import { HealthController } from '@api/interfaces/http/health/health.controller';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

describe('Health HTTP API', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    app = testingModule.createNestApplication();
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('responds with the service health', async () => {
    const response = await request(server).get('/health').expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });
});
