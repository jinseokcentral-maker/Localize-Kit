import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UnauthorizedError } from './unauthorized-error';
import { ErrorName, errorMessages, getErrorMessage } from './error-messages';
import { unwrapFiberFailure } from '../effect/effect.util';
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

/**
 * Maps application errors to HTTP exceptions.
 * Handles FiberFailure unwrapping and error type resolution.
 */
export class ErrorMapper {
  /**
   * Maps an error to an appropriate HttpException.
   * Automatically unwraps FiberFailure if present.
   */
  static map(error: unknown): HttpException {
    // If already an HttpException, return as-is
    if (error instanceof HttpException) {
      return error;
    }
    // Unwrap FiberFailure if present
    const unwrapped = unwrapFiberFailure(error);
    // Map based on error type
    return this.mapUnwrappedError(unwrapped);
  }

  private static mapUnwrappedError(error: unknown): HttpException {
    // ProviderAuthError → 500 (check before UnauthorizedError since it extends it)
    if (this.isProviderAuthError(error)) {
      const reason =
        typeof error === 'object' && error !== null && 'reason' in error
          ? (error as { reason?: string }).reason
          : undefined;
      return new InternalServerErrorException(
        errorMessages.unauthorized.providerAuthFailed({ reason }),
      );
    }
    // JWT expired errors → 401 (check before general JWT-related errors and tagged errors)
    if (
      error instanceof Error &&
      error.message?.toLowerCase().includes('jwt') &&
      error.message?.toLowerCase().includes('expired')
    ) {
      return new UnauthorizedException(errorMessages.unauthorized.jwtExpired());
    }
    // UnauthorizedError and JWT-related errors → 401 (but not ProviderAuthError)
    if (
      (error instanceof UnauthorizedError &&
        !this.isProviderAuthError(error)) ||
      this.isJwtRelatedError(error)
    ) {
      return this.toUnauthorizedException(error);
    }
    // InvalidTeamError → 400
    if (error instanceof InvalidTeamError) {
      return new BadRequestException(
        errorMessages.team.invalid({ teamId: error.teamId }),
      );
    }
    // TeamAccessForbiddenError → 403
    if (error instanceof TeamAccessForbiddenError) {
      return new ForbiddenException(
        errorMessages.team.accessForbidden({ teamId: error.teamId }),
      );
    }
    // ForbiddenProjectAccessError → 403
    if (error instanceof ForbiddenProjectAccessError) {
      const message =
        error.plan &&
        error.limit !== undefined &&
        error.currentCount !== undefined
          ? `Project limit exceeded. Your ${error.plan} plan allows ${error.limit} project${error.limit === 1 ? '' : 's'}, and you currently have ${error.currentCount}.`
          : errorMessages.project.forbidden();
      return new ForbiddenException(message);
    }
    // ProjectArchivedError → 403
    if (error instanceof ProjectArchivedError) {
      return new ForbiddenException(errorMessages.project.archived());
    }
    // ProjectConflictError → 409
    if (error instanceof ProjectConflictError) {
      return new ConflictException(
        errorMessages.project.conflict({ reason: error.reason }),
      );
    }
    // ProjectValidationError → 400
    if (error instanceof ProjectValidationError) {
      return new BadRequestException(
        errorMessages.project.validation({ reason: error.reason }),
      );
    }
    // PersonalTeamNotFoundError → 500
    if (error instanceof PersonalTeamNotFoundError) {
      return new InternalServerErrorException(
        errorMessages.user.personalTeamNotFound({ userId: error.userId }),
      );
    }
    // Tagged errors (default) → 400
    if (this.isTaggedError(error)) {
      const message = getErrorMessage(error, errorMessages);
      return new BadRequestException(message);
    }
    // Unknown errors → 500
    if (error instanceof Error) {
      return new InternalServerErrorException(error.message);
    }
    return new InternalServerErrorException(errorMessages.system.internal());
  }

  private static toUnauthorizedException(
    error: unknown,
  ): UnauthorizedException {
    const reason =
      typeof error === 'object' && error !== null && 'reason' in error
        ? (error as { reason?: string }).reason
        : undefined;
    return new UnauthorizedException(
      errorMessages.unauthorized.invalidToken({ reason }),
    );
  }

  private static isProviderAuthError(error: unknown): boolean {
    return (
      error instanceof ProviderAuthError ||
      this.getErrorTag(error) === ErrorName.ProviderAuthError
    );
  }

  private static isJwtRelatedError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    // Don't check for 'jwt expired' here - it's handled separately above
    const errorTag = this.getErrorTag(error);
    if (!errorTag) {
      return false;
    }
    return (
      errorTag === ErrorName.MissingAuthHeaderError ||
      errorTag === ErrorName.InvalidAuthSchemeError ||
      errorTag === ErrorName.InvalidTokenError ||
      errorTag === ErrorName.UnauthorizedError
    );
  }

  private static isTaggedError(error: unknown): error is { _tag?: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      typeof (error as { _tag?: unknown })._tag === 'string'
    );
  }

  private static getErrorTag(error: unknown): string | undefined {
    if (
      typeof error === 'object' &&
      error !== null &&
      '_tag' in error &&
      typeof (error as { _tag?: unknown })._tag === 'string'
    ) {
      return (error as { _tag: string })._tag;
    }
    if (error instanceof Error) {
      return error.constructor.name;
    }
    return undefined;
  }
}
