import { Data } from 'effect';

export class ProjectNotFoundError extends Data.TaggedError(
  'ProjectNotFoundError',
) {}

export class ProjectConflictError extends Data.TaggedError(
  'ProjectConflictError',
)<{
  readonly reason: string;
}> {}

export class ForbiddenProjectAccessError extends Data.TaggedError(
  'ForbiddenProjectAccessError',
)<{
  readonly plan: string;
  readonly currentCount: number;
  readonly limit: number;
}> {}

export class ProjectValidationError extends Data.TaggedError(
  'ProjectValidationError',
)<{
  readonly reason: string;
}> {}
