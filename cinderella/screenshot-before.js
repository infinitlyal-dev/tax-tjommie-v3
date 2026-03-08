const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

  console.log('Navigating to live app...');
  await page.goto('https://tax-tjommie-app.vercel.app', { waitUntil: 'load', timeout: 90000 });
  console.log('Page loaded, waiting for React to render...');
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'cinderella/before/01-welcome.png', fullPage: true, timeout: 15000 });
  console.log('1. Welcome screen captured');

  // List all visible text to understand what rendered
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Page text:', bodyText.substring(0, 200));

  // List all buttons
  const buttons = await page.$$eval('button', btns => btns.map(b => b.textContent.trim().substring(0, 50)));
  console.log('Buttons:', buttons);

  // Set up localStorage with mock data
  await page.evaluate(() => {
    const mockData = {
      screen: 'dashboard',
      name: 'Thabo',
      dob: '1990-05-15',
      occupation: 'Freelance Developer',
      taxYear: '2025',
      monthlyGross: 45000,
      annualGross: 540000,
      deductions: {
        homeOffice: 24000,
        travel: 12000,
        equipment: 8500,
        internet: 6000,
        phone: 3600,
        medical: 4200,
        retirement: 36000,
        other: 2000
      },
      expenses: [
        { id: 1, date: '2026-03-01', description: 'Woolworths groceries', amount: 850, category: 'Groceries', type: 'personal' },
        { id: 2, date: '2026-03-02', description: 'Uber to client meeting', amount: 165, category: 'Transport', type: 'work' },
        { id: 3, date: '2026-03-03', description: 'Takealot monitor stand', amount: 1299, category: 'Equipment', type: 'work' },
        { id: 4, date: '2026-03-04', description: 'Discovery Health', amount: 2100, category: 'Medical', type: 'personal' },
        { id: 5, date: '2026-03-05', description: 'Fibre internet', amount: 999, category: 'Internet', type: 'work' },
        { id: 6, date: '2026-03-06', description: 'Coffee at Vida', amount: 65, category: 'Food', type: 'personal' },
        { id: 7, date: '2026-03-07', description: 'Adobe subscription', amount: 299, category: 'Software', type: 'work' },
      ],
      budget: {
        total: 25000,
        categories: {
          Groceries: 5000,
          Transport: 3000,
          Entertainment: 2000,
          Utilities: 4000,
          Food: 2500
        }
      },
      setupComplete: true
    };
    localStorage.setItem('tax_tjommie_v3', JSON.stringify(mockData));
  });

  // Reload with data
  await page.goto('https://tax-tjommie-app.vercel.app', { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(5000);

  // Try to navigate to dashboard
  const screens = [
    { hash: '#dashboard', name: '02-dashboard' },
    { hash: '#log', name: '03-log-expense' },
    { hash: '#expenses', name: '04-expenses' },
    { hash: '#tax', name: '05-tax-hub' },
    { hash: '#budget', name: '06-budget' },
    { hash: '#backpocket', name: '07-backpocket' },
    { hash: '#documents', name: '08-documents' },
    { hash: '#settings', name: '09-settings' },
  ];

  for (const screen of screens) {
    try {
      await page.evaluate((hash) => { window.location.hash = hash; }, screen.hash);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `cinderella/before/${screen.name}.png`, fullPage: true, timeout: 15000 });
      console.log(`${screen.name} captured`);
    } catch (e) {
      console.log(`Failed ${screen.name}: ${e.message.substring(0, 80)}`);
    }
  }

  await browser.close();
  console.log('\nDone!');
})();
