import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess, sendError } from '../utils/response';
import { invitationService } from '../services/invitation';
import { authenticate } from '../middleware/auth';

const router = Router();

// Input validation rules
const createInvitationValidation = [
  param('groupId').isUUID().withMessage('Invalid group ID'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('role')
    .optional()
    .isIn(['admin', 'member'])
    .withMessage('Role must be either admin or member'),
];

const acceptInvitationValidation = [
  body('token')
    .isUUID()
    .withMessage('Valid invitation token is required'),
];

const invitationIdValidation = [
  param('invitationId').isUUID().withMessage('Invalid invitation ID'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400));
  }
  next();
};

// POST /api/groups/:groupId/invitations - Create group invitation
router.post('/:groupId/invitations', authenticate, createInvitationValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    const userId = (req as any).user.id;
    const { email, role = 'member' } = req.body;

    const invitationData = {
      groupId,
      email,
      role,
      invitedBy: userId,
    };

    const invitation = await invitationService.createInvitation(invitationData);

    sendSuccess(res, {
      statusCode: 201,
      message: 'Invitation created successfully',
      data: { invitation },
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to create invitation', 500));
  }
});

// GET /api/groups/:groupId/invitations - Get group invitations
router.get('/:groupId/invitations', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    const userId = (req as any).user.id;

    const invitations = await invitationService.getGroupInvitations(groupId, userId);

    sendSuccess(res, {
      message: 'Group invitations retrieved successfully',
      data: { invitations },
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to get group invitations', 500));
  }
});

// GET /api/invitations/:token - Get invitation details by token
router.get('/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const invitation = await invitationService.getInvitationByToken(token);
    if (!invitation) {
      return next(new AppError('Invitation not found', 404));
    }

    sendSuccess(res, {
      message: 'Invitation retrieved successfully',
      data: { invitation },
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to get invitation', 500));
  }
});

// POST /api/invitations/accept - Accept invitation
router.post('/accept', authenticate, acceptInvitationValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { token } = req.body;

    const result = await invitationService.acceptInvitation(token, userId);

    sendSuccess(res, {
      message: 'Invitation accepted successfully',
      data: result,
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to accept invitation', 500));
  }
});

// DELETE /api/invitations/:invitationId - Cancel invitation
router.delete('/:invitationId', authenticate, invitationIdValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invitationId } = req.params;
    const userId = (req as any).user.id;

    await invitationService.cancelInvitation(invitationId, userId);

    sendSuccess(res, {
      message: 'Invitation cancelled successfully',
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to cancel invitation', 500));
  }
});

export default router;
