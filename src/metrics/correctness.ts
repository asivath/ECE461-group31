import { cloneRepo } from "../util.ts";
import { ESLint } from "eslint";
import { getLogger } from "../logger.ts";
import { exec } from "child_process";
import { promisify } from "util";

const logger = getLogger();
const execAsync = promisify(exec);

export async function calculateCorrectness(repoOwner: string, repoName: string): Promise<number> {
  const repoDir = await cloneRepo(`https://github.com/${repoOwner}/${repoName}.git`, repoName);
  if (!repoDir) return 0;
  const eslintScore = await calculateESLintScore(repoDir);
  return eslintScore;
}

async function calculateESLintScore(repoDir: string): Promise<number> {
  const eslint = new ESLint({ ignore: false });
  const results = await eslint.lintFiles([`${repoDir}/**/*.{js,ts,tsx}`]);

  let totalErrors = 0;
  let totalWarnings = 0;
  for (const result of results) {
    totalErrors += result.errorCount;
    totalWarnings += result.warningCount;
  }

  const { stdout } = await execAsync(`cloc --json ${repoDir}`);
  const clocData = JSON.parse(stdout);
  const jsLines = clocData.JavaScript?.code || 0;
  const tsLines = clocData.TypeScript?.code || 0;
  const totalLines = jsLines + tsLines;

  if (totalLines === 0) {
    logger.debug(`No lines of code found in ${repoDir}`);
    return 0;
  }

  logger.debug(`ESLint errors: ${totalErrors}, warnings: ${totalWarnings}, total lines: ${totalLines}`);

  const eslintScore = 1 - (5 * totalErrors + totalWarnings) / totalLines;
  return Math.max(0, Math.min(1, eslintScore));
}
