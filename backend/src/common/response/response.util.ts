import dayjs from 'dayjs';
import type { ResponseEnvelope } from './response.schema';

type EnvelopeExtras = Readonly<{
  requestId?: string;
  path?: string;
}>;

export function buildResponse<T>(data: T, extras: EnvelopeExtras = {}): ResponseEnvelope<T> {
  return {
    data,
    timestamp: dayjs().toISOString(),
    ...extras,
  };
}

