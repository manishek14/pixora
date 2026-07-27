/**
 * Global Jest setup — runs before every test file.
 *
 * Forces a clean, in-memory SQLite database for every test run so unit &
 * e2e tests never touch the developer's ./data/lenz.db file.
 *
 * Tests should NOT spin up the real AppModule unless they explicitly override
 * these env vars. For module-level overrides, see test/e2e/app.e2e-spec.ts.
 */
process.env.NODE_ENV = 'test';
process.env.DB_TYPE = 'better-sqlite3';
process.env.DB_PATH = ':memory:';
process.env.DB_LOG = 'false';
process.env.PORT = '0'; // 0 = let Nest pick an ephemeral port for supertest
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_TTL = '15m';
process.env.JWT_REFRESH_TTL = '7d';
process.env.UPLOAD_DIR = './test-uploads';
process.env.MAX_FILE_SIZE = '5000000';
