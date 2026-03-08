const puppeteer = require('puppeteer');
const { Scan, Report, Patient, User, Doctor } = require('../models');

// ══════════════════════════════════════════════════════════════
// @desc    Generate PDF Report
// @route   POST /api/scans/:id/report/pdf
// @access  Private (Doctor)
// ══════════════════════════════════════════════════════════════
const generatePDFReport = async (req, res) => {
    const scanId = req.params.id;
    const { diagnosis, notes, aiFindings } = req.body;

    try {
        // ── Fetch scan + patient + doctor data ──
        const scan = await Scan.findByPk(scanId, {
            include: [
                { model: Patient, include: [{ model: User, attributes: ['name', 'email'] }] }
            ]
        });

        if (!scan) return res.status(404).json({ message: 'Scan not found' });

        const doctorProfile = await Doctor.findOne({
            where: { user_id: req.user.id },
            include: [{ model: User, attributes: ['name', 'email'] }]
        });

        const patientName  = scan.Patient?.User?.name  || 'Unknown Patient';
        const patientEmail = scan.Patient?.User?.email || 'N/A';
        const doctorName   = doctorProfile?.User?.name || 'Unknown Doctor';
        const reportDate   = new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const scanType     = (scan.scan_type || 'retinal').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const prediction   = aiFindings?.prediction || {};
        const explanation  = aiFindings?.explanation || {};
        const regions      = aiFindings?.regions     || [];
        const allProbs     = prediction?.all_probs   || {};
        const overlayImg   = aiFindings?.images?.overlay || '';
        const originalImg  = aiFindings?.images?.original || '';
        const heatmapImg   = aiFindings?.images?.heatmap  || '';
        const confidence   = prediction?.confidence || 0;
        const className    = (prediction?.class_name || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        // ── Confidence color ──
        const confColor = confidence >= 80 ? '#16a34a' : confidence >= 60 ? '#d97706' : '#dc2626';

        // ── Regions table rows ──
        const regionRows = regions.map(r => `
            <tr>
                <td>${r.label}</td>
                <td>
                    <div class="bar-wrap">
                        <div class="bar" style="width:${Math.min(r.score * 300, 100)}%;background:${r.is_expected ? '#ef4444' : '#3b82f6'}"></div>
                    </div>
                </td>
                <td>${r.coverage_pct.toFixed(0)}%</td>
                <td>${r.is_expected ? '<span class="badge-red">Expected</span>' : '<span class="badge-gray">Other</span>'}</td>
            </tr>
        `).join('');

        // ── Probabilities rows ──
        const probRows = Object.entries(allProbs)
            .sort((a, b) => b[1] - a[1])
            .map(([cls, prob]) => `
                <tr>
                    <td>${cls.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                    <td>
                        <div class="bar-wrap">
                            <div class="bar" style="width:${prob}%;background:#3b82f6"></div>
                        </div>
                    </td>
                    <td style="color:${prob > 50 ? '#16a34a' : '#6b7280'};font-weight:${prob > 50 ? '700' : '400'}">${prob.toFixed(1)}%</td>
                </tr>
            `).join('');

        // ── HTML Template ──
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color:#1e293b; background:#fff; font-size:13px; }

  /* Header */
  .header { background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); color:white; padding:28px 40px; display:flex; justify-content:space-between; align-items:center; }
  .header-left h1 { font-size:22px; font-weight:700; letter-spacing:0.5px; }
  .header-left p  { font-size:11px; opacity:0.8; margin-top:3px; }
  .header-right   { text-align:right; font-size:11px; opacity:0.85; line-height:1.8; }

  /* Sections */
  .container { padding:28px 40px; }
  .section { margin-bottom:22px; }
  .section-title { font-size:13px; font-weight:700; color:#1e40af; text-transform:uppercase; letter-spacing:1px; border-bottom:2px solid #e2e8f0; padding-bottom:6px; margin-bottom:14px; }

  /* Info grid */
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .info-item label { font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }
  .info-item p     { font-size:13px; font-weight:600; color:#0f172a; margin-top:2px; }

  /* Prediction box */
  .prediction-box { background:linear-gradient(135deg,#eff6ff,#f5f3ff); border:1.5px solid #bfdbfe; border-radius:12px; padding:20px; display:flex; justify-content:space-between; align-items:center; }
  .pred-main h2   { font-size:22px; font-weight:800; color:#1e293b; }
  .pred-main p    { font-size:12px; color:#64748b; margin-top:3px; }
  .pred-conf      { text-align:center; }
  .pred-conf .conf-val { font-size:32px; font-weight:900; }
  .pred-conf .conf-lbl { font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:1px; }

  /* Confidence bar */
  .conf-bar-wrap { background:#e2e8f0; border-radius:99px; height:8px; margin-top:10px; overflow:hidden; }
  .conf-bar      { height:8px; border-radius:99px; }

  /* Images */
  .images-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
  .img-card    { border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; }
  .img-card p  { font-size:10px; font-weight:600; color:#64748b; text-align:center; padding:6px; background:#f8fafc; text-transform:uppercase; letter-spacing:0.5px; }
  .img-card img { width:100%; height:160px; object-fit:contain; background:#0f172a; display:block; }

  /* Tables */
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th    { background:#f1f5f9; color:#475569; font-weight:600; padding:8px 10px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; }
  td    { padding:8px 10px; border-bottom:1px solid #f1f5f9; color:#1e293b; }
  tr:last-child td { border-bottom:none; }

  .bar-wrap { background:#e2e8f0; border-radius:99px; height:6px; width:120px; overflow:hidden; }
  .bar      { height:6px; border-radius:99px; }

  .badge-red  { background:#fee2e2; color:#b91c1c; font-size:10px; padding:2px 7px; border-radius:99px; font-weight:600; }
  .badge-gray { background:#f1f5f9; color:#64748b; font-size:10px; padding:2px 7px; border-radius:99px; font-weight:600; }

  /* Explanation boxes */
  .expl-box { border-radius:10px; padding:14px; margin-bottom:10px; }
  .expl-box.blue   { background:#eff6ff; border-left:4px solid #3b82f6; }
  .expl-box.green  { background:#f0fdf4; border-left:4px solid #22c55e; }
  .expl-box.yellow { background:#fffbeb; border-left:4px solid #f59e0b; }
  .expl-box.red    { background:#fef2f2; border-left:4px solid #ef4444; }
  .expl-box strong { font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; display:block; margin-bottom:5px; }
  .expl-box p      { font-size:12px; line-height:1.6; color:#1e293b; }

  /* Doctor notes */
  .notes-box { background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:10px; padding:16px; }
  .notes-box p { line-height:1.7; color:#374151; }

  /* Disclaimer */
  .disclaimer { background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:12px 16px; margin-top:10px; }
  .disclaimer p { font-size:11px; color:#92400e; line-height:1.6; }

  /* Footer */
  .footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:14px 40px; display:flex; justify-content:space-between; font-size:10px; color:#94a3b8; }

  /* Page break */
  .page-break { page-break-before:always; }
</style>
</head>
<body>

<!-- ══ HEADER ══ -->
<div class="header">
  <div class="header-left">
    <h1>🏥 MediFusion Vision</h1>
    <p>AI-Powered Medical Diagnostic Report</p>
  </div>
  <div class="header-right">
    <div>Report Date: <strong>${reportDate}</strong></div>
    <div>Scan Type: <strong>${scanType}</strong></div>
    <div>Report ID: <strong>#${scanId.toString().slice(0,8).toUpperCase()}</strong></div>
  </div>
</div>

<div class="container">

  <!-- ══ PATIENT & DOCTOR INFO ══ -->
  <div class="section">
    <div class="section-title">Patient & Doctor Information</div>
    <div class="info-grid">
      <div class="info-item"><label>Patient Name</label><p>${patientName}</p></div>
      <div class="info-item"><label>Patient Email</label><p>${patientEmail}</p></div>
      <div class="info-item"><label>Attending Doctor</label><p>Dr. ${doctorName}</p></div>
      <div class="info-item"><label>Scan Date</label><p>${new Date(scan.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</p></div>
      <div class="info-item"><label>Facility</label><p>${scan.facility_name || 'MediFusion Hospital'}</p></div>
      <div class="info-item"><label>Scan Source</label><p>${(scan.scan_source || 'External').replace(/\b\w/g, c => c.toUpperCase())}</p></div>
    </div>
  </div>

  <!-- ══ AI PREDICTION ══ -->
  <div class="section">
    <div class="section-title">AI Prediction — EfficientNetB3 + GradCAM</div>
    <div class="prediction-box">
      <div class="pred-main">
        <h2>${className}</h2>
        <p>${explanation.confidence_text || ''}</p>
        <div class="conf-bar-wrap" style="width:220px; margin-top:10px;">
          <div class="conf-bar" style="width:${confidence}%; background:${confColor};"></div>
        </div>
      </div>
      <div class="pred-conf">
        <div class="conf-val" style="color:${confColor}">${confidence.toFixed(1)}%</div>
        <div class="conf-lbl">Confidence</div>
      </div>
    </div>
  </div>

  <!-- ══ SCAN IMAGES ══ -->
  ${(originalImg || overlayImg || heatmapImg) ? `
  <div class="section">
    <div class="section-title">Scan Images & GradCAM Visualization</div>
    <div class="images-grid">
      ${originalImg ? `<div class="img-card"><p>Original Scan</p><img src="data:image/jpeg;base64,${originalImg}" /></div>` : ''}
      ${heatmapImg  ? `<div class="img-card"><p>GradCAM Heatmap</p><img src="data:image/jpeg;base64,${heatmapImg}" /></div>` : ''}
      ${overlayImg  ? `<div class="img-card"><p>Overlay</p><img src="data:image/jpeg;base64,${overlayImg}" /></div>` : ''}
    </div>
  </div>` : ''}

  <!-- ══ AI EXPLANATION ══ -->
  <div class="section">
    <div class="section-title">AI Analysis Findings</div>
    ${explanation.what_model_sees ? `<div class="expl-box blue"><strong>What the Model Sees</strong><p>${explanation.what_model_sees}</p></div>` : ''}
    ${explanation.why_prediction  ? `<div class="expl-box green"><strong>Why This Prediction</strong><p>${explanation.why_prediction}</p></div>` : ''}
    ${explanation.red_area_meaning ? `<div class="expl-box red"><strong>High Activation Area</strong><p>${explanation.red_area_meaning}</p></div>` : ''}
    ${explanation.validity_check  ? `<div class="expl-box yellow"><strong>Pattern Validity</strong><p>${explanation.validity_check}</p></div>` : ''}
    ${explanation.clinical_note   ? `<div class="expl-box blue"><strong>Clinical Recommendation</strong><p>${explanation.clinical_note}</p></div>` : ''}
  </div>

  <!-- ══ REGION ANALYSIS ══ -->
  ${regions.length > 0 ? `
  <div class="section">
    <div class="section-title">Retinal Region Activation Analysis</div>
    <table>
      <thead><tr><th>Region</th><th>Activation Level</th><th>Coverage</th><th>Status</th></tr></thead>
      <tbody>${regionRows}</tbody>
    </table>
  </div>` : ''}

  <!-- ══ CLASS PROBABILITIES ══ -->
  ${Object.keys(allProbs).length > 0 ? `
  <div class="section">
    <div class="section-title">Disease Class Probabilities</div>
    <table>
      <thead><tr><th>Condition</th><th>Probability</th><th>Score</th></tr></thead>
      <tbody>${probRows}</tbody>
    </table>
  </div>` : ''}

  <!-- ══ DOCTOR'S REPORT ══ -->
  <div class="section">
    <div class="section-title">Doctor's Final Report</div>
    <div class="info-grid" style="margin-bottom:12px;">
      <div class="info-item"><label>Final Diagnosis</label><p>${diagnosis || 'Pending'}</p></div>
      <div class="info-item"><label>Report By</label><p>Dr. ${doctorName}</p></div>
    </div>
    <div class="notes-box">
      <p><strong style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Clinical Notes & Recommendations</strong></p>
      <p style="margin-top:8px;">${notes || 'No additional notes provided.'}</p>
    </div>
  </div>

  <!-- ══ DISCLAIMER ══ -->
  <div class="disclaimer">
    <p>⚠️ <strong>Medical Disclaimer:</strong> This AI-generated report is intended to assist qualified healthcare professionals and does not constitute a definitive medical diagnosis. The AI analysis (EfficientNetB3 + GradCAM) provides probabilistic findings based on pattern recognition. Final clinical decisions must be made by a licensed physician based on complete clinical evaluation, patient history, and additional investigations as appropriate.</p>
  </div>

</div>

<!-- ══ FOOTER ══ -->
<div class="footer">
  <span>MediFusion Vision — AI Diagnostic Platform</span>
  <span>Confidential Medical Document — Patient: ${patientName}</span>
  <span>Generated: ${reportDate}</span>
</div>

</body>
</html>`;

        // ── Generate PDF with Puppeteer ──
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });
        await browser.close();

        // ── Send PDF ──
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
            `attachment; filename="MediFusion_Report_${patientName.replace(/\s/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf"`
        );
        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ message: 'PDF generation failed', error: error.message });
    }
};

module.exports = { generatePDFReport };