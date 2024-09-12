import fs from "fs/promises";
import { getLogger } from "./logger.ts";
import {returnRepo} from "./types.ts"

const logger = getLogger();

//Get the GitHub repo from the URL
export async function getGithubRepo(url: string): Promise<returnRepo> {
  const trimmedUrl = url.trim();
  const npmRegex = /^https:\/\/www\.npmjs\.com\/package\/(?<packageName>[a-zA-Z0-9\-_]+)$/;
  const githubRegex = /^(ssh:\/\/git@|https:\/\/)?github\.com\/(?<owner>[a-zA-Z0-9\-_]+)\/(?<packageName>[a-zA-Z0-9\-_]+)(?:\.git)?$/;

  if (npmRegex.test(trimmedUrl)) {
    logger.info("NPM URL");

    const match = trimmedUrl.match(npmRegex);
    if (match?.groups?.packageName) {
      try {
        const packageName = match.groups.packageName;
        const response = await fetch(`https://registry.npmjs.org/${packageName}`);
        const data = await response.json();
        let repoURL = data.repository.url;

        // Remove the "git+" prefix if present
        if (repoURL.startsWith("git+")) {
          repoURL = repoURL.slice(4);
        }
        // Remove the ".git" suffix if present
        if (repoURL.endsWith(".git")) {
          repoURL = repoURL.slice(0, -4);
        }

        repoURL = repoURL.match(githubRegex);

        if (repoURL?.groups) {
          logger.info("Repo: ", data.repository.url);
          return { packageName: repoURL.groups.packageName, owner: repoURL.groups.owner };
        }
      } catch (error) {
        logger.info(error);
      }
    }
  } else if (githubRegex.test(trimmedUrl)) {
    logger.info("GitHub URL");

    const match = trimmedUrl.match(githubRegex);
    if (match?.groups) {
      return { packageName: match.groups.packageName, owner: match.groups.owner };
    }
  } else {
    logger.info("Invalid URL");
  }

  return null;
}


// Read the file and get the URLs
export async function processURLs(filePath: string) {
  let fileContent;
  try {
    fileContent = await fs.readFile(filePath, "utf-8");
  } catch (error) {
    logger.info("Error reading file", error);
    return [];
  }

  if (!fileContent) {
    logger.info("Empty file");
    return [];
  }

  const urls = fileContent.trim().split("\n");
  const results = [];

  for (const url of urls) {
    logger.info("Working with URL:", url);
    const repo = await getGithubRepo(url);
    if (!repo) {
      logger.info("Invalid URL");
      continue;
    }
    results.push(repo);
    //Get repo netscore stuff
  }
  logger.info("results are: ", results);
  return results;
}
