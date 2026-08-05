import { config as loadDotEnv } from 'dotenv';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { loadEnvironment } from './environment.config';

loadDotEnv({
  path: resolve(process.cwd(), '.env'),
});

const environment = loadEnvironment();
const migrationExtension = __filename.endsWith('.ts') ? 'ts' : 'js';
const migrationsRoot = __filename.endsWith('.ts') ? '' : 'dist/';

export default new DataSource({
  type: 'postgres',
  host: environment.database.host,
  port: environment.database.port,
  username: environment.database.username,
  password: environment.database.password,
  database: environment.database.name,
  ssl: environment.database.ssl,
  synchronize: false,
  migrationsRun: false,
  migrationsTableName: 'migrations',
  migrationsTransactionMode: 'all',
  migrations: [
    resolve(
      process.cwd(),
      `${migrationsRoot}libs/*/src/infrastructure/persistence/postgres/typeorm/migrations/*.${migrationExtension}`,
    ),
  ],
});
