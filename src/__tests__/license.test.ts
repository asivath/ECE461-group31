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
    graphqlClient.request = vi.fn().mockResolvedValue({
      repository: {
        licenseInfo: {
          spdxId: "MIT"
        }
      }
    });

    fs.readFile = vi.fn().mockResolvedValue("");

    const result = await calculateLicenseScore("owner", "repo");
    expect(result).toBe(1);
  });

  it("should return 1 when the license is found in README.md", async () => {
    (graphqlClient.request as Mock).mockResolvedValue({
      repository: {
        licenseInfo: {
          spdxId: null
        }
      }
    });

    (cloneRepo as Mock).mockResolvedValue("/mock/repo/dir");
    (fs.readFile as Mock).mockResolvedValue("This project is licensed under the MIT License.");

    const result = await calculateLicenseScore("owner", "repo");
    expect(result).toBe(1);
  });

  it("should return 0 when no license is found in GraphQL or README.md", async () => {
    graphqlClient.request = vi.fn().mockResolvedValue({
      repository: {
        licenseInfo: {
          spdxId: null
        }
      }
    });

    fs.readFile = vi.fn().mockResolvedValue("Some content without any license information.");

    const result = await calculateLicenseScore("owner", "repo");
    expect(result).toBe(0);
  });

  it("should handle errors in GraphQL request", async () => {
    graphqlClient.request = vi.fn().mockRejectedValue(new Error("GraphQL request failed"));

    fs.readFile = vi.fn().mockResolvedValue("");

    const result = await calculateLicenseScore("owner", "repo");
    expect(result).toBe(0);
  });

  it("should handle errors in README.md file reading", async () => {
    graphqlClient.request = vi.fn().mockResolvedValue({
      repository: {
        licenseInfo: {
          spdxId: null
        }
      }
    });

    fs.readFile = vi.fn().mockRejectedValue(new Error("README.md not found"));

    const result = await calculateLicenseScore("owner", "repo");
    expect(result).toBe(0);
  });
});
