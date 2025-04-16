module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/client-new/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node']
};