// Environment variables — loaded before test framework (setupFiles)
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://tmis_user:tmis_password@localhost:5432/tmis_db';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-chars-minimum!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-minimum!';
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
