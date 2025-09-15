import { config } from 'dotenv';

// Load environment variables first
config();

import { db } from '../config/database';
import { UserModel } from '../models/User';
import { GroupModel } from '../models/Group';
import { CreateUserInput, CreateGroupInput } from '@divvy-up/shared';

interface SeedData {
  users: CreateUserInput[];
  groups: Array<CreateGroupInput & { members: string[] }>;
}

const seedData: SeedData = {
  users: [
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
  ],
  groups: [
    {
      name: 'Weekend Trip to NYC',
      description: 'Our annual weekend getaway to New York City',
      currency: 'USD',
      created_by: '', // Will be set to first user
      settings: {
        splitMethod: 'equal',
        allowPartialPayments: true,
        requireApproval: false
      },
      members: ['johndoe', 'janesmith', 'mikewilson', 'sarahjohnson']
    },
    {
      name: 'Office Lunch Fund',
      description: 'Shared lunch expenses for the team',
      currency: 'USD',
      created_by: '', // Will be set to second user
      settings: {
        splitMethod: 'custom',
        allowPartialPayments: false,
        requireApproval: true
      },
      members: ['janesmith', 'mikewilson', 'alexbrown']
    },
    {
      name: 'Apartment Utilities',
      description: 'Monthly utilities for our shared apartment',
      currency: 'USD',
      created_by: '', // Will be set to third user
      settings: {
        splitMethod: 'equal',
        allowPartialPayments: true,
        requireApproval: false
      },
      members: ['mikewilson', 'sarahjohnson', 'alexbrown']
    },
    {
      name: 'Birthday Party',
      description: 'Sarah\'s surprise birthday party expenses',
      currency: 'USD',
      created_by: '', // Will be set to fourth user
      settings: {
        splitMethod: 'equal',
        allowPartialPayments: false,
        requireApproval: false
      },
      members: ['johndoe', 'janesmith', 'mikewilson', 'sarahjohnson', 'alexbrown']
    }
  ]
};

class DatabaseSeeder {
  private createdUsers: Map<string, string> = new Map(); // username -> user_id

  async connect(): Promise<void> {
    try {
      await db.connect();
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
        await db.query(`DELETE FROM ${table}`);
        console.log(`  ✅ Cleared ${table}`);
      }

      console.log('✅ Database cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear database:', error);
      throw error;
    }
  }

  async seedUsers(): Promise<void> {
    console.log('👥 Seeding users...');
    
    for (const userData of seedData.users) {
      try {
        const result = await UserModel.create(userData);
        
        if (result.success && result.data) {
          this.createdUsers.set(userData.username, result.data.id);
          console.log(`  ✅ Created user: ${userData.username} (${userData.email})`);
        } else {
          console.error(`  ❌ Failed to create user ${userData.username}:`, result.error);
        }
      } catch (error) {
        console.error(`  ❌ Error creating user ${userData.username}:`, error);
      }
    }
    
    console.log(`✅ Created ${this.createdUsers.size} users`);
  }

  async seedGroups(): Promise<void> {
    console.log('🏠 Seeding groups...');
    
    for (const groupData of seedData.groups) {
      try {
        // Set created_by to the first user ID
        const firstUserId = this.createdUsers.values().next().value;
        if (!firstUserId) {
          console.error('  ❌ No users available to create group');
          continue;
        }

        const groupInput: CreateGroupInput = {
          name: groupData.name,
          description: groupData.description,
          currency: groupData.currency,
          created_by: firstUserId,
          settings: groupData.settings
        };

        const result = await GroupModel.create(groupInput);
        
        if (result.success && result.data) {
          console.log(`  ✅ Created group: ${groupData.name}`);
          
          // Add members to the group
          for (const username of groupData.members) {
            const userId = this.createdUsers.get(username);
            if (userId) {
              const isAdmin = username === groupData.members[0]; // First member is admin
              await GroupModel.addMember(result.data.id, userId, isAdmin ? 'admin' : 'member');
              console.log(`    ✅ Added member: ${username} (${isAdmin ? 'admin' : 'member'})`);
            } else {
              console.error(`    ❌ User not found: ${username}`);
            }
          }
        } else {
          console.error(`  ❌ Failed to create group ${groupData.name}:`, result.error);
        }
      } catch (error) {
        console.error(`  ❌ Error creating group ${groupData.name}:`, error);
      }
    }
    
    console.log(`✅ Created ${seedData.groups.length} groups`);
  }

  async seedSampleExpenses(): Promise<void> {
    console.log('💰 Seeding sample expenses...');
    
    try {
      // Get all groups
      const groupsResult = await GroupModel.findMany();
      if (!groupsResult.success || !groupsResult.data) {
        console.error('❌ Failed to get groups for expenses');
        return;
      }

      const groups = groupsResult.data.data;
      
      // Sample expenses for each group
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

      for (const group of groups) {
        const groupExpenses = sampleExpenses.find(se => se.groupName === group.name);
        if (!groupExpenses) continue;

        for (const expenseData of groupExpenses.expenses) {
          const paidByUserId = this.createdUsers.get(expenseData.paidBy);
          if (!paidByUserId) continue;

          // Create expense
          const expenseQuery = `
            INSERT INTO expenses (
              group_id, created_by, paid_by, amount, description, 
              category, expense_date, is_settled
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
          `;

          const expenseResult = await db.query(expenseQuery, [
            group.id,
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
          const membersResult = await db.query(membersQuery, [group.id]);
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

            await db.query(itemQuery, [
              expenseId,
              userId,
              splitAmount,
              100 / memberIds.length,
              isPaidBy
            ]);
          }

          console.log(`  ✅ Created expense: ${expenseData.description} ($${expenseData.amount})`);
        }
      }

      console.log('✅ Sample expenses created');
    } catch (error) {
      console.error('❌ Error creating sample expenses:', error);
    }
  }

  async run(): Promise<void> {
    console.log('🌱 Starting database seeding...\n');

    try {
      await this.connect();
      await this.clearDatabase();
      await this.seedUsers();
      await this.seedGroups();
      await this.seedSampleExpenses();

      console.log('\n🎉 Database seeding completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`  👥 Users: ${this.createdUsers.size}`);
      console.log(`  🏠 Groups: ${seedData.groups.length}`);
      console.log('  💰 Sample expenses created');
      
      console.log('\n🔑 Test credentials:');
      console.log('  Email: john.doe@example.com | Password: password123');
      console.log('  Email: jane.smith@example.com | Password: password123');
      console.log('  Email: mike.wilson@example.com | Password: password123');
      
    } catch (error) {
      console.error('\n💥 Seeding failed:', error);
      process.exit(1);
    } finally {
      await db.disconnect();
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const seeder = new DatabaseSeeder();

  switch (command) {
    case 'seed':
      await seeder.run();
      break;
    case 'clear':
      await seeder.connect();
      await seeder.clearDatabase();
      await db.disconnect();
      console.log('✅ Database cleared');
      break;
    default:
      console.log('Usage:');
      console.log('  npm run db:seed     - Seed database with sample data');
      console.log('  npm run db:clear    - Clear all data from database');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseSeeder };
