import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const responseEnvelopeSchema = z.object({
  data: z.unknown(),
  timestamp: z.string(),
  requestId: z.string().optional(),
  path: z.string().optional(),
});

export class ResponseEnvelopeDto extends createZodDto(responseEnvelopeSchema) {}

export type ResponseEnvelope<T> = {
  data: T;
  timestamp: string;
  requestId?: string;
  path?: string;
};
