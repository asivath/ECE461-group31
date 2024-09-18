import { calculateLicenseScore } from "./license.ts";
import { calculateRampUpScore } from "./rampUp.ts";
import { calculateResponsiveMaintainerScore } from "./responsiveMaintainer.ts";
import { calculateCorrectness } from "./correctness.ts";
import { processURLs } from "../processURL.ts";
import { calculateBusFactorScore } from "./busFactor.ts";
import { getLogger } from "../logger.ts";
// IMPORT BUS FACTOR

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
    let netStart = Date.now();

    let startTime = Date.now();
    const licenseScore = await calculateLicenseScore(owner, packageName);
    let endTime = Date.now();
    const licenseLatency = (endTime - startTime) / 1000; // Convert to seconds

    startTime = Date.now();
    const rampUpScore = await calculateRampUpScore(owner, packageName);
    endTime = Date.now();
    const rampUpLatency = (endTime - startTime) / 1000; // Convert to seconds

    startTime = Date.now();
    const responsiveMaintainerScore = await calculateResponsiveMaintainerScore(owner, packageName);
    endTime = Date.now();
    const responsiveMaintainerLatency = (endTime - startTime) / 1000; // Convert to seconds

    startTime = Date.now();
    const busFactor = await calculateBusFactorScore(owner, packageName);
    endTime = Date.now();
    const busFactorLatency = (endTime - startTime) / 1000; // Convert to seconds

    startTime = Date.now();
    const correctness = await calculateCorrectness(owner, packageName);
    endTime = Date.now();
    const correctnessLatency = (endTime - startTime) / 1000; // Convert to seconds

    const netScore =
      0.3 * licenseScore + 0.1 * rampUpScore + 0.15 * responsiveMaintainerScore + 0.15 * busFactor + 0.3 * correctness;

    let netEnd = Date.now();
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
