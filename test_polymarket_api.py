"""
Test script to debug Polymarket API response format
"""
import os
from py_clob_client.client import ClobClient
from py_clob_client.constants import POLYGON
import json

def test_polymarket_api():
    """Test actual API response from py-clob-client"""
    print("Testing Polymarket API...")

    # Initialize client (read-only mode)
    host = "https://clob.polymarket.com"
    chain_id = POLYGON

    print(f"Host: {host}")
    print(f"Chain ID: {chain_id}")

    client = ClobClient(host, chain_id=chain_id)

    print("\n=== Testing get_markets() ===")
    try:
        response = client.get_markets()
        print(f"Response type: {type(response)}")
        print(f"Response length: {len(response) if hasattr(response, '__len__') else 'N/A'}")

        if isinstance(response, list):
            print(f"First item type: {type(response[0]) if response else 'Empty list'}")
            if response:
                print(f"First item sample: {json.dumps(response[0], indent=2) if isinstance(response[0], dict) else response[0]}")
        elif isinstance(response, dict):
            print(f"Keys: {list(response.keys())}")
            print(f"Sample: {json.dumps(response, indent=2)[:500]}")
        else:
            print(f"Raw response: {str(response)[:500]}")

    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

    print("\n=== Testing with limit parameter ===")
    try:
        # Try with next_cursor parameter if available
        response = client.get_markets()
        print(f"Response with limit type: {type(response)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_polymarket_api()
