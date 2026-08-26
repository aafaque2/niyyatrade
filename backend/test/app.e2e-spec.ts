import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

type Json = Record<string, unknown>;

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/health (GET) should return health status', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as Json;
        expect(body).toHaveProperty('status');
        expect(['ok', 'degraded']).toContain(body.status);
        expect(body).toHaveProperty('db');
        expect(body).toHaveProperty('redis');
      });
  });

  it('/api/v1/health/live (GET) should return liveness', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200)
      .expect((res) => {
        expect((res.body as Json).status).toBe('ok');
      });
  });

  it('/api/v1/health/ready (GET) should return readiness', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(200)
      .expect((res) => {
        const body = res.body as Json;
        expect(body).toHaveProperty('status');
        expect(['ok', 'not_ready']).toContain(body.status);
      });
  });

  it('/api/v1/compliance (GET) should list frameworks', () => {
    return request(app.getHttpServer())
      .get('/api/v1/compliance')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray((res.body as Json).data)).toBe(true);
      });
  });
});
