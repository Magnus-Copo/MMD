import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin@magnuscopo.com';
const TEST_PASSWORD = 'Admin123!';

test.describe('Lead Lifecycle', () => {
    test.beforeEach(({ page }) => {
        page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`));
        page.on('pageerror', err => console.error(`[BROWSER ERROR]: ${err.message}`));
    });

    test('should create, move, and persist a lead', async ({ page }) => {
        // 1. Login
        console.log('Logging in...');
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input#email', TEST_EMAIL);
        await page.fill('input#password', TEST_PASSWORD);
        await page.click('button[type="submit"]');

        // Check for error messages if navigation doesn't happen quickly
        const errorLocator = page.locator('.bg-\\[rgba\\(239\\,68\\,68\\,0\\.08\\)\\]');

        try {
            await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
            console.log('Login successful');
        } catch (e) {
            const errorMsg = await errorLocator.textContent().catch(() => 'No visible error message');
            console.error(`Login failed. Error message on page: ${errorMsg}`);
            throw e;
        }

        // 2. Navigate to Leads
        console.log('Navigating to Leads...');
        await page.goto(`${BASE_URL}/dashboard/leads`);
        try {
            await expect(page.getByText('Manage scraped leads and conversions')).toBeVisible({ timeout: 10000 });
        } catch (e) {
            console.error(`Url: ${page.url()}`);
            console.error('Text not found. Printing page content snippet:');
            const body = await page.innerHTML('body');
            console.error(body.slice(0, 500));
            await page.screenshot({ path: 'leads-fail-nav.png' });
            throw e;
        }

        // 3. Create Lead
        console.log('Creating Lead...');
        try {
            await page.click("button:has-text('New Lead')");
        } catch (e) {
            await page.screenshot({ path: 'leads-fail-create-btn.png' });
            const html = await page.innerHTML('.flex.gap-2'); // Should contain the button
            console.error('Button area content:', html);
            throw e;
        }

        const companyName = `Test Corp ${Date.now()}`;
        await page.fill('input[placeholder="Enter company name"]', companyName);
        await page.fill('input[placeholder="LinkedIn, Naukri"]', 'LinkedIn');
        await page.selectOption('select[aria-label="Sector"]', 'IT');
        await page.fill('input[aria-label="Confidence score"]', '90');
        await page.click("button:has-text('Create Lead')");

        // Verify creation
        console.log('Verifying creation...');
        const card = page.locator('h4', { hasText: companyName }).first();
        await expect(card).toBeVisible({ timeout: 10000 });

        // 4. Drag and Drop Interaction
        console.log('Dragging Lead...');
        const destination = page.locator('div[data-status="CONTACTED"]');

        // Manual drag simulation for dnd-kit
        const box = await card.boundingBox();
        const destBox = await destination.boundingBox();

        if (box && destBox) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down();
            // Move in steps to satisfy dnd-kit detection
            await page.mouse.move(destBox.x + destBox.width / 2, destBox.y + destBox.height / 2, { steps: 15 });
            await page.mouse.up();
        }

        console.log('Waiting for status update...');
        await page.waitForTimeout(3000);

        // 5. Verify Persistence
        console.log('Reloading to verify persistence...');
        await page.reload();

        const reloadedCard = page.locator('h4', { hasText: companyName }).first();
        await expect(reloadedCard).toBeVisible();

        // Click Edit to verify status in backend
        console.log('Verifying status in edit modal...');
        await reloadedCard.locator('../..').locator('button[title="Edit Lead"]').click();
        await expect(page.locator('select[aria-label="Status"]')).toHaveValue('CONTACTED');
        console.log('✅ Integration Test Passed!');
    });
});
