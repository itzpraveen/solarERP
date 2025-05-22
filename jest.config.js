module.exports = {
  testEnvironment: 'node', // Ensure this is set
  roots: ['<rootDir>/src', '<rootDir>/client-new/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  setupFilesAfterEnv: ['./src/api/tests/jest.setup.js'], // path relative to root
};
