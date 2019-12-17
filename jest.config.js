module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!**/__tests__/**'],
	coverageReporters: ['json', 'lcov', 'text', 'clover', 'cobertura'],
	testMatch: ['**/__tests__/**/*.spec.[jt]s?(x)'],
}
