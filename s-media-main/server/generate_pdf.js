import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generatePDF() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const htmlPath = path.join(__dirname, '../Pulse_MERN_Interview_Guide.html');
  const pdfPath = path.join(__dirname, '../Pulse_MERN_Interview_Guide.pdf');

  console.log('🚀 Launching Headless Edge to generate PDF...');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '15mm',
      right: '15mm',
    },
    printBackground: true,
  });

  await browser.close();
  console.log(`✅ PDF generated successfully at: ${pdfPath}`);
}

generatePDF().catch(err => {
  console.error('❌ PDF generation failed:', err);
  process.exit(1);
});
