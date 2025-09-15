import { Pool, PoolClient, QueryResult } from 'pg';
import { env } from '@divvy-up/shared';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;
  private isConnected = false;

  private constructor() {
    this.pool = new Pool({
      connectionString: env.DB.DATABASE_URL,
      host: env.DB.HOST,
      port: env.DB.PORT,
      database: env.DB.NAME,
      user: env.DB.USER,
      password: env.DB.PASSWORD,
      ssl: env.DB.SSL ? { rejectUnauthorized: false } : false,
      min: env.DB.POOL.MIN,
      max: env.DB.POOL.MAX,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err);
      this.isConnected = false;
    });

    // Handle pool connect
    this.pool.on('connect', () => {
      console.log('✅ New client connected to database');
      this.isConnected = true;
    });

    // Handle pool remove
    this.pool.on('remove', () => {
      console.log('🔌 Client removed from database pool');
    });
  }

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.isConnected = true;
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      console.log('🔌 Database disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error);
      throw error;
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (env.DEV.ENABLE_DEBUG) {
        console.log('🔍 Query executed:', { text, duration, rows: result.rowCount });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Database query error:', { text, params, error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    return this.pool.connect();
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  getPool(): Pool {
    return this.pool;
  }

  isHealthy(): boolean {
    return this.isConnected && !this.pool.ended;
  }

  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const start = Date.now();
      const result = await this.query('SELECT NOW() as timestamp, version() as version');
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        details: {
          connected: this.isConnected,
          pool: {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount,
          },
          responseTime: `${duration}ms`,
          timestamp: result.rows[0].timestamp,
          version: result.rows[0].version,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: this.isConnected,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// Export singleton instance
export const db = DatabaseConnection.getInstance();

// Export types
export type { QueryResult, PoolClient } from 'pg';

// Export database utilities
export const dbUtils = {
  async testConnection(): Promise<boolean> {
    try {
      await db.connect();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  },

  async getTableInfo(tableName: string): Promise<any[]> {
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position;
    `;
    
    const result = await db.query(query, [tableName]);
    return result.rows;
  },

  async getTableCount(tableName: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${tableName}`;
    const result = await db.query(query);
    return parseInt(result.rows[0].count);
  },

  async getDatabaseSize(): Promise<string> {
    const query = `
      SELECT pg_size_pretty(pg_database_size(current_database())) as size;
    `;
    const result = await db.query(query);
    return result.rows[0].size;
  },

  async getActiveConnections(): Promise<number> {
    const query = `
      SELECT count(*) as connections 
      FROM pg_stat_activity 
      WHERE state = 'active';
    `;
    const result = await db.query(query);
    return parseInt(result.rows[0].connections);
  },
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down database connection...');
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down database connection...');
  await db.disconnect();
  process.exit(0);
});
