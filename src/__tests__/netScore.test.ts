import { describe, it, expect, vi } from "vitest";
import { calculateNetScore } from "../metrics/netScore.ts"; // adjust this based on your file structure
import { calculateLicenseScore } from "../metrics/license.ts";
import { calculateRampUpScore } from "../metrics/rampUp.ts";
import { calculateResponsiveMaintainerScore } from "../metrics/responsiveMaintainer.ts";
import { calculateCorrectness } from "../metrics/correctness.ts";
import { calculateBusFactorScore } from "../metrics/busFactor.ts";
import { processURLs } from "../processURL.ts";
import { getLogger } from "../logger.ts";
import { beforeEach } from "node:test";

// Mock the logger
vi.mock("../logger.ts", () => {
  return {
    getLogger: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn(),
      console: vi.fn()
    })
  };
});

// Mock external functions
vi.mock("../metrics/license.ts", () => ({
  calculateLicenseScore: vi.fn().mockResolvedValue(1)
}));

vi.mock("../metrics/rampUp.ts", () => ({
  calculateRampUpScore: vi.fn().mockResolvedValue(1)
}));

vi.mock("../metrics/responsiveMaintainer.ts", () => ({
  calculateResponsiveMaintainerScore: vi.fn().mockResolvedValue(1)
}));

vi.mock("../metrics/correctness.ts", () => ({
  calculateCorrectness: vi.fn().mockResolvedValue(1)
}));

vi.mock("../metrics/busFactor.ts", () => ({
  calculateBusFactorScore: vi.fn().mockResolvedValue(1)
}));

vi.mock("../processURL.ts", () => ({
  processURLs: vi
    .fn()
    .mockResolvedValue([
      { packageName: "test-package", owner: "test-owner", url: "https://github.com/test/test-package" }
    ])
}));

// Mock calculateBusFactor and calculateCorrectness (temporary stubs in your code)
vi.mock("../metrics/netScore.ts", async () => {
  const actual = await vi.importActual("../metrics/netScore.ts");
  return {
    ...actual,
    calculateBusFactor: vi.fn().mockResolvedValue(-1)
  };
});

describe("calculateNetScore", () => {
  const logger = getLogger();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate the correct net score for a given repository", async () => {
    await calculateNetScore("path/to/url_file.txt");

    // Ensure external functions are called correctly
    expect(processURLs).toHaveBeenCalledWith("path/to/url_file.txt");
    expect(calculateLicenseScore).toHaveBeenCalledWith("test-owner", "test-package");
    expect(calculateRampUpScore).toHaveBeenCalledWith("test-owner", "test-package");
    expect(calculateResponsiveMaintainerScore).toHaveBeenCalledWith("test-owner", "test-package");
    expect(calculateCorrectness).toHaveBeenCalledWith("test-owner", "test-package");
    expect(calculateBusFactorScore).toHaveBeenCalledWith("test-owner", "test-package");

    expect(logger.console).toHaveBeenCalledWith(
      JSON.stringify({
        URL: "https://github.com/test/test-package",
        NetScore: 1, // Calculated net score from the mocked data
        NetScore_Latency: -1,
        RampUp: 1,
        RampUp_Latency: -1,
        Correctness: 1,
        Correctness_Latency: -1,
        BusFactor: 1,
        BusFactor_Latency: -1,
        ResponsiveMaintainer: 1,
        ResponsiveMaintainer_Latency: -1,
        License: 1,
        License_Latency: -1
      })
    );
  });
});
