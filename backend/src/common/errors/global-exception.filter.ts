import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { UnauthorizedError } from './unauthorized-error';
import { ErrorName, errorMessages, getErrorMessage } from './error-messages';
import { unwrapFiberFailure } from '../effect/effect.util';

type LoggerLike = Readonly<{
  error: (obj: Record<string, unknown>, message?: string) => void;
}>;

type ErrorBody = Readonly<{
  statusCode: number;
  message: string;
  path: string;
  requestId: string | undefined;
  timestamp: string;
}>;

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerLike) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const reply = context.getResponse<FastifyReply>();

    const status = this.resolveStatus(exception);
    const body = this.buildBody(exception, request, status);

    this.logger.error(
      {
        requestId: request.id,
        path: request.url,
        method: request.method,
        statusCode: status,
        errorName: exception instanceof Error ? exception.name : undefined,
        errorMessage: this.resolveMessage(exception),
      },
      'request_exception',
    );

    void reply.status(status).send(body);
  }

  private resolveStatus(exception: unknown): number {
    const unwrapped = unwrapFiberFailure(exception);
    if (this.isProviderAuthError(unwrapped)) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (
        status === HttpStatus.UNAUTHORIZED ||
        this.isJwtRelatedException(exception)
      ) {
        return HttpStatus.UNAUTHORIZED;
      }
      return status;
    }
    if (unwrapped instanceof UnauthorizedError) {
      return HttpStatus.UNAUTHORIZED;
    }
    if (this.isJwtRelatedError(unwrapped)) {
      return HttpStatus.UNAUTHORIZED;
    }
    if (this.isForbiddenProjectAccessError(unwrapped)) {
      return HttpStatus.FORBIDDEN;
    }
    if (this.isPersonalTeamNotFoundError(unwrapped)) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
    if (this.isTaggedError(unwrapped)) {
      return HttpStatus.BAD_REQUEST;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private buildBody(
    exception: unknown,
    request: FastifyRequest,
    status: number,
  ): ErrorBody {
    return {
      statusCode: status,
      message: this.resolveMessage(exception),
      path: request.url,
      requestId: request.id,
      timestamp: new Date().toISOString(),
    };
  }

  private resolveMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return res;
      }
      if (
        typeof res === 'object' &&
        res !== null &&
        'message' in res &&
        typeof (res as { message?: unknown }).message === 'string'
      ) {
        return (res as { message: string }).message;
      }
      return exception.message;
    }
    const unwrapped = unwrapFiberFailure(exception);
    return getErrorMessage(unwrapped, errorMessages);
  }

  private isTaggedError(error: unknown): error is { _tag?: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      typeof (error as { _tag?: unknown })._tag === 'string'
    );
  }

  private isJwtRelatedException(exception: HttpException): boolean {
    const res = exception.getResponse();
    const message =
      typeof res === 'string'
        ? res
        : typeof res === 'object' && res !== null && 'message' in res
          ? String((res as { message?: unknown }).message)
          : exception.message;
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('jwt') ||
      lowerMessage.includes('token') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('invalid token') ||
      lowerMessage.includes('missing auth') ||
      lowerMessage.includes('invalid auth scheme')
    );
  }

  private isProviderAuthError(error: unknown): boolean {
    const errorTag = this.getErrorTag(error);
    return errorTag === ErrorName.ProviderAuthError;
  }

  private isJwtRelatedError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    const errorTag = this.getErrorTag(error);
    if (!errorTag) {
      return error.message?.toLowerCase().includes('jwt expired') === true;
    }
    return (
      errorTag === ErrorName.MissingAuthHeaderError ||
      errorTag === ErrorName.InvalidAuthSchemeError ||
      errorTag === ErrorName.InvalidTokenError ||
      errorTag === ErrorName.UnauthorizedError ||
      error.message?.toLowerCase().includes('jwt expired') === true
    );
  }

  private isForbiddenProjectAccessError(error: unknown): boolean {
    const errorTag = this.getErrorTag(error);
    return errorTag === ErrorName.ForbiddenProjectAccessError;
  }

  private isPersonalTeamNotFoundError(error: unknown): boolean {
    const errorTag = this.getErrorTag(error);
    return errorTag === ErrorName.PersonalTeamNotFoundError;
  }

  private getErrorTag(error: unknown): string | undefined {
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
