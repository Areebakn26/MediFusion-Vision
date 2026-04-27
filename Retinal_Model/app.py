import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"
import io
import base64
import warnings
warnings.filterwarnings('ignore')

import numpy as np
import cv2
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend — server ke liye zaroori
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image as PILImage

import tensorflow as tf
from tensorflow.keras.preprocessing import image as keras_image
from tensorflow.keras.applications.efficientnet import preprocess_input

# ══════════════════════════════════════════════════════════════
# FLASK APP SETUP
# ══════════════════════════════════════════════════════════════
app = Flask(__name__)
CORS(app)  # React frontend se connection allow karo

# ══════════════════════════════════════════════════════════════
# CONFIG
# ══════════════════════════════════════════════════════════════
MODEL_PATH = os.path.join(os.path.dirname(__file__), "efficientnetb3-Eye Disease-91.47.keras")
CLASS_DICT  = {0: "cataract", 1: "diabetic_retinopathy", 2: "glaucoma", 3: "normal"}
CONV_LAYER  = "block6a_expand_conv"
IMG_SIZE    = (224, 224)

BAR_COLORS = {
    'glaucoma':             '#e74c3c',
    'diabetic_retinopathy': '#e67e22',
    'cataract':             '#3498db',
    'normal':               '#2ecc71'
}

DISEASE_KNOWLEDGE = {
    "glaucoma": {
        "color":          "#e74c3c",
        "primary":        "optic nerve head damage and nerve fiber layer thinning",
        "region_meanings": {
            "optic_disc": "Optic disc cupping — hallmark of glaucomatous optic nerve damage",
            "superior":   "Superior arcuate nerve fiber layer thinning — typical early glaucoma",
            "inferior":   "Inferior arcuate nerve fiber layer thinning — common progression sign",
            "periphery":  "Peripheral nerve fiber loss — advanced field defects",
            "macula":     "Macular ganglion cell loss — moderate-to-advanced glaucoma",
        },
        "clinical_note":  "Measure IOP, cup-to-disc ratio, and perform visual field testing.",
        "expected_zones": ["optic_disc", "superior", "inferior", "periphery"]
    },
    "diabetic_retinopathy": {
        "color":          "#e67e22",
        "primary":        "vascular abnormalities, microaneurysms, and neovascularization",
        "region_meanings": {
            "optic_disc": "Neovascularization at disc (NVD) — serious proliferative DR sign",
            "macula":     "Diabetic macular edema (DME) — leading cause of DR vision loss",
            "superior":   "Flame hemorrhages and hard exudates in superior arcade",
            "inferior":   "Dot-blot hemorrhages and microaneurysms in inferior arcade",
            "periphery":  "Peripheral neovascularization elsewhere (NVE) — proliferative DR",
        },
        "clinical_note":  "Control HbA1c and BP. Consider anti-VEGF or laser treatment.",
        "expected_zones": ["optic_disc", "macula", "superior", "inferior"]
    },
    "cataract": {
        "color":          "#3498db",
        "primary":        "lens opacity causing diffuse light scattering",
        "region_meanings": {
            "macula":     "Posterior subcapsular opacity affecting central vision clarity",
            "optic_disc": "Nuclear sclerosis causing diffuse image haze",
            "superior":   "Cortical spoke-wheel opacity in superior lens quadrant",
            "inferior":   "Cortical opacity in inferior lens quadrant",
            "periphery":  "Peripheral cortical opacity — early cataract pattern",
        },
        "clinical_note":  "Assess visual acuity and glare. Surgery indicated if VA < 6/18.",
        "expected_zones": ["macula", "optic_disc"]
    },
    "normal": {
        "color":          "#2ecc71",
        "primary":        "no pathological features detected",
        "region_meanings": {
            "optic_disc": "Normal optic disc with healthy cup-to-disc ratio",
            "macula":     "Healthy foveal reflex — no macular pathology",
            "superior":   "Normal superior nerve fiber layer",
            "inferior":   "Normal inferior nerve fiber layer",
            "periphery":  "Normal peripheral retina — no lesions detected",
        },
        "clinical_note":  "No intervention required. Annual screening recommended.",
        "expected_zones": []
    }
}

# ══════════════════════════════════════════════════════════════
# LOAD MODEL — server start pe ek baar load hoga
# ══════════════════════════════════════════════════════════════
print("Loading model (using tf_keras for legacy support)...")

import tf_keras
model = tf_keras.models.load_model(MODEL_PATH, compile=False)

base_model      = model.layers[0]
last_conv_layer = base_model.get_layer(CONV_LAYER)
conv_model      = tf.keras.models.Model(
    inputs  = base_model.input,
    outputs = [last_conv_layer.output, base_model.output]
)
print("Model loaded!")

# ══════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════
def preprocess_img_from_array(img_array_rgb):
    img_resized = cv2.resize(img_array_rgb, IMG_SIZE)
    arr         = np.expand_dims(img_resized.astype(np.float32), axis=0)
    return preprocess_input(arr)

def make_gradcam_heatmap(img_array):
    img_tensor = tf.cast(img_array, tf.float32)
    preds      = model.predict(img_array, verbose=0)
    class_idx  = np.argmax(preds[0])
    conf       = float(preds[0][class_idx]) * 100
    class_name = CLASS_DICT[class_idx]
    all_probs  = {CLASS_DICT[i]: round(float(preds[0][i]) * 100, 2) for i in range(4)}

    with tf.GradientTape() as tape:
        conv_outputs, base_out = conv_model(img_tensor, training=False)
        tape.watch(conv_outputs)
        x    = model.layers[1](base_out, training=False)
        x    = model.layers[2](x,        training=False)
        x    = model.layers[3](x,        training=False)
        out  = model.layers[4](x,        training=False)
        loss = out[:, class_idx]

    grads        = tape.gradient(loss, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    heatmap      = conv_outputs[0] @ pooled_grads[..., tf.newaxis]
    heatmap      = tf.squeeze(heatmap)
    heatmap      = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)
    return heatmap.numpy(), class_idx, class_name, conf, all_probs

def get_otsu_threshold(heatmap):
    heatmap_uint8 = np.uint8(heatmap * 255)
    otsu_val, _   = cv2.threshold(heatmap_uint8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    threshold     = otsu_val / 255.0
    if threshold < 0.1 or threshold > 0.95:
        threshold = heatmap.min() + 0.7 * (heatmap.max() - heatmap.min())
    return threshold

def detect_disc_position(img_rgb):
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    h, w = gray.shape

    _, retina_mask = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)
    kernel         = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    retina_mask    = cv2.morphologyEx(retina_mask, cv2.MORPH_CLOSE, kernel)

    clahe    = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # Vessel density for eye side
    kernel_vessel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
    vessel_map    = cv2.morphologyEx(enhanced, cv2.MORPH_TOPHAT, kernel_vessel)
    vessel_map    = cv2.bitwise_and(vessel_map, vessel_map, mask=retina_mask)

    mid_x           = w // 2
    left_pixels     = vessel_map[:, :mid_x][retina_mask[:, :mid_x] > 0]
    right_pixels    = vessel_map[:, mid_x:][retina_mask[:, mid_x:] > 0]
    left_density    = float(np.mean(left_pixels))  if len(left_pixels)  > 0 else 0
    right_density   = float(np.mean(right_pixels)) if len(right_pixels) > 0 else 0
    density_ratio   = abs(left_density - right_density) / (max(left_density, right_density) + 1e-6)

    eye_side   = "left"  if left_density >= right_density else "right"
    confidence = "high"  if density_ratio > 0.05 else "moderate" if density_ratio > 0.02 else "low"

    # Disc center
    blurred     = cv2.GaussianBlur(enhanced, (51, 51), 0)
    masked      = cv2.bitwise_and(blurred, blurred, mask=retina_mask)
    thresh_val  = np.percentile(masked[retina_mask > 0], 98)
    bright_mask = (masked >= thresh_val).astype(np.uint8)
    moments     = cv2.moments(bright_mask)

    if moments["m00"] > 0:
        disc_x_pct = (moments["m10"] / moments["m00"]) / w
        disc_y_pct = (moments["m01"] / moments["m00"]) / h
    else:
        disc_x_pct = 0.35 if eye_side == "left" else 0.65
        disc_y_pct = 0.5

    return eye_side, disc_x_pct, disc_y_pct, confidence

def build_anatomy_map(disc_x_pct, disc_y_pct, eye_side, h, w):
    disc_r  = int(0.10 * w)
    disc_cx = int(disc_x_pct * w)
    disc_cy = int(disc_y_pct * h)

    macula_offset = int(2.5 * disc_r)
    macula_cx     = disc_cx + macula_offset if eye_side == "left" else disc_cx - macula_offset
    macula_cy     = disc_cy
    macula_cx     = max(0, min(w - 1, macula_cx))

    def circle_mask(cy, cx, r):
        mask = np.zeros((h, w), dtype=bool)
        Y, X = np.ogrid[:h, :w]
        mask[(Y - cy)**2 + (X - cx)**2 <= r**2] = True
        return mask

    disc_mask   = circle_mask(disc_cy, disc_cx, int(disc_r * 1.5))
    macula_mask = circle_mask(macula_cy, macula_cx, int(disc_r * 1.6))

    sup_mask  = np.zeros((h, w), dtype=bool)
    sup_mask[:int(0.35 * h), :] = True
    sup_mask &= ~disc_mask & ~macula_mask

    inf_mask  = np.zeros((h, w), dtype=bool)
    inf_mask[int(0.65 * h):, :] = True
    inf_mask &= ~disc_mask & ~macula_mask

    Y, X      = np.ogrid[:h, :w]
    dist      = np.sqrt(((Y - h//2) / h)**2 + ((X - w//2) / w)**2)
    peri_mask = (dist > 0.40) & ~disc_mask & ~macula_mask

    return {
        "optic_disc": {"mask": disc_mask,   "label": "Optic Disc"},
        "macula":     {"mask": macula_mask, "label": "Macula/Fovea"},
        "superior":   {"mask": sup_mask,    "label": "Superior Retina"},
        "inferior":   {"mask": inf_mask,    "label": "Inferior Retina"},
        "periphery":  {"mask": peri_mask,   "label": "Peripheral Retina"},
    }

def derive_score_weights(heatmap):
    variance   = float(np.var(heatmap))
    norm_var   = min(variance / 0.08, 1.0)
    w_peak     = 0.25 + 0.30 * norm_var
    w_mean     = 0.50 - 0.25 * norm_var
    w_coverage = 1.0 - w_peak - w_mean
    return {"mean": round(w_mean, 3), "peak": round(w_peak, 3), "coverage": round(w_coverage, 3)}

def score_regions(heatmap, regions, threshold, weights):
    results = {}
    for rname, rinfo in regions.items():
        mask = rinfo["mask"]
        vals = heatmap[mask]
        if len(vals) < 10:
            continue
        mean_act = float(np.mean(vals))
        peak_act = float(np.max(vals))
        coverage = float(np.sum(vals > threshold) / len(vals) * 100)
        score    = mean_act * weights["mean"] + peak_act * weights["peak"] + (coverage / 100) * weights["coverage"]
        results[rname] = {
            "mean_activation": round(mean_act, 3),
            "peak_activation": round(peak_act, 3),
            "coverage_pct":    round(coverage, 1),
            "score":           round(score, 3),
            "label":           rinfo["label"],
        }
    return sorted(results.items(), key=lambda x: -x[1]["score"])

def generate_explanation(class_name, conf, ranked_regions, threshold, weights, eye_side, disc_x_pct, disc_y_pct):
    knowledge  = DISEASE_KNOWLEDGE[class_name]
    top2       = ranked_regions[:2]
    top_labels = [s["label"] for _, s in top2]
    macula_side = "right" if eye_side == "left" else "left"

    what_sees = (f"Highest activation in {' and '.join(top_labels)} "
                 f"(Disc at {disc_x_pct*100:.0f}%, {disc_y_pct*100:.0f}% — macula " +
                 macula_side + " of disc)")

    why_parts = []
    for rname, stats in top2:
        if stats["score"] > 0.10:
            meaning = knowledge["region_meanings"].get(rname, "")
            why_parts.append(f"{meaning} (score: {stats['score']:.3f})")
    why = " | ".join(why_parts) if why_parts else f"Model detected {knowledge['primary']}"

    top_r, top_s = ranked_regions[0]
    red_meaning  = (f"{top_s['label']}: {top_s['coverage_pct']:.1f}% pixels above threshold "
                    f"(peak={top_s['peak_activation']:.3f}) — "
                    f"{knowledge['region_meanings'].get(top_r, '')}")

    expected  = set(knowledge["expected_zones"])
    activated = set([r for r, _ in top2])
    overlap   = expected & activated
    if len(overlap) >= 1:
        validity = f"Medically consistent — model focused on expected regions for {class_name.replace('_',' ')}."
    elif class_name == "normal":
        validity = "Normal — no strong focal activation, consistent with healthy retina."
    else:
        validity = f"Atypical pattern — clinical verification strongly advised."

    conf_text = ("High confidence" if conf >= 90 else
                 "Moderate confidence" if conf >= 70 else "Low confidence")

    return {
        "what_model_sees":  what_sees,
        "why_prediction":   why,
        "red_area_meaning": red_meaning,
        "clinical_note":    knowledge["clinical_note"],
        "validity_check":   validity,
        "confidence_text":  f"{conf_text} ({conf:.1f}%)",
        "eye_side":         eye_side,
        "eye_confidence":   "N/A",
    }

def img_to_base64(img_array_rgb):
    pil_img = PILImage.fromarray(img_array_rgb.astype(np.uint8))
    buffer  = io.BytesIO()
    pil_img.save(buffer, format="JPEG", quality=85)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

# ══════════════════════════════════════════════════════════════
# API ROUTES
# ══════════════════════════════════════════════════════════════

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": "EfficientNetB3", "tf_version": tf.__version__})

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Main endpoint — accepts retinal image, returns full analysis
    Request: multipart/form-data with 'image' field
    Response: JSON with prediction, heatmaps (base64), explanation
    """
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400

    try:
        # Read image
        file      = request.files['image']
        img_bytes = file.read()
        img_pil   = PILImage.open(io.BytesIO(img_bytes)).convert('RGB')
        img_rgb   = np.array(img_pil)

        # Preprocess
        img_array = preprocess_img_from_array(img_rgb)
        img_resized = cv2.resize(img_rgb, IMG_SIZE)

        # Grad-CAM
        heatmap, class_idx, class_name, conf, all_probs = make_gradcam_heatmap(img_array)
        heatmap_resized = cv2.resize(heatmap, IMG_SIZE)

        # Analysis
        eye_side, disc_x_pct, disc_y_pct, eye_conf = detect_disc_position(img_resized)
        regions        = build_anatomy_map(disc_x_pct, disc_y_pct, eye_side, IMG_SIZE[0], IMG_SIZE[1])
        threshold      = get_otsu_threshold(heatmap_resized)
        weights        = derive_score_weights(heatmap_resized)
        ranked_regions = score_regions(heatmap_resized, regions, threshold, weights)
        explanation    = generate_explanation(
            class_name, conf, ranked_regions,
            threshold, weights, eye_side, disc_x_pct, disc_y_pct
        )

        # Generate overlay images
        heatmap_color = cv2.cvtColor(
            cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET),
            cv2.COLOR_BGR2RGB)
        overlay = cv2.addWeighted(img_resized, 0.6, heatmap_color, 0.4, 0)

        # Convert to base64 for frontend
        original_b64  = img_to_base64(img_resized)
        heatmap_b64   = img_to_base64(heatmap_color)
        overlay_b64   = img_to_base64(overlay)

        # Ranked regions for frontend (remove numpy masks — not JSON serializable)
        regions_json = [
            {
                "name":             rname,
                "label":            stats["label"],
                "score":            stats["score"],
                "peak_activation":  stats["peak_activation"],
                "coverage_pct":     stats["coverage_pct"],
                "is_expected":      rname in DISEASE_KNOWLEDGE[class_name]["expected_zones"]
            }
            for rname, stats in ranked_regions
        ]

        return jsonify({
            "success":       True,
            "prediction": {
                "class_name":  class_name,
                "class_idx":   int(class_idx),
                "confidence":  round(conf, 2),
                "all_probs":   all_probs,
            },
            "images": {
                "original":    original_b64,
                "heatmap":     heatmap_b64,
                "overlay":     overlay_b64,
            },
            "explanation":    explanation,
            "regions":        regions_json,
            "analysis_meta": {
                "otsu_threshold": round(threshold, 3),
                "weights":        weights,
                "eye_side":       eye_side,
                "eye_confidence": eye_conf,
                "disc_position":  {"x": round(disc_x_pct, 3), "y": round(disc_y_pct, 3)},
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ══════════════════════════════════════════════════════════════
# RUN
# ══════════════════════════════════════════════════════════════
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)