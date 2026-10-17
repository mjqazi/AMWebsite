// Render single-line-diagram-checklist.html with its print stylesheet to
// downloads/single-line-diagram-checklist.pdf.
// usage: (serve the repo on :8765) node tools/build_sld_checklist_pdf.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const base = process.env.SITE || 'http://localhost:8765';
  const out = path.join(__dirname, '..', 'downloads', 'single-line-diagram-checklist.pdf');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(base + '/single-line-diagram-checklist.html', { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: out, format: 'A4', printBackground: false, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size:7px;width:100%;text-align:center;color:#555;font-family:Arial">Advanced Mechanix &middot; Single-line diagram checklist &middot; page <span class="pageNumber"></span> of <span class="totalPages"></span></div>' });
  await browser.close();
  console.log('wrote', out);
})();
