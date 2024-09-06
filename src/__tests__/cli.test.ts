import { describe, it, expect, vi, beforeAll } from 'vitest';
import * as fs from 'fs';
import { getGithubRepo, processURLs } from '../process_url.ts'; // Replace with your actual module file path
import path from 'path';

// Mock the logger
vi.mock('./logger.ts', () => ({
    getLogger: () => ({
        info: vi.fn(),
    }),
}));

// Mock the fs module
// vi.mock('fs');

const logFilePath = path.join("src", "__tests__", "logs", "test.log");

// Mock fetch
global.fetch = vi.fn();

beforeAll(() => {
  process.env.LOG_LEVEL = "2";
  process.env.LOG_FILE = logFilePath;
  process.env.NODE_ENV = "testing";
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe('getGithubRepo', () => {
    it('should return the GitHub repo URL when given a GitHub URL', async () => {
        const url = 'https://github.com/user/repo';

        const repo = await getGithubRepo(url);
        
        expect(repo).toBe(url);
    });

    it('should fetch and return the GitHub repo URL when given an NPM package URL', async () => {
        const npmUrl = 'https://www.npmjs.com/package/some-package';
        const mockedRepoUrl = 'https://github.com/user/repo';

        // Mock the fetch response
        (global.fetch as any).mockResolvedValueOnce({
            json: () => Promise.resolve({
                repository: { url: mockedRepoUrl }
            }),
        });

        const repo = await getGithubRepo(npmUrl);
        
        expect(repo).toBe(mockedRepoUrl);
        expect(global.fetch).toHaveBeenCalledWith('https://registry.npmjs.org/some-package');
    });

    it('should return the original URL if the URL is not GitHub or NPM', async () => {
        const invalidUrl = 'https://example.com';

        const repo = await getGithubRepo(invalidUrl);
        
        expect(repo).toBe('Invalid URL');
    });
});

describe('processURLs', () => {
    it('should return an empty array if the file is empty', async () => {
      const filePath = path.join(__dirname, 'empty_file.txt'); // Adjust path if needed

      // Write an empty file
      fs.writeFileSync(filePath, '');

      const result = await processURLs(filePath);

      expect(result).toEqual([]);
    });   

    it('should return an empty array if the file does not exist', async () => {
      const filePath = path.join(__dirname, 'nonexistent_file.txt'); // Adjust path if needed

      const result = await processURLs(filePath);

      expect(result).toEqual([]);
    });

    // it('should return an array of GitHub repo URLs for each valid URL in the file', async () => {
    //   const filePath = path.join(__dirname, 'sample_url.txt'); // Adjust path if needed
    //   const urls = [
    //     'https://github.com/cloudinary/cloudinary_npm',
    //     'https://www.npmjs.com/package/express',
    //   ];

    //   // Write the URLs to the file
    //   fs.writeFileSync(filePath, urls.join('\n'));

    //   const result = await processURLs(filePath);

    //   const expected = [
    //     'https://github.com/cloudinary/cloudinary_npm',
    //     'https://github.com/expressjs/express',
    //   ];

    //   expect(result).toEqual(expected);
    // });
});
