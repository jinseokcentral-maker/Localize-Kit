import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { UnauthorizedError } from './unauthorized-error';

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
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    if (exception instanceof UnauthorizedError) {
      return HttpStatus.UNAUTHORIZED;
    }
    if (this.isJwtExpired(exception)) {
      return HttpStatus.UNAUTHORIZED;
    }
    if (this.isTaggedError(exception)) {
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
    if (exception instanceof Error && typeof exception.message === 'string') {
      return exception.message;
    }
    if (this.isJwtExpired(exception)) {
      return 'jwt expired';
    }
    if (this.isTaggedError(exception)) {
      return `TaggedError:${this.getTag(exception)}`;
    }
    return 'Internal server error';
  }

  private isTaggedError(error: unknown): error is { _tag?: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      typeof (error as { _tag?: unknown })._tag === 'string'
    );
  }

  private getTag(error: { _tag?: string }): string {
    return error._tag ?? 'Unknown';
  }

  private isJwtExpired(error: unknown): boolean {
    return (
      error instanceof Error &&
      typeof error.message === 'string' &&
      error.message.toLowerCase().includes('jwt expired')
    );
  }
}

