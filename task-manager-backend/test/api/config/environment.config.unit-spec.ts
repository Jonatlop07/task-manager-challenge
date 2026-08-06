import { loadEnvironment } from '@api/config/environment.config';

describe('loadEnvironment', () => {
  const localDatabaseEnvironment = {
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_USERNAME: 'admin',
    DB_PASSWORD: 'pass',
    DB_DATABASE: 'task_manager',
    DB_SSL: 'false',
  };

  it('loads separate database variables for local development', () => {
    const config = loadEnvironment(localDatabaseEnvironment);

    expect(config.database).toEqual({
      connection: {
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'pass',
        database: 'task_manager',
      },
      ssl: false,
    });
  });

  it('prefers the Render database URL when it is present', () => {
    const databaseUrl =
      'postgresql://task_manager:secret@render-database:5432/task_manager';

    const config = loadEnvironment({
      ...localDatabaseEnvironment,
      DATABASE_URL: databaseUrl,
    });

    expect(config.database).toEqual({
      connection: { url: databaseUrl },
      ssl: false,
    });
  });

  it.each([
    ['not-a-url', 'DATABASE_URL must be a valid PostgreSQL URL'],
    [
      'https://example.com/database',
      'DATABASE_URL must use the postgres protocol',
    ],
  ])('rejects the invalid database URL %s', (databaseUrl, message) => {
    expect(() =>
      loadEnvironment({
        ...localDatabaseEnvironment,
        DATABASE_URL: databaseUrl,
      }),
    ).toThrow(message);
  });
});
