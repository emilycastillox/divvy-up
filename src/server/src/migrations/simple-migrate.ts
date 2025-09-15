import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

interface Migration {
  version: number;
  name: string;
  filename: string;
  applied: boolean;
  applied_at?: Date;
}

class SimpleMigrationRunner {
  private pool: Pool;
  private migrations: Migration[] = [];

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.pool.connect();
      console.log('✅ Connected to database');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        version INTEGER UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await this.pool.query(query);
      console.log('✅ Migrations table ready');
    } catch (error) {
      console.error('❌ Failed to create migrations table:', error);
      throw error;
    }
  }

  async loadMigrations(): Promise<void> {
    const files = [
      '001_create_users_table.sql',
      '002_create_groups_table.sql',
      '003_create_group_members_table.sql',
      '004_create_expenses_table.sql',
      '005_create_expense_items_table.sql',
      '006_create_balances_table.sql',
      '007_create_transactions_table.sql',
      '008_create_payments_table.sql',
      '009_create_notifications_table.sql',
      '010_create_audit_logs_table.sql',
    ];

    for (const filename of files) {
      const version = parseInt(filename.split('_')[0]);
      const name = filename.replace('.sql', '').replace(/^\d+_/, '');
      
      this.migrations.push({
        version,
        name,
        filename,
        applied: false,
      });
    }

    // Sort by version
    this.migrations.sort((a, b) => a.version - b.version);
    console.log(`📋 Loaded ${this.migrations.length} migrations`);
  }

  async checkAppliedMigrations(): Promise<void> {
    const query = 'SELECT version, name, applied_at FROM migrations ORDER BY version';
    
    try {
      const result = await this.pool.query(query);
      
      for (const row of result.rows) {
        const migration = this.migrations.find(m => m.version === row.version);
        if (migration) {
          migration.applied = true;
          migration.applied_at = row.applied_at;
        }
      }

      const appliedCount = this.migrations.filter(m => m.applied).length;
      console.log(`📊 ${appliedCount}/${this.migrations.length} migrations already applied`);
    } catch (error) {
      console.error('❌ Failed to check applied migrations:', error);
      throw error;
    }
  }

  async runMigration(migration: Migration): Promise<void> {
    const filePath = join(__dirname, migration.filename);
    
    try {
      const sql = readFileSync(filePath, 'utf8');
      
      console.log(`🔄 Running migration ${migration.version}: ${migration.name}`);
      
      // Start transaction
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Run migration SQL
        await client.query(sql);
        
        // Record migration
        await client.query(
          'INSERT INTO migrations (version, name, filename) VALUES ($1, $2, $3)',
          [migration.version, migration.name, migration.filename]
        );
        
        await client.query('COMMIT');
        migration.applied = true;
        migration.applied_at = new Date();
        
        console.log(`✅ Migration ${migration.version} completed successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`❌ Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  async runAllMigrations(): Promise<void> {
    console.log('🚀 Starting database migrations...\n');

    try {
      await this.connect();
      await this.createMigrationsTable();
      await this.loadMigrations();
      await this.checkAppliedMigrations();

      const pendingMigrations = this.migrations.filter(m => !m.applied);
      
      if (pendingMigrations.length === 0) {
        console.log('✅ All migrations are up to date');
        return;
      }

      console.log(`📝 Running ${pendingMigrations.length} pending migrations:\n`);

      for (const migration of pendingMigrations) {
        await this.runMigration(migration);
      }

      console.log('\n🎉 All migrations completed successfully!');
    } catch (error) {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    } finally {
      await this.pool.end();
    }
  }

  async getStatus(): Promise<void> {
    try {
      await this.connect();
      await this.loadMigrations();
      await this.checkAppliedMigrations();

      console.log('\n📊 Migration Status:');
      console.log('==================');
      
      for (const migration of this.migrations) {
        const status = migration.applied ? '✅ Applied' : '⏳ Pending';
        const date = migration.applied_at ? ` (${migration.applied_at.toISOString()})` : '';
        console.log(`${status} ${migration.version.toString().padStart(3, '0')}: ${migration.name}${date}`);
      }
    } catch (error) {
      console.error('❌ Failed to get status:', error);
    } finally {
      await this.pool.end();
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const migrationRunner = new SimpleMigrationRunner();

  switch (command) {
    case 'migrate':
      await migrationRunner.runAllMigrations();
      break;
    case 'status':
      await migrationRunner.getStatus();
      break;
    default:
      console.log('Usage:');
      console.log('  npm run db:migrate     - Run all pending migrations');
      console.log('  npm run db:status      - Show migration status');
      break;
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SimpleMigrationRunner };
