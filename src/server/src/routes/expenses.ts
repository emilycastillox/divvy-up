import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { ResponseFormatter } from '../utils/response';

const router = Router();

// Input validation rules
const createExpenseValidation = [
  body('group_id')
    .isUUID()
    .withMessage('Valid group ID is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('description')
    .isLength({ min: 1, max: 500 })
    .trim()
    .withMessage('Description is required and must be less than 500 characters'),
  body('category')
    .optional()
    .isLength({ max: 50 })
    .trim()
    .withMessage('Category must be less than 50 characters'),
  body('expense_date')
    .isISO8601()
    .withMessage('Valid expense date is required'),
  body('splits')
    .isArray({ min: 1 })
    .withMessage('At least one expense split is required'),
  body('splits.*.user_id')
    .isUUID()
    .withMessage('Valid user ID is required for each split'),
  body('splits.*.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Split amount must be a positive number'),
  body('splits.*.percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Split percentage must be between 0 and 100'),
];

const updateExpenseValidation = [
  param('id').isUUID().withMessage('Invalid expense ID'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('description')
    .optional()
    .isLength({ min: 1, max: 500 })
    .trim()
    .withMessage('Description must be less than 500 characters'),
  body('category')
    .optional()
    .isLength({ max: 50 })
    .trim()
    .withMessage('Category must be less than 50 characters'),
  body('expense_date')
    .optional()
    .isISO8601()
    .withMessage('Valid expense date is required'),
];

const expenseIdValidation = [
  param('id').isUUID().withMessage('Invalid expense ID'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    ResponseFormatter.validationError(res, 'Validation failed', errors.array());
    return true;
  }
  return false;
};

// GET /api/expenses - Get expenses (with optional group filter)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { group_id, page = 1, limit = 10, category, date_from, date_to } = req.query;
  
  // Mock expenses data
  const expenses = [
    {
      id: '123e4567-e89b-12d3-a456-426614174020',
      group: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Weekend Trip to NYC'
      },
      description: 'Hotel room for 2 nights',
      amount: 400.00,
      category: 'accommodation',
      expense_date: new Date('2024-01-16'),
      paid_by: {
        id: '123e4567-e89b-12d3-a456-426614174010',
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe'
      },
      splits: [
        {
          user: {
            id: '123e4567-e89b-12d3-a456-426614174010',
            username: 'johndoe',
            first_name: 'John',
            last_name: 'Doe'
          },
          amount: 100.00,
          percentage: 25.0,
          is_paid: true
        },
        {
          user: {
            id: '123e4567-e89b-12d3-a456-426614174011',
            username: 'janesmith',
            first_name: 'Jane',
            last_name: 'Smith'
          },
          amount: 100.00,
          percentage: 25.0,
          is_paid: false
        }
      ],
      is_settled: false,
      created_at: new Date('2024-01-16'),
      updated_at: new Date('2024-01-16')
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174021',
      group: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Weekend Trip to NYC'
      },
      description: 'Dinner at fancy restaurant',
      amount: 150.00,
      category: 'food',
      expense_date: new Date('2024-01-17'),
      paid_by: {
        id: '123e4567-e89b-12d3-a456-426614174011',
        username: 'janesmith',
        first_name: 'Jane',
        last_name: 'Smith'
      },
      splits: [
        {
          user: {
            id: '123e4567-e89b-12d3-a456-426614174010',
            username: 'johndoe',
            first_name: 'John',
            last_name: 'Doe'
          },
          amount: 37.50,
          percentage: 25.0,
          is_paid: false
        },
        {
          user: {
            id: '123e4567-e89b-12d3-a456-426614174011',
            username: 'janesmith',
            first_name: 'Jane',
            last_name: 'Smith'
          },
          amount: 37.50,
          percentage: 25.0,
          is_paid: true
        }
      ],
      is_settled: false,
      created_at: new Date('2024-01-17'),
      updated_at: new Date('2024-01-17')
    }
  ];

  // Mock pagination
  const total = expenses.length;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const totalPages = Math.ceil(total / limitNum);

  const pagination = {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages,
    hasNext: pageNum < totalPages,
    hasPrev: pageNum > 1
  };

  ResponseFormatter.paginated(res, expenses, pagination, 'Expenses retrieved successfully');
}));

// GET /api/expenses/:id - Get a specific expense with details
router.get('/:id', expenseIdValidation, asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const { id } = req.params;
  
  // Mock expense data
  const expense = {
    id,
    group: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Weekend Trip to NYC'
    },
    description: 'Hotel room for 2 nights',
    amount: 400.00,
    category: 'accommodation',
    expense_date: new Date('2024-01-16'),
    receipt_url: 'https://example.com/receipts/hotel-receipt.pdf',
    notes: 'Booked through Booking.com with free cancellation',
    paid_by: {
      id: '123e4567-e89b-12d3-a456-426614174010',
      username: 'johndoe',
      first_name: 'John',
      last_name: 'Doe',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
    },
    created_by: {
      id: '123e4567-e89b-12d3-a456-426614174010',
      username: 'johndoe',
      first_name: 'John',
      last_name: 'Doe'
    },
    splits: [
      {
        id: '123e4567-e89b-12d3-a456-426614174030',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174010',
          username: 'johndoe',
          first_name: 'John',
          last_name: 'Doe',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
        },
        amount: 100.00,
        percentage: 25.0,
        is_paid: true
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174031',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174011',
          username: 'janesmith',
          first_name: 'Jane',
          last_name: 'Smith',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane'
        },
        amount: 100.00,
        percentage: 25.0,
        is_paid: false
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174032',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174012',
          username: 'mikewilson',
          first_name: 'Mike',
          last_name: 'Wilson',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike'
        },
        amount: 100.00,
        percentage: 25.0,
        is_paid: false
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174033',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174013',
          username: 'sarahjohnson',
          first_name: 'Sarah',
          last_name: 'Johnson',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah'
        },
        amount: 100.00,
        percentage: 25.0,
        is_paid: false
      }
    ],
    is_settled: false,
    created_at: new Date('2024-01-16'),
    updated_at: new Date('2024-01-16')
  };

  ResponseFormatter.success(res, { expense }, 'Expense details retrieved successfully');
}));

// POST /api/expenses - Create a new expense
router.post('/', createExpenseValidation, asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const { 
    group_id, 
    amount, 
    description, 
    category, 
    expense_date, 
    receipt_url, 
    notes,
    splits 
  } = req.body;

  // TODO: Get user ID from authentication
  // const created_by = req.user?.id;
  // const paid_by = req.user?.id; // Assuming the creator pays initially

  // Validate splits total to 100% or equal to amount
  const totalSplitAmount = splits.reduce((sum: number, split: any) => sum + (split.amount || 0), 0);
  const totalSplitPercentage = splits.reduce((sum: number, split: any) => sum + (split.percentage || 0), 0);

  if (totalSplitAmount > 0 && Math.abs(totalSplitAmount - amount) > 0.01) {
    return ResponseFormatter.badRequest(res, 'Split amounts must equal the total expense amount');
  }

  if (totalSplitPercentage > 0 && Math.abs(totalSplitPercentage - 100) > 0.01) {
    return ResponseFormatter.badRequest(res, 'Split percentages must equal 100%');
  }

  // Mock expense creation
  const newExpense = {
    id: '123e4567-e89b-12d3-a456-426614174022',
    group_id,
    description,
    amount,
    category,
    expense_date: new Date(expense_date),
    receipt_url,
    notes,
    paid_by: {
      id: '123e4567-e89b-12d3-a456-426614174010',
      username: 'johndoe',
      first_name: 'John',
      last_name: 'Doe'
    },
    created_by: {
      id: '123e4567-e89b-12d3-a456-426614174010',
      username: 'johndoe',
      first_name: 'John',
      last_name: 'Doe'
    },
    splits: splits.map((split: any, index: number) => ({
      id: `123e4567-e89b-12d3-a456-42661417403${index}`,
      user_id: split.user_id,
      amount: split.amount || (amount / splits.length),
      percentage: split.percentage || (100 / splits.length),
      is_paid: split.user_id === '123e4567-e89b-12d3-a456-426614174010' // Mock: paid by creator
    })),
    is_settled: false,
    created_at: new Date(),
    updated_at: new Date()
  };

  ResponseFormatter.created(res, { expense: newExpense }, 'Expense created successfully');
}));

// PUT /api/expenses/:id - Update an expense
router.put('/:id', updateExpenseValidation, asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const { id } = req.params;
  const { amount, description, category, expense_date, receipt_url, notes } = req.body;

  // Mock expense update
  const updatedExpense = {
    id,
    description: description || 'Hotel room for 2 nights',
    amount: amount || 400.00,
    category: category || 'accommodation',
    expense_date: expense_date ? new Date(expense_date) : new Date('2024-01-16'),
    receipt_url: receipt_url || null,
    notes: notes || null,
    updated_at: new Date()
  };

  ResponseFormatter.success(res, { expense: updatedExpense }, 'Expense updated successfully');
}));

// DELETE /api/expenses/:id - Delete an expense
router.delete('/:id', expenseIdValidation, asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const { id } = req.params;

  // Mock expense deletion
  ResponseFormatter.success(res, { expenseId: id }, 'Expense deleted successfully');
}));

// POST /api/expenses/:id/settle - Mark an expense as settled
router.post('/:id/settle', expenseIdValidation, asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const { id } = req.params;

  // Mock expense settlement
  const settledExpense = {
    id,
    is_settled: true,
    settled_at: new Date(),
    updated_at: new Date()
  };

  ResponseFormatter.success(res, { expense: settledExpense }, 'Expense marked as settled');
}));

// POST /api/expenses/:id/splits/:splitId/pay - Mark a split as paid
router.post('/:id/splits/:splitId/pay', [
  param('id').isUUID().withMessage('Invalid expense ID'),
  param('splitId').isUUID().withMessage('Invalid split ID'),
], asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const { id, splitId } = req.params;

  // Mock split payment
  const paidSplit = {
    id: splitId,
    expense_id: id,
    is_paid: true,
    paid_at: new Date(),
    updated_at: new Date()
  };

  ResponseFormatter.success(res, { split: paidSplit }, 'Split marked as paid');
}));

// GET /api/expenses/categories - Get expense categories
router.get('/categories', asyncHandler(async (req: Request, res: Response) => {
  const categories = [
    { id: 'food', name: 'Food & Dining', icon: '🍽️' },
    { id: 'accommodation', name: 'Accommodation', icon: '🏨' },
    { id: 'transportation', name: 'Transportation', icon: '🚗' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️' },
    { id: 'utilities', name: 'Utilities', icon: '⚡' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'travel', name: 'Travel', icon: '✈️' },
    { id: 'other', name: 'Other', icon: '📦' }
  ];

  ResponseFormatter.success(res, { categories }, 'Expense categories retrieved successfully');
}));

export default router;
