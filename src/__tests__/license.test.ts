import { describe, it, expect, vi, Mock, beforeEach } from "vitest";
import { calculateLicenseScore } from "../metrics/license.ts"; // Adjust the import path
import { graphqlClient } from "../graphqlClient.ts";
import { cloneRepo } from "../util.ts";
import fs from "fs/promises";

vi.mock("../graphqlClient.ts");
vi.mock("../util.ts");
vi.mock("fs/promises");

describe("calculateLicenseScore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 1 when the license is found in GraphQL response", async () => {
    // Mock GraphQL response
    graphqlClient.request = vi.fn().mockResolvedValue({
      repository: {
        licenseInfo: {
          spdxId: "MIT"
        }
      }
    });

    // Mock cloneRepo and fs.readFile
    // const cloneRepoMock = vi.fn().mockResolvedValue("/mock/repo/dir");
    fs.readFile = vi.fn().mockResolvedValue("");

    const result = await calculateLicenseScore("owner", "repo");
    expect(result).toBe(1);
  });

  it("should return 1 when the license is found in README.md", async () => {
    // Mock GraphQL response to return null
    (graphqlClient.request as Mock).mockResolvedValue({
      repository: {
        licenseInfo: {
          spdxId: null
        }
      }
    });

    // Mock cloneRepo to return a valid directory
    (cloneRepo as Mock).mockResolvedValue("/mock/repo/dir");
    // Mock fs.readFile to return README content
    (fs.readFile as Mock).mockResolvedValue("This project is licensed under the MIT License.");

    const result = await calculateLicenseScore("owner", "repo");
    expect(result).toBe(1);
  });

  it("should return 0 when no license is found in GraphQL or README.md", async () => {
    // Mock GraphQL response to return null
    graphqlClient.request = vi.fn().mockResolvedValue({
      repository: {
        licenseInfo: {
          spdxId: null
        }
      }
    });

    // Mock cloneRepo to return a valid directory and fs.readFile to return non-matching content
    // const cloneRepoMock = vi.fn().mockResolvedValue("/mock/repo/dir");
    fs.readFile = vi.fn().mockResolvedValue("Some content without any license information.");

    const result = await calculateLicenseScore("owner", "repo");
    expect(result).toBe(0);
  });

  it("should handle errors in GraphQL request", async () => {
    // Mock GraphQL request to throw an error
    graphqlClient.request = vi.fn().mockRejectedValue(new Error("GraphQL request failed"));

    // Mock cloneRepo and fs.readFile
    // const cloneRepoMock = vi.fn().mockResolvedValue("/mock/repo/dir");
    fs.readFile = vi.fn().mockResolvedValue("");

    const result = await calculateLicenseScore("owner", "repo");
    expect(result).toBe(0);
  });

  it("should handle errors in README.md file reading", async () => {
    // Mock GraphQL response to return null
    graphqlClient.request = vi.fn().mockResolvedValue({
      repository: {
        licenseInfo: {
          spdxId: null
        }
      }
    });

    // Mock cloneRepo to return a valid directory
    // const cloneRepoMock = vi.fn().mockResolvedValue("/mock/repo/dir");
    fs.readFile = vi.fn().mockRejectedValue(new Error("README.md not found"));

    const result = await calculateLicenseScore("owner", "repo");
    expect(result).toBe(0);
  });
});
