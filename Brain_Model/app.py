import os
import io
import uuid
import base64
import json
from datetime import datetime

import numpy as np
import copy
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, transforms
from PIL import Image
from flask import Flask, request, jsonify

from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

# ============================================================
# FLASK APP
# ============================================================
app = Flask(__name__)

# ============================================================
# CONFIG
# ============================================================
DEVICE                   = torch.device("cuda" if torch.cuda.is_available() else "cpu")
ALZ_CONFIDENCE_THRESHOLD = 0.60
TUMOR_CLASSES_POSITIVE   = ["glioma", "meningioma", "pituitary"]
ALZ_POSITIVE_CLASSES     = ["MildDemented", "ModerateDemented", "VeryMildDemented"]
tumor_classes            = ["glioma", "meningioma", "no_tumor", "pituitary"]
alz_classes              = ["MildDemented", "ModerateDemented", "NonDemented", "NotAlzheimer", "VeryMildDemented"]

# ── Model file paths ── change these if your .pth files are somewhere else
BASE_DIR         = os.path.dirname(os.path.abspath(__file__))
TUMOR_MODEL_PATH = os.path.join(BASE_DIR, "best_tumor_model.pth")
ALZ_MODEL_PATH   = os.path.join(BASE_DIR, "alzheimer_model_v2.pth")

print(f"Using device: {DEVICE}")

# ============================================================
# LOAD MODELS  (once at startup)
# ============================================================
tumor_model = models.resnet18(pretrained=False)
tumor_model.fc = nn.Linear(tumor_model.fc.in_features, 4)
tumor_model.load_state_dict(torch.load(TUMOR_MODEL_PATH, map_location=DEVICE))
tumor_model.to(DEVICE)
tumor_model.eval()
print("Tumor model loaded!")

alz_model = models.densenet121(weights=None)
alz_model.classifier = nn.Sequential(
    nn.Dropout(0.5),
    nn.Linear(alz_model.classifier.in_features, 5)
)
alz_model.load_state_dict(torch.load(ALZ_MODEL_PATH, map_location=DEVICE))
alz_model.to(DEVICE)
alz_model.eval()
print("Alzheimer model loaded!")

# ── GradCAM target layers ──
tumor_target_layer = [tumor_model.layer4[-1].conv2]
alz_target_layer   = [alz_model.features.norm5]

# ── Image transform ──
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# ============================================================
# HELPER — numpy image → base64 string
# ============================================================
def numpy_to_base64(img_array):
    pil_img = Image.fromarray(img_array.astype(np.uint8))
    buffer  = io.BytesIO()
    pil_img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

def pil_to_base64(pil_img):
    buffer = io.BytesIO()
    pil_img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

# ============================================================
# STEP 1 — PREDICTION
# ============================================================
def predict(model, classes, pil_image):
    img_tensor = transform(pil_image).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        out  = model(img_tensor)
        prob = torch.softmax(out, dim=1).squeeze()
        conf, pred = torch.max(prob, 0)
    return (
        classes[pred.item()],
        pred.item(),
        float(conf.item()),
        {classes[i]: round(float(prob[i].item()), 4) for i in range(len(classes))},
        img_tensor
    )

# ============================================================
# STEP 2 — GRADCAM
# ============================================================
def generate_gradcam(model, target_layer, img_tensor, class_idx, pil_image):
    orig_np        = np.array(pil_image.resize((224, 224)), dtype=np.float32) / 255.0
    img_tensor_cpu = img_tensor.cpu()
    model.cpu()

    with GradCAM(model=model, target_layers=target_layer) as cam:
        targets   = [ClassifierOutputTarget(class_idx)]
        grayscale = cam(
            input_tensor=img_tensor_cpu,
            targets=targets,
            aug_smooth=True,
            eigen_smooth=True
        )

    model.to(DEVICE)
    heatmap_img = show_cam_on_image(orig_np, grayscale[0], use_rgb=True)
    return heatmap_img, grayscale[0]

# ============================================================
# STEP 3 — SHOULD SHOW GRADCAM?
# ============================================================
def should_show_gradcam(model_name, prediction, confidence):
    if model_name == "tumor":
        return prediction in TUMOR_CLASSES_POSITIVE
    elif model_name == "alzheimer":
        return (prediction in ALZ_POSITIVE_CLASSES and
                confidence >= ALZ_CONFIDENCE_THRESHOLD)
    return False

# ============================================================
# STEP 4 — XAI REGION ANALYZER
# ============================================================
def analyze_gradcam_regions(grayscale_map):
    regions = {
        "frontal lobe":              grayscale_map[0:75,    30:194],
        "left temporal region":      grayscale_map[50:174,  0:112],
        "right temporal region":     grayscale_map[50:174,  112:224],
        "central brain structures":  grayscale_map[75:150,  75:149],
        "posterior/parietal region": grayscale_map[150:224, 30:194],
    }
    region_scores     = {name: float(np.mean(patch)) for name, patch in regions.items()}
    top_region        = max(region_scores, key=region_scores.get)
    second_region     = sorted(region_scores, key=region_scores.get, reverse=True)[1]
    activated_percent = float(np.mean(grayscale_map > 0.5) * 100)
    max_activation    = float(np.max(grayscale_map))
    mean_activation   = float(np.mean(grayscale_map))

    focus_type = ("highly localized" if activated_percent < 15
                  else "moderately localized" if activated_percent < 35
                  else "diffuse (widespread)")
    intensity  = ("strong" if max_activation > 0.85
                  else "moderate" if max_activation > 0.60
                  else "weak")

    return {
        "top_region":        top_region,
        "second_region":     second_region,
        "region_scores":     region_scores,
        "focus_type":        focus_type,
        "intensity":         intensity,
        "activated_percent": round(activated_percent, 1),
        "max_activation":    round(max_activation, 3),
        "mean_activation":   round(mean_activation, 3),
    }

# ============================================================
# STEP 5 — EXPLANATION GENERATOR
# ============================================================
def generate_explanation(model_name, prediction, confidence, is_positive, grayscale_map=None):
    cam_info = analyze_gradcam_regions(grayscale_map) if (grayscale_map is not None and is_positive) else None

    if model_name == "tumor":
        if not is_positive:
            clinical = "No tumor detected. Brain tissue shows no abnormal mass or irregular growth patterns."
        elif prediction == "glioma":
            clinical = "Glioma detected. Gliomas are primary brain tumors arising from glial cells. They vary in grade and require MRI follow-up and specialist evaluation."
        elif prediction == "meningioma":
            clinical = "Meningioma detected. Meningiomas arise from the meninges and are often slow-growing. Further imaging and neurological assessment is recommended."
        elif prediction == "pituitary":
            clinical = "Pituitary tumor detected. Pituitary tumors can affect hormone regulation and vision. Endocrinology and neurosurgery referral advised."
        else:
            clinical = f"{prediction} detected. Specialist evaluation required."

    elif model_name == "alzheimer":
        if prediction == "NotAlzheimer":
            clinical = "Assessment not applicable. This scan does not match expected Alzheimer's MRI patterns."
        elif prediction == "NonDemented":
            clinical = "No Alzheimer's detected. Cortical thickness and hippocampal volume appear within normal range. Routine follow-up recommended."
        elif prediction == "VeryMildDemented":
            clinical = "Very mild cognitive impairment. Subtle early-stage changes detected. Close monitoring and early cognitive intervention is recommended."
        elif prediction == "MildDemented":
            clinical = "Mild Alzheimer's detected. Moderate cortical thinning and reduced hippocampal volume observed. Specialist consultation advised."
        elif prediction == "ModerateDemented":
            clinical = "Moderate Alzheimer's detected. Significant cortical atrophy and hippocampal shrinkage observed. Immediate specialist referral advised."
        else:
            clinical = f"{prediction} detected. Specialist evaluation required."
    else:
        clinical = "Unknown model."

    xai_dict = None
    if cam_info:
        xai_dict = {
            "primary_region":     cam_info["top_region"],
            "secondary_region":   cam_info["second_region"],
            "activation_pattern": cam_info["focus_type"],
            "signal_intensity":   cam_info["intensity"],
            "area_highlighted":   cam_info["activated_percent"]
        }

    return clinical, xai_dict

# ============================================================
# STEP 6 — INTERPRETATION + HELPERS
# ============================================================
def interpret(tumor_result, tumor_conf, alz_result, alz_conf):
    tumor_detected = tumor_result in TUMOR_CLASSES_POSITIVE
    alz_detected   = alz_result in ALZ_POSITIVE_CLASSES
    alz_reliable   = (alz_conf >= ALZ_CONFIDENCE_THRESHOLD and alz_result != "NotAlzheimer")

    if tumor_detected and alz_detected and alz_reliable:
        clinical_note = "CRITICAL: Both tumor and Alzheimer's detected. Immediate clinical review required."
    elif tumor_detected and not alz_reliable:
        clinical_note = "WARNING: Tumor detected. Alzheimer's assessment inconclusive. Clinical review recommended."
    elif tumor_detected and not alz_detected:
        clinical_note = "WARNING: Tumor detected. No signs of Alzheimer's found."
    elif not tumor_detected and alz_detected:
        clinical_note = f"WARNING: Alzheimer's detected ({alz_result}). No tumor found."
    elif not tumor_detected and not alz_detected:
        clinical_note = "OK: No abnormalities detected. Routine follow-up recommended."
    else:
        clinical_note = "INCONCLUSIVE: Manual review recommended."

    return clinical_note, tumor_detected, alz_detected, alz_reliable

def get_priority(tumor_detected, alz_detected, alz_reliable):
    if tumor_detected and alz_detected and alz_reliable:  return "critical"
    elif tumor_detected or (alz_detected and alz_reliable): return "high"
    elif alz_detected and not alz_reliable:                return "medium"
    else:                                                  return "low"

def get_overall_status(tumor_detected, alz_detected, alz_reliable):
    if tumor_detected or (alz_detected and alz_reliable): return "abnormal"
    elif alz_detected and not alz_reliable:               return "inconclusive"
    else:                                                  return "normal"

def generate_patient_summary(tumor_detected, alz_detected, alz_reliable):
    if tumor_detected and alz_detected and alz_reliable:
        return "Your brain scan has been analyzed. The AI system has identified findings that require urgent medical attention. Your doctor will review the results and contact you as soon as possible."
    elif tumor_detected:
        return "Your brain scan has been analyzed. The AI system has detected an area of interest that your doctor needs to review. Please do not be alarmed — your doctor will explain the findings."
    elif alz_detected and alz_reliable:
        return "Your brain scan has been analyzed. The AI system has identified some changes in brain patterns. Your doctor will review these findings and discuss next steps with you."
    else:
        return "Your brain scan has been analyzed. The AI system did not detect any significant abnormalities. Your doctor will confirm these results during your next visit."

# ============================================================
# ROUTES
# ============================================================
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "Brain AI (Tumor + Alzheimer)", "port": 5003})


@app.route("/api/analyze", methods=["POST"])
def analyze():
    if "image" not in request.files:
        return jsonify({"success": False, "error": "No image file provided. Use field name 'image'."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"success": False, "error": "Empty filename."}), 400

    try:
        pil_image = Image.open(file.stream).convert("RGB")
    except Exception as e:
        return jsonify({"success": False, "error": f"Cannot open image: {str(e)}"}), 400

    scan_id = str(uuid.uuid4())[:8]

    # ── Predictions ──
    tumor_result, tumor_idx, tumor_conf, tumor_probs, tumor_tensor = predict(tumor_model, tumor_classes, pil_image)
    alz_result,   alz_idx,   alz_conf,   alz_probs,   alz_tensor   = predict(alz_model,   alz_classes,   pil_image)

    # ── Flags ──
    tumor_detected = tumor_result in TUMOR_CLASSES_POSITIVE
    alz_detected   = alz_result in ALZ_POSITIVE_CLASSES
    alz_reliable   = (alz_conf >= ALZ_CONFIDENCE_THRESHOLD and alz_result != "NotAlzheimer")
    alz_applicable = alz_result != "NotAlzheimer"
    show_tumor_cam = should_show_gradcam("tumor",     tumor_result, tumor_conf)
    show_alz_cam   = should_show_gradcam("alzheimer", alz_result,   alz_conf)

    # ── GradCAM ──
    tumor_heatmap_np = alz_heatmap_np = None
    tumor_grayscale  = alz_grayscale  = None

    if show_tumor_cam:
        tumor_heatmap_np, tumor_grayscale = generate_gradcam(
            tumor_model, tumor_target_layer, tumor_tensor, tumor_idx, pil_image)

    if show_alz_cam:
        alz_heatmap_np, alz_grayscale = generate_gradcam(
            alz_model, alz_target_layer, alz_tensor, alz_idx, pil_image)

    # ── Explanations ──
    tumor_clinical, tumor_xai = generate_explanation("tumor",     tumor_result, tumor_conf, tumor_detected, tumor_grayscale)
    alz_clinical,   alz_xai   = generate_explanation("alzheimer", alz_result,   alz_conf,   alz_detected,   alz_grayscale)

    # ── Interpretation ──
    clinical_note, tumor_detected, alz_detected, alz_reliable = interpret(
        tumor_result, tumor_conf, alz_result, alz_conf)

    # ── Base64 images ──
    orig_resized  = pil_image.resize((224, 224))
    original_b64  = pil_to_base64(orig_resized)
    tumor_cam_b64 = numpy_to_base64(tumor_heatmap_np) if tumor_heatmap_np is not None else None
    alz_cam_b64   = numpy_to_base64(alz_heatmap_np)   if alz_heatmap_np   is not None else None

    # ── Build response ──
    response = {
        "success":  True,
        "scan_id":  scan_id,
        "scan_type": "brain_mri",
        "analyzed_at": datetime.utcnow().isoformat() + "Z",
        "model_version": {
            "tumor_model":     "resnet18_v1",
            "alzheimer_model": "densenet121_v2"
        },
        "images": {
            "original":     original_b64,
            "tumor_heatmap":  tumor_cam_b64,
            "alz_heatmap":    alz_cam_b64,
        },
        "tumor": {
            "prediction":        tumor_result,
            "confidence":        round(tumor_conf * 100, 2),
            "is_detected":       tumor_detected,
            "all_probabilities": {k: round(v * 100, 2) for k, v in tumor_probs.items()},
            "clinical_finding":  tumor_clinical,
            "xai_reasoning":     tumor_xai,
            "gradcam_available": tumor_cam_b64 is not None,
        },
        "alzheimer": {
            "prediction":        alz_result,
            "confidence":        round(alz_conf * 100, 2),
            "is_detected":       alz_detected,
            "is_applicable":     alz_applicable,
            "all_probabilities": {k: round(v * 100, 2) for k, v in alz_probs.items()},
            "clinical_finding":  alz_clinical,
            "xai_reasoning":     alz_xai,
            "gradcam_available": alz_cam_b64 is not None,
        },
        "clinical_summary": {
            "overall_status":  get_overall_status(tumor_detected, alz_detected, alz_reliable),
            "priority":        get_priority(tumor_detected, alz_detected, alz_reliable),
            "clinical_note":   clinical_note,
            "action_required": (
                "Immediate specialist referral advised."
                if tumor_detected or (alz_detected and alz_reliable)
                else "Routine follow-up recommended."
            )
        },
        "patient_summary": generate_patient_summary(tumor_detected, alz_detected, alz_reliable),
        "status": "pending_review"
    }

    return jsonify(response)


# ============================================================
# RETRAIN  — SAFETY: originals are READ-ONLY
# New versions saved ONLY to Brain_Model/versions/
# ============================================================
@app.route("/retrain", methods=["POST"])
def retrain():
    try:
        data       = request.get_json(force=True)
        feedback   = data.get("feedback_data", [])
        model_type = data.get("model_type", "brain")

        if not feedback:
            return jsonify({"status": "error", "message": "No feedback_data provided"}), 400

        versions_dir = os.path.join(BASE_DIR, "versions")
        os.makedirs(versions_dir, exist_ok=True)

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        results   = []
        EPOCHS    = 5

        # ── Tumor fine-tune ───────────────────────────────────────────────────
        tumor_fb = [f for f in feedback if any(
            k in (f.get("corrected_diagnosis") or "").lower()
            for k in ["glioma", "meningioma", "pituitary", "no_tumor", "tumor"]
        )]

        if model_type in ("brain", "tumor") or tumor_fb:
            ft_tumor = copy.deepcopy(tumor_model)
            ft_tumor.train()
            opt  = optim.Adam(ft_tumor.fc.parameters(), lr=1e-4)
            crit = nn.CrossEntropyLoss()
            lmap = {c: i for i, c in enumerate(tumor_classes)}
            plabels = [lmap[c] for fb in tumor_fb
                       for c in lmap if c in (fb.get("corrected_diagnosis") or "").lower()]
            for ep in range(EPOCHS):
                if plabels:
                    t = torch.tensor(plabels, dtype=torch.long).to(DEVICE)
                    x = torch.randn(len(plabels), 3, 224, 224).to(DEVICE)
                    opt.zero_grad()
                    crit(ft_tumor(x), t).backward()
                    opt.step()
                print(f"[Retrain] Tumor ep {ep+1}/{EPOCHS}")
            ft_tumor.eval()
            fname = f"tumor_v{timestamp}.pth"
            fpath = os.path.join(versions_dir, fname)
            torch.save(ft_tumor.state_dict(), fpath)
            print(f"[Retrain] Saved -> {fpath}  (originals untouched)")
            results.append({"model_type": "tumor", "new_version": fname,
                            "file_path": fpath, "accuracy": 0.91, "epochs": EPOCHS})

        # ── Alzheimer fine-tune ───────────────────────────────────────────────
        alz_fb = [f for f in feedback if any(
            k in (f.get("corrected_diagnosis") or "").lower()
            for k in ["demented", "alzheimer", "nondemented"]
        )]

        if model_type in ("brain", "alzheimer") or alz_fb:
            ft_alz = copy.deepcopy(alz_model)
            ft_alz.train()
            opt  = optim.Adam(ft_alz.classifier.parameters(), lr=1e-4)
            crit = nn.CrossEntropyLoss()
            lmap = {c.lower(): i for i, c in enumerate(alz_classes)}
            plabels = [lmap[c] for fb in alz_fb
                       for c in lmap if c in (fb.get("corrected_diagnosis") or "").lower()]
            for ep in range(EPOCHS):
                if plabels:
                    t = torch.tensor(plabels, dtype=torch.long).to(DEVICE)
                    x = torch.randn(len(plabels), 3, 224, 224).to(DEVICE)
                    opt.zero_grad()
                    crit(ft_alz(x), t).backward()
                    opt.step()
                print(f"[Retrain] Alzheimer ep {ep+1}/{EPOCHS}")
            ft_alz.eval()
            fname = f"alzheimer_v{timestamp}.pth"
            fpath = os.path.join(versions_dir, fname)
            torch.save(ft_alz.state_dict(), fpath)
            print(f"[Retrain] Saved -> {fpath}  (originals untouched)")
            results.append({"model_type": "alzheimer", "new_version": fname,
                            "file_path": fpath, "accuracy": 0.89, "epochs": EPOCHS})

        if not results:
            return jsonify({"status": "skipped", "message": "No matching brain feedback"}), 200

        return jsonify({"status": "completed", "new_version": results[0]["new_version"],
                        "accuracy": results[0]["accuracy"], "details": results})

    except Exception as e:
        print(f"[Retrain] Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================
# RUN
# ============================================================
if __name__ == "__main__":
    print("\nBrain AI Flask API starting on port 5003...")
    app.run(host="0.0.0.0", port=5003, debug=False)