import { db } from '../config/database';
import bcrypt from 'bcryptjs';

// db is imported from config/database

interface TestUser {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

interface TestGroup {
  id: string;
  name: string;
  description: string;
  created_by: string;
}

interface TestExpense {
  id: string;
  group_id: string;
  paid_by: string;
  amount: number;
  description: string;
  category: string;
  date: string;
}

async function seedTestData() {
  try {
    await db.connect();
    console.log('🌱 Seeding test data...');

    // Create test users
    const testUsers: TestUser[] = [
      {
        id: 'test-user-1',
        email: 'test@example.com',
        password: await bcrypt.hash('Password123!', 10),
        first_name: 'Test',
        last_name: 'User'
      },
      {
        id: 'test-user-2',
        email: 'jane@example.com',
        password: await bcrypt.hash('Password123!', 10),
        first_name: 'Jane',
        last_name: 'Smith'
      },
      {
        id: 'test-user-3',
        email: 'bob@example.com',
        password: await bcrypt.hash('Password123!', 10),
        first_name: 'Bob',
        last_name: 'Johnson'
      }
    ];

    // Insert test users
    for (const user of testUsers) {
      await db.query(`
        INSERT INTO users (id, email, password, first_name, last_name, email_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          password = EXCLUDED.password,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          updated_at = NOW()
      `, [user.id, user.email, user.password, user.first_name, user.last_name]);
    }

    // Create test groups
    const testGroups: TestGroup[] = [
      {
        id: 'test-group-1',
        name: 'Weekend Trip',
        description: 'Splitting expenses for our weekend getaway',
        created_by: 'test-user-1'
      },
      {
        id: 'test-group-2',
        name: 'Office Lunch',
        description: 'Monthly office lunch expenses',
        created_by: 'test-user-1'
      }
    ];

    // Insert test groups
    for (const group of testGroups) {
      await db.query(`
        INSERT INTO groups (id, name, description, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          updated_at = NOW()
      `, [group.id, group.name, group.description, group.created_by]);
    }

    // Add members to groups
    const groupMembers = [
      { group_id: 'test-group-1', user_id: 'test-user-1', role: 'admin' },
      { group_id: 'test-group-1', user_id: 'test-user-2', role: 'member' },
      { group_id: 'test-group-1', user_id: 'test-user-3', role: 'member' },
      { group_id: 'test-group-2', user_id: 'test-user-1', role: 'admin' },
      { group_id: 'test-group-2', user_id: 'test-user-2', role: 'member' }
    ];

    for (const member of groupMembers) {
      await db.query(`
        INSERT INTO group_members (group_id, user_id, role, joined_at, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW(), NOW())
        ON CONFLICT (group_id, user_id) DO UPDATE SET
          role = EXCLUDED.role,
          updated_at = NOW()
      `, [member.group_id, member.user_id, member.role]);
    }

    // Create test expenses
    const testExpenses: TestExpense[] = [
      {
        id: 'test-expense-1',
        group_id: 'test-group-1',
        paid_by: 'test-user-1',
        amount: 150.00,
        description: 'Dinner at Restaurant',
        category: 'Food & Dining',
        date: new Date().toISOString()
      },
      {
        id: 'test-expense-2',
        group_id: 'test-group-1',
        paid_by: 'test-user-2',
        amount: 300.00,
        description: 'Hotel Room',
        category: 'Accommodation',
        date: new Date().toISOString()
      },
      {
        id: 'test-expense-3',
        group_id: 'test-group-2',
        paid_by: 'test-user-1',
        amount: 75.00,
        description: 'Team Lunch',
        category: 'Food & Dining',
        date: new Date().toISOString()
      }
    ];

    // Insert test expenses
    for (const expense of testExpenses) {
      await db.query(`
        INSERT INTO expenses (id, group_id, paid_by, amount, description, category, date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          amount = EXCLUDED.amount,
          description = EXCLUDED.description,
          updated_at = NOW()
      `, [expense.id, expense.group_id, expense.paid_by, expense.amount, expense.description, expense.category, expense.date]);
    }

    // Create expense splits (equal splits for all expenses)
    const expenseSplits = [
      { expense_id: 'test-expense-1', user_id: 'test-user-1', amount: 50.00, percentage: 33.33, is_paid: false },
      { expense_id: 'test-expense-1', user_id: 'test-user-2', amount: 50.00, percentage: 33.33, is_paid: false },
      { expense_id: 'test-expense-1', user_id: 'test-user-3', amount: 50.00, percentage: 33.34, is_paid: false },
      { expense_id: 'test-expense-2', user_id: 'test-user-1', amount: 100.00, percentage: 33.33, is_paid: false },
      { expense_id: 'test-expense-2', user_id: 'test-user-2', amount: 100.00, percentage: 33.33, is_paid: false },
      { expense_id: 'test-expense-2', user_id: 'test-user-3', amount: 100.00, percentage: 33.34, is_paid: false },
      { expense_id: 'test-expense-3', user_id: 'test-user-1', amount: 37.50, percentage: 50.00, is_paid: false },
      { expense_id: 'test-expense-3', user_id: 'test-user-2', amount: 37.50, percentage: 50.00, is_paid: false }
    ];

    for (const split of expenseSplits) {
      await db.query(`
        INSERT INTO expense_splits (expense_id, user_id, amount, percentage, is_paid, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (expense_id, user_id) DO UPDATE SET
          amount = EXCLUDED.amount,
          percentage = EXCLUDED.percentage,
          updated_at = NOW()
      `, [split.expense_id, split.user_id, split.amount, split.percentage, split.is_paid]);
    }

    // Create group activities
    const activities = [
      {
        id: 'test-activity-1',
        group_id: 'test-group-1',
        user_id: 'test-user-1',
        type: 'group_created',
        description: 'Group "Weekend Trip" was created',
        metadata: { group_name: 'Weekend Trip' }
      },
      {
        id: 'test-activity-2',
        group_id: 'test-group-1',
        user_id: 'test-user-1',
        type: 'expense_added',
        description: 'Added expense "Dinner at Restaurant" for $150.00',
        metadata: { expense_id: 'test-expense-1', amount: 150.00 }
      },
      {
        id: 'test-activity-3',
        group_id: 'test-group-1',
        user_id: 'test-user-2',
        type: 'expense_added',
        description: 'Added expense "Hotel Room" for $300.00',
        metadata: { expense_id: 'test-expense-2', amount: 300.00 }
      }
    ];

    for (const activity of activities) {
      await db.query(`
        INSERT INTO group_activities (id, group_id, user_id, type, description, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (id) DO UPDATE SET
          description = EXCLUDED.description,
          metadata = EXCLUDED.metadata
      `, [activity.id, activity.group_id, activity.user_id, activity.type, activity.description, JSON.stringify(activity.metadata)]);
    }

    console.log('✅ Test data seeded successfully!');
    console.log('');
    console.log('Test users created:');
    console.log('- test@example.com (Password: Password123!)');
    console.log('- jane@example.com (Password: Password123!)');
    console.log('- bob@example.com (Password: Password123!)');
    console.log('');
    console.log('Test groups created:');
    console.log('- Weekend Trip (3 members)');
    console.log('- Office Lunch (2 members)');
    console.log('');
    console.log('Test expenses created:');
    console.log('- Dinner at Restaurant ($150.00)');
    console.log('- Hotel Room ($300.00)');
    console.log('- Team Lunch ($75.00)');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await db.disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('🎉 Test data seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test data seeding failed:', error);
      process.exit(1);
    });
}

export default seedTestData;
