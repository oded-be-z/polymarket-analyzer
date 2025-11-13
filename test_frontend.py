#!/usr/bin/env python3
"""
Test the Polymarket Analyzer frontend to verify:
1. API calls are being made to the backend
2. Real data is displayed after JavaScript loads
3. Console errors if any
"""

from playwright.sync_api import sync_playwright
import json

def test_frontend():
    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        # Capture network requests
        api_requests = []
        page.on("request", lambda request: api_requests.append({
            "url": request.url,
            "method": request.method
        }) if "/api/" in request.url or "polymarket" in request.url else None)

        # Capture network responses
        api_responses = []
        def handle_response(response):
            if "/api/" in response.url or "polymarket" in response.url:
                api_responses.append({
                    "url": response.url,
                    "status": response.status,
                    "ok": response.ok
                })
        page.on("response", handle_response)

        print("🌐 Navigating to production frontend...")
        page.goto('https://polymarket-frontend.azurewebsites.net', wait_until='domcontentloaded')

        print("⏳ Waiting for network idle (JavaScript execution)...")
        page.wait_for_load_state('networkidle', timeout=30000)

        print("📸 Taking screenshot...")
        page.screenshot(path='/tmp/polymarket_frontend.png', full_page=True)

        print("\n" + "="*60)
        print("📊 RESULTS")
        print("="*60)

        # Extract market titles
        print("\n🎯 Market Titles Found:")
        market_titles = page.locator('h3.text-base.font-semibold.text-white.mb-2').all_text_contents()
        if market_titles:
            for i, title in enumerate(market_titles[:10], 1):
                print(f"  {i}. {title[:80]}...")
        else:
            print("  ❌ No markets found!")

        # Check for specific mock data indicators
        page_content = page.content()
        has_bitcoin_mock = "Will Bitcoin reach $100,000" in page_content
        has_democrats_mock = "Will the Democrats win" in page_content
        has_ethereum_mock = "Will Ethereum have a successful Shanghai" in page_content
        has_fed_mock = "Will the Fed raise interest rates" in page_content

        print("\n🔍 Mock Data Detection:")
        print(f"  Bitcoin mock: {'❌ YES (MOCK)' if has_bitcoin_mock else '✅ NO'}")
        print(f"  Democrats mock: {'❌ YES (MOCK)' if has_democrats_mock else '✅ NO'}")
        print(f"  Ethereum mock: {'❌ YES (MOCK)' if has_ethereum_mock else '✅ NO'}")
        print(f"  Fed mock: {'❌ YES (MOCK)' if has_fed_mock else '✅ NO'}")

        # Check for real Polymarket data indicators
        has_ncaab = "NCAAB" in page_content or "Arizona State" in page_content
        print(f"  Real data (NCAAB): {'✅ YES' if has_ncaab else '❌ NO'}")

        print("\n🌐 API Requests Made:")
        if api_requests:
            for req in api_requests[:10]:
                print(f"  {req['method']} {req['url']}")
        else:
            print("  ⚠️ No API requests detected!")

        print("\n📡 API Responses:")
        if api_responses:
            for resp in api_responses[:10]:
                status_icon = "✅" if resp['ok'] else "❌"
                print(f"  {status_icon} {resp['status']} {resp['url']}")
        else:
            print("  ⚠️ No API responses received!")

        print("\n📝 Console Logs:")
        if console_logs:
            for log in console_logs[:20]:
                print(f"  {log}")
        else:
            print("  ℹ️ No console logs")

        print("\n📸 Screenshot saved to: /tmp/polymarket_frontend.png")

        # Summary
        print("\n" + "="*60)
        print("📋 SUMMARY")
        print("="*60)

        total_markets = len(market_titles)
        mock_count = sum([has_bitcoin_mock, has_democrats_mock, has_ethereum_mock, has_fed_mock])

        if total_markets == 0:
            print("❌ CRITICAL: No markets displayed at all!")
        elif mock_count == 4:
            print("❌ FAIL: Only mock data is displayed (4/4 mock markets)")
        elif mock_count > 0:
            print(f"⚠️ PARTIAL: {mock_count} mock markets found, but also {total_markets - mock_count} other markets")
        else:
            print(f"✅ SUCCESS: {total_markets} markets displayed, no mock data detected!")

        if not api_requests:
            print("❌ CRITICAL: Frontend is NOT calling the backend API!")
        elif not api_responses:
            print("⚠️ WARNING: API requests sent but no responses received")
        elif any(not r['ok'] for r in api_responses):
            print("⚠️ WARNING: Some API requests failed")
        else:
            print(f"✅ API: {len(api_responses)} successful API calls")

        browser.close()

if __name__ == '__main__':
    test_frontend()
