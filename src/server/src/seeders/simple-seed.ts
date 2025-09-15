import { Pool } from 'pg';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
config();

class SimpleSeeder {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.pool.connect();
      console.log('✅ Connected to database for seeding');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async clearDatabase(): Promise<void> {
    console.log('🧹 Clearing existing data...');
    
    try {
      // Delete in reverse order of dependencies
      const tables = [
        'audit_logs',
        'notifications',
        'payments',
        'transactions',
        'balances',
        'expense_items',
        'expenses',
        'group_members',
        'groups',
        'users'
      ];

      for (const table of tables) {
        await this.pool.query(`DELETE FROM ${table}`);
        console.log(`  ✅ Cleared ${table}`);
      }

      console.log('✅ Database cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear database:', error);
      throw error;
    }
  }

  async seedUsers(): Promise<Map<string, string>> {
    console.log('👥 Seeding users...');
    
    const users = [
      {
        email: 'john.doe@example.com',
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
        password: 'password123',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
        phone: '+1234567890',
        timezone: 'America/New_York'
      },
      {
        email: 'jane.smith@example.com',
        username: 'janesmith',
        first_name: 'Jane',
        last_name: 'Smith',
        password: 'password123',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
        phone: '+1234567891',
        timezone: 'America/Los_Angeles'
      },
      {
        email: 'mike.wilson@example.com',
        username: 'mikewilson',
        first_name: 'Mike',
        last_name: 'Wilson',
        password: 'password123',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
        phone: '+1234567892',
        timezone: 'America/Chicago'
      },
      {
        email: 'sarah.johnson@example.com',
        username: 'sarahjohnson',
        first_name: 'Sarah',
        last_name: 'Johnson',
        password: 'password123',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        phone: '+1234567893',
        timezone: 'America/Denver'
      },
      {
        email: 'alex.brown@example.com',
        username: 'alexbrown',
        first_name: 'Alex',
        last_name: 'Brown',
        password: 'password123',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
        phone: '+1234567894',
        timezone: 'Europe/London'
      }
    ];

    const createdUsers = new Map<string, string>();

    for (const userData of users) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        const query = `
          INSERT INTO users (
            email, username, first_name, last_name, password_hash,
            avatar_url, phone, timezone
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `;

        const values = [
          userData.email,
          userData.username,
          userData.first_name,
          userData.last_name,
          hashedPassword,
          userData.avatar_url,
          userData.phone,
          userData.timezone
        ];

        const result = await this.pool.query(query, values);
        createdUsers.set(userData.username, result.rows[0].id);
        console.log(`  ✅ Created user: ${userData.username} (${userData.email})`);
      } catch (error) {
        console.error(`  ❌ Error creating user ${userData.username}:`, error);
      }
    }
    
    console.log(`✅ Created ${createdUsers.size} users`);
    return createdUsers;
  }

  async seedGroups(createdUsers: Map<string, string>): Promise<Map<string, string>> {
    console.log('🏠 Seeding groups...');
    
    const groups = [
      {
        name: 'Weekend Trip to NYC',
        description: 'Our annual weekend getaway to New York City',
        currency: 'USD',
        createdBy: 'johndoe',
        members: ['johndoe', 'janesmith', 'mikewilson', 'sarahjohnson'],
        settings: {
          splitMethod: 'equal',
          allowPartialPayments: true,
          requireApproval: false
        }
      },
      {
        name: 'Office Lunch Fund',
        description: 'Shared lunch expenses for the team',
        currency: 'USD',
        createdBy: 'janesmith',
        members: ['janesmith', 'mikewilson', 'alexbrown'],
        settings: {
          splitMethod: 'custom',
          allowPartialPayments: false,
          requireApproval: true
        }
      },
      {
        name: 'Apartment Utilities',
        description: 'Monthly utilities for our shared apartment',
        currency: 'USD',
        createdBy: 'mikewilson',
        members: ['mikewilson', 'sarahjohnson', 'alexbrown'],
        settings: {
          splitMethod: 'equal',
          allowPartialPayments: true,
          requireApproval: false
        }
      },
      {
        name: 'Birthday Party',
        description: 'Sarah\'s surprise birthday party expenses',
        currency: 'USD',
        createdBy: 'sarahjohnson',
        members: ['johndoe', 'janesmith', 'mikewilson', 'sarahjohnson', 'alexbrown'],
        settings: {
          splitMethod: 'equal',
          allowPartialPayments: false,
          requireApproval: false
        }
      }
    ];

    const createdGroups = new Map<string, string>();

    for (const groupData of groups) {
      try {
        const createdByUserId = createdUsers.get(groupData.createdBy);
        if (!createdByUserId) {
          console.error(`  ❌ User not found: ${groupData.createdBy}`);
          continue;
        }

        const query = `
          INSERT INTO groups (
            name, description, currency, created_by, settings
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `;

        const values = [
          groupData.name,
          groupData.description,
          groupData.currency,
          createdByUserId,
          JSON.stringify(groupData.settings)
        ];

        const result = await this.pool.query(query, values);
        const groupId = result.rows[0].id;
        createdGroups.set(groupData.name, groupId);
        
        console.log(`  ✅ Created group: ${groupData.name}`);
        
        // Add members to the group
        for (const username of groupData.members) {
          const userId = createdUsers.get(username);
          if (userId) {
            const isAdmin = username === groupData.createdBy;
            const role = isAdmin ? 'admin' : 'member';
            
            const memberQuery = `
              INSERT INTO group_members (group_id, user_id, role)
              VALUES ($1, $2, $3)
              ON CONFLICT (group_id, user_id) 
              DO UPDATE SET 
                role = EXCLUDED.role,
                is_active = true,
                joined_at = CURRENT_TIMESTAMP,
                left_at = NULL
            `;

            await this.pool.query(memberQuery, [groupId, userId, role]);
            console.log(`    ✅ Added member: ${username} (${role})`);
          } else {
            console.error(`    ❌ User not found: ${username}`);
          }
        }
      } catch (error) {
        console.error(`  ❌ Error creating group ${groupData.name}:`, error);
      }
    }
    
    console.log(`✅ Created ${createdGroups.size} groups`);
    return createdGroups;
  }

  async seedSampleExpenses(createdUsers: Map<string, string>, createdGroups: Map<string, string>): Promise<void> {
    console.log('💰 Seeding sample expenses...');
    
    const sampleExpenses = [
      {
        groupName: 'Weekend Trip to NYC',
        expenses: [
          {
            description: 'Hotel room for 2 nights',
            amount: 400.00,
            category: 'accommodation',
            paidBy: 'johndoe'
          },
          {
            description: 'Dinner at fancy restaurant',
            amount: 150.00,
            category: 'food',
            paidBy: 'janesmith'
          },
          {
            description: 'Broadway show tickets',
            amount: 300.00,
            category: 'entertainment',
            paidBy: 'mikewilson'
          },
          {
            description: 'Uber rides around the city',
            amount: 80.00,
            category: 'transportation',
            paidBy: 'sarahjohnson'
          }
        ]
      },
      {
        groupName: 'Office Lunch Fund',
        expenses: [
          {
            description: 'Team lunch at Italian restaurant',
            amount: 75.00,
            category: 'food',
            paidBy: 'janesmith'
          },
          {
            description: 'Coffee for the team',
            amount: 25.00,
            category: 'food',
            paidBy: 'mikewilson'
          }
        ]
      },
      {
        groupName: 'Apartment Utilities',
        expenses: [
          {
            description: 'Electricity bill',
            amount: 120.00,
            category: 'utilities',
            paidBy: 'mikewilson'
          },
          {
            description: 'Internet bill',
            amount: 80.00,
            category: 'utilities',
            paidBy: 'sarahjohnson'
          },
          {
            description: 'Water bill',
            amount: 60.00,
            category: 'utilities',
            paidBy: 'alexbrown'
          }
        ]
      }
    ];

    for (const groupExpenses of sampleExpenses) {
      const groupId = createdGroups.get(groupExpenses.groupName);
      if (!groupId) continue;

      for (const expenseData of groupExpenses.expenses) {
        const paidByUserId = createdUsers.get(expenseData.paidBy);
        if (!paidByUserId) continue;

        try {
          // Create expense
          const expenseQuery = `
            INSERT INTO expenses (
              group_id, created_by, paid_by, amount, description, 
              category, expense_date, is_settled
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
          `;

          const expenseResult = await this.pool.query(expenseQuery, [
            groupId,
            paidByUserId,
            paidByUserId,
            expenseData.amount,
            expenseData.description,
            expenseData.category,
            new Date(),
            false
          ]);

          const expenseId = expenseResult.rows[0].id;

          // Get group members for splitting
          const membersQuery = `
            SELECT user_id FROM group_members 
            WHERE group_id = $1 AND is_active = true
          `;
          const membersResult = await this.pool.query(membersQuery, [groupId]);
          const memberIds = membersResult.rows.map(row => row.user_id);

          // Split expense equally among members
          const splitAmount = expenseData.amount / memberIds.length;

          for (const userId of memberIds) {
            const isPaidBy = userId === paidByUserId;
            
            const itemQuery = `
              INSERT INTO expense_items (
                expense_id, user_id, amount, percentage, is_paid
              ) VALUES ($1, $2, $3, $4, $5)
            `;

            await this.pool.query(itemQuery, [
              expenseId,
              userId,
              splitAmount,
              100 / memberIds.length,
              isPaidBy
            ]);
          }

          console.log(`  ✅ Created expense: ${expenseData.description} ($${expenseData.amount})`);
        } catch (error) {
          console.error(`  ❌ Error creating expense ${expenseData.description}:`, error);
        }
      }
    }

    console.log('✅ Sample expenses created');
  }

  async run(): Promise<void> {
    console.log('🌱 Starting database seeding...\n');

    try {
      await this.connect();
      await this.clearDatabase();
      
      const createdUsers = await this.seedUsers();
      const createdGroups = await this.seedGroups(createdUsers);
      await this.seedSampleExpenses(createdUsers, createdGroups);

      console.log('\n🎉 Database seeding completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`  👥 Users: ${createdUsers.size}`);
      console.log(`  🏠 Groups: ${createdGroups.size}`);
      console.log('  💰 Sample expenses created');
      
      console.log('\n🔑 Test credentials:');
      console.log('  Email: john.doe@example.com | Password: password123');
      console.log('  Email: jane.smith@example.com | Password: password123');
      console.log('  Email: mike.wilson@example.com | Password: password123');
      
    } catch (error) {
      console.error('\n💥 Seeding failed:', error);
      process.exit(1);
    } finally {
      await this.pool.end();
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const seeder = new SimpleSeeder();

  switch (command) {
    case 'seed':
      await seeder.run();
      break;
    case 'clear':
      await seeder.connect();
      await seeder.clearDatabase();
      await seeder.pool.end();
      console.log('✅ Database cleared');
      break;
    default:
      console.log('Usage:');
      console.log('  npm run db:seed     - Seed database with sample data');
      console.log('  npm run db:clear    - Clear all data from database');
      break;
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SimpleSeeder };
