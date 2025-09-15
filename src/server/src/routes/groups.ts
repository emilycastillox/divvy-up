import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { ResponseFormatter } from '../utils/response';

const router = Router();

// Input validation rules
const createGroupValidation = [
  body('name')
    .isLength({ min: 1, max: 255 })
    .trim()
    .withMessage('Group name is required and must be less than 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .withMessage('Description must be less than 1000 characters'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
];

const updateGroupValidation = [
  param('id').isUUID().withMessage('Invalid group ID'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 255 })
    .trim()
    .withMessage('Group name must be less than 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .withMessage('Description must be less than 1000 characters'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
];

const groupIdValidation = [
  param('id').isUUID().withMessage('Invalid group ID'),
];

const addMemberValidation = [
  param('id').isUUID().withMessage('Invalid group ID'),
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('role')
    .optional()
    .isIn(['admin', 'member'])
    .withMessage('Role must be either admin or member'),
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

// GET /api/groups - Get all groups for the current user
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement authentication middleware
  // const userId = req.user?.id;
  
  // Mock data for now
  const groups = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Weekend Trip to NYC',
      description: 'Our annual weekend getaway',
      currency: 'USD',
      memberCount: 4,
      totalExpenses: 930.00,
      yourBalance: -45.50,
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-20')
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Office Lunch Fund',
      description: 'Shared lunch expenses',
      currency: 'USD',
      memberCount: 3,
      totalExpenses: 100.00,
      yourBalance: 25.00,
      created_at: new Date('2024-01-10'),
      updated_at: new Date('2024-01-18')
    }
  ];

  ResponseFormatter.success(res, { groups }, 'Groups retrieved successfully');
}));

// GET /api/groups/:id - Get a specific group with details
router.get('/:id', groupIdValidation, asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const { id } = req.params;
  
  // Mock data for now
  const group = {
    id,
    name: 'Weekend Trip to NYC',
    description: 'Our annual weekend getaway to New York City',
    currency: 'USD',
    created_by: '123e4567-e89b-12d3-a456-426614174010',
    is_active: true,
    settings: {
      splitMethod: 'equal',
      allowPartialPayments: true,
      requireApproval: false
    },
    members: [
      {
        id: '123e4567-e89b-12d3-a456-426614174010',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174010',
          username: 'johndoe',
          first_name: 'John',
          last_name: 'Doe',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
        },
        role: 'admin',
        joined_at: new Date('2024-01-15'),
        balance: -45.50
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174011',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174011',
          username: 'janesmith',
          first_name: 'Jane',
          last_name: 'Smith',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane'
        },
        role: 'member',
        joined_at: new Date('2024-01-15'),
        balance: 150.00
      }
    ],
    recentExpenses: [
      {
        id: '123e4567-e89b-12d3-a456-426614174020',
        description: 'Hotel room for 2 nights',
        amount: 400.00,
        paid_by: {
          username: 'johndoe',
          first_name: 'John',
          last_name: 'Doe'
        },
        expense_date: new Date('2024-01-16'),
        created_at: new Date('2024-01-16')
      }
    ],
    totalExpenses: 930.00,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-20')
  };

  ResponseFormatter.success(res, { group }, 'Group details retrieved successfully');
}));

// POST /api/groups - Create a new group
router.post('/', createGroupValidation, asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const { name, description, currency = 'USD' } = req.body;
  // TODO: Get user ID from authentication
  // const created_by = req.user?.id;

  // Mock creation for now
  const newGroup = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    name,
    description,
    currency,
    created_by: '123e4567-e89b-12d3-a456-426614174010', // Mock user ID
    is_active: true,
    settings: {
      splitMethod: 'equal',
      allowPartialPayments: true,
      requireApproval: false
    },
    members: [
      {
        id: '123e4567-e89b-12d3-a456-426614174012',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174010',
          username: 'johndoe',
          first_name: 'John',
          last_name: 'Doe'
        },
        role: 'admin',
        joined_at: new Date()
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  };

  ResponseFormatter.created(res, { group: newGroup }, 'Group created successfully');
}));

// PUT /api/groups/:id - Update a group
router.put('/:id', updateGroupValidation, asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const { id } = req.params;
  const { name, description, currency } = req.body;

  // Mock update for now
  const updatedGroup = {
    id,
    name: name || 'Weekend Trip to NYC',
    description: description || 'Our annual weekend getaway to New York City',
    currency: currency || 'USD',
    updated_at: new Date()
  };

  ResponseFormatter.success(res, { group: updatedGroup }, 'Group updated successfully');
}));

// DELETE /api/groups/:id - Delete (deactivate) a group
router.delete('/:id', groupIdValidation, asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const { id } = req.params;

  // Mock deletion for now
  ResponseFormatter.success(res, { groupId: id }, 'Group deleted successfully');
}));

// POST /api/groups/:id/members - Add a member to a group
router.post('/:id/members', addMemberValidation, asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const { id } = req.params;
  const { userId, role = 'member' } = req.body;

  // Mock member addition
  const newMember = {
    id: '123e4567-e89b-12d3-a456-426614174013',
    user: {
      id: userId,
      username: 'newuser',
      first_name: 'New',
      last_name: 'User'
    },
    role,
    joined_at: new Date(),
    is_active: true
  };

  ResponseFormatter.created(res, { member: newMember }, 'Member added to group successfully');
}));

// DELETE /api/groups/:id/members/:userId - Remove a member from a group
router.delete('/:id/members/:userId', [
  param('id').isUUID().withMessage('Invalid group ID'),
  param('userId').isUUID().withMessage('Invalid user ID'),
], asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const { id, userId } = req.params;

  // Mock member removal
  ResponseFormatter.success(res, { groupId: id, userId }, 'Member removed from group successfully');
}));

// GET /api/groups/:id/balances - Get balances for a group
router.get('/:id/balances', groupIdValidation, asyncHandler(async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  const { id } = req.params;

  // Mock balances data
  const balances = [
    {
      user: {
        id: '123e4567-e89b-12d3-a456-426614174010',
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe'
      },
      total_owed: 200.00,
      total_owes: 245.50,
      net_balance: -45.50
    },
    {
      user: {
        id: '123e4567-e89b-12d3-a456-426614174011',
        username: 'janesmith',
        first_name: 'Jane',
        last_name: 'Smith'
      },
      total_owed: 300.00,
      total_owes: 150.00,
      net_balance: 150.00
    }
  ];

  ResponseFormatter.success(res, { balances }, 'Group balances retrieved successfully');
}));

export default router;
