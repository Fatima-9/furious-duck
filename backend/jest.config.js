const coverageMin = Number(process.env.COVERAGE_MIN || 0);

module.exports = {
  testEnvironment: "node",
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
  coveragePathIgnorePatterns: ["/node_modules/", "/coverage/"],
  ...(coverageMin
    ? {
        coverageThreshold: {
          global: {
            lines: coverageMin,
          },
        },
      }
    : {}),
};
