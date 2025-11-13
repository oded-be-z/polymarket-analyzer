#!/usr/bin/env python3
"""
Test the Polymarket Analyzer frontend with cache disabled
"""

from playwright.sync_api import sync_playwright
import json

def test_frontend():
    with sync_playwright() as p:
        # Launch browser with cache disabled
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            bypass_csp=True,
            ignore_https_errors=True,
            extra_http_headers={
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        )
        page = context.new_page()

        # Capture console logs
        console_logs = []
        errors = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda exc: errors.append(str(exc)))

        # Capture network requests
        api_requests = []
        page.on("request", lambda request: api_requests.append({
            "url": request.url,
            "method": request.method
        }) if "/api/" in request.url or "polymarket" in request.url or "markets" in request.url else None)

        print("🌐 Navigating to production frontend (CACHE DISABLED)...")
        # Add cache-busting timestamp
        import time
        url = f'https://polymarket-frontend.azurewebsites.net?t={int(time.time())}'
        page.goto(url, wait_until='domcontentloaded')

        print("⏳ Waiting for network idle...")
        try:
            page.wait_for_load_state('networkidle', timeout=45000)
        except Exception as e:
            print(f"⚠️ Timeout waiting for network idle: {e}")

        print("📸 Taking screenshot...")
        page.screenshot(path='/tmp/polymarket_frontend_nocache.png', full_page=True)

        print("\n" + "="*60)
        print("📊 RESULTS (NO CACHE)")
        print("="*60)

        # Extract market titles
        print("\n🎯 Market Titles Found:")
        market_titles = page.locator('h3.text-base.font-semibold.text-white.mb-2').all_text_contents()
        if market_titles:
            for i, title in enumerate(market_titles[:10], 1):
                print(f"  {i}. {title[:80]}...")
        else:
            print("  ❌ No markets found!")

        # Check for mock data
        page_content = page.content()
        has_bitcoin_mock = "Will Bitcoin reach $100,000" in page_content
        has_democrats_mock = "Will the Democrats win" in page_content

        print("\n🔍 Mock Data Detection:")
        print(f"  Bitcoin mock: {'❌ YES (MOCK)' if has_bitcoin_mock else '✅ NO'}")
        print(f"  Democrats mock: {'❌ YES (MOCK)' if has_democrats_mock else '✅ NO'}")

        print("\n🌐 API Requests Made (filtered):")
        if api_requests:
            for req in api_requests:
                print(f"  {req['method']} {req['url']}")
        else:
            print("  ⚠️ No API requests to backend detected!")

        print("\n❌ JavaScript Errors:")
        if errors:
            for err in errors:
                print(f"  {err}")
        else:
            print("  ✅ No JavaScript errors")

        print("\n📝 Console Logs (first 30):")
        if console_logs:
            for log in console_logs[:30]:
                print(f"  {log}")
        else:
            print("  ℹ️ No console logs")

        # Check what JavaScript bundles were loaded
        print("\n📦 JavaScript Bundles Loaded:")
        js_requests = [r for r in api_requests if '.js' in r['url']]
        for req in js_requests[:15]:
            filename = req['url'].split('/')[-1]
            print(f"  {filename}")

        browser.close()

if __name__ == '__main__':
    test_frontend()
