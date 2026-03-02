import os
import time
from playwright.sync_api import sync_playwright, expect
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

BASE_URL = "http://localhost:3000"
# Use a test user if available, or admin creds
TEST_EMAIL = "admin@magnuscopo.com" 
TEST_PASSWORD = "Admin123!"

def test_lead_lifecycle():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("🚀 Starting Lead Lifecycle Test...")

        # 1. Login
        print("🔑 Logging in...")
        page.goto(f"{BASE_URL}/login")
        page.fill('input[type="email"]', TEST_EMAIL)
        page.fill('input[type="password"]', TEST_PASSWORD)
        page.click('button[type="submit"]')
        
        # Wait for dashboard
        page.wait_for_url(f"{BASE_URL}/dashboard")
        print("✅ Login Successful")

        # 2. Navigate to Leads
        print("📂 Navigating to Leads...")
        page.goto(f"{BASE_URL}/dashboard/leads")
        expect(page.get_by_text("Leads")).to_be_visible()

        # 3. Create New Lead
        print("➕ Creating New Lead...")
        page.click("button:has-text('New Lead')")
        
        test_company = f"Test Corp {int(time.time())}"
        page.fill('input[placeholder="Enter company name"]', test_company)
        page.fill('input[placeholder="LinkedIn, Naukri"]', "LinkedIn")
        page.select_option('select[aria-label="Sector"]', "IT")
        page.fill('input[aria-label="Confidence score"]', "85")
        page.click("button:has-text('Create Lead')")

        # Verify Lead Appears in NEW column
        print(f"✅ Verifying {test_company} in NEW column...")
        # Assuming the first column is NEW. We look for the card text.
        expect(page.get_by_text(test_company)).to_be_visible()

        # 4. Drag to 'CONTACTED'
        print("✋ Dragging Lead to CONTACTED...")
        # Locate the card drag handle or the card itself
        # Note: Dnd-kit usually needs specific mouse events in Playwright
        card = page.locator(f"div:has-text('{test_company}')").last
        
        # Using drag_to is tricky with some libraries, let's try manual mouse steps
        # Find destination column (CONTACTED)
        contacted_col = page.locator("div[data-status='CONTACTED']")
        
        card.drag_to(contacted_col)
        
        # Wait for persistence (optimistic UI is fast, server is slow)
        time.sleep(2) 

        # 5. Reload and Verify Persistence
        print("🔄 Reloading to verify persistence...")
        page.reload()
        
        # Check if it's in the correct column context
        # This is harder to verify structurally without specific IDs, 
        # but if we check the status select inside the card, it should say 'CONTACTED'
        # Or we check that it is NOT in 'NEW' if we assume strict ordered rendering.
        
        # Better: Click Edit and check status
        print("🔍 Verifying status persisted...")
        page.click(f"div:has-text('{test_company}') button[title='Edit Lead']")
        expect(page.locator('select[aria-label="Status"]')).to_have_value("CONTACTED")
        
        print("✅ Lifecycle Test Passed!")
        
        browser.close()

if __name__ == "__main__":
    test_lead_lifecycle()
