import * as Joi from 'joi';

export const envValidation = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),

  // Database
  DB_TYPE: Joi.string().valid('postgres', 'sqlite', 'better-sqlite3').default('better-sqlite3'),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().default('lenz'),
  DB_USER: Joi.string().default('postgres'),
  DB_PASS: Joi.string().default('postgres'),
  DB_PATH: Joi.string().default('./data/lenz.db'),
  DB_LOG: Joi.string().valid('true', 'false').default('false'),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().default('lenz-access-secret-change-me'),
  JWT_REFRESH_SECRET: Joi.string().default('lenz-refresh-secret-change-me'),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),

  // Upload
  UPLOAD_DIR: Joi.string().default('./uploads'),
  MAX_FILE_SIZE: Joi.number().default(50_000_000),

  // Allowed client origin for CORS (any GraphQL/REST client).
  // The backend currently accepts all origins (`origin: true` in main.ts), but
  // this is kept for production hardening.
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
});
