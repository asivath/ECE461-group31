import * as fs from 'fs';

abstract class URLHandler {
    abstract handleURL(url: string): void;
    repoInfo: {
        name: string;
        repo: string;
        maintainers: string[];
        version: string;
    } = {
        name: '',
        repo: '',
        maintainers: [],
        version: ''
    };

    // Functions to call Github API to get neccessary information to built NetScore
}


class NpmURLHandler extends URLHandler {

    async handleURL(url: string): Promise<void> {
        // Logic to handle npm URLs
        const packageName = url.split('/').pop();
        if (!packageName) {
            console.error("Invalid npm package URL.");
            return;
        }

        // Fetch data from the npm registry API
        fetch(`https://registry.npmjs.org/${packageName}`)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                // console.log("data", data);
                this.repoInfo = {
                    name: data.name,
                    repo: data.repository.url,
                    maintainers: data.maintainers,
                    version: Object.keys(data.versions)[0]
                };
                console.log(this.repoInfo);
            })
            .catch((error) => {
            console.error(error);
            });
    }
}


class GitHubURLHandler extends URLHandler {
    async handleURL(url: string): Promise<void> {
        // Logic to handle GitHub URLs
        const repoUrlParts = url.split('/');
        const owner = repoUrlParts[3];
        const repo = repoUrlParts[4];

        // Fetch basic data from the GitHub API
        fetch(`https://api.github.com/repos/${owner}/${repo}`)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                // console.log("data", data);
                // Assign the data to the repoInfo object
                this.repoInfo = {
                    name: data.name,
                    repo: data.html_url,
                    maintainers: data.owner.login,
                    version: data.default_branch
                };
                console.log(this.repoInfo);
            })
            .catch((error) => {
                console.error(error);
            });
    }
}


async function parser(url: string): Promise<string> {
    // Logic to parse URL
    const trimmedUrl = url.trim();
    const npmRegex = /^https:\/\/www\.npmjs\.com\/package\/.*$/;
    const githubRegex = /^https:\/\/github\.com\/.*$/;
    
    if (npmRegex.test(trimmedUrl)) {
        console.log("NPM URL");
        const npmHandler = new NpmURLHandler();
        await npmHandler.handleURL(trimmedUrl);
    } else if (githubRegex.test(trimmedUrl)) {
        console.log("GitHub URL");
        const githubHandler = new GitHubURLHandler();
        await githubHandler.handleURL(trimmedUrl);
    } else {
        console.log("Invalid URL");
    }
    
    return url;
}

const filePath = process.argv[2];

// Read the file and get the URLs
const urls = fs.readFileSync(filePath, 'utf-8').trim().split('\n');

for (const url of urls) {
    console.log("Working with URL:", url);
    parser(url);
}

// console.log("Working with file:", url);
// parser(url);

