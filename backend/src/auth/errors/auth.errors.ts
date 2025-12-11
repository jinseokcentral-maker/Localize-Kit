import { Data } from 'effect';
import { UnauthorizedError } from '../../common/errors/unauthorized-error';

export class MissingAuthHeaderError extends Data.TaggedError('MissingAuthHeaderError') {}

export class InvalidAuthSchemeError extends Data.TaggedError('InvalidAuthSchemeError') {}

export class InvalidTokenError extends UnauthorizedError {}


