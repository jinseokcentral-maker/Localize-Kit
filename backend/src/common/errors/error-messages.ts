type ErrorContext = Readonly<Record<string, unknown>>;

type ErrorMessageFn = (context?: ErrorContext) => string;

export enum ErrorName {
  MissingAuthHeaderError = 'MissingAuthHeaderError',
  InvalidAuthSchemeError = 'InvalidAuthSchemeError',
  InvalidTokenError = 'InvalidTokenError',
  ProviderAuthError = 'ProviderAuthError',
  UnauthorizedError = 'UnauthorizedError',
  ProjectNotFoundError = 'ProjectNotFoundError',
  ProjectConflictError = 'ProjectConflictError',
  ForbiddenProjectAccessError = 'ForbiddenProjectAccessError',
  ProjectValidationError = 'ProjectValidationError',
  ProjectArchivedError = 'ProjectArchivedError',
  UserNotFoundError = 'UserNotFoundError',
  UserConflictError = 'UserConflictError',
  PersonalTeamNotFoundError = 'PersonalTeamNotFoundError',
  MissingEnvError = 'MissingEnvError',
  InvalidPortError = 'InvalidPortError',
}

function createMessage(template: string, context?: ErrorContext): string {
  if (!context) {
    return template;
  }
  let message = template;
  for (const [key, value] of Object.entries(context)) {
    const placeholder = `{{${key}}}`;
    message = message.replace(new RegExp(placeholder, 'g'), String(value));
  }
  return message;
}

export const errorMessages = {
  unauthorized: {
    default: (): string => 'Unauthorized',
    missingAuthHeader: (): string => 'Missing authorization header',
    invalidAuthScheme: (): string => 'Invalid authorization scheme',
    invalidToken: (context?: ErrorContext): string =>
      createMessage(
        'Invalid token{{reason}}',
        context
          ? { reason: context.reason ? `: ${context.reason}` : '' }
          : undefined,
      ),
    jwtExpired: (): string => 'JWT token expired',
    providerAuthFailed: (context?: ErrorContext): string =>
      createMessage(
        'Provider authentication failed{{reason}}',
        context
          ? { reason: context.reason ? `: ${context.reason}` : '' }
          : undefined,
      ),
  },
  project: {
    notFound: (): string => 'Project not found',
    conflict: (context?: ErrorContext): string => {
      if (context?.reason) {
        return `Project conflict: ${context.reason}`;
      }
      return 'Project conflict';
    },
    forbidden: (): string => 'Forbidden: insufficient project access',
    validation: (context?: ErrorContext): string =>
      createMessage(
        'Project validation failed{{reason}}',
        context
          ? { reason: context.reason ? `: ${context.reason}` : '' }
          : undefined,
      ),
    archived: (): string =>
      'Project is archived. Only read operations are allowed.',
  },
  user: {
    notFound: (): string => 'User not found',
    conflict: (context?: ErrorContext): string =>
      createMessage(
        'User conflict{{reason}}',
        context
          ? { reason: context.reason ? `: ${context.reason}` : '' }
          : undefined,
      ),
    personalTeamNotFound: (context?: ErrorContext): string =>
      createMessage(
        'Personal team not found for user{{userId}}',
        context
          ? { userId: context.userId ? `: ${context.userId}` : '' }
          : undefined,
      ),
  },
  system: {
    missingEnv: (context?: ErrorContext): string =>
      createMessage('Missing environment variable: {{key}}', context),
    invalidPort: (context?: ErrorContext): string =>
      createMessage('Invalid port value: {{value}}', context),
    internal: (): string => 'Internal server error',
    refreshTokenFailed: (context?: ErrorContext): string =>
      createMessage(
        'Refresh token validation failed{{reason}}',
        context
          ? { reason: context.reason ? `: ${context.reason}` : '' }
          : undefined,
      ),
  },
} as const;

export type ErrorMessageKey = keyof typeof errorMessages;

function getErrorTag(error: unknown): string | undefined {
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

export function getErrorMessage(
  error: unknown,
  messages: typeof errorMessages,
): string {
  const errorTag = getErrorTag(error);
  if (!errorTag) {
    if (error instanceof Error && error.message) {
      const lowerMessage = error.message.toLowerCase();
      if (lowerMessage.includes('jwt expired')) {
        return messages.unauthorized.jwtExpired();
      }
      return error.message;
    }
    return messages.system.internal();
  }
  switch (errorTag) {
    case ErrorName.MissingAuthHeaderError:
      return messages.unauthorized.missingAuthHeader();
    case ErrorName.InvalidAuthSchemeError:
      return messages.unauthorized.invalidAuthScheme();
    case ErrorName.InvalidTokenError: {
      const reason =
        typeof error === 'object' && error !== null && 'reason' in error
          ? (error as { reason?: string }).reason
          : undefined;
      return messages.unauthorized.invalidToken({ reason });
    }
    case ErrorName.ProviderAuthError: {
      const reason =
        typeof error === 'object' && error !== null && 'reason' in error
          ? (error as { reason?: string }).reason
          : undefined;
      return messages.unauthorized.providerAuthFailed({ reason });
    }
    case ErrorName.UnauthorizedError: {
      const reason =
        typeof error === 'object' && error !== null && 'reason' in error
          ? (error as { reason?: string }).reason
          : undefined;
      return messages.unauthorized.invalidToken({ reason });
    }
    case ErrorName.ProjectNotFoundError:
      return messages.project.notFound();
    case ErrorName.ProjectConflictError: {
      const reason =
        typeof error === 'object' && error !== null && 'reason' in error
          ? (error as { reason?: string }).reason
          : undefined;
      return messages.project.conflict({ reason });
    }
    case ErrorName.ForbiddenProjectAccessError: {
      const plan =
        typeof error === 'object' && error !== null && 'plan' in error
          ? (error as { plan?: string }).plan
          : undefined;
      const currentCount =
        typeof error === 'object' && error !== null && 'currentCount' in error
          ? (error as { currentCount?: number }).currentCount
          : undefined;
      const limit =
        typeof error === 'object' && error !== null && 'limit' in error
          ? (error as { limit?: number }).limit
          : undefined;
      if (plan && limit !== undefined && currentCount !== undefined) {
        return `Project limit exceeded. Your ${plan} plan allows ${limit} project${limit === 1 ? '' : 's'}, and you currently have ${currentCount}.`;
      }
      return messages.project.forbidden();
    }
    case ErrorName.ProjectValidationError: {
      const reason =
        typeof error === 'object' && error !== null && 'reason' in error
          ? (error as { reason?: string }).reason
          : undefined;
      return messages.project.validation({ reason });
    }
    case ErrorName.ProjectArchivedError:
      return messages.project.archived();
    case ErrorName.UserNotFoundError:
      return messages.user.notFound();
    case ErrorName.UserConflictError: {
      const reason =
        typeof error === 'object' && error !== null && 'reason' in error
          ? (error as { reason?: string }).reason
          : undefined;
      return messages.user.conflict({ reason });
    }
    case ErrorName.PersonalTeamNotFoundError: {
      const userId =
        typeof error === 'object' && error !== null && 'userId' in error
          ? (error as { userId?: string }).userId
          : undefined;
      return messages.user.personalTeamNotFound({ userId });
    }
    case ErrorName.MissingEnvError: {
      const key =
        typeof error === 'object' && error !== null && 'key' in error
          ? (error as { key?: string }).key
          : undefined;
      return messages.system.missingEnv({ key });
    }
    case ErrorName.InvalidPortError: {
      const value =
        typeof error === 'object' && error !== null && 'value' in error
          ? (error as { value?: string }).value
          : undefined;
      return messages.system.invalidPort({ value });
    }
    default:
      if (error instanceof Error && error.message) {
        const lowerMessage = error.message.toLowerCase();
        if (lowerMessage.includes('jwt expired')) {
          return messages.unauthorized.jwtExpired();
        }
        return error.message;
      }
      return messages.system.internal();
  }
}
