
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
  };
  