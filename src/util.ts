import { SimpleGit, simpleGit } from "simple-git";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { getLogger } from "./logger.js";

const logger = getLogger();
/**
 * Clone a repository from a given URL
 * @param repoUrl The URL of the repository to clone
 * @param repoName The name of the repository
 * @returns The path to the cloned repository or null if an error occurred
 */
export async function cloneRepo(repoUrl: string, repoName: string): Promise<string | null> {
  const git: SimpleGit = simpleGit();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoDir = path.resolve(__dirname, "..", "repos", repoName);
  try {
    await fs.mkdir(repoDir, { recursive: true });
    await git.clone(repoUrl, repoDir);
    logger.info(`Repository cloned to ${repoDir}`);
    return repoDir;
  } catch (error) {
    if ((error as Error).message.includes("already exists")) {
      logger.info(`Repository already cloned to ${repoDir}`);
      return repoDir;
    }
    logger.info("Error cloning repository:", error);
    return null;
  }
}
