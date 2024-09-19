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
    const repoDir = await cloneRepo(`https://github.com/${owner}/${packageName}.git`, packageName);
    
    const execAsync = promisify(exec);
    const { stdout } = await execAsync(`npx cloc --json ${repoDir}`);
    const clocData = JSON.parse(stdout);
    const jsLines = clocData.JavaScript?.code || 0;
    const tsLines = clocData.TypeScript?.code || 0;
    const totalLinesCorrectness = jsLines + tsLines;
    const totalLinesRamp = clocData.SUM?.code || 0;

    const licenseScore = repoDir ? await calculateLicenseScore(owner, packageName, repoDir) : 0;
    const rampUpScore = repoDir ? await calculateRampUpScore(owner, packageName, repoDir, totalLinesRamp) : 0;
    const responsiveMaintainerScore = await calculateResponsiveMaintainerScore(owner, packageName);
    const busFactor = await calculateBusFactorScore(owner, packageName);
    const correctness = repoDir ? await calculateCorrectness(repoDir, totalLinesCorrectness) : 0;

    const netScore =
      0.3 * licenseScore + 0.1 * rampUpScore + 0.15 * responsiveMaintainerScore + 0.15 * busFactor + 0.3 * correctness;

    logger.console(
      JSON.stringify({
        URL: url.trim(),
        NetScore: parseFloat(netScore.toFixed(2)),
        NetScore_Latency: parseFloat((-1).toFixed(3)), // Placeholder for latency
        RampUp: parseFloat(rampUpScore.toFixed(2)),
        RampUp_Latency: parseFloat((-1).toFixed(3)), // Placeholder for latency
        Correctness: parseFloat(correctness.toFixed(2)),
        Correctness_Latency: parseFloat((-1).toFixed(3)), // Placeholder for latency
        BusFactor: parseFloat(busFactor.toFixed(2)),
        BusFactor_Latency: parseFloat((-1).toFixed(3)), // Placeholder for latency
        ResponsiveMaintainer: parseFloat(responsiveMaintainerScore.toFixed(2)),
        ResponsiveMaintainer_Latency: parseFloat((-1).toFixed(3)), // Placeholder for latency
        License: parseFloat(licenseScore.toFixed(2)),
        License_Latency: parseFloat((-1).toFixed(3)) // Placeholder for latency
      })
    );
  }
}
