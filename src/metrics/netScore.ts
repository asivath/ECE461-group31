import { calculateLicenseScore } from "./license.ts";
import { calculateRampUpScore } from "./rampUp.ts";
import { calculateResponsiveMaintainerScore } from "./responsiveMaintainer.ts";
import { calculateCorrectness } from "./correctness.ts";
import { processURLs } from "../processURL.ts";
import { calculateBusFactorScore } from "./busFactor.ts";
import { getLogger } from "../logger.ts";
import { promisify } from "util";
import { exec } from "child_process";
import { cloneRepo } from "../util.ts";

const logger = getLogger();

/**
 * Calculate the net score of a repository and print it to standard out
 * @param repoOwner The owner of the repository
 * @param repoName The name of the repository
 * @returns Nothing
 */
export async function calculateNetScore(linkPath: string): Promise<void> {
  const results = await processURLs(linkPath);

  for (const { packageName, owner, url } of results) {
    const netStart = Date.now();

    const repoDir = await cloneRepo(`https://github.com/${owner}/${packageName}.git`, packageName);

    const execAsync = promisify(exec);
    const { stdout } = await execAsync(`npx cloc --json ${repoDir}`);
    const clocData = JSON.parse(stdout);
    const jsLines = clocData.JavaScript?.code || 0;
    const tsLines = clocData.TypeScript?.code || 0;
    const totalLinesCorrectness = jsLines + tsLines;
    const totalLinesRamp = clocData.SUM?.code || 0;

    const [licenseScoreResult, rampUpScoreResult, responsiveMaintainerScoreResult, busFactorResult, correctnessResult] =
      await Promise.all([
        calculateWithLatency(() => calculateLicenseScore(owner, packageName, repoDir)),
        calculateWithLatency(() => calculateRampUpScore(owner, packageName, repoDir, totalLinesRamp)),
        calculateWithLatency(() => calculateResponsiveMaintainerScore(owner, packageName)),
        calculateWithLatency(() => calculateBusFactorScore(owner, packageName)),
        calculateWithLatency(() => calculateCorrectness(repoDir, totalLinesCorrectness))
      ]);

    const { score: licenseScore, latency: licenseLatency } = licenseScoreResult;

    const { score: rampUpScore, latency: rampUpLatency } = rampUpScoreResult;

    const { score: responsiveMaintainerScore, latency: responsiveMaintainerLatency } = responsiveMaintainerScoreResult;

    const { score: busFactor, latency: busFactorLatency } = busFactorResult;

    const { score: correctness, latency: correctnessLatency } = correctnessResult;

    const netScore =
      0.3 * licenseScore + 0.1 * rampUpScore + 0.15 * responsiveMaintainerScore + 0.15 * busFactor + 0.3 * correctness;

    const netEnd = Date.now();
    const netLatency = (netEnd - netStart) / 1000; // Convert to seconds

    logger.console(
      JSON.stringify({
        URL: url.trim(),
        NetScore: parseFloat(netScore.toFixed(2)),
        NetScore_Latency: parseFloat(netLatency.toFixed(3)), // Converted to seconds
        RampUp: parseFloat(rampUpScore.toFixed(2)),
        RampUp_Latency: parseFloat(rampUpLatency.toFixed(3)), // Converted to seconds
        Correctness: parseFloat(correctness.toFixed(2)),
        Correctness_Latency: parseFloat(correctnessLatency.toFixed(3)), // Converted to seconds
        BusFactor: parseFloat(busFactor.toFixed(2)),
        BusFactor_Latency: parseFloat(busFactorLatency.toFixed(3)), // Converted to seconds
        ResponsiveMaintainer: parseFloat(responsiveMaintainerScore.toFixed(2)),
        ResponsiveMaintainer_Latency: parseFloat(responsiveMaintainerLatency.toFixed(3)), // Converted to seconds
        License: parseFloat(licenseScore.toFixed(2)),
        License_Latency: parseFloat(licenseLatency.toFixed(3)) // Converted to seconds
      })
    );
  }
}

async function calculateWithLatency(calculateFn: () => Promise<number>): Promise<{ score: number; latency: number }> {
  const startTime = Date.now();
  const score = await calculateFn();
  const endTime = Date.now();
  const latency = (endTime - startTime) / 1000; // Convert to seconds
  return { score, latency };
}
