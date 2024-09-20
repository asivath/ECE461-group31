
# Project Part 1 - Software Engineering

## Team Members:
- Kevin Chang
- Aditya Sivathnu
- Ellis Selznick

**Date:** 9/19/24  

---

## Project Overview

We have implemented a system in TypeScript that evaluates external package URLs and assigns them a **NetScore** rating between 0 and 1. This score is based on five key metrics:
- **Bus Factor (15%)**
- **Correctness (30%)**
- **Ramp-Up Time (10%)**
- **Responsive Maintainer (15%)**
- **License Compatibility (30%)**

Each metric is rated from 0 to 1, and their weighted sum forms the final NetScore. The program outputs the individual metric scores and the overall NetScore in **NDJSON** format to both the console and a log file. If an invalid URL is encountered (one that is not a GitHub or NPMJS URL), the system logs it as invalid and does not assign a score. Metric data for Bus Factor, Responsive Maintainer, License, and Ramp-Up Time is retrieved via GitHub’s GraphQL API, while Correctness is determined by cloning the repository and analyzing it using ESLint. The program was tested using Vitest and code quality was ensured through ESLint and Prettier. The program was parallelized via `promise.all()` so that multiple metrics can be calculated separately, rather than sequentially and waiting for one metric to finish at a time before moving to the next one.

## System Requirements

| Requirement          | Description                                                                                             |
|----------------------|---------------------------------------------------------------------------------------------------------|
| **System Input**      | The system supports CLI inputs, e.g., `./run` commands for metrics calculation and dependency installation. |
| **System Implementation** | The system is implemented in TypeScript and uses a mix of GraphQL and repository cloning to calculate metrics. |
| **System Output**     | Outputs metrics in **NDJSON** format, with console logging for metrics and latency values.               |
| **Response Time**     | Latency times for each metric are calculated and logged alongside the metric score.                     |
| **Parallel Processing** | Utilizes asynchronous programming for parallel execution of metrics.                                   |

## Open Issues
There are currently **0 open issues** in the [GitHub Issue Tracker](https://github.com/asivath/ECE461-group31/issues).

## Modularity

- **Decomposition:** The system is divided into modules for:
  - **Testing:** Unit tests for each `.ts` file in the `src` folder.
  - **Metrics Calculation:** Separate files for each metric, joined by `netScore.ts`.
  - **Processing:** Handles URL processing, logging, and GraphQL queries.
  
- **Composability:** Each module is self-contained with no global state, allowing the modules to be imported into others without conflict.

- **Understandability:** Each module can be understood individually, though some familiarity with **GraphQL** and **Vitest** might be required for testing.

- **Continuity:** Modifying metric weights or constants is easy, but significant changes to the calculation logic will require corresponding updates to the tests. Adding metrics will not be an issue.

- **Isolation:** Errors are handled locally within each module, and failing metrics return a value of 0 without crashing the system.

## Dependencies

The project dependencies are listed in `package.json`.

| Dependency                    | Purpose                                                        |
|-------------------------------|----------------------------------------------------------------|
| **cloc**                      | Counts lines of code                                            |
| **date-fns**                  | Calculates the difference in days                               |
| **dotenv**                    | Imports environment variables from `.env`                       |
| **eslint**                    | Code quality check                                              |
| **eslint-config-prettier**    | Ensures eslint does not conflict with prettier                  |
| **eslint-plugin-security**    | Enhances correctness lint check                                 |
| **graphql**                   | For all API calls to GitHub                                     |
| **graphql-request**           | Simplifies GitHub GraphQL requests                              |
| **prettier**                  | Formats code for consistent coding standards                    |
| **simple-git**                | Provides a simple way to clone a repo                           |
| **tsx**                       | Allows running `.ts` files without compiling                    |
| **vitest**                    | Testing framework                                               |
| **typescript**                | TypeScript project setup                                        |

## Configuration

The project can be configured via the `.env` file. Key configurations include:
- **GITHUB_TOKEN=PERSONAL_ACCESS_TOKEN**
- **LOG_FILE=PATH_TO_LOG_FILE**
- **LOG_LEVEL**

Without the first two, the program will not make valid API calls or log properly.

## Build and Version Control

There are no build steps for this project; it can be run directly using `npm start`. For version control, we used GitHub, and branches were created for each feature or bug fix, linked to issues in the project tracker.

## Test Plan

- **Automated Tests:** We use **Vitest** for unit and end-to-end testing, covering system input, output, and response time. Most tests are automated.
- **Test Coverage:** The system requires 90% code coverage before merging. This can be checked via:

  ```bash
  npm run test:coverage
  ```

## Test Execution

Run the tests using either of the following commands:

```bash
npm test
npm run test:watch
```
test:watch will rerun tests whenever changes are detected in the files

**Things to Note with Testing:**
- All tests are automated with unit tests created using Vitest and mocks. There are unit tests for each metric, URL processing, loggers, and the utility functions for cloning repositories.
- End-to-end testing ensures the program correctly makes GraphQL calls and logs outputs.
- When running E2E tests, the test calls `./run test`. To avoid a circular call, an env variable (`NODE_ENV == "test"`) ensures the test runner doesn't call `index.test.ts` recursively.

### Important Notes for Modifying/Deleting Tests:
When making new tests or deleting tests, be sure to update the following code block found in `index.test.ts`:

```javascript
expect(totalTests).toBe(number);
expect(totalPassed).toBe(number);
expect(lineCoverage).toBe(coverage);
```

- **DO NOT** simply change the number to whatever is expected if the test fails. This defeats the purpose of the test by comparing incorrect values.
- If your code is supposed to pass correctly, run the following command to update the numbers and coverage values:

  ```bash
  npm run test
  npm run test:coverage
  ```

- You should see an output like the following:

  ```
  Test Files 1 failed | 9 passed (10)
  Tests 2 failed | 53 passed (55)
  ```

  In this case, your test amount should be calculated as `55 - 3 = 52 tests`. Coverage information can be checked via `npm run test:coverage`.

  The reason for subtracting 3 is that `index.test.ts` is excluded (as explained earlier) and contains 3 tests.

- **IMPORTANT:** You aren't allowed to merge if tests are failing or you don't meet 90% code coverage.

## Running the Project

To run the project, use the following commands:

- **Start the program:**
  ```bash
  npm start
  ```

- **Run tests:**
  ```bash
  npm run test
  npm run test:coverage
  ```

Ensure the `.env` file contains valid GitHub token and log file path settings before running the program.
