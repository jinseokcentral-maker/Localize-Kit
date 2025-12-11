import { UnauthorizedException } from '@nestjs/common';
import { Data } from 'effect';

export class UnauthorizedError extends Data.TaggedError('UnauthorizedError')<{
  readonly reason: string;
}> {}

export function toUnauthorizedException(error: unknown): UnauthorizedException {
  const reason = deriveReason(error);
  return new UnauthorizedException(reason);
}

function deriveReason(error: unknown): string {
  if (error instanceof UnauthorizedError) {
    return error.reason;
  }
  if (error instanceof Error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Unauthorized';
}
