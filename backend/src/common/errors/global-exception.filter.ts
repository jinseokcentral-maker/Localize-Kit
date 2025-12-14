import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { ErrorMapper } from './error-mapper';
import { UnauthorizedError } from './unauthorized-error';
import { errorMessages } from './error-messages';
import { unwrapFiberFailure } from '../effect/effect.util';
import { ProviderAuthError } from '../../auth/errors/auth.errors';

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

    const mapped = this.toHttpException(exception);
    const status = mapped.getStatus();
    const body = this.buildBody(mapped, request, status);

    this.logger.error(
      {
        requestId: request.id,
        path: request.url,
        method: request.method,
        statusCode: status,
        errorName:
          exception instanceof Error
            ? exception.name
            : mapped instanceof Error
              ? mapped.name
              : undefined,
        errorMessage: this.resolveMessage(mapped),
      },
      'request_exception',
    );

    void reply.status(status).send(body);
  }

  private buildBody(
    exception: HttpException,
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
    return errorMessages.system.internal();
  }

  private toHttpException(exception: unknown): HttpException {
    // Normalize any thrown value into an HttpException using the central mapper.
    const mapped = ErrorMapper.map(exception);
    const unwrapped = unwrapFiberFailure(exception);

    // Ensure UnauthorizedError always maps to 401 even if thrown directly,
    // but don't override ProviderAuthError which should stay 500.
    if (
      mapped instanceof HttpException &&
      unwrapped instanceof UnauthorizedError &&
      !(unwrapped instanceof ProviderAuthError) &&
      mapped.getStatus() !== HttpStatus.UNAUTHORIZED
    ) {
      return new HttpException(mapped.getResponse(), HttpStatus.UNAUTHORIZED);
    }

    return mapped;
  }
}
