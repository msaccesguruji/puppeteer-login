const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const browser = await puppeteer.launch({
      headless: true, // Set to true in production
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();

    // Log requests and responses for debugging
    page.on('requestfailed', (req) =>
      console.error(`Request failed: ${req.url()} - ${req.failure()?.errorText}`)
    );
    page.on('response', (response) =>
      console.log(`Response: ${response.url()} - ${response.status()}`)
    );

    // Navigate to the login page
    await page.goto('https://app.sellerassistant.app/login', {
      waitUntil: 'domcontentloaded',
    });

    // Input email
    await page.waitForSelector('#input-1', { visible: true, timeout: 10000 });
    await page.type('#input-1', email);

    // Input password
    await page.waitForSelector('#input-3', { visible: true, timeout: 10000 });
    await page.type('#input-3', password);

    // Ensure the submit button is available and click
    await page.waitForSelector('button[type="submit"]', { visible: true, timeout: 10000 });
    await page.evaluate(() => {
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.click();
      }
    });

    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    // Collect cookies after successful login
    const cookies = await page.cookies();
    await browser.close();

    res.status(200).json({ cookies });
  } catch (error) {
    console.error('Error in login:', error.message);

    // Capture detailed error output
    if (error.stack) console.error(error.stack);

    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
