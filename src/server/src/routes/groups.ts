import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess, sendError } from '../utils/response';
import { groupService } from '../services/group';
import { activityService } from '../services/activity';
import { authenticate } from '../middleware/auth';

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

const removeMemberValidation = [
  param('id').isUUID().withMessage('Invalid group ID'),
  param('userId').isUUID().withMessage('Invalid user ID'),
];

const updateMemberRoleValidation = [
  param('id').isUUID().withMessage('Invalid group ID'),
  param('userId').isUUID().withMessage('Invalid user ID'),
  body('role')
    .isIn(['admin', 'member'])
    .withMessage('Role must be either admin or member'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400));
  }
  next();
};

// GET /api/groups - Get all groups for the current user
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await groupService.getUserGroups(userId, page, limit);

    // Apply search filter if provided
    let filteredGroups = result.groups;
    if (search) {
      filteredGroups = result.groups.filter(group =>
        group.name.toLowerCase().includes(search.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(search.toLowerCase()))
      );
    }

    sendSuccess(res, {
      message: 'Groups retrieved successfully',
      data: { groups: filteredGroups },
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to get groups', 500));
  }
});

// GET /api/groups/:id - Get a specific group with details
router.get('/:id', authenticate, groupIdValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if user is a member of the group
    const isMember = await groupService.isGroupMember(id, userId);
    if (!isMember) {
      return next(new AppError('You are not a member of this group', 403));
    }

    const group = await groupService.getGroupById(id);
    if (!group) {
      return next(new AppError('Group not found', 404));
    }

    sendSuccess(res, {
      message: 'Group retrieved successfully',
      data: { group },
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to get group', 500));
  }
});

// POST /api/groups - Create a new group
router.post('/', authenticate, createGroupValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { name, description, currency = 'USD', settings } = req.body;

    const groupData = {
      name,
      description,
      currency,
      createdBy: userId,
      settings,
    };

    const group = await groupService.createGroup(groupData);

    sendSuccess(res, {
      statusCode: 201,
      message: 'Group created successfully',
      data: { group },
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to create group', 500));
  }
});

// PUT /api/groups/:id - Update a group
router.put('/:id', authenticate, updateGroupValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { name, description, currency, settings } = req.body;

    const updateData = {
      name,
      description,
      currency,
      settings,
    };

    const group = await groupService.updateGroup(id, updateData, userId);

    sendSuccess(res, {
      message: 'Group updated successfully',
      data: { group },
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to update group', 500));
  }
});

// DELETE /api/groups/:id - Delete a group
router.delete('/:id', authenticate, groupIdValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    await groupService.deleteGroup(id, userId);

    sendSuccess(res, {
      message: 'Group deleted successfully',
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to delete group', 500));
  }
});

// POST /api/groups/:id/members - Add a member to a group
router.post('/:id/members', authenticate, addMemberValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { userId: memberUserId, role = 'member' } = req.body;

    // Check if user has permission to add members
    const isAdmin = await groupService.isGroupAdmin(id, userId);
    if (!isAdmin) {
      return next(new AppError('Insufficient permissions to add members', 403));
    }

    const memberData = {
      userId: memberUserId,
      role,
      invitedBy: userId,
    };

    const member = await groupService.addMember(id, memberData);

    sendSuccess(res, {
      statusCode: 201,
      message: 'Member added successfully',
      data: { member },
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to add member', 500));
  }
});

// DELETE /api/groups/:id/members/:userId - Remove a member from a group
router.delete('/:id/members/:userId', authenticate, removeMemberValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, userId: memberUserId } = req.params;
    const userId = (req as any).user.id;

    await groupService.removeMember(id, memberUserId, userId);

    sendSuccess(res, {
      message: 'Member removed successfully',
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to remove member', 500));
  }
});

// PUT /api/groups/:id/members/:userId/role - Update member role
router.put('/:id/members/:userId/role', authenticate, updateMemberRoleValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, userId: memberUserId } = req.params;
    const userId = (req as any).user.id;
    const { role } = req.body;

    await groupService.updateMemberRole(id, memberUserId, role, userId);

    sendSuccess(res, {
      message: 'Member role updated successfully',
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to update member role', 500));
  }
});

// GET /api/groups/:id/members - Get group members
router.get('/:id/members', authenticate, groupIdValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if user is a member of the group
    const isMember = await groupService.isGroupMember(id, userId);
    if (!isMember) {
      return next(new AppError('You are not a member of this group', 403));
    }

    const members = await groupService.getGroupMembers(id);

    sendSuccess(res, {
      message: 'Group members retrieved successfully',
      data: { members },
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to get group members', 500));
  }
});

// GET /api/groups/:id/balances - Get group balances
router.get('/:id/balances', authenticate, groupIdValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if user is a member of the group
    const isMember = await groupService.isGroupMember(id, userId);
    if (!isMember) {
      return next(new AppError('You are not a member of this group', 403));
    }

    // TODO: Implement balance calculation
    // For now, return mock data
    const balances = [
      {
        userId: '123e4567-e89b-12d3-a456-426614174010',
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        balance: -45.50,
        owes: [
          { userId: '123e4567-e89b-12d3-a456-426614174011', amount: 45.50 }
        ]
      },
      {
        userId: '123e4567-e89b-12d3-a456-426614174011',
        username: 'janesmith',
        firstName: 'Jane',
        lastName: 'Smith',
        balance: 45.50,
        owedBy: [
          { userId: '123e4567-e89b-12d3-a456-426614174010', amount: 45.50 }
        ]
      }
    ];

    sendSuccess(res, {
      message: 'Group balances retrieved successfully',
      data: { balances },
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to get group balances', 500));
    }
  });

// PUT /api/groups/:id/members/:userId/role - Update member role
router.put('/:id/members/:userId/role', authenticate, groupIdValidation, param('userId').isUUID().withMessage('Invalid user ID'), body('role').isIn(['admin', 'member']).withMessage('Role must be either admin or member'), async (req: Request, res: Response, next: NextFunction) => {
  if (handleValidationErrors(req, res, next)) return;

  try {
    const { id: groupId, userId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user!.id;
    
    const updatedMember = await groupService.updateMemberRole(groupId, userId, role, currentUserId);
    sendSuccess(res, { member: updatedMember }, 'Member role updated successfully');
  } catch (error) {
    next(error);
  }
});

// GET /api/groups/:id/activities - Get group activity feed
router.get('/:id/activities', authenticate, groupIdValidation, async (req: Request, res: Response, next: NextFunction) => {
  if (handleValidationErrors(req, res, next)) return;

  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;
    
    const activities = await activityService.getGroupActivities(
      id, 
      userId, 
      Number(page), 
      Number(limit)
    );
    
    sendSuccess(res, { activities }, 'Group activities retrieved successfully');
  } catch (error) {
    next(error);
  }
});

export default router;