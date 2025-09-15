import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ResponseFormatter {
  // Success responses
  static success<T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      timestamp: new Date().toISOString(),
    };

    if (message) response.message = message;
    if (data !== undefined) response.data = data;

    return res.status(statusCode).json(response);
  }

  // Created response (201)
  static created<T>(
    res: Response,
    data?: T,
    message: string = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  // No content response (204)
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  // Paginated response
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    message?: string
  ): Response {
    const response: ApiResponse<T[]> = {
      success: true,
      timestamp: new Date().toISOString(),
      data,
      pagination,
    };

    if (message) response.message = message;

    return res.status(200).json(response);
  }

  // Error responses
  static error(
    res: Response,
    error: string,
    statusCode: number = 500,
    code?: string,
    details?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      error,
      timestamp: new Date().toISOString(),
    };

    if (code) response.code = code;
    if (details) response.data = details;

    return res.status(statusCode).json(response);
  }

  // Bad request (400)
  static badRequest(
    res: Response,
    error: string = 'Bad request',
    details?: any
  ): Response {
    return this.error(res, error, 400, 'BAD_REQUEST', details);
  }

  // Unauthorized (401)
  static unauthorized(
    res: Response,
    error: string = 'Unauthorized'
  ): Response {
    return this.error(res, error, 401, 'UNAUTHORIZED');
  }

  // Forbidden (403)
  static forbidden(
    res: Response,
    error: string = 'Forbidden'
  ): Response {
    return this.error(res, error, 403, 'FORBIDDEN');
  }

  // Not found (404)
  static notFound(
    res: Response,
    error: string = 'Resource not found'
  ): Response {
    return this.error(res, error, 404, 'NOT_FOUND');
  }

  // Conflict (409)
  static conflict(
    res: Response,
    error: string = 'Resource conflict'
  ): Response {
    return this.error(res, error, 409, 'CONFLICT');
  }

  // Validation error (422)
  static validationError(
    res: Response,
    error: string = 'Validation failed',
    details?: any
  ): Response {
    return this.error(res, error, 422, 'VALIDATION_ERROR', details);
  }

  // Rate limit exceeded (429)
  static rateLimitExceeded(
    res: Response,
    error: string = 'Rate limit exceeded',
    retryAfter?: number
  ): Response {
    if (retryAfter) {
      res.set('Retry-After', retryAfter.toString());
    }
    return this.error(res, error, 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Internal server error (500)
  static internalError(
    res: Response,
    error: string = 'Internal server error'
  ): Response {
    return this.error(res, error, 500, 'INTERNAL_SERVER_ERROR');
  }
}

// Helper functions for common response patterns
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode?: number
) => ResponseFormatter.success(res, data, message, statusCode);

export const sendError = (
  res: Response,
  error: string,
  statusCode?: number,
  code?: string,
  details?: any
) => ResponseFormatter.error(res, error, statusCode, code, details);

export const sendCreated = <T>(
  res: Response,
  data?: T,
  message?: string
) => ResponseFormatter.created(res, data, message);

export const sendNotFound = (
  res: Response,
  message?: string
) => ResponseFormatter.notFound(res, message);

export const sendBadRequest = (
  res: Response,
  message?: string,
  details?: any
) => ResponseFormatter.badRequest(res, message, details);

export const sendUnauthorized = (
  res: Response,
  message?: string
) => ResponseFormatter.unauthorized(res, message);

export const sendForbidden = (
  res: Response,
  message?: string
) => ResponseFormatter.forbidden(res, message);

export const sendConflict = (
  res: Response,
  message?: string
) => ResponseFormatter.conflict(res, message);

export const sendValidationError = (
  res: Response,
  message?: string,
  details?: any
) => ResponseFormatter.validationError(res, message, details);

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  },
  message?: string
) => ResponseFormatter.paginated(res, data, pagination, message);

// Pagination helper
export const calculatePagination = (
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    total,
    totalPages,
    offset,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
