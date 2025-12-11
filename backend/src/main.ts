import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Data, Effect } from 'effect';
import { AppModule } from './app.module';

const DEFAULT_PORT = 3000;
const PORT_KEY = 'PORT';

class InvalidPortError extends Data.TaggedError('InvalidPortError')<{
  readonly value: string;
}> {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.enableCors({
    origin: true,
    credentials: true,
  });
  const configService = app.get(ConfigService);
  setupSwagger(app);
  const port = resolvePort(configService.get<string>(PORT_KEY));
  await app.listen({ port, host: '0.0.0.0' });
}

function resolvePort(portValue?: string): number {
  return Effect.runSync(
    Effect.fromNullable(portValue).pipe(
      Effect.flatMap((value) =>
        Effect.try({
          try: () => Number(value),
          catch: () => new InvalidPortError({ value }),
        }),
      ),
      Effect.flatMap((parsed) =>
        Number.isNaN(parsed)
          ? Effect.fail(new InvalidPortError({ value: portValue ?? '' }))
          : Effect.succeed(parsed),
      ),
      Effect.catchAll(() => Effect.succeed(DEFAULT_PORT)),
    ),
  );
}

function setupSwagger(app: NestFastifyApplication): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LocalizeKit API')
    .setDescription('API documentation for LocalizeKit backend')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT access token',
      },
      'jwt',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true, docExpansion: 'list' },
  });
}

bootstrap();
