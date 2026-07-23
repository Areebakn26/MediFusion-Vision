const puppeteer = require('../server/node_modules/puppeteer');
const { marked }  = require('../server/node_modules/marked');
const fs          = require('fs');
const path        = require('path');

const mdPath  = path.join(__dirname, 'implementation_doc.md');
const outPath = path.join(__dirname, 'MediFusionVision_Implementation_Doc.pdf');
const md      = fs.readFileSync(mdPath, 'utf8');

// Configure marked for clean table/code rendering
marked.setOptions({ gfm: true, breaks: false });
const body = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  /* ── Page setup ── */
  @page { size: A4; margin: 2.2cm 2.4cm 2.2cm 2.4cm; }
  * { box-sizing: border-box; }

  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.65;
    color: #1a1a2e;
    background: #fff;
  }

  /* ── Cover-page block ── */
  .cover {
    text-align: center;
    padding: 80px 0 60px;
    page-break-after: always;
  }
  .cover .uni   { font-size: 15pt; font-weight: 700; color: #0d3b6e; margin-bottom: 10px; }
  .cover .title { font-size: 26pt; font-weight: 800; color: #0d3b6e; margin: 20px 0 10px; letter-spacing: 1px; }
  .cover .sub   { font-size: 12pt; color: #555; margin-bottom: 36px; }
  .cover .authors { font-size: 11pt; line-height: 2.2; color: #333; margin-bottom: 30px; }
  .cover .supervisor { font-size: 11pt; color: #444; margin-top: 10px; }
  .cover .degree  { font-size: 10.5pt; color: #666; margin-top: 18px; }
  .cover hr { border: none; border-top: 2px solid #0d3b6e; width: 80px; margin: 30px auto; }

  /* ── Headings ── */
  h1 { font-size: 18pt; font-weight: 800; color: #0d3b6e;
       border-bottom: 3px solid #0d3b6e; padding-bottom: 6px;
       margin-top: 40px; margin-bottom: 16px; page-break-after: avoid; }
  h2 { font-size: 14pt; font-weight: 700; color: #1a4a8a;
       border-left: 4px solid #1a4a8a; padding-left: 10px;
       margin-top: 28px; margin-bottom: 10px; page-break-after: avoid; }
  h3 { font-size: 12pt; font-weight: 700; color: #0d3b6e;
       margin-top: 22px; margin-bottom: 8px; page-break-after: avoid; }
  h4 { font-size: 11pt; font-weight: 600; color: #333;
       margin-top: 16px; margin-bottom: 6px; page-break-after: avoid; }

  /* ── Paragraphs & lists ── */
  p  { margin: 0 0 10px; text-align: justify; }
  ul, ol { margin: 6px 0 10px 22px; padding: 0; }
  li { margin-bottom: 4px; }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 18px;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  thead tr { background: #0d3b6e; color: #fff; }
  thead th { padding: 8px 10px; text-align: left; font-weight: 600; border: 1px solid #0d3b6e; }
  tbody tr:nth-child(even) { background: #f0f4fb; }
  tbody tr:nth-child(odd)  { background: #fff; }
  tbody td { padding: 7px 10px; border: 1px solid #c8d6e8; vertical-align: top; }

  /* ── Code blocks ── */
  pre {
    background: #1e2a3a;
    color: #d4e6f1;
    padding: 14px 16px;
    border-radius: 6px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8.5pt;
    overflow-x: auto;
    margin: 12px 0 16px;
    page-break-inside: avoid;
    white-space: pre-wrap;
    word-break: break-word;
  }
  code {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 9pt;
    background: #eef2f7;
    color: #c0392b;
    padding: 1px 4px;
    border-radius: 3px;
  }
  pre code { background: none; color: inherit; padding: 0; font-size: inherit; }

  /* ── Horizontal rules ── */
  hr { border: none; border-top: 1px solid #c8d6e8; margin: 24px 0; }

  /* ── Block-level dividers ── */
  .chapter-break { page-break-before: always; }

  /* ── Prevent widow/orphan lines ── */
  p, li { orphans: 3; widows: 3; }

  /* ── Footer-style page numbers via CSS counters ── */
  @page {
    @bottom-center {
      content: counter(page);
      font-size: 9pt;
      color: #888;
    }
  }
</style>
</head>
<body>

<div class="cover">
  <div class="uni">COMSATS University, Islamabad — Pakistan</div>
  <hr>
  <div class="title">MediFusion Vision</div>
  <div class="sub">Implementation Documentation</div>
  <hr>
  <div style="font-size:11pt;color:#444;margin-bottom:8px;">By</div>
  <div class="authors">
    AIZA KHADIM &nbsp;&nbsp;&nbsp; CIIT/FA22-BCS-010/ISB<br>
    AREEBA NIAZI &nbsp;&nbsp; CIIT/FA22-BCS-014/ISB<br>
    AREEHA NAYAB &nbsp; CIIT/FA22-BCS-015/ISB
  </div>
  <div class="supervisor"><strong>Supervisor:</strong> Dr. Rasool Bukhsh</div>
  <div class="degree">Bachelor of Science in Computer Science / Software Engineering (2022–2026)</div>
</div>

${body}

</body>
</html>`;

(async () => {
  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  console.log('Generating PDF...');
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size:8px;color:#aaa;width:100%;text-align:center;padding-top:6px;">
        MediFusion Vision — Implementation Documentation
      </div>`,
    footerTemplate: `
      <div style="font-size:8px;color:#aaa;width:100%;text-align:center;padding-bottom:6px;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>`,
    margin: { top: '2.2cm', bottom: '2.2cm', left: '2.4cm', right: '2.4cm' },
  });

  await browser.close();
  console.log('PDF saved to:', outPath);
})();
