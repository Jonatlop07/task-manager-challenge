import { registerAs } from '@nestjs/config';

const DEFAULT_APP_PORT = 3000;
const DEFAULT_DATABASE_PORT = 5432;

export interface EnvironmentConfiguration {
  app: {
    port: number;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
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

export function loadEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): EnvironmentConfiguration {
  return {
    app: {
      port: parsePort(environment.PORT, 'PORT', DEFAULT_APP_PORT),
    },
    database: {
      host: getRequiredVariable(environment, 'DB_HOST'),
      port: parsePort(environment.DB_PORT, 'DB_PORT', DEFAULT_DATABASE_PORT),
      username: getRequiredVariable(environment, 'DB_USERNAME'),
      password: getRequiredVariable(environment, 'DB_PASSWORD'),
      name: getRequiredVariable(environment, 'DB_DATABASE'),
      ssl: parseBoolean(environment.DB_SSL, 'DB_SSL'),
    },
  };
}

export const environmentConfig = registerAs('environment', loadEnvironment);
