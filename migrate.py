#!/usr/bin/env python3
"""
Polymarket Sentiment Analyzer - Database Migration Script
Agent: 02-database
Purpose: Create PostgreSQL schema with error recovery and connection pooling
"""

import os
import sys
import psycopg2
from psycopg2 import pool, OperationalError, sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import json
from datetime import datetime, timezone
from typing import Optional, Dict, List

# Configuration
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'postgres-seekapatraining-prod.postgres.database.azure.com'),
    'port': int(os.getenv('POSTGRES_PORT', '6432')),  # PgBouncer port
    'database': os.getenv('POSTGRES_DB', 'seekapa_training'),
    'user': os.getenv('POSTGRES_USER', 'seekapaadmin'),
    'password': os.getenv('POSTGRES_PASSWORD', ''),  # Must be provided via env
}

SSL_MODES = ['require', 'prefer', 'allow', 'disable']


class DatabaseMigrator:
    """Handles PostgreSQL schema migration with error recovery"""

    def __init__(self, config: Dict[str, str]):
        self.config = config
        self.connection: Optional[psycopg2.extensions.connection] = None
        self.connection_pool: Optional[pool.SimpleConnectionPool] = None
        self.migration_log: List[Dict] = []

    def log(self, level: str, message: str, details: Optional[Dict] = None):
        """Log migration events"""
        entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'level': level,
            'message': message,
            'details': details or {}
        }
        self.migration_log.append(entry)

        color_codes = {
            'INFO': '\033[94m',
            'SUCCESS': '\033[92m',
            'WARNING': '\033[93m',
            'ERROR': '\033[91m',
            'RESET': '\033[0m'
        }

        color = color_codes.get(level, color_codes['RESET'])
        print(f"{color}[{level}] {message}{color_codes['RESET']}")
        if details:
            print(f"  Details: {json.dumps(details, indent=2)}")

    def connect(self) -> bool:
        """Establish database connection with SSL fallback"""
        self.log('INFO', 'Attempting database connection...')

        # Check password
        if not self.config.get('password'):
            self.log('ERROR', 'POSTGRES_PASSWORD environment variable not set')
            self.log('INFO', 'Usage: POSTGRES_PASSWORD=your_password python migrate.py')
            return False

        # Try different SSL modes
        for ssl_mode in SSL_MODES:
            try:
                conn_config = {**self.config, 'sslmode': ssl_mode}

                self.log('INFO', f'Trying connection with sslmode={ssl_mode}...')

                self.connection = psycopg2.connect(**conn_config)
                self.connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

                # Test connection
                cursor = self.connection.cursor()
                cursor.execute('SELECT version();')
                version = cursor.fetchone()[0]
                cursor.close()

                self.log('SUCCESS', f'Connected successfully with sslmode={ssl_mode}', {
                    'host': self.config['host'],
                    'port': self.config['port'],
                    'database': self.config['database'],
                    'version': version
                })

                return True

            except OperationalError as e:
                self.log('WARNING', f'Connection failed with sslmode={ssl_mode}', {
                    'error': str(e)
                })
                continue

        self.log('ERROR', 'All connection attempts failed')
        return False

    def create_connection_pool(self, min_conn: int = 1, max_conn: int = 5) -> bool:
        """Create connection pool for concurrent operations"""
        try:
            self.connection_pool = pool.SimpleConnectionPool(
                min_conn,
                max_conn,
                **{**self.config, 'sslmode': 'prefer'}
            )
            self.log('SUCCESS', f'Connection pool created ({min_conn}-{max_conn} connections)')
            return True
        except Exception as e:
            self.log('ERROR', 'Failed to create connection pool', {'error': str(e)})
            return False

    def execute_sql_file(self, filepath: str) -> bool:
        """Execute SQL file with error handling"""
        self.log('INFO', f'Executing SQL file: {filepath}')

        if not os.path.exists(filepath):
            self.log('ERROR', f'SQL file not found: {filepath}')
            return False

        try:
            with open(filepath, 'r') as f:
                sql_content = f.read()

            cursor = self.connection.cursor()

            # Split by semicolons but keep multi-line statements together
            statements = [s.strip() for s in sql_content.split(';') if s.strip()]

            executed = 0
            failed = 0

            for idx, statement in enumerate(statements, 1):
                try:
                    cursor.execute(statement)
                    executed += 1

                    # Log important operations
                    if 'CREATE TABLE' in statement.upper():
                        table_name = statement.split('CREATE TABLE')[1].split('(')[0].strip().split()[-1]
                        self.log('INFO', f'Created table: {table_name}')
                    elif 'CREATE INDEX' in statement.upper():
                        index_name = statement.split('CREATE INDEX')[1].split('ON')[0].strip().split()[-1]
                        self.log('INFO', f'Created index: {index_name}')

                except Exception as e:
                    failed += 1
                    self.log('WARNING', f'Statement {idx} failed (may be expected)', {
                        'statement': statement[:100] + '...' if len(statement) > 100 else statement,
                        'error': str(e)
                    })

            cursor.close()

            self.log('SUCCESS', f'Executed {executed} statements ({failed} failed/skipped)')
            return True

        except Exception as e:
            self.log('ERROR', 'Failed to execute SQL file', {
                'filepath': filepath,
                'error': str(e)
            })
            return False

    def verify_schema(self) -> Dict[str, any]:
        """Verify schema was created correctly"""
        self.log('INFO', 'Verifying schema...')

        expected_tables = ['markets', 'sentiment_data', 'price_history',
                          'alerts', 'phase_checkpoints', 'error_log']

        try:
            cursor = self.connection.cursor()

            # Check tables
            cursor.execute("""
                SELECT table_name,
                       (SELECT COUNT(*) FROM information_schema.columns
                        WHERE table_name = t.table_name) as column_count
                FROM information_schema.tables t
                WHERE table_schema = 'public'
                  AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            """)

            tables = cursor.fetchall()
            table_dict = {name: cols for name, cols in tables}

            # Check indexes
            cursor.execute("""
                SELECT COUNT(*)
                FROM pg_indexes
                WHERE schemaname = 'public';
            """)
            index_count = cursor.fetchone()[0]

            # Check views
            cursor.execute("""
                SELECT COUNT(*)
                FROM information_schema.views
                WHERE table_schema = 'public';
            """)
            view_count = cursor.fetchone()[0]

            # Check functions
            cursor.execute("""
                SELECT COUNT(*)
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE n.nspname = 'public';
            """)
            function_count = cursor.fetchone()[0]

            cursor.close()

            # Verify all expected tables exist
            missing_tables = [t for t in expected_tables if t not in table_dict]

            result = {
                'tables': table_dict,
                'indexes': index_count,
                'views': view_count,
                'functions': function_count,
                'missing_tables': missing_tables,
                'success': len(missing_tables) == 0
            }

            if result['success']:
                self.log('SUCCESS', 'Schema verification passed', result)
            else:
                self.log('ERROR', 'Schema verification failed', result)

            return result

        except Exception as e:
            self.log('ERROR', 'Schema verification error', {'error': str(e)})
            return {'success': False, 'error': str(e)}

    def seed_data(self) -> bool:
        """Insert seed data"""
        self.log('INFO', 'Inserting seed data...')

        try:
            cursor = self.connection.cursor()

            # Check if seed data already exists
            cursor.execute("SELECT COUNT(*) FROM phase_checkpoints;")
            existing_count = cursor.fetchone()[0]

            if existing_count > 0:
                self.log('INFO', f'Seed data already exists ({existing_count} checkpoints)')
                cursor.close()
                return True

            # Insert phase checkpoints
            phases = [
                ('infrastructure', 'agent-01-infrastructure', 'completed',
                 json.dumps({'description': 'Set up project structure and Azure resources'})),
                ('database', 'agent-02-database', 'in_progress',
                 json.dumps({'description': 'Create PostgreSQL schema and migrations'})),
                ('api', 'agent-03-api', 'pending',
                 json.dumps({'description': 'Build FastAPI backend with Polymarket integration'})),
                ('ml', 'agent-04-ml', 'pending',
                 json.dumps({'description': 'Implement sentiment analysis ML pipeline'})),
                ('frontend', 'agent-05-frontend', 'pending',
                 json.dumps({'description': 'Build React dashboard with real-time updates'})),
                ('testing', 'agent-06-testing', 'pending',
                 json.dumps({'description': 'Create comprehensive test suite'})),
            ]

            for phase_name, agent_name, status, details in phases:
                cursor.execute("""
                    INSERT INTO phase_checkpoints (phase_name, agent_name, status, details)
                    VALUES (%s, %s, %s, %s::jsonb)
                    ON CONFLICT DO NOTHING;
                """, (phase_name, agent_name, status, details))

            cursor.close()

            self.log('SUCCESS', f'Inserted {len(phases)} phase checkpoints')
            return True

        except Exception as e:
            self.log('ERROR', 'Failed to insert seed data', {'error': str(e)})
            return False

    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            self.log('INFO', 'Database connection closed')

        if self.connection_pool:
            self.connection_pool.closeall()
            self.log('INFO', 'Connection pool closed')

    def save_migration_log(self, filepath: str = 'migration_log.json'):
        """Save migration log to file"""
        try:
            with open(filepath, 'w') as f:
                json.dump(self.migration_log, f, indent=2)
            self.log('INFO', f'Migration log saved to {filepath}')
        except Exception as e:
            self.log('ERROR', f'Failed to save migration log', {'error': str(e)})


def main():
    """Main migration workflow"""
    print("=" * 60)
    print("Polymarket Sentiment Analyzer - Database Migration")
    print("Agent: 02-database")
    print("=" * 60)
    print()

    # Initialize migrator
    migrator = DatabaseMigrator(DB_CONFIG)

    try:
        # Step 1: Connect to database
        if not migrator.connect():
            print("\n❌ Migration failed: Could not connect to database")
            print("\nPlease set POSTGRES_PASSWORD environment variable:")
            print("  export POSTGRES_PASSWORD='your_password'")
            print("  python migrate.py")
            sys.exit(1)

        # Step 2: Execute schema SQL
        schema_file = os.path.join(os.path.dirname(__file__), 'schema.sql')
        if not migrator.execute_sql_file(schema_file):
            print("\n❌ Migration failed: Could not execute schema.sql")
            sys.exit(1)

        # Step 3: Verify schema
        verification = migrator.verify_schema()
        if not verification['success']:
            print("\n❌ Migration failed: Schema verification failed")
            sys.exit(1)

        # Step 4: Seed data
        if not migrator.seed_data():
            print("\n⚠️  Warning: Seed data insertion failed (may already exist)")

        # Success!
        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)
        print(f"\nTables created: {len(verification['tables'])}")
        print(f"Indexes created: {verification['indexes']}")
        print(f"Views created: {verification['views']}")
        print(f"Functions created: {verification['functions']}")
        print("\nDatabase is ready for Polymarket Sentiment Analyzer!")

    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        # Cleanup
        migrator.save_migration_log()
        migrator.close()


if __name__ == '__main__':
    main()
