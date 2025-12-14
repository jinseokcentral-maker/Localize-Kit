import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cause, Effect } from 'effect';
import { ErrorMapper } from './error-mapper';
import {
  InvalidTeamError,
  InvalidTokenError,
  ProviderAuthError,
  TeamAccessForbiddenError,
} from '../../auth/errors/auth.errors';
import {
  ForbiddenProjectAccessError,
  ProjectArchivedError,
  ProjectConflictError,
  ProjectNotFoundError,
  ProjectValidationError,
} from '../../project/errors/project.errors';
import {
  PersonalTeamNotFoundError,
  UserConflictError,
  UserNotFoundError,
} from '../../user/errors/user.errors';
import { UnauthorizedError } from './unauthorized-error';
import { unwrapFiberFailure } from '../effect/effect.util';

function getExceptionMessage(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return response;
  }
  if (
    typeof response === 'object' &&
    response !== null &&
    'message' in response &&
    typeof (response as { message?: unknown }).message === 'string'
  ) {
    return (response as { message: string }).message;
  }
  return exception.message;
}

describe('ErrorMapper', () => {
  describe('map', () => {
    it('preserves HttpException as-is', () => {
      const httpException = new BadRequestException('Test error');
      const result = ErrorMapper.map(httpException);
      expect(result).toBe(httpException);
      expect(result.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('unwraps FiberFailure correctly', async () => {
      const originalError = new InvalidTeamError({ teamId: 'test-team-id' });
      let fiberFailure: unknown;
      try {
        await Effect.runPromise(Effect.fail(originalError));
      } catch (err) {
        fiberFailure = err;
      }

      const result = ErrorMapper.map(fiberFailure);
      expect(result).toBeInstanceOf(BadRequestException);
      expect(result.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(getExceptionMessage(result)).toContain(
        'Invalid team ID: test-team-id',
      );
    });

    it('maps InvalidTeamError → 400 BadRequest', () => {
      const error = new InvalidTeamError({ teamId: 'invalid-team-123' });
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(BadRequestException);
      expect(result.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(getExceptionMessage(result)).toBe(
        'Invalid team ID: invalid-team-123',
      );
    });

    it('maps TeamAccessForbiddenError → 403 Forbidden', () => {
      const error = new TeamAccessForbiddenError({
        userId: 'user-1',
        teamId: 'team-1',
      });
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(ForbiddenException);
      expect(result.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(getExceptionMessage(result)).toBe(
        'User is not a member of team team-1',
      );
    });

    it('maps ProviderAuthError → 500 InternalServerError', () => {
      const error = new ProviderAuthError('Database connection failed');
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(InternalServerErrorException);
      expect(result.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      const message = getExceptionMessage(result);
      expect(message).toContain('Provider authentication failed');
      expect(message).toContain('Database connection failed');
    });

    it('maps InvalidTokenError → 401 Unauthorized', () => {
      const error = new InvalidTokenError({ reason: 'Token expired' });
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(UnauthorizedException);
      expect(result.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      const message = getExceptionMessage(result);
      expect(message).toContain('Invalid token');
      expect(message).toContain('Token expired');
    });

    it('maps UnauthorizedError → 401 Unauthorized', () => {
      const error = new UnauthorizedError({ reason: 'Missing token' });
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(UnauthorizedException);
      expect(result.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(getExceptionMessage(result)).toContain('Invalid token');
    });

    it('maps ForbiddenProjectAccessError → 403 Forbidden with detailed message', () => {
      const error = new ForbiddenProjectAccessError({
        plan: 'free',
        currentCount: 1,
        limit: 1,
      });
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(ForbiddenException);
      expect(result.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(getExceptionMessage(result)).toBe(
        'Project limit exceeded. Your free plan allows 1 project, and you currently have 1.',
      );
    });

    it('maps ForbiddenProjectAccessError → 403 Forbidden with generic message when details missing', () => {
      const error = new ForbiddenProjectAccessError({
        plan: '',
        currentCount: 0,
        limit: 0,
      });
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(ForbiddenException);
      expect(result.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(getExceptionMessage(result)).toBe(
        'Forbidden: insufficient project access',
      );
    });

    it('maps ProjectArchivedError → 403 Forbidden', () => {
      const error = new ProjectArchivedError();
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(ForbiddenException);
      expect(result.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(getExceptionMessage(result)).toBe(
        'Project is archived. Only read operations are allowed.',
      );
    });

    it('maps ProjectConflictError → 409 Conflict', () => {
      const error = new ProjectConflictError({ reason: 'Slug already exists' });
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(ConflictException);
      expect(result.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(getExceptionMessage(result)).toBe(
        'Project conflict: Slug already exists',
      );
    });

    it('maps ProjectValidationError → 400 BadRequest', () => {
      const error = new ProjectValidationError({
        reason: 'Name is required',
      });
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(BadRequestException);
      expect(result.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      const message = getExceptionMessage(result);
      expect(message).toContain('Project validation failed');
      expect(message).toContain('Name is required');
    });

    it('maps PersonalTeamNotFoundError → 500 InternalServerError', () => {
      const error = new PersonalTeamNotFoundError({ userId: 'user-123' });
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(InternalServerErrorException);
      expect(result.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      const message = getExceptionMessage(result);
      expect(message).toContain('Personal team not found for user');
      expect(message).toContain('user-123');
    });

    it('maps ProjectNotFoundError → 400 BadRequest (tagged error)', () => {
      const error = new ProjectNotFoundError();
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(BadRequestException);
      expect(result.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(getExceptionMessage(result)).toBe('Project not found');
    });

    it('maps UserNotFoundError → 400 BadRequest (tagged error)', () => {
      const error = new UserNotFoundError();
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(BadRequestException);
      expect(result.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(getExceptionMessage(result)).toBe('User not found');
    });

    it('maps UserConflictError → 400 BadRequest (tagged error)', () => {
      const error = new UserConflictError({ reason: 'Email already exists' });
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(BadRequestException);
      expect(result.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      const message = getExceptionMessage(result);
      expect(message).toContain('User conflict');
      expect(message).toContain('Email already exists');
    });

    it('maps Error with "jwt expired" message → 401 Unauthorized', () => {
      const error = new Error('JWT token expired');
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(UnauthorizedException);
      expect(result.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(getExceptionMessage(result)).toBe('JWT token expired');
    });

    it('maps unknown Error → 500 InternalServerError', () => {
      const error = new Error('Something went wrong');
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(InternalServerErrorException);
      expect(result.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(getExceptionMessage(result)).toBe('Something went wrong');
    });

    it('maps unknown non-Error → 500 InternalServerError', () => {
      const error = { some: 'object' };
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(InternalServerErrorException);
      expect(result.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(getExceptionMessage(result)).toBe('Internal server error');
    });

    it('handles nested FiberFailure', async () => {
      const originalError = new InvalidTeamError({ teamId: 'nested-team' });
      let fiberFailure: unknown;
      try {
        await Effect.runPromise(Effect.fail(originalError));
      } catch (err) {
        fiberFailure = err;
      }

      // Test that unwrapFiberFailure can handle the FiberFailure
      const unwrapped = unwrapFiberFailure(fiberFailure);
      expect(unwrapped).toBeInstanceOf(InvalidTeamError);

      const result = ErrorMapper.map(fiberFailure);
      expect(result).toBeInstanceOf(BadRequestException);
      expect(getExceptionMessage(result)).toContain(
        'Invalid team ID: nested-team',
      );
    });

    it('handles error without _tag', () => {
      const error = new Error('Plain error');
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(InternalServerErrorException);
      expect(getExceptionMessage(result)).toBe('Plain error');
    });

    it('handles error with missing context fields gracefully', () => {
      // InvalidTeamError with missing teamId (shouldn't happen but test edge case)
      const error = Object.assign(new InvalidTeamError({ teamId: 'test' }), {
        teamId: undefined,
      });
      const result = ErrorMapper.map(error);
      expect(result).toBeInstanceOf(BadRequestException);
      // Should still return a message, even if teamId is missing
      expect(getExceptionMessage(result)).toBeDefined();
    });
  });
});
