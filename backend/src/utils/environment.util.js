import * as dotenv from 'dotenv';
dotenv.config();

export const getEnvironmentVariable = (
  variableName,
  defaultValue,
) => {
  const environment = process.env[variableName];

  if (!environment) {
    if (!defaultValue) {
      throw new Error(`Missing environment variable: ${variableName}`);
    }

    return defaultValue;
  }

  return environment;
};