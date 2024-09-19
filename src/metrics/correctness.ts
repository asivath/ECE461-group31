import { ESLint } from "eslint";
import { getLogger } from "../logger.ts";

const logger = getLogger();

export async function calculateCorrectness(repoDir: string, totalLines: number): Promise<number> {
  const eslintScore = await calculateESLintScore(repoDir, totalLines);
  return eslintScore;
}

async function calculateESLintScore(repoDir: string, totalLines: number): Promise<number> {
  try {
    const eslint = new ESLint({ ignore: false });
    const results = await eslint.lintFiles([`${repoDir}/**/*.{js,ts,tsx}`]);

    let totalErrors = 0;
    let totalWarnings = 0;
    for (const result of results) {
      totalErrors += result.errorCount;
      totalWarnings += result.warningCount;
    }

    if (totalLines === 0) {
      logger.debug(`No lines of code found in ${repoDir}`);
      return 0;
    }

    const eslintScore = Math.max(0, Math.min(1, 1 - (5 * totalErrors + totalWarnings) / totalLines));
    logger.debug(
      `ESLint errors: ${totalErrors}, warnings: ${totalWarnings}, total lines: ${totalLines}, final score: ${eslintScore} for ${repoDir}`
    );
    return eslintScore;
  } catch (error) {
    logger.info(`Failed to calculate ESLint score: ${error}`);
    return 0;
  }
}
