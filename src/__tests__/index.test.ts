/*
 * This file contains end-to-end tests for the CLI.
 * It tests the CLI commands and their output.
 * As much as possible, avoid mocking and use the actual implementation because this is an end-to-end test.
 */
import { promisify } from "util";
import { exec } from "child_process";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

type ExecError = {
  stdout: string;
  stderr: string;
  code: number;
  signal: string | null;
  cmd: string;
} & Error;

describe("E2E Test", () => {
  const execAsync = promisify(exec);
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "e2e-test-"));
    const packageJsonPath = path.resolve(__dirname, "..", "..", "package.json");
    const tmpPackageJsonPath = path.join(tmpDir, "package.json");
    await fs.copyFile(packageJsonPath, tmpPackageJsonPath);
    const scriptPath = path.resolve(__dirname, "..", "..", "run");
    const tmpScriptPath = path.join(tmpDir, "run");
    await fs.copyFile(scriptPath, tmpScriptPath);
    const nodeModulesPath = path.join(__dirname, "..", "..", "node_modules");
    const tmpNodeModulesPath = path.join(tmpDir, "node_modules");
    await fs.cp(nodeModulesPath, tmpNodeModulesPath, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should install dependencies using the "install" command', { timeout: 10000 }, async () => {
    const { stdout, stderr } = await execAsync("./run install", { cwd: tmpDir });

    expect(stderr).toBe("");
    expect(stdout).toContain("Dependencies installed successfully");

    const nodeModulesPath = path.join(tmpDir, "node_modules");
    const nodeModulesExists = await fs
      .stat(nodeModulesPath)
      .then(() => true)
      .catch(() => false);
    expect(nodeModulesExists).toBe(true);

    const packageJsonPath = path.resolve(tmpDir, "package.json");
    const packageJson = await fs.readFile(packageJsonPath, "utf-8");
    const parsedPackageJson = JSON.parse(packageJson);
    const expectedDependencies = Object.keys(parsedPackageJson.dependencies || {});
    for (const dependency of expectedDependencies) {
      const dependencyPath = path.join(nodeModulesPath, dependency);
      const dependencyExists = await fs
        .stat(dependencyPath)
        .then(() => true)
        .catch(() => false);
      expect(dependencyExists).toBe(true);
    }
  });

  it('should run tests "test" command', async () => {
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
      expect(totalTests).toBe(21);
      expect(totalPassed).toBe(21);
      expect(lineCoverage).toBe(93.47);
    }
  });

  it("should process a URL file with a default command", async () => {
    const { stdout, stderr } = await execAsync("./run myFile.txt");

    expect(stderr).toBe("");
    expect(stdout).toContain("Command not implemented for:  myFile.txt");
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
