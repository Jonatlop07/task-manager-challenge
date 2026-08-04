module.exports = {
  displayName: 'unit',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.unit-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@accounting/(.*)$': '<rootDir>/libs/accounting/src/$1',
    '^@api/(.*)$': '<rootDir>/apps/api/src/$1',
    '^@project/(.*)$': '<rootDir>/apps/project/src/$1',
    '^@task/(.*)$': '<rootDir>/apps/task/src/$1',
    '^@shared$': '<rootDir>/libs/shared/src',
    '^@shared/(.*)$': '<rootDir>/libs/shared/src/$1',
  },
  testEnvironment: 'node',
};
