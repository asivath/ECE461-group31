import * as fs from 'fs';
import { getLogger } from './logger.ts';
import { Octokit } from '@octokit/rest';

const logger = getLogger();

//Get the GitHub repo from the URL
export async function getGithubRepo(url: string): Promise<string> {
    const trimmedUrl = url.trim();
    const npmRegex = /^https:\/\/www\.npmjs\.com\/package\/.*$/;
    const githubRegex = /^https:\/\/github\.com\/.*$/;
    
    if (npmRegex.test(trimmedUrl)) {
        logger.info("NPM URL");
        
        try {
            const packageName = trimmedUrl.split('/').pop();
            const response = await fetch(`https://registry.npmjs.org/${packageName}`);
            const data = await response.json();
            const repoURL = data.repository.url;
            logger.info("Repo: ", repoURL);
            return repoURL;
        } catch (error) {
            logger.info(error);
        }

    } else if (githubRegex.test(trimmedUrl)) {
        logger.info("GitHub URL");
        logger.info("Repo: ", trimmedUrl);
        return trimmedUrl;
    } else {
        return 'Invalid URL';
        logger.info("Invalid URL");
    }
    
    return url;
}

async function GetRepoInfo(link: string){
    // Octokit.js
    // https://github.com/octokit/core.js#readme
    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN
    })
    const [owner, repo] = link.split('/').slice(-2);
    const commits = await octokit.request(`GET /repos/${owner}/${repo}/commits`, {
        owner,
        repo,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    
    logger.info("Commits:", commits);
}


// Read the file and get the URLs
export async function processURLs(filePath: string){
    let fileContent;
    try {
        fileContent = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        return [];
    }

    if (fileContent == '') {
        return [];
    }

    const urls = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
    
    for (const url of urls) {
        logger.info("Working with URL:", url);
        console.log("Working with URL:", url);
        const Repo = await getGithubRepo(url);
        if (Repo != 'Invalid URL') {
            GetRepoInfo(Repo);
        }
    }
}