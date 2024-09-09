import winston from "winston";
import path from "path";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import "dotenv/config";

type CustomLogger = {
  info: winston.LeveledLogMethod;
  debug: winston.LeveledLogMethod;
};

let bareLogger: CustomLogger | null = null;

const initializeLogger = () => {
  const logLevel = (() => {
    const level = process.env.LOG_LEVEL;
    switch (level) {
      case "1":
        return "info";
      case "2":
        return "debug";
      default:
        return "silent";
    }
  })();

  const fileLogFormat = winston.format.combine(
    winston.format.timestamp({ format: "DD/MM/YYYY HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => {
      if (typeof message === "object") {
        message = JSON.stringify(message, null, 2);
      }
      return `${timestamp} [${level}]: ${message}`;
    })
  );

  const logDir = process.env.LOG_FILE || "logs/default.log";

  bareLogger = winston.createLogger({
    level: logLevel,
    format: fileLogFormat,
    transports: [new winston.transports.File({ filename: logDir })],
    silent: logLevel === "silent"
  }) as CustomLogger;
};

/**
 * Get the logger instance. If the logger has not been initialized, initialize it.
 * @returns CustomLogger
 */
export const getLogger = () => {
  if (!bareLogger) {
    initializeLogger();
    if (!bareLogger) {
      throw new Error("Unable to initialize logger");
    }
  }
  return bareLogger;
};

/**
 * Reinitialize the logger instance. This is useful for tests where the environment variables need to be refrshed.
 */
export const reinitializeLogger = () => {
  bareLogger = null;
  initializeLogger();
  if (!bareLogger) {
    throw new Error("Unable to reinitialize logger");
  }
};

/**
 * Run Vitest tests and log the results.
 */
export const logTestResults = async () => {
  const logger = getLogger();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const asyncExec = promisify(exec);
  // avoid running index.test.ts in E2E tests to prevent infinite loop
  const command =
    process.env.NODE_ENV === "test"
      ? "npx vitest run --coverage --silent --reporter=json --outputFile=coverage/test-results.json --exclude src/__tests__/index.test.ts"
      : "npx vitest run --silent";
  try {
    await asyncExec(command).catch((error) => {
      logger.debug(
        "Error running tests, most likely due to failing tests of coverage thresholds not being met.",
        error
      );
    });
    const file = await readFile(path.resolve(__dirname, "..", "coverage", "test-results.json"), "utf-8");
    const results = JSON.parse(file);
    const totalTests = results.numTotalTests;
    const totalPassed = results.numPassedTests;
    const coverageSummary = await readFile(path.resolve(__dirname, "..", "coverage", "coverage-summary.json"), "utf-8");
    const coverage = JSON.parse(coverageSummary);
    const lineCoverage = coverage.total.lines.pct;
    console.log(`Total: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Coverage: ${lineCoverage}%`);
    console.log(`${totalPassed}/${totalTests} test cases passed. ${lineCoverage}% line coverage achieved.`);
  } catch (error) {
    logger.debug(error);
    throw error;
  }
};
