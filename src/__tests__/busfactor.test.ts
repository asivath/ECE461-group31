import { describe, test, vi, expect, beforeEach } from "vitest";
import { calculateBusFactorScore } from "../metrics/busFactor.ts";
import { it } from "node:test";
/* 
the GTAs specified a few repo that should be low, med, or high, I will interpret:
0.00 - 0.33 = low
0.33 - 0.66 = med
66.6 - 1.00 = high
BTW I think one of the provided repo is low despite GTA saying high
https://github.com/prathameshnetake/libvlc
*/

// hasansultan92 watch.js low
// mrdoob three.js High
// socketio socket.io Med
// prathameshnetake libvlc Low
// facebook react High
// ryanve unlicensed low

vi.mock("../logger.ts", () => ({
    getLogger: () => ({
      debug: vi.fn(),
      info: vi.fn(),
    }),
  }));

  vi.mock("../graphqlClient.ts", () => ({
    graphqlClient: {
      request: vi.fn(),
    },
  }));

describe("calculateBusFactorScore", () => {
    beforeEach(() => {
        vi.clearAllMocks();
      });
    it("should return a low bus factor score for cloudinary/cloudinary_npm", async () => {
        const score = await calculateBusFactorScore("cloudinary", "cloudinary_npm");
        expect(score).toBeLessThanOrEqual(0.33);
    });

});