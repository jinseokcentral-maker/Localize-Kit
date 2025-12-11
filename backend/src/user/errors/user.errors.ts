import { Data } from 'effect';

export class UserNotFoundError extends Data.TaggedError('UserNotFoundError') {}

export class UserConflictError extends Data.TaggedError('UserConflictError')<{
  readonly reason: string;
}> {}


