/*
 * This file contains end-to-end tests for the CLI.
 * It tests the CLI commands and their output.
 * As much as possible, avoid mocking and use the actual implementation because this is an end-to-end test.
 */
import { promisify } from "util";
import { exec } from "child_process";
import { describe, it, expect, vi, afterAll } from "vitest";
import path from "path";
import fs from "fs/promises";
import { calculateNetScore } from "../metrics/netScore.ts";

type ExecError = {
  stdout: string;
  stderr: string;
  code: number;
  signal: string | null;
  cmd: string;
} & Error;

// Cleanup created files after tests
afterAll(async () => {
  await fs.rm(path.join(__dirname, "test-files"), { recursive: true, force: true });
});

describe("E2E Test", () => {
  const execAsync = promisify(exec);
  const testDir = path.join(__dirname, "test-files");

  it('should run "./run test" and output results', { timeout: 10000 }, async () => {
    const { stdout } = await execAsync("./run test", { env: { ...process.env, NODE_ENV: "test" } });

    expect(stdout).toContain("Total:");
    expect(stdout).toContain("Passed:");
    expect(stdout).toContain("Coverage:");

    const totalMatches = stdout.match(/Total: (\d+)/);
    const passedMatches = stdout.match(/Passed: (\d+)/);
    const coverageMatches = stdout.match(/Coverage: (\d+\.\d+)%/);

    if (totalMatches && passedMatches && coverageMatches) {
      const totalTests = parseInt(totalMatches[1], 10);
      const totalPassed = parseInt(passedMatches[1], 10);
      const lineCoverage = parseFloat(coverageMatches[1]);

      // Instead of being smart and actually trying to calculate the actual values (we would need to subtact the index.test.ts tests), we will just hardcode it, so these needs to be updated if the tests are updated
      // Don't get the values from ./run test (would defeat the purpose of this test), run the tests using npm run test and get the values from there and get coverage from npm run test:coverage
      expect(totalTests).toBe(48);
      expect(totalPassed).toBe(48);
      expect(lineCoverage).toBe(94.99);
    }
  });

  it("should calculate a netscore", async () => {
    await fs.mkdir(testDir, { recursive: true });

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    ////////REPLACE WITH ACTUAL EXPECTED VALUES///////
    const expected = {
      URL: "https://github.com/cloudinary/cloudinary_npm",
      NetScore: -0.11,
      NetScore_Latency: -1,
      RampUp: 0.27,
      RampUp_Latency: -1,
      Correctness: -1,
      Correctness_Latency: -1,
      BusFactor: -1,
      BusFactor_Latency: -1,
      ResponsiveMaintainer: 0.09,
      ResponsiveMaintainer_Latency: -1,
      License: 1,
      License_Latency: -1
    };
    const filePath = path.join(testDir, "sampleURL.txt");

    await fs.writeFile(filePath, `https://github.com/cloudinary/cloudinary_npm`);

    await calculateNetScore(filePath);

    expect(consoleSpy).toHaveBeenCalledWith(expected);
  }, 50000);

  it("should fail with no command provided", async () => {
    try {
      await execAsync("./run");
      throw new Error("Expected the script to exit with code 1 but it did not");
    } catch (error) {
      const { stdout, code } = error as ExecError;
      expect(stdout).toBe("No command entered\n");
      expect(code).toBe(1);
    }
  });
});
