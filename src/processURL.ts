import fs from "fs/promises";
import { getLogger } from "./logger.ts";
import { returnRepo } from "./types.ts";
import { isValidFilePath } from "./util.ts";

const logger = getLogger();

// Get the GitHub repo from the URL
export async function getGithubRepo(url: string): Promise<returnRepo> {
  const trimmedUrl = url.trim();

  const npmRegex = /^https:\/\/www\.npmjs\.com\/package\/(?<packageName>[a-zA-Z0-9\-_]+)$/;

  // Updated regex to allow .js, .io, and other extensions in the repo name, and handle trailing slashes
  const githubRegex =
    /^(?:ssh:\/\/git@|https:\/\/)?github\.com\/(?<owner>[a-zA-Z0-9\-_]+)\/(?<packageName>[a-zA-Z0-9\-_.]+?)(?:\/)?(?:\.git)?$/;
  
  if (npmRegex.test(trimmedUrl)) {
    return handleNpmUrl(trimmedUrl, npmRegex, githubRegex);
  } else if (githubRegex.test(trimmedUrl)) {
    return handleGithubUrl(trimmedUrl, githubRegex);
  } else {
    logger.info("Invalid URL");
    return null;
  }
}

async function handleNpmUrl(url: string, npmRegex: RegExp, githubRegex: RegExp): Promise<returnRepo> {
  logger.info("NPM URL");

  const match = url.match(npmRegex);
  if (!match?.groups?.packageName) return null;

  const packageName = match.groups.packageName;

  try {
    const repoURL = await getRepoUrlFromNpm(packageName, githubRegex);
    if (repoURL?.groups) {
      logger.info("Repo: ", repoURL.input);
      return { packageName: repoURL.groups.packageName, owner: repoURL.groups.owner };
    }
  } catch (error) {
    logger.info(error);
  }

  return null;
}

async function getRepoUrlFromNpm(packageName: string, githubRegex: RegExp): Promise<RegExpMatchArray> {
  const response = await fetch(`https://registry.npmjs.org/${packageName}`);
  const data = await response.json();
  let repoURL = data.repository.url;

  repoURL = repoURL.replace(/^git\+/, "").replace(/\.git$/, "");

  return repoURL.match(githubRegex);
}

function handleGithubUrl(url: string, githubRegex: RegExp): returnRepo {
  logger.info("GitHub URL");

  const match = url.match(githubRegex);
  if (match?.groups) {
    return { packageName: match.groups.packageName, owner: match.groups.owner };
  }

  return null;
}

// Read the file and get the URLs
export async function processURLs(filePath: string) {
  if (!isValidFilePath(filePath)) {
    logger.info("Invalid file path");
    return [];
  }
  let fileContent;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath is validated
    fileContent = await fs.readFile(filePath, "utf-8");
  } catch (error) {
    logger.info("Error reading file: ", error);
    return [];
  }

  if (!fileContent) {
    logger.info("Empty file");
    return [];
  }

  const urls = fileContent.trim().split("\n");
  const results = [];

  for (const url of urls) {
    logger.info(`Working with URL: ${url}`);
    const repo = await getGithubRepo(url);
    if (!repo) {
      logger.info("Invalid URL");
      continue;
    }
    results.push({ ...repo, url: url });
  }
  logger.info("Results are: ", results);
  return results;
}
