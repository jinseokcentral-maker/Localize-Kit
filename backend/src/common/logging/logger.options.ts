import type { FastifyServerOptions } from 'fastify';

const LOG_LEVEL_KEY = 'LOG_LEVEL';
const NODE_ENV_KEY = 'NODE_ENV';
const PRODUCTION = 'production';

type LoggerOptions = NonNullable<FastifyServerOptions['logger']>;

/**
 * Builds structured logger options for Fastify/Pino.
 * - Production: JSON logs, redacted sensitive headers.
 * - Non-production: pretty-printed, colorized logs for readability.
 */
export function createLoggerOptions(): LoggerOptions {
  const level = process.env[LOG_LEVEL_KEY] ?? 'info';
  const isProd = process.env[NODE_ENV_KEY] === PRODUCTION;

  const baseOptions: LoggerOptions = {
    level,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  };

  if (isProd) {
    return baseOptions;
  }

  return {
    ...baseOptions,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        singleLine: false,
      },
    },
  };
}

