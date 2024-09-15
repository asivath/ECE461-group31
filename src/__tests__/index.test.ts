/*
 * This file contains end-to-end tests for the CLI.
 * It tests the CLI commands and their output.
 * As much as possible, avoid mocking and use the actual implementation because this is an end-to-end test.
 */
import { promisify } from "util";
import { exec } from "child_process";
import { describe, it, expect } from "vitest";

type ExecError = {
  stdout: string;
  stderr: string;
  code: number;
  signal: string | null;
  cmd: string;
} & Error;

describe("E2E Test", () => {
  const execAsync = promisify(exec);

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
      expect(totalTests).toBe(40);
      expect(totalPassed).toBe(40);
      expect(lineCoverage).toBe(95.84);
    }
  });

  it("should process a URL file with a default command", async () => {
    const { stdout, stderr } = await execAsync("./run myFile.txt");

    expect(stderr).toBe("");
    expect(stdout).toContain("Command TBD");
  });

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
