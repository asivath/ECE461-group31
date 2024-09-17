import { describe, it, expect, vi, Mock, beforeEach } from "vitest";
import { cloneRepo, isValidFilePath } from "../util.ts";
import fs from "fs/promises";
import { simpleGit } from "simple-git";
import { getLogger } from "../logger.ts";
import path from "path";
import { fileURLToPath } from "url";

vi.mock("fs/promises");
vi.mock("simple-git");
vi.mock("../logger.ts", () => {
  return {
    getLogger: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn()
    })
  };
});

describe("cloneRepo", () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoUrl = "https://github.com/user/repo.git";
  const repoName = "repo";
  const expectedRepoDir = path.resolve(__dirname, "..", "..", "repos", repoName);
  const logger = getLogger();
  const mkdirSpy = vi.spyOn(fs, "mkdir");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should clone a repository to the specified directory", async () => {
    const gitClone = vi.fn().mockResolvedValue(undefined);
    (simpleGit as Mock).mockReturnValue({ clone: gitClone });

    const repoDir = await cloneRepo(repoUrl, repoName);

    expect(logger.info).toHaveBeenCalledWith(`Repository cloned to ${expectedRepoDir}`);
    expect(repoDir).toBe(expectedRepoDir);
    expect(mkdirSpy).toHaveBeenCalledWith(expectedRepoDir, { recursive: true });
    expect(gitClone).toHaveBeenCalledWith(repoUrl, expectedRepoDir);
  });

  it("should return the directory if the repository is already cloned", async () => {
    const gitClone = vi.fn().mockRejectedValue(new Error("already exists"));
    (simpleGit as Mock).mockReturnValue({ clone: gitClone });
    vi.mocked(fs.mkdir).mockRejectedValueOnce(new Error("already exists"));

    const repoDir = await cloneRepo(repoUrl, repoName);

    expect(repoDir).toBe(expectedRepoDir);
    expect(mkdirSpy).toHaveBeenCalledWith(expectedRepoDir, { recursive: true });
    expect(gitClone).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(`Repository already cloned to ${expectedRepoDir}`);
  });

  it("should return null if there is an error other than 'already exists'", async () => {
    const gitClone = vi.fn().mockRejectedValueOnce(new Error("some other error"));
    (simpleGit as Mock).mockReturnValueOnce({ clone: gitClone });

    const repoDir = await cloneRepo(repoUrl, repoName);

    expect(repoDir).toBeNull();
    expect(logger.info).toHaveBeenCalledWith("Error cloning repository:", expect.any(Error));
  });

  it("should return null if the file path is invalid", async () => {
    const invalidRepoName = "..";
    const repoDir = await cloneRepo(repoUrl, invalidRepoName);

    expect(repoDir).toBeNull();
    expect(logger.info).toHaveBeenCalledWith("Invalid file path");
    expect(mkdirSpy).not.toHaveBeenCalled();
  });
});

describe("isValidFilePath", async () => {
  it("should return true for valid file paths", () => {
    expect(isValidFilePath("/path/to/file")).toBe(true);
    expect(isValidFilePath("C:\\path\\to\\file")).toBe(true);
  });

  it("should return false for invalid file paths", () => {
    expect(isValidFilePath("../path/to/file")).toBe(false);
    expect(isValidFilePath("../../cwd/password")).toBe(false);
  });
});
