# Report Generation — feature/report-generation

## What Was Implemented
- PDF report generation for both Brain MRI and Retinal scans
- Brain scan: Tumor + Alzheimer predictions with GradCAM heatmaps
- Retinal scan: Disease classification with GradCAM overlay
- Reports saved to server/uploads/reports/
- Doctor can download PDF from Diagnostics page

## How to Run

### 1. Start Brain Model (port 5003)
```bash
cd Brain_Model
venv/bin/python app.py
```

### 2. Start Retinal Model (port 5002)
```bash
cd "/Users/macbook/Desktop/FYP Model/Github repo/MediFusion-Vision"
cd Retinal_Model && venv/bin/python app.py
```

### 3. Start Backend
```bash
cd server
node index.js
```

### 4. Start Frontend
```bash
cd client
npm run dev
```

## How to Test
1. Login as doctor
2. Go to Diagnostics
3. Select any scan → Run AI Analysis
4. Click "Download PDF"
5. PDF downloads with full report

## PDF Contents
- Patient & doctor information
- AI prediction with confidence score
- GradCAM heatmap images
- Probability tables
- Doctor notes & disclaimer
