# Feedback Loop V2 — MediFusion Vision
**Branch:** `feature/feedback-loop-v2`

## Overview
This module transforms MediFusion Vision from a static AI diagnostic 
tool into a self-improving medical AI system. Doctors can flag incorrect 
AI predictions, and the system automatically learns from their corrections 
over time — similar to how real-world clinical AI platforms like Google 
Health and Aidoc work.

---

## Architecture — 5 Modules

### Module 1 — Quality Checker
**File:** `server/services/qualityChecker.js`

Scores each doctor's feedback from 0.0 to 1.0 based on:

| Factor | Weight | Logic |
|---|---|---|
| Specialization match | 30% | Neurologist reviewing brain scan = max score |
| Years of experience | 20% | Capped at 10 years |
| Notes quality | 15% | Detailed notes > 50 chars = full score |
| Reason provided | 10% | Any reason = full score |
| AI confidence gap | 25% | Doctor correcting high-confidence AI = most valuable |

**Auto-validation rules:**
- Score >= 0.75 → `validated` (used for retraining)
- Score < 0.40 → `rejected` (ignored)
- Otherwise → `pending` (needs more reviews)

---

### Module 2 — Consensus Engine
**File:** `server/services/consensusEngine.js`

When multiple doctors review the same scan, the system decides 
which correction to trust:

- **2+ doctors agree** on same diagnosis + combined score >= 1.5 
  → Auto-validated
- **Single high-trust doctor** (score >= 0.85) 
  → Auto-validated without needing second opinion
- Returns: `{ consensusReached, diagnosis, count }`

---

### Module 3 — Cron Job (Auto Trigger)
**File:** `server/jobs/retrainingTrigger.js`

Runs automatically every day at **2:00 AM**. Checks these 
conditions — if ANY is true, retraining is triggered:

| Condition | Threshold | Reason |
|---|---|---|
| New validated feedback | >= 100 samples | Enough data to learn from |
| Model accuracy drop | < 90% | Performance degradation |
| Days since last retrain | >= 30 days | Catches slow drift |
| Single class corrections | >= 50 | One disease being misdiagnosed often |

---

### Module 4 — Python Retraining Pipeline
**Brain Model:** `Brain_Model/app.py` — `POST /retrain` (port 5003)
**Retinal Model:** `Retinal_Model/app.py` — `POST /retrain` (port 5002)

- Accepts doctor feedback data
- Fine-tunes existing model for 5-10 epochs
- Saves new version to `versions/` folder with timestamp

**⚠️ SAFETY RULE — Original models are NEVER overwritten:**
- `Brain_Model/best_tumor_model.pth` — READ ONLY
- `Brain_Model/alzheimer_model_v2.pth` — READ ONLY
- `Retinal_Model/efficientnetb3-Eye Disease-91.47.keras` — READ ONLY

New models are saved as:
- `Brain_Model/versions/tumor_v{timestamp}.pth`
- `Brain_Model/versions/alzheimer_v{timestamp}.pth`
- `Retinal_Model/versions/retinal_v{timestamp}.keras`

---

### Module 5 — Model Registry & Deployer
**File:** `server/services/modelDeployer.js`

Manages model versions like a production ML system:

| Function | What it does |
|---|---|
| `registerNewVersion()` | Records new trained model in DB |
| `deployModel()` | Promotes new model, deactivates old |
| `rollbackModel()` | Reverts to any previous version |

---

## New API Endpoints

| Endpoint | Method | Access | Purpose |
|---|---|---|---|
| `/api/feedback/models/versions` | GET | Admin | List all model versions |
| `/api/feedback/models/deploy` | POST | Admin | Deploy a new version |
| `/api/feedback/models/rollback` | POST | Admin | Rollback to previous version |

---

## How to Run

### Start Brain Model (port 5003)
```bash
cd Brain_Model
venv/bin/python app.py
```

### Start Retinal Model (port 5002)
```bash
cd MediFusion-Vision
cd Retinal_Model && venv/bin/python app.py
```

### Start Backend
```bash
cd server
node index.js
```

### Start Frontend
```bash
cd client
npm run dev
```

---

## How to Test End-to-End

1. Login as **doctor**
2. Go to Diagnostics → select any scan
3. Run AI Analysis → wait for results
4. Click **"Flag as Incorrect"** button
5. Select corrected diagnosis + reason + notes
6. Submit feedback
7. Check DB — quality score should be calculated:
```sql
SELECT feedback_id, quality_score, validation_status 
FROM ai_feedback 
ORDER BY "createdAt" DESC LIMIT 1;
```
8. Login as **admin** → go to `/admin/feedback`
9. View feedback stats and retraining status
10. Click **"Trigger Retraining"** to manually start

---

## What is Real vs Simulated

| Feature | Status |
|---|---|
| Feedback collection | ✅ Real |
| Quality scoring | ✅ Real |
| Consensus detection | ✅ Real |
| Auto-trigger conditions | ✅ Real |
| Python retraining endpoint | ✅ Real (fine-tuning) |
| Model versioning in DB | ✅ Real |
| Actual GPU training time | ⚠️ Takes 10-30 min per run |

---

## Future Work
- Email notification when retraining completes
- Admin dashboard charts for accuracy over time
- A/B testing between model versions
- Shadow mode deployment