import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from '../config/env';

beforeAll(async () => {
  // Set testing environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_secret';

  // We use the same cluster but a different database (gmboutique_test) to avoid messing up production data
  const testUri = env.MONGODB_URI.replace('/gmboutique?', '/gmboutique_test?');
  
  await mongoose.connect(testUri);
});

afterAll(async () => {
  // Disconnect and stop the server after all tests
  await mongoose.disconnect();
});

afterEach(async () => {
  // Clear all data after each test to ensure isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
