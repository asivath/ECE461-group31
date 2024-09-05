import { describe, it, expect, vi, afterEach, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "fs/promises";
import path from "path";
import { getLogger, reinitializeLogger } from "../logger.ts";

const logFilePath = path.join("src", "__tests__", "logs", "test.log");

beforeAll(() => {
  const mockDate = new Date(2021, 1, 1);
  vi.setSystemTime(mockDate);
  process.env.LOG_LEVEL = "2";
  process.env.LOG_FILE = logFilePath;
  process.env.NODE_ENV = "testing";
});

afterAll(async () => {
  await fs.rm(path.join("src", "__tests__", "logs"), { recursive: true, force: true });
});

describe("Logger Tests", () => {
  let logger = getLogger();
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    reinitializeLogger();
    logger = getLogger();
    debugSpy = vi.spyOn(logger, "debug");
    infoSpy = vi.spyOn(logger, "info");
    await fs.writeFile(logFilePath, "");
  });

  afterEach(() => {
    debugSpy.mockClear();
    infoSpy.mockClear();
  });

  it("Should log a debug message when logger.debug is called", async () => {
    const logMessage = "This is a debug message";

    logger.debug(logMessage);

    expect(debugSpy).toHaveBeenCalledWith(logMessage);
    expect(infoSpy).not.toHaveBeenCalled();

    const logContents = await fs.readFile(logFilePath, "utf-8");
    expect(logContents).toBe(`01/02/2021 00:00:00 [debug]: ${logMessage}\n`);
  });

  it("Should log an info message when logger.info is called", async () => {
    const logMessage = "This is an info message";

    logger.info(logMessage);

    const logContents = await fs.readFile(logFilePath, "utf-8");
    expect(logContents).toBe(`01/02/2021 00:00:00 [info]: ${logMessage}\n`);
    expect(infoSpy).toHaveBeenCalledWith(logMessage);
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it("should not log a debug message and log an info message when log level is 1", async () => {
    process.env.LOG_LEVEL = "1";
    reinitializeLogger();
    logger = getLogger();

    logger.debug("This is a debug message");
    logger.info("This is an info message");

    const logContents = await fs.readFile(logFilePath, "utf-8");
    expect(logContents).toBe(`01/02/2021 00:00:00 [info]: This is an info message\n`);
  });

  it("should not log a debug or info message when log level is 0", async () => {
    process.env.LOG_LEVEL = "0";
    reinitializeLogger();
    logger = getLogger();

    logger.debug("This is a debug message");
    logger.info("This is an info message");

    const logContents = await fs.readFile(logFilePath, "utf-8");
    expect(logContents).toBe("");
  });
});
