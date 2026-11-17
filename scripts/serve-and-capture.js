const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('../mobile/node_modules/puppeteer-core');

const DIST_DIR = path.resolve(__dirname, '../mobile/dist');
const SCREENS_DIR = '/workspace/edgepoint-home/screens';
const PORT = 8089;

if (!fs.existsSync(SCREENS_DIR)) {
  fs.mkdirSync(SCREENS_DIR, { recursive: true });
}

// Simple SPA static server
const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(DIST_DIR, reqPath);

  // Dynamic route handling
  if (reqPath.startsWith('/match/')) {
    filePath = path.join(DIST_DIR, 'match/[id].html');
  } else if (!fs.existsSync(filePath) || (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory())) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    } else if (fs.existsSync(path.join(DIST_DIR, '(tabs)', reqPath.replace(/^\//, '') + '.html'))) {
      filePath = path.join(DIST_DIR, '(tabs)', reqPath.replace(/^\//, '') + '.html');
    } else {
      filePath = path.join(DIST_DIR, 'index.html');
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.ttf': 'font/ttf',
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

async function run() {
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`Dist server listening on http://127.0.0.1:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();

    // 1. Home Mobile (390x844)
    console.log('Capturing Home Mobile (390px)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });

    // Wait for content (e.g. Arsenal or PICK OF THE DAY)
    await page.waitForFunction(
      () => document.body.innerText.includes('PICK OF THE DAY') || document.body.innerText.includes('Featured Matches'),
      { timeout: 15000 }
    );
    // Allow any layout stabilization
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENS_DIR, 'home-mobile-390.png') });
    console.log('Saved home-mobile-390.png');

    // 2. Home Desktop (1280x800)
    console.log('Capturing Home Desktop (1280px)...');
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => document.body.innerText.includes('PICK OF THE DAY') || document.body.innerText.includes('Featured Matches'),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENS_DIR, 'home-desktop-1280.png') });
    console.log('Saved home-desktop-1280.png');

    // 3. Matches (390x844)
    console.log('Capturing Matches (390px)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(`http://127.0.0.1:${PORT}/matches`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => document.body.innerText.includes('Curated Action Board') || document.body.innerText.includes('Chelsea') || document.body.innerText.includes('Arsenal'),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENS_DIR, 'matches-mobile-390.png') });
    console.log('Saved matches-mobile-390.png');

    // 4. Full Analysis match/[id] (390x844)
    console.log('Capturing Full Analysis (390px)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(`http://127.0.0.1:${PORT}/match/fix-epl-1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => document.body.innerText.includes('Quant Model Valuation') || document.body.innerText.includes('Cross-Book Odds Matrix') || document.body.innerText.includes('Back'),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENS_DIR, 'match-analysis-390.png') });
    console.log('Saved match-analysis-390.png');

    // 5. More (390x844)
    console.log('Capturing More (390px)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(`http://127.0.0.1:${PORT}/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => document.body.innerText.includes('Hub & Quick Links') || document.body.innerText.includes('Watchlist & Betslip'),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENS_DIR, 'more-mobile-390.png') });
    console.log('Saved more-mobile-390.png');

    // 6. Verify hidden routes tracker & record still load
    console.log('Verifying hidden routes tracker & record...');
    await page.goto(`http://127.0.0.1:${PORT}/tracker`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.innerText.includes('Slip Builder') || document.body.innerText.includes('Active Legs') || document.body.innerText.includes('Watchlist'), { timeout: 15000 });
    console.log('Verified /(tabs)/tracker loads cleanly!');

    await page.goto(`http://127.0.0.1:${PORT}/record`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.innerText.includes('Track Record') || document.body.innerText.includes('Verified Performance'), { timeout: 15000 });
    console.log('Verified /(tabs)/record loads cleanly!');

    console.log('All captures and verifications completed successfully!');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('Error running capture script:', err);
  process.exit(1);
});
