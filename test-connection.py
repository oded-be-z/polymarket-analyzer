#!/usr/bin/env python3
"""
PostgreSQL Connection Test Script
Tests connectivity to Azure PostgreSQL with PgBouncer connection pooling
"""

import os
import sys
import psycopg2
from psycopg2 import OperationalError
from datetime import datetime
import time

# Color codes for output
class Colors:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_status(level: str, message: str):
    """Print colored status message"""
    colors = {
        'INFO': Colors.BLUE,
        'SUCCESS': Colors.GREEN,
        'WARNING': Colors.YELLOW,
        'ERROR': Colors.RED
    }
    color = colors.get(level, Colors.RESET)
    print(f"{color}[{level}] {message}{Colors.RESET}")

def test_connection(host: str, port: int, database: str, user: str, password: str, sslmode: str = 'prefer'):
    """Test database connection with specific SSL mode"""
    try:
        start_time = time.time()

        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            sslmode=sslmode,
            connect_timeout=10
        )

        connect_time = time.time() - start_time

        # Test query
        cursor = conn.cursor()
        cursor.execute('SELECT version();')
        version = cursor.fetchone()[0]

        cursor.execute('SELECT current_database(), current_user, inet_server_addr(), inet_server_port();')
        db_info = cursor.fetchone()

        cursor.close()
        conn.close()

        return {
            'success': True,
            'connect_time': round(connect_time, 3),
            'version': version,
            'database': db_info[0],
            'user': db_info[1],
            'server_addr': db_info[2],
            'server_port': db_info[3],
            'sslmode': sslmode
        }

    except OperationalError as e:
        return {
            'success': False,
            'error': str(e),
            'sslmode': sslmode
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'sslmode': sslmode
        }

def test_connection_pool(host: str, port: int, database: str, user: str, password: str, pool_size: int = 5):
    """Test connection pooling"""
    try:
        from psycopg2 import pool

        start_time = time.time()

        connection_pool = pool.SimpleConnectionPool(
            1, pool_size,
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            sslmode='prefer'
        )

        pool_time = time.time() - start_time

        # Test getting connections from pool
        connections = []
        for i in range(min(3, pool_size)):
            conn = connection_pool.getconn()
            connections.append(conn)

        # Return connections to pool
        for conn in connections:
            connection_pool.putconn(conn)

        connection_pool.closeall()

        return {
            'success': True,
            'pool_time': round(pool_time, 3),
            'pool_size': pool_size,
            'connections_tested': len(connections)
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def test_database_tables(host: str, port: int, database: str, user: str, password: str):
    """Test if schema tables exist"""
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            sslmode='prefer'
        )

        cursor = conn.cursor()

        # Check for Polymarket tables
        expected_tables = ['markets', 'sentiment_data', 'price_history',
                          'alerts', 'phase_checkpoints', 'error_log']

        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
              AND table_name = ANY(%s)
            ORDER BY table_name;
        """, (expected_tables,))

        existing_tables = [row[0] for row in cursor.fetchall()]
        missing_tables = [t for t in expected_tables if t not in existing_tables]

        cursor.close()
        conn.close()

        return {
            'success': len(missing_tables) == 0,
            'existing_tables': existing_tables,
            'missing_tables': missing_tables,
            'total_expected': len(expected_tables)
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def main():
    """Main test workflow"""
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}PostgreSQL Connection Test{Colors.RESET}")
    print(f"{Colors.BOLD}Polymarket Sentiment Analyzer - Agent 02{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}\n")

    # Configuration
    config = {
        'host': os.getenv('POSTGRES_HOST', 'postgres-seekapatraining-prod.postgres.database.azure.com'),
        'port': int(os.getenv('POSTGRES_PORT', '6432')),
        'database': os.getenv('POSTGRES_DB', 'seekapa_training'),
        'user': os.getenv('POSTGRES_USER', 'seekapaadmin'),
        'password': os.getenv('POSTGRES_PASSWORD', ''),
    }

    print_status('INFO', 'Connection Configuration:')
    print(f"  Host: {config['host']}")
    print(f"  Port: {config['port']} (PgBouncer)")
    print(f"  Database: {config['database']}")
    print(f"  User: {config['user']}")
    print(f"  Password: {'*' * len(config['password']) if config['password'] else '[NOT SET]'}")
    print()

    # Check password
    if not config['password']:
        print_status('ERROR', 'POSTGRES_PASSWORD environment variable not set')
        print(f"\n{Colors.YELLOW}Usage:{Colors.RESET}")
        print("  export POSTGRES_PASSWORD='your_password'")
        print("  python test-connection.py")
        sys.exit(1)

    # Test 1: Basic Connection with different SSL modes
    print_status('INFO', 'Test 1: Testing connection with different SSL modes...')
    ssl_modes = ['require', 'prefer', 'allow']

    successful_mode = None
    for ssl_mode in ssl_modes:
        print(f"\n  Testing sslmode={ssl_mode}...", end=' ')
        result = test_connection(**config, sslmode=ssl_mode)

        if result['success']:
            print(f"{Colors.GREEN}✓ SUCCESS{Colors.RESET} ({result['connect_time']}s)")
            if not successful_mode:
                successful_mode = ssl_mode
                print(f"\n  {Colors.GREEN}Connection Details:{Colors.RESET}")
                print(f"    Version: {result['version'][:60]}...")
                print(f"    Database: {result['database']}")
                print(f"    User: {result['user']}")
                print(f"    Connect Time: {result['connect_time']}s")
                print(f"    SSL Mode: {result['sslmode']}")
        else:
            print(f"{Colors.RED}✗ FAILED{Colors.RESET}")
            print(f"    Error: {result['error'][:100]}")

    if not successful_mode:
        print_status('ERROR', 'All connection attempts failed')
        sys.exit(1)

    # Test 2: Connection Pooling
    print(f"\n{Colors.BOLD}{'─'*60}{Colors.RESET}")
    print_status('INFO', 'Test 2: Testing connection pooling...')
    pool_result = test_connection_pool(**config)

    if pool_result['success']:
        print_status('SUCCESS', f"Connection pool working")
        print(f"  Pool Size: {pool_result['pool_size']}")
        print(f"  Connections Tested: {pool_result['connections_tested']}")
        print(f"  Pool Creation Time: {pool_result['pool_time']}s")
    else:
        print_status('ERROR', f"Connection pool failed: {pool_result['error']}")

    # Test 3: Schema Verification
    print(f"\n{Colors.BOLD}{'─'*60}{Colors.RESET}")
    print_status('INFO', 'Test 3: Checking database schema...')
    schema_result = test_database_tables(**config)

    if schema_result.get('success'):
        print_status('SUCCESS', 'All required tables exist')
        print(f"  Tables found: {', '.join(schema_result['existing_tables'])}")
    elif 'error' in schema_result:
        print_status('ERROR', f"Schema check failed: {schema_result['error']}")
    else:
        print_status('WARNING', 'Some tables are missing (run migrate.py)')
        print(f"  Existing: {', '.join(schema_result['existing_tables'])}")
        print(f"  Missing: {', '.join(schema_result['missing_tables'])}")

    # Summary
    print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}Test Summary{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}\n")

    tests_passed = 0
    tests_total = 3

    if successful_mode:
        tests_passed += 1
        print(f"{Colors.GREEN}✓{Colors.RESET} Connection: PASSED (sslmode={successful_mode})")
    else:
        print(f"{Colors.RED}✗{Colors.RESET} Connection: FAILED")

    if pool_result.get('success'):
        tests_passed += 1
        print(f"{Colors.GREEN}✓{Colors.RESET} Connection Pool: PASSED")
    else:
        print(f"{Colors.RED}✗{Colors.RESET} Connection Pool: FAILED")

    if schema_result.get('success'):
        tests_passed += 1
        print(f"{Colors.GREEN}✓{Colors.RESET} Schema: PASSED")
    else:
        status = 'WARNING' if schema_result.get('existing_tables') else 'FAILED'
        color = Colors.YELLOW if status == 'WARNING' else Colors.RED
        print(f"{color}⚠{Colors.RESET} Schema: {status}")

    print(f"\n{Colors.BOLD}Result: {tests_passed}/{tests_total} tests passed{Colors.RESET}")

    if tests_passed == tests_total:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✅ Database is ready for Polymarket Sentiment Analyzer!{Colors.RESET}")
        sys.exit(0)
    elif tests_passed >= 2:
        print(f"\n{Colors.YELLOW}⚠️  Database connection works but schema may need migration{Colors.RESET}")
        print(f"{Colors.YELLOW}   Run: python migrate.py{Colors.RESET}")
        sys.exit(0)
    else:
        print(f"\n{Colors.RED}❌ Database connection issues detected{Colors.RESET}")
        sys.exit(1)

if __name__ == '__main__':
    main()
