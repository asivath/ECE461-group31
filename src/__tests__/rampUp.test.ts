import { describe, test, vi, expect, beforeEach } from "vitest";
import { calculateRampUpScore } from "../metrics/rampUp.ts";
import { getLogger } from "../logger.ts";
import * as graphqlClientModule from "../graphqlClient.ts";
import * as utilModule from "util";

vi.mock("../graphqlClient.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof graphqlClientModule>();
  return {
    ...actual,
    graphqlClient: {
      request: vi.fn()
    }
  };
});
vi.mock("../logger.ts", () => {
  return {
    getLogger: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn()
    })
  };
});
vi.mock("../util.ts", () => {
  return {
    cloneRepo: vi.fn().mockResolvedValue("mockRepoDir")
  };
});
vi.mock("util", () => ({
  promisify: vi.fn().mockReturnValue(() => {
    return Promise.resolve({
      stdout: `
        github.com/AlDanial/cloc v 2.02  T=0.11 s (789.9 files/s, 145526.9 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
TypeScript                      59           1082           1657          10355
Markdown                        10            795              0           2025
JSON                             8              0              0            127
YAML                             5             16              8             90
HTML                             4              3              0             36
Dockerfile                       1              3              3              7
Text                             1              0              0              6
-------------------------------------------------------------------------------
SUM:                            88           1899           1668          12646
-------------------------------------------------------------------------------
      `
    });
  })
}));

describe("calculateRampUpScore", () => {
  let loggerSpy: ReturnType<typeof getLogger>;
  const mockDate = new Date("2022-01-01T00:00:00Z");
  const mockDatePlus5Days = new Date(mockDate);
  const mockDatePlus200Days = new Date(mockDate);
  mockDatePlus200Days.setDate(mockDate.getDate() + 200);
  mockDatePlus5Days.setDate(mockDate.getDate() + 5);
  beforeEach(() => {
    loggerSpy = getLogger();
    vi.clearAllMocks();
  });

  test("should calculate ramp-up score correctly and log internal values", async () => {
    const mockGraphQLResponse = {
      repository: {
        forks: {
          edges: [
            {
              node: {
                createdAt: mockDate.toISOString(),
                pullRequests: { nodes: [{ createdAt: "2022-01-10T00:00:00Z" }] },
                issues: { nodes: [{ createdAt: mockDatePlus5Days }] },
                refs: { nodes: [] }
              }
            }
          ]
        },
        object: { id: "README" },
        contributing: { id: "CONTRIBUTING" }
      }
    };
    vi.mocked(graphqlClientModule.graphqlClient.request).mockResolvedValue(mockGraphQLResponse);

    const score = await calculateRampUpScore("owner", "repo", 50);

    expect(loggerSpy.debug).toHaveBeenCalledWith("Total days: 5, Forks with activity: 1");
    expect(loggerSpy.debug).toHaveBeenCalledWith("Found README and CONTRIBUTING for repo owner/repo");
    expect(loggerSpy.debug).toHaveBeenCalledWith("Lines of code: 12646");
    const expectedTargetTime = 10;
    const expectedConstant = expectedTargetTime / Math.log(1.05);
    const expectedAverageTimeValue = Math.max(Math.exp(-(5 - expectedTargetTime) / expectedConstant), 0.3);
    const expectedDocumentationWeight = 1;
    const expectedScore = Math.min(1, expectedAverageTimeValue * expectedDocumentationWeight);
    expect(score).toBe(expectedScore);
  });

  test("should log an error and return 0 if GraphQL request fails", async () => {
    vi.mocked(graphqlClientModule.graphqlClient.request).mockRejectedValue(new Error("GraphQL request failure"));
    const score = await calculateRampUpScore("owner", "repo", 50);
    expect(score).toBe(0);
    expect(loggerSpy.info).toHaveBeenCalledWith("Error fetching forks and PRs:", new Error("GraphQL request failure"));
  });

  test("should calculate lower score values for scenarios with high average days and no documentation", async () => {
    const mockGraphQLResponse = {
      repository: {
        forks: {
          edges: [
            {
              node: {
                createdAt: mockDate.toISOString(),
                pullRequests: { nodes: [{ createdAt: mockDatePlus200Days }] },
                issues: { nodes: [] },
                refs: { nodes: [] }
              }
            }
          ]
        },
        object: null,
        contributing: null
      }
    };
    vi.mocked(graphqlClientModule.graphqlClient.request).mockResolvedValue(mockGraphQLResponse);

    const score = await calculateRampUpScore("owner", "repo", 50);

    expect(loggerSpy.debug).toHaveBeenCalledWith("Total days: 200, Forks with activity: 1");
    expect(loggerSpy.debug).toHaveBeenCalledWith("No README or CONTRIBUTING found for repo owner/repo");
    expect(loggerSpy.debug).toHaveBeenCalledWith("Lines of code: 12646");
    const expectedTargetTime = 14;
    const expectedConstant = expectedTargetTime / Math.log(1.05);
    const expectedAverageTimeValue = Math.max(Math.exp(-(200 - expectedTargetTime) / expectedConstant), 0.3);
    const expectedDocumentationWeight = 0.8;
    const expectedScore = Math.min(1, expectedAverageTimeValue * expectedDocumentationWeight);
    expect(score).toBe(expectedScore);
  });

  const locTestCases = [
    { loc: 4000, expectedTargetTime: 7 },
    { loc: 8000, expectedTargetTime: 10 },
    { loc: 30000, expectedTargetTime: 14 },
    { loc: 70000, expectedTargetTime: 21 },
    { loc: 400000, expectedTargetTime: 30 },
    { loc: 800000, expectedTargetTime: 45 },
    { loc: 1200000, expectedTargetTime: 60 }
  ];

  locTestCases.forEach(({ loc, expectedTargetTime }) => {
    test(`should calculate target time for ${loc} LOC and log internal values`, async () => {
      const mockGraphQLResponse = {
        repository: {
          forks: {
            edges: [
              {
                node: {
                  createdAt: mockDate.toISOString(),
                  pullRequests: { nodes: [{ createdAt: mockDate }] },
                  issues: { nodes: [{ createdAt: mockDatePlus5Days }] },
                  refs: { nodes: [] }
                }
              }
            ]
          },
          object: { id: "README" },
          contributing: { id: "CONTRIBUTING" }
        }
      };
      vi.mocked(graphqlClientModule.graphqlClient.request).mockResolvedValue(mockGraphQLResponse);
      vi.mocked(utilModule.promisify).mockReturnValue(() => {
        return Promise.resolve({
          stdout: `
            github.com/AlDanial/cloc v 2.02  T=0.11 s (789.9 files/s, 145526.9 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
TypeScript                      59           1082           1657          ${loc}
Markdown                        10            795              0           2025
-------------------------------------------------------------------------------
SUM:                            88           1899           1668          ${loc}
-------------------------------------------------------------------------------
          `
        });
      });

      const score = await calculateRampUpScore("owner", "repo", 50);

      expect(loggerSpy.debug).toHaveBeenCalledWith(`Lines of code: ${loc}`);
      const expectedConstant = expectedTargetTime / Math.log(1.05);
      const expectedAverageTimeValue = Math.max(Math.exp(-(5 - expectedTargetTime) / expectedConstant), 0.3);
      const expectedDocumentationWeight = 1;
      const expectedScore = Math.min(1, expectedAverageTimeValue * expectedDocumentationWeight);

      expect(score).toBe(expectedScore);
    });
  });
});
