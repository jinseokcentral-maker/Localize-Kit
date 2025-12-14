import { BadRequestException, Controller, Get } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { GlobalExceptionFilter } from '../src/common/errors/global-exception.filter';
import {
  InvalidTokenError,
  InvalidTeamError,
  ProviderAuthError,
} from '../src/auth/errors/auth.errors';
import { UnauthorizedError } from '../src/common/errors/unauthorized-error';
import { PersonalTeamNotFoundError } from '../src/user/errors/user.errors';
import { ForbiddenProjectAccessError } from '../src/project/errors/project.errors';

@Controller()
class RootController {
  @Get()
  health(): string {
    return 'OK';
  }
}

@Controller('test-errors')
class TestErrorController {
  @Get('provider-auth')
  providerAuth(): void {
    throw new ProviderAuthError('Database connection failed');
  }

  @Get('invalid-token')
  invalidToken(): void {
    throw new InvalidTokenError({ reason: 'Token expired' });
  }

  @Get('unauthorized')
  unauthorized(): void {
    throw new UnauthorizedError({ reason: 'Missing token' });
  }

  @Get('invalid-team')
  invalidTeam(): void {
    throw new InvalidTeamError({ teamId: 'team-123' });
  }

  @Get('project-forbidden')
  projectForbidden(): void {
    throw new ForbiddenProjectAccessError({
      plan: 'free',
      currentCount: 2,
      limit: 1,
    });
  }

  @Get('plain-error')
  plainError(): void {
    throw new Error('Something went wrong');
  }

  @Get('plain-object')
  plainObject(): void {
    throw { foo: 'bar' };
  }

  @Get('http-exception')
  httpException(): void {
    throw new BadRequestException('bad request');
  }

  @Get('jwt-expired')
  jwtExpired(): void {
    throw new Error('JWT expired');
  }

  @Get('personal-team-missing')
  personalTeamMissing(): void {
    throw new PersonalTeamNotFoundError({ userId: 'user-99' });
  }
}

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RootController, TestErrorController],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.useGlobalFilters(
      new GlobalExceptionFilter({
        error: () => {
          // no-op logger for tests
        },
      }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  it('/ (GET)', async () => {
    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('OK');
  });

  it('/test-errors/provider-auth returns 500 via ErrorMapper', async () => {
    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/test-errors/provider-auth',
    });
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.message).toContain('Provider authentication failed');
    expect(body.message).toContain('Database connection failed');
  });

  it('/test-errors/invalid-token returns 401 via ErrorMapper', async () => {
    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/test-errors/invalid-token',
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.message).toContain('Invalid token');
    expect(body.message).toContain('Token expired');
  });

  it('/test-errors/unauthorized returns 401 for UnauthorizedError', async () => {
    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/test-errors/unauthorized',
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.message).toContain('Invalid token');
    expect(body.message).toContain('Missing token');
  });

  it('/test-errors/invalid-team returns 400 BadRequest', async () => {
    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/test-errors/invalid-team',
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toContain('Invalid team ID: team-123');
  });

  it('/test-errors/project-forbidden returns 403 Forbidden', async () => {
    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/test-errors/project-forbidden',
    });
    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.message).toBe(
      'Project limit exceeded. Your free plan allows 1 project, and you currently have 2.',
    );
  });

  it('/test-errors/plain-error returns 500 InternalServerError', async () => {
    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/test-errors/plain-error',
    });
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.message).toBe('Something went wrong');
  });

  it('/test-errors/plain-object returns 500 InternalServerError', async () => {
    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/test-errors/plain-object',
    });
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.message).toBe('Internal server error');
  });

  it('/test-errors/http-exception preserves HttpException', async () => {
    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/test-errors/http-exception',
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toBe('bad request');
  });

  it('/test-errors/jwt-expired returns 401', async () => {
    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/test-errors/jwt-expired',
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.message.toLowerCase()).toContain('jwt token expired');
  });

  it('/test-errors/personal-team-missing returns 500', async () => {
    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/test-errors/personal-team-missing',
    });
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.message).toContain('Personal team not found for user');
    expect(body.message).toContain('user-99');
  });

  afterEach(async () => {
    await app.close();
  });
});
