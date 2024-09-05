import winston from "winston";
import path from "path";
import "dotenv/config";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

type CustomLogger = {
  info: winston.LeveledLogMethod;
  debug: winston.LeveledLogMethod;
  on: (event: string, callback: () => void) => void;
  end: () => void;
};

export let bareLogger: CustomLogger | null = null;

/**
 * Get the logger instance. Using initializeLogger() instead of directly exporting the logger instance allows us to stub the environment variables in the tests.
 * @returns CustomLogger
 */
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

  const consoleLogFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.align(),
    winston.format.timestamp({ format: "DD/MM/YYYY HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => {
      if (typeof message === "object") {
        message = JSON.stringify(message, null, 2);
      }
      return `${timestamp} [${level}]: ${message} `;
    })
  );

  const logDir = process.env.LOG_FILE || "logs/default.log";

  bareLogger = winston.createLogger({
    level: logLevel,
    format: fileLogFormat,
    transports: [
      new winston.transports.File({ filename: logDir }),
      new winston.transports.Console({
        format: consoleLogFormat,
        silent: logLevel === "silent" || process.env.NODE_ENV === "testing"
      })
    ],
    silent: logLevel === "silent"
  }) as CustomLogger;
};

export const getLogger = () => {
  if (!bareLogger) {
    initializeLogger();
    if (!bareLogger) {
      throw new Error("Unable to initialize logger");
    }
  }
  return bareLogger;
}

export const reinitializeLogger = () => {
  bareLogger = null;
  initializeLogger();
  if (!bareLogger) {
    throw new Error("Unable to reinitialize logger");
  }
}

/**
 * Run Vitest tests and log the results in the specified format with a header "Testing Info".
 */

export const logTestResults = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const resultsPath = path.resolve(__dirname, "..", "test-results.json");
  const asyncExec = promisify(exec);
  try {
    await asyncExec("npm run test:script --silent");
    const file = await readFile(resultsPath, "utf-8")
    const results = JSON.parse(file);
    const totalTests = results.numTotalTests;
    const totalPassed = results.numPassedTests;

    const coverageSummary = await readFile(path.resolve(__dirname, "..", "coverage", "coverage-summary.json"), "utf-8");
    const coverage = JSON.parse(coverageSummary);
    const lineCoverage = coverage.total.lines.pct;

    console.log(`${totalPassed}/${totalTests} test cases passed. ${lineCoverage}% line coverage achieved.`);
  } catch (error) {
    getLogger().info("Error reading test results file", error);
  }
};
