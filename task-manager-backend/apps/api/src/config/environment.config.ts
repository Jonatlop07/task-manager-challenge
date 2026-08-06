import { registerAs } from '@nestjs/config';

const DEFAULT_APP_PORT = 3000;
const DEFAULT_DATABASE_PORT = 5432;
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
] as const;

export interface EnvironmentConfiguration {
  app: {
    port: number;
    corsOrigins: string[];
  };
  database: {
    connection:
      | Readonly<{ url: string }>
      | Readonly<{
          host: string;
          port: number;
          username: string;
          password: string;
          database: string;
        }>;
    ssl: boolean;
  };
}

function getRequiredVariable(
  environment: NodeJS.ProcessEnv,
  variableName: string,
): string {
  const value = environment[variableName]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }

  return value;
}

function parsePort(
  value: string | undefined,
  variableName: string,
  defaultValue: number,
): number {
  const port = Number(value ?? defaultValue);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${variableName} must be an integer between 1 and 65535`);
  }

  return port;
}

function parseBoolean(
  value: string | undefined,
  variableName: string,
): boolean {
  const normalizedValue = (value ?? 'false').toLowerCase();

  if (!['true', 'false'].includes(normalizedValue)) {
    throw new Error(`${variableName} must be either "true" or "false"`);
  }

  return normalizedValue === 'true';
}

function parseCorsOrigins(value: string | undefined): string[] {
  const origins = value
    ? value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [...DEFAULT_CORS_ORIGINS];

  if (origins.length === 0) {
    throw new Error('CORS_ORIGINS must contain at least one origin');
  }

  for (const origin of origins) {
    const url = new URL(origin);

    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
      throw new Error(`Invalid CORS origin: ${origin}`);
    }
  }

  return origins;
}

function parseDatabaseConnection(
  environment: NodeJS.ProcessEnv,
): EnvironmentConfiguration['database']['connection'] {
  const connectionString = environment.DATABASE_URL?.trim();

  if (connectionString) {
    let url: URL;

    try {
      url = new URL(connectionString);
    } catch {
      throw new Error('DATABASE_URL must be a valid PostgreSQL URL');
    }

    if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
      throw new Error('DATABASE_URL must use the postgres protocol');
    }

    return { url: connectionString };
  }

  return {
    host: getRequiredVariable(environment, 'DB_HOST'),
    port: parsePort(environment.DB_PORT, 'DB_PORT', DEFAULT_DATABASE_PORT),
    username: getRequiredVariable(environment, 'DB_USERNAME'),
    password: getRequiredVariable(environment, 'DB_PASSWORD'),
    database: getRequiredVariable(environment, 'DB_DATABASE'),
  };
}

export function loadEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): EnvironmentConfiguration {
  return {
    app: {
      port: parsePort(environment.PORT, 'PORT', DEFAULT_APP_PORT),
      corsOrigins: parseCorsOrigins(environment.CORS_ORIGINS),
    },
    database: {
      connection: parseDatabaseConnection(environment),
      ssl: parseBoolean(environment.DB_SSL, 'DB_SSL'),
    },
  };
}

export const environmentConfig = registerAs('environment', loadEnvironment);
