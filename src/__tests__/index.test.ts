/*
  * This file contains end-to-end tests for the CLI.
  * It tests the CLI commands and their output.
  * As much as possible, avoid mocking and use the actual implementation because this is an end-to-end test.
*/
import { promisify } from "util";
import { exec } from "child_process";
import { readFile } from "fs/promises";
import { describe, it, expect, vi } from "vitest";
import * as loggerModule from "../logger.ts";

const execAsync = promisify(exec);

describe("E2E Test", () => {
  // it('should install dependencies using the "install" command', async () => {
  //   const { stdout, stderr } = await execAsync("./run install");
  //   expect(stderr).toBe("");
  //   expect(stdout).toContain("Dependencies installed successfully");
  // });

  it('should run tests and delete the coverage directory using the "test" command', async () => {
    const logTestResultsSpy = vi.spyOn(loggerModule, "logTestResults");
    const infoSpy = vi.spyOn(loggerModule.getLogger(), "info");

    const { stdout } = await execAsync("./run test", { env: { ...process.env, NODE_ENV: "test" } });

    console.log(stdout);

    // expect(infoSpy).toHaveBeenCalledWith("Running tests");
    expect(logTestResultsSpy).toHaveBeenCalledOnce();
    try {
      await readFile("coverage/test-results.json", "utf-8");
      throw new Error("Coverage directory should have been removed");
    } catch (err) {
      expect((err as Error).message).toBe("ENOENT");
    }
  });

  // it("should process a URL file with a default command", async () => {
  //   const { stdout, stderr } = await execAsync("./run run myFile.txt");

  //   expect(stderr).toBe("");
  //   expect(stdout).toContain("Processing URL file");
  //   expect(stdout).toContain("Command not implemented for: run");
  // });

  // it("should fail with no command provided", async () => {
  //   const { stdout, stderr } = await execAsync("./run");

  //   expect(stderr).toContain("No command entered");
  //   expect(stdout).toBe("");
  // });
});
