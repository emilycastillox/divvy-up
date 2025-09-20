import { Router, Request, Response, NextFunction } from 'express';
import { param, query, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess, sendError } from '../utils/response';
import { balanceService } from '../services/balance';
import { groupService } from '../services/group';
import { authenticate } from '../middleware/auth';

const router = Router();

// Input validation rules
const groupIdValidation = [
  param('groupId').isUUID().withMessage('Invalid group ID'),
];

const userIdValidation = [
  param('groupId').isUUID().withMessage('Invalid group ID'),
  param('userId').isUUID().withMessage('Invalid user ID'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError('Validation failed', 400, errors.array()));
    return true;
  }
  return false;
};

/**
 * @route GET /api/balances/group/:groupId
 * @desc Get balance summary for a group
 * @access Private
 */
router.get('/group/:groupId', 
  authenticate,
  groupIdValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (handleValidationErrors(req, res, next)) return;

      const { groupId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 'User not authenticated', 401);
      }

      // Check if user is a member of the group
      const isMember = await groupService.isGroupMember(groupId, userId);
      if (!isMember) {
        return sendError(res, 'User is not a member of this group', 403);
      }

      const balanceSummary = await balanceService.getGroupBalanceSummary(groupId);
      
      // Add user information to balances
      const balancesWithUsers = await Promise.all(
        balanceSummary.balances.map(async (balance) => {
          const member = await groupService.getGroupMember(groupId, balance.userId);
          return {
            ...balance,
            user: member?.user || null
          };
        })
      );

      sendSuccess(res, {
        ...balanceSummary,
        balances: balancesWithUsers
      }, 'Group balance summary retrieved successfully');

    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route GET /api/balances/group/:groupId/settlements
 * @desc Get optimal settlement transactions for a group
 * @access Private
 */
router.get('/group/:groupId/settlements',
  authenticate,
  groupIdValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (handleValidationErrors(req, res, next)) return;

      const { groupId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 'User not authenticated', 401);
      }

      // Check if user is a member of the group
      const isMember = await groupService.isGroupMember(groupId, userId);
      if (!isMember) {
        return sendError(res, 'User is not a member of this group', 403);
      }

      const balances = await balanceService.calculateGroupBalances(groupId);
      const settlements = balanceService.calculateOptimalSettlements(balances);

      // Add user information to settlements
      const settlementsWithUsers = await Promise.all(
        settlements.map(async (settlement) => {
          const fromMember = await groupService.getGroupMember(groupId, settlement.from);
          const toMember = await groupService.getGroupMember(groupId, settlement.to);
          
          return {
            ...settlement,
            fromUser: fromMember?.user || null,
            toUser: toMember?.user || null
          };
        })
      );

      sendSuccess(res, {
        settlements: settlementsWithUsers,
        totalSettlements: settlementsWithUsers.length,
        totalAmount: settlementsWithUsers.reduce((sum, s) => sum + s.amount, 0)
      }, 'Settlement transactions retrieved successfully');

    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route GET /api/balances/group/:groupId/user/:userId
 * @desc Get balance for a specific user in a group
 * @access Private
 */
router.get('/group/:groupId/user/:userId',
  authenticate,
  userIdValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (handleValidationErrors(req, res, next)) return;

      const { groupId, userId } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        return sendError(res, 'User not authenticated', 401);
      }

      // Check if current user is a member of the group
      const isMember = await groupService.isGroupMember(groupId, currentUserId);
      if (!isMember) {
        return sendError(res, 'User is not a member of this group', 403);
      }

      const userBalance = await balanceService.getUserBalanceInGroup(groupId, userId);
      
      if (!userBalance) {
        return sendError(res, 'User balance not found', 404);
      }

      // Add user information
      const member = await groupService.getGroupMember(groupId, userId);
      
      sendSuccess(res, {
        ...userBalance,
        user: member?.user || null
      }, 'User balance retrieved successfully');

    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route GET /api/balances/group/:groupId/history
 * @desc Get balance history for a group
 * @access Private
 */
router.get('/group/:groupId/history',
  authenticate,
  groupIdValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (handleValidationErrors(req, res, next)) return;

      const { groupId } = req.params;
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        return sendError(res, 'User not authenticated', 401);
      }

      // Check if user is a member of the group
      const isMember = await groupService.isGroupMember(groupId, userId);
      if (!isMember) {
        return sendError(res, 'User is not a member of this group', 403);
      }

      const balanceHistory = await balanceService.getBalanceHistory(groupId, limit);
      
      sendSuccess(res, {
        history: balanceHistory,
        totalRecords: balanceHistory.length
      }, 'Balance history retrieved successfully');

    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route POST /api/balances/group/:groupId/validate
 * @desc Validate group balances
 * @access Private
 */
router.post('/group/:groupId/validate',
  authenticate,
  groupIdValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (handleValidationErrors(req, res, next)) return;

      const { groupId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 'User not authenticated', 401);
      }

      // Check if user is a member of the group
      const isMember = await groupService.isGroupMember(groupId, userId);
      if (!isMember) {
        return sendError(res, 'User is not a member of this group', 403);
      }

      const balances = await balanceService.calculateGroupBalances(groupId);
      const validation = balanceService.validateBalances(balances);
      
      sendSuccess(res, {
        isValid: validation.isValid,
        error: validation.error,
        totalMembers: balances.length,
        totalNetBalance: balances.reduce((sum, b) => sum + b.netBalance, 0)
      }, 'Balance validation completed');

    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
