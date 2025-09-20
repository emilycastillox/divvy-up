import { db } from '../config/database';
import { Balance, Expense, ExpenseSplit } from '@divvy-up/shared';

export interface BalanceCalculation {
  userId: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
  expenses: {
    paid: number;
    owed: number;
  };
}

export interface SettlementTransaction {
  from: string;
  to: string;
  amount: number;
  description: string;
}

class BalanceService {
  /**
   * Calculate balances for all members in a group
   */
  async calculateGroupBalances(groupId: string): Promise<BalanceCalculation[]> {
    try {
      // Get all expenses for the group
      const expensesQuery = `
        SELECT e.id, e.amount, e.paid_by, e.description, e.expense_date,
               es.user_id, es.amount as split_amount, es.percentage
        FROM expenses e
        JOIN expense_splits es ON e.id = es.expense_id
        WHERE e.group_id = $1
        ORDER BY e.expense_date DESC
      `;
      
      const expensesResult = await db.query(expensesQuery, [groupId]);
      const expenses = expensesResult.rows;

      // Group expenses by user
      const userBalances = new Map<string, BalanceCalculation>();

      for (const expense of expenses) {
        const userId = expense.user_id;
        const paidBy = expense.paid_by;
        const splitAmount = parseFloat(expense.split_amount);

        // Initialize user balance if not exists
        if (!userBalances.has(userId)) {
          userBalances.set(userId, {
            userId,
            totalPaid: 0,
            totalOwed: 0,
            netBalance: 0,
            expenses: { paid: 0, owed: 0 }
          });
        }

        const userBalance = userBalances.get(userId)!;

        // Add to owed amount (what this user owes)
        userBalance.totalOwed += splitAmount;
        userBalance.expenses.owed += splitAmount;

        // If this user paid for this expense, add to paid amount
        if (paidBy === userId) {
          userBalance.totalPaid += parseFloat(expense.amount);
          userBalance.expenses.paid += parseFloat(expense.amount);
        }
      }

      // Calculate net balances
      const balances = Array.from(userBalances.values()).map(balance => ({
        ...balance,
        netBalance: balance.totalPaid - balance.totalOwed
      }));

      return balances;
    } catch (error) {
      console.error('Error calculating group balances:', error);
      throw new Error('Failed to calculate group balances');
    }
  }

  /**
   * Calculate optimal settlement transactions to minimize the number of payments
   */
  calculateOptimalSettlements(balances: BalanceCalculation[]): SettlementTransaction[] {
    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors = balances
      .filter(b => b.netBalance > 0)
      .sort((a, b) => b.netBalance - a.netBalance);
    
    const debtors = balances
      .filter(b => b.netBalance < 0)
      .sort((a, b) => a.netBalance - b.netBalance);

    const settlements: SettlementTransaction[] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      // Calculate the settlement amount
      const settlementAmount = Math.min(creditor.netBalance, Math.abs(debtor.netBalance));

      if (settlementAmount > 0.01) { // Only create settlements for amounts > 1 cent
        settlements.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: settlementAmount,
          description: `Settlement: ${debtor.userId} pays ${creditor.userId}`
        });

        // Update balances
        creditor.netBalance -= settlementAmount;
        debtor.netBalance += settlementAmount;

        // Move to next creditor or debtor if their balance is settled
        if (Math.abs(creditor.netBalance) < 0.01) {
          creditorIndex++;
        }
        if (Math.abs(debtor.netBalance) < 0.01) {
          debtorIndex++;
        }
      } else {
        // Move to next creditor or debtor
        if (creditor.netBalance > Math.abs(debtor.netBalance)) {
          debtorIndex++;
        } else {
          creditorIndex++;
        }
      }
    }

    return settlements;
  }

  /**
   * Get balance summary for a specific user in a group
   */
  async getUserBalanceInGroup(groupId: string, userId: string): Promise<BalanceCalculation | null> {
    try {
      const balances = await this.calculateGroupBalances(groupId);
      return balances.find(b => b.userId === userId) || null;
    } catch (error) {
      console.error('Error getting user balance:', error);
      throw new Error('Failed to get user balance');
    }
  }

  /**
   * Get simplified balance view for group members
   */
  async getGroupBalanceSummary(groupId: string): Promise<{
    totalExpenses: number;
    totalSettled: number;
    totalOutstanding: number;
    memberCount: number;
    balances: BalanceCalculation[];
  }> {
    try {
      const balances = await this.calculateGroupBalances(groupId);
      
      const totalExpenses = balances.reduce((sum, b) => sum + b.totalPaid, 0);
      const totalOutstanding = balances.reduce((sum, b) => sum + Math.abs(b.netBalance), 0) / 2;
      const totalSettled = totalExpenses - totalOutstanding;
      const memberCount = balances.length;

      return {
        totalExpenses,
        totalSettled,
        totalOutstanding,
        memberCount,
        balances
      };
    } catch (error) {
      console.error('Error getting group balance summary:', error);
      throw new Error('Failed to get group balance summary');
    }
  }

  /**
   * Validate that all balances sum to zero (expense splitting is correct)
   */
  validateBalances(balances: BalanceCalculation[]): { isValid: boolean; error?: string } {
    const totalNetBalance = balances.reduce((sum, b) => sum + b.netBalance, 0);
    
    if (Math.abs(totalNetBalance) > 0.01) {
      return {
        isValid: false,
        error: `Balances do not sum to zero. Total net balance: ${totalNetBalance.toFixed(2)}`
      };
    }

    return { isValid: true };
  }

  /**
   * Get balance history for a group (simplified version)
   */
  async getBalanceHistory(groupId: string, limit: number = 50): Promise<{
    date: Date;
    totalExpenses: number;
    memberCount: number;
    balances: BalanceCalculation[];
  }[]> {
    try {
      // This is a simplified implementation
      // In a real app, you'd want to store balance snapshots over time
      const currentBalances = await this.calculateGroupBalances(groupId);
      const summary = await this.getGroupBalanceSummary(groupId);
      
      return [{
        date: new Date(),
        totalExpenses: summary.totalExpenses,
        memberCount: summary.memberCount,
        balances: currentBalances
      }];
    } catch (error) {
      console.error('Error getting balance history:', error);
      throw new Error('Failed to get balance history');
    }
  }
}

export const balanceService = new BalanceService();
