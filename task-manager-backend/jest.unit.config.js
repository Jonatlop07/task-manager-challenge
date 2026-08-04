module.exports = {
  displayName: 'unit',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.unit-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@api/(.*)$': '<rootDir>/apps/api/src/$1',
    '^@project/(.*)$': '<rootDir>/libs/project/src/$1',
    '^@task/(.*)$': '<rootDir>/libs/task/src/$1',
    '^@shared$': '<rootDir>/libs/shared/src',
    '^@shared/(.*)$': '<rootDir>/libs/shared/src/$1',
  },
  testEnvironment: 'node',
};
