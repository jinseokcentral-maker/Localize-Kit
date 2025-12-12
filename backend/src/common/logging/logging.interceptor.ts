import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { tap, catchError, throwError } from 'rxjs';

type LogLevel = 'info' | 'warn' | 'error';

type LoggerLike = Readonly<{
  info: (obj: Record<string, unknown>, message?: string) => void;
  warn: (obj: Record<string, unknown>, message?: string) => void;
  error: (obj: Record<string, unknown>, message?: string) => void;
}>;

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerLike) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<FastifyRequest>();
    const response = httpContext.getResponse<FastifyReply>();
    const startedAt = Date.now();

    const baseMeta = this.buildBaseMeta(request);

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startedAt;
        this.log('info', {
          ...baseMeta,
          statusCode: response.statusCode,
          durationMs,
        });
      }),
      catchError((err: unknown) => {
        const durationMs = Date.now() - startedAt;
        this.log('error', {
          ...baseMeta,
          statusCode: response.statusCode,
          durationMs,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          errorName: err instanceof Error ? err.name : undefined,
        });
        return throwError(() => err);
      }),
    );
  }

  private buildBaseMeta(request: FastifyRequest): Record<string, unknown> {
    const user =
      (request as unknown as Record<string, unknown>).user as
        | { sub?: string; plan?: string }
        | undefined;
    return {
      requestId: request.id,
      method: request.method,
      path: request.url,
      userId: user?.sub,
      userPlan: user?.plan,
      clientIp: request.ip,
      userAgent: request.headers['user-agent'],
    };
  }

  private log(level: LogLevel, meta: Record<string, unknown>): void {
    if (level === 'info') {
      this.logger.info(meta, 'request_complete');
      return;
    }
    if (level === 'warn') {
      this.logger.warn(meta, 'request_warn');
      return;
    }
    this.logger.error(meta, 'request_error');
  }
}

