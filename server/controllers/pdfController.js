const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { Scan, Report, Patient, User, Doctor } = require('../models');
const { generateReportPDF } = require('../utils/pdfGenerator');

// @desc    Generate PDF Report (retinal + brain)
// @route   POST /api/scans/:id/report/pdf
// @access  Private (Doctor, Patient)
const generatePDFReport = async (req, res) => {
    const scanId = req.params.id;

    try {
        // Fetch scan + patient data
        const scan = await Scan.findByPk(scanId, {
            include: [{ model: Patient, include: [User] }]
        });
        if (!scan) return res.status(404).json({ message: 'Scan not found' });

        const report = await Report.findOne({ where: { scan_id: scanId } });
        if (!report) return res.status(404).json({ message: 'Report not finalized yet' });

        const doctorProfile = req.user.role === 'doctor'
            ? await Doctor.findOne({ where: { user_id: req.user.id }, include: [{ model: User }] })
            : null;

        const aiFindings = report.ai_findings  || {};
        const diagnosis  = report.diagnosis    || 'Pending';
        const notes      = report.doctor_notes || 'No additional notes provided.';

        const patientName  = scan.Patient?.User?.name  || 'Unknown Patient';
        const patientEmail = scan.Patient?.User?.email || 'N/A';
        const doctorName   = doctorProfile?.User?.name || 'Unknown Doctor';
        const reportDate   = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const scanType = (scan.scan_type || 'retinal').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        const isBrain = !!(aiFindings?.tumor);

        const sharedCSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color:#1e293b; background:#fff; font-size:13px; }
  .header { background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); color:white; padding:28px 40px; display:flex; justify-content:space-between; align-items:center; }
  .header-left h1 { font-size:22px; font-weight:700; }
  .header-left p  { font-size:11px; opacity:0.8; margin-top:3px; }
  .header-right   { text-align:right; font-size:11px; opacity:0.85; line-height:1.8; }
  .container { padding:28px 40px; }
  .section { margin-bottom:22px; }
  .section-title { font-size:13px; font-weight:700; color:#1e40af; text-transform:uppercase; letter-spacing:1px; border-bottom:2px solid #e2e8f0; padding-bottom:6px; margin-bottom:14px; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .info-item label { font-size:10px; color:#64748b; text-transform:uppercase; }
  .info-item p     { font-size:13px; font-weight:600; color:#0f172a; margin-top:2px; }
  .prediction-box { background:linear-gradient(135deg,#eff6ff,#f5f3ff); border:1.5px solid #bfdbfe; border-radius:12px; padding:20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
  .pred-main h2 { font-size:22px; font-weight:800; color:#1e293b; }
  .pred-main p  { font-size:12px; color:#64748b; margin-top:3px; }
  .pred-conf    { text-align:center; }
  .pred-conf .conf-val { font-size:32px; font-weight:900; }
  .pred-conf .conf-lbl { font-size:10px; color:#64748b; text-transform:uppercase; }
  .conf-bar-wrap { background:#e2e8f0; border-radius:99px; height:8px; margin-top:10px; overflow:hidden; }
  .conf-bar      { height:8px; border-radius:99px; }
  .images-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
  .img-card    { border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; }
  .img-card p  { font-size:10px; font-weight:600; color:#64748b; text-align:center; padding:6px; background:#f8fafc; text-transform:uppercase; }
  .img-card img { width:100%; height:160px; object-fit:contain; background:#0f172a; display:block; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th    { background:#f1f5f9; color:#475569; font-weight:600; padding:8px 10px; text-align:left; font-size:11px; text-transform:uppercase; }
  td    { padding:8px 10px; border-bottom:1px solid #f1f5f9; color:#1e293b; }
  tr:last-child td { border-bottom:none; }
  .bar-wrap { background:#e2e8f0; border-radius:99px; height:6px; width:120px; overflow:hidden; }
  .bar      { height:6px; border-radius:99px; }
  .badge-red  { background:#fee2e2; color:#b91c1c; font-size:10px; padding:2px 7px; border-radius:99px; font-weight:600; }
  .badge-gray { background:#f1f5f9; color:#64748b; font-size:10px; padding:2px 7px; border-radius:99px; font-weight:600; }
  .expl-box { border-radius:10px; padding:14px; margin-bottom:10px; }
  .expl-box.blue   { background:#eff6ff; border-left:4px solid #3b82f6; }
  .expl-box.green  { background:#f0fdf4; border-left:4px solid #22c55e; }
  .expl-box.yellow { background:#fffbeb; border-left:4px solid #f59e0b; }
  .expl-box.red    { background:#fef2f2; border-left:4px solid #ef4444; }
  .expl-box strong { font-size:11px; text-transform:uppercase; color:#64748b; display:block; margin-bottom:5px; }
  .expl-box p { font-size:12px; line-height:1.6; color:#1e293b; }
  .priority-box { border-radius:12px; padding:16px 20px; margin-bottom:14px; border:1.5px solid; }
  .priority-high   { background:#fef2f2; border-color:#fca5a5; }
  .priority-medium { background:#fffbeb; border-color:#fde68a; }
  .priority-low    { background:#f0fdf4; border-color:#86efac; }
  .priority-box h3 { font-size:15px; font-weight:700; margin-bottom:4px; }
  .priority-box p  { font-size:12px; line-height:1.6; color:#374151; }
  .notes-box { background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:10px; padding:16px; }
  .notes-box p { line-height:1.7; color:#374151; }
  .disclaimer { background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:12px 16px; margin-top:10px; }
  .disclaimer p { font-size:11px; color:#92400e; line-height:1.6; }
  .footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:14px 40px; display:flex; justify-content:space-between; font-size:10px; color:#94a3b8; }
`;

        const sharedHeader = `
<div class="header">
  <div class="header-left"><h1>MediFusion Vision</h1><p>AI-Powered Medical Diagnostic Report</p></div>
  <div class="header-right">
    <div>Report Date: <strong>${reportDate}</strong></div>
    <div>Scan Type: <strong>${scanType}</strong></div>
    <div>Report ID: <strong>#${scanId.toString().slice(0,8).toUpperCase()}</strong></div>
  </div>
</div>
<div class="container">
  <div class="section">
    <div class="section-title">Patient &amp; Doctor Information</div>
    <div class="info-grid">
      <div class="info-item"><label>Patient Name</label><p>${patientName}</p></div>
      <div class="info-item"><label>Patient Email</label><p>${patientEmail}</p></div>
      <div class="info-item"><label>Attending Doctor</label><p>Dr. ${doctorName}</p></div>
      <div class="info-item"><label>Scan Date</label><p>${new Date(scan.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p></div>
      <div class="info-item"><label>Facility</label><p>${scan.facility_name || 'MediFusion Hospital'}</p></div>
      <div class="info-item"><label>Scan Source</label><p>${(scan.scan_source||'External').replace(/\b\w/g,c=>c.toUpperCase())}</p></div>
    </div>
  </div>`;

        const sharedFooter = `
  <div class="section">
    <div class="section-title">Doctor's Final Report</div>
    <div class="info-grid" style="margin-bottom:12px;">
      <div class="info-item"><label>Final Diagnosis</label><p>${diagnosis}</p></div>
      <div class="info-item"><label>Report By</label><p>Dr. ${doctorName}</p></div>
    </div>
    <div class="notes-box"><p><strong style="font-size:11px;color:#64748b;text-transform:uppercase;">Clinical Notes &amp; Recommendations</strong></p><p style="margin-top:8px;">${notes}</p></div>
  </div>
  <div class="disclaimer"><p><strong>Medical Disclaimer:</strong> This AI-generated report is intended to assist qualified healthcare professionals and does not constitute a definitive medical diagnosis.</p></div>
</div>
<div class="footer">
  <span>MediFusion Vision — AI Diagnostic Platform</span>
  <span>Confidential Medical Document — Patient: ${patientName}</span>
  <span>Generated: ${reportDate}</span>
</div>`;

        let bodyContent = '';

        if (isBrain) {
            const tumor = aiFindings.tumor || {};
            const alz   = aiFindings.alzheimer || {};
            const summary = aiFindings.clinical_summary || {};
            const brainImages = aiFindings.images || {};

            const tumorClass = (tumor.predicted_class || 'Unknown').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
            const tumorConf  = typeof tumor.confidence === 'number' ? tumor.confidence : 0;
            const tumorProbs = tumor.all_probabilities || {};
            const alzClass   = (alz.predicted_class || 'Unknown').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
            const alzConf    = typeof alz.confidence === 'number' ? alz.confidence : 0;
            const alzProbs   = alz.all_probabilities || {};

            const tc = tumorConf >= 80 ? '#16a34a' : tumorConf >= 60 ? '#d97706' : '#dc2626';
            const ac = alzConf   >= 80 ? '#16a34a' : alzConf   >= 60 ? '#d97706' : '#dc2626';
            const pLevel = summary.priority_level || 'medium';
            const pClass = pLevel === 'high' ? 'priority-high' : pLevel === 'low' ? 'priority-low' : 'priority-medium';
            const pLabel = pLevel === 'high' ? 'HIGH PRIORITY' : pLevel === 'low' ? 'LOW PRIORITY' : 'MODERATE PRIORITY';
            const pColor = pLevel === 'high' ? '#b91c1c' : pLevel === 'low' ? '#166534' : '#92400e';

            const tumorRows = Object.entries(tumorProbs).sort((a,b)=>b[1]-a[1]).map(([cls,p])=>`<tr><td>${cls.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</td><td><div class="bar-wrap"><div class="bar" style="width:${p}%;background:#3b82f6"></div></div></td><td style="color:${p>50?'#16a34a':'#6b7280'};font-weight:${p>50?'700':'400'}">${p.toFixed(1)}%</td></tr>`).join('');
            const alzRows  = Object.entries(alzProbs).sort((a,b)=>b[1]-a[1]).map(([cls,p])=>`<tr><td>${cls.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</td><td><div class="bar-wrap"><div class="bar" style="width:${p}%;background:#8b5cf6"></div></div></td><td style="color:${p>50?'#16a34a':'#6b7280'};font-weight:${p>50?'700':'400'}">${p.toFixed(1)}%</td></tr>`).join('');

            const origImg = brainImages.original || '';
            const tHeat   = brainImages.tumor_heatmap || '';
            const aHeat   = brainImages.alz_heatmap   || '';

            bodyContent = `
  <div class="section"><div class="section-title">Clinical Priority Assessment</div>
    <div class="priority-box ${pClass}"><h3 style="color:${pColor}">${pLabel}</h3><p>${summary.summary||'AI analysis complete.'}</p></div>
    ${summary.recommendations?`<div class="expl-box blue"><strong>Recommendations</strong><p>${summary.recommendations}</p></div>`:''}
  </div>
  <div class="section"><div class="section-title">Brain Tumor Analysis — ResNet18</div>
    <div class="prediction-box"><div class="pred-main"><h2>${tumorClass}</h2><p>Brain Tumor Classification</p><div class="conf-bar-wrap" style="width:220px;margin-top:10px;"><div class="conf-bar" style="width:${tumorConf}%;background:${tc};"></div></div></div>
      <div class="pred-conf"><div class="conf-val" style="color:${tc}">${tumorConf.toFixed(1)}%</div><div class="conf-lbl">Confidence</div></div></div>
    ${Object.keys(tumorProbs).length>0?`<table><thead><tr><th>Tumor Type</th><th>Probability</th><th>Score</th></tr></thead><tbody>${tumorRows}</tbody></table>`:''}
  </div>
  <div class="section"><div class="section-title">Alzheimer's Disease Analysis — DenseNet121</div>
    <div class="prediction-box" style="background:linear-gradient(135deg,#fdf4ff,#f5f3ff);border-color:#e9d5ff;"><div class="pred-main"><h2>${alzClass}</h2><p>Alzheimer's Stage Classification</p><div class="conf-bar-wrap" style="width:220px;margin-top:10px;"><div class="conf-bar" style="width:${alzConf}%;background:${ac};"></div></div></div>
      <div class="pred-conf"><div class="conf-val" style="color:${ac}">${alzConf.toFixed(1)}%</div><div class="conf-lbl">Confidence</div></div></div>
    ${Object.keys(alzProbs).length>0?`<table><thead><tr><th>Stage</th><th>Probability</th><th>Score</th></tr></thead><tbody>${alzRows}</tbody></table>`:''}
  </div>
  ${(origImg||tHeat||aHeat)?`<div class="section"><div class="section-title">Brain Scan Images &amp; Heatmaps</div><div class="images-grid">
    ${origImg?`<div class="img-card"><p>Original MRI</p><img src="data:image/jpeg;base64,${origImg}"/></div>`:''}
    ${tHeat?`<div class="img-card"><p>Tumor Heatmap</p><img src="data:image/jpeg;base64,${tHeat}"/></div>`:''}
    ${aHeat?`<div class="img-card"><p>Alzheimer Heatmap</p><img src="data:image/jpeg;base64,${aHeat}"/></div>`:''}
  </div></div>`:''}`;
        } else {
            const prediction  = aiFindings?.prediction  || {};
            const explanation = aiFindings?.explanation || {};
            const regions     = aiFindings?.regions     || [];
            const allProbs    = prediction?.all_probs   || {};
            const overlayImg  = aiFindings?.images?.overlay  || '';
            const originalImg = aiFindings?.images?.original || '';
            const heatmapImg  = aiFindings?.images?.heatmap  || '';
            const confidence  = prediction?.confidence || 0;
            const className   = (prediction?.class_name || 'Unknown').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
            const cc = confidence >= 80 ? '#16a34a' : confidence >= 60 ? '#d97706' : '#dc2626';

            const regionRows = regions.map(r=>`<tr><td>${r.label}</td><td><div class="bar-wrap"><div class="bar" style="width:${Math.min(r.score*300,100)}%;background:${r.is_expected?'#ef4444':'#3b82f6'}"></div></div></td><td>${r.coverage_pct.toFixed(0)}%</td><td>${r.is_expected?'<span class="badge-red">Expected</span>':'<span class="badge-gray">Other</span>'}</td></tr>`).join('');
            const probRows   = Object.entries(allProbs).sort((a,b)=>b[1]-a[1]).map(([cls,p])=>`<tr><td>${cls.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</td><td><div class="bar-wrap"><div class="bar" style="width:${p}%;background:#3b82f6"></div></div></td><td style="color:${p>50?'#16a34a':'#6b7280'};font-weight:${p>50?'700':'400'}">${p.toFixed(1)}%</td></tr>`).join('');

            bodyContent = `
  <div class="section"><div class="section-title">AI Prediction — EfficientNetB3 + GradCAM</div>
    <div class="prediction-box"><div class="pred-main"><h2>${className}</h2><p>${explanation.confidence_text||''}</p><div class="conf-bar-wrap" style="width:220px;margin-top:10px;"><div class="conf-bar" style="width:${confidence}%;background:${cc};"></div></div></div>
      <div class="pred-conf"><div class="conf-val" style="color:${cc}">${confidence.toFixed(1)}%</div><div class="conf-lbl">Confidence</div></div></div>
  </div>
  ${(originalImg||overlayImg||heatmapImg)?`<div class="section"><div class="section-title">Scan Images &amp; GradCAM Visualization</div><div class="images-grid">
    ${originalImg?`<div class="img-card"><p>Original Scan</p><img src="data:image/jpeg;base64,${originalImg}"/></div>`:''}
    ${heatmapImg?`<div class="img-card"><p>GradCAM Heatmap</p><img src="data:image/jpeg;base64,${heatmapImg}"/></div>`:''}
    ${overlayImg?`<div class="img-card"><p>Overlay</p><img src="data:image/jpeg;base64,${overlayImg}"/></div>`:''}
  </div></div>`:''}
  <div class="section"><div class="section-title">AI Analysis Findings</div>
    ${explanation.what_model_sees?`<div class="expl-box blue"><strong>What the Model Sees</strong><p>${explanation.what_model_sees}</p></div>`:''}
    ${explanation.why_prediction?`<div class="expl-box green"><strong>Why This Prediction</strong><p>${explanation.why_prediction}</p></div>`:''}
    ${explanation.red_area_meaning?`<div class="expl-box red"><strong>High Activation Area</strong><p>${explanation.red_area_meaning}</p></div>`:''}
    ${explanation.validity_check?`<div class="expl-box yellow"><strong>Pattern Validity</strong><p>${explanation.validity_check}</p></div>`:''}
    ${explanation.clinical_note?`<div class="expl-box blue"><strong>Clinical Recommendation</strong><p>${explanation.clinical_note}</p></div>`:''}
  </div>
  ${regions.length>0?`<div class="section"><div class="section-title">Retinal Region Activation Analysis</div><table><thead><tr><th>Region</th><th>Activation Level</th><th>Coverage</th><th>Status</th></tr></thead><tbody>${regionRows}</tbody></table></div>`:''}
  ${Object.keys(allProbs).length>0?`<div class="section"><div class="section-title">Disease Class Probabilities</div><table><thead><tr><th>Condition</th><th>Probability</th><th>Score</th></tr></thead><tbody>${probRows}</tbody></table></div>`:''}`;
        }

        const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><style>${sharedCSS}</style></head><body>${sharedHeader}${bodyContent}${sharedFooter}</body></html>`;

        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top:'0', right:'0', bottom:'0', left:'0' } });
        await browser.close();

        const reportsDir = path.join(__dirname, '..', 'uploads', 'reports');
        fs.mkdirSync(reportsDir, { recursive: true });
        const fileName = `MediFusion_Report_${patientName.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}_${scanId}.pdf`;
        const filePath = path.join(reportsDir, fileName);
        fs.writeFileSync(filePath, pdfBuffer);

        try { await scan.update({ pdf_path: `uploads/reports/${fileName}` }); } catch (_) {}

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ message: 'PDF generation failed', error: error.message });
    }
};

module.exports = { generatePDFReport };
