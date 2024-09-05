import { getLogger, logTestResults } from "./logger.ts";

const logger = getLogger();

// JSON Score ratings
const messages = [
  {
    URL: "https://github.com/nullivex/nodist",
    NetScore: 0.9,
    NetScore_Latency: 0.033,
    RampUp: 0.5,
    RampUp_Latency: 0.023,
    Correctness: 0.7,
    Correctness_Latency: 0.005,
    BusFactor: 0.3,
    BusFactor_Latency: 0.002,
    ResponsiveMaintainer: 0.4,
    ResponsiveMaintainer_Latency: 0.002,
    License: 1,
    License_Latency: 0.001
  },
  {
    URL: "https://www.npmjs.com/package/browserify",
    NetScore: 0.76,
    NetScore_Latency: 0.099,
    RampUp: 0.5,
    RampUp_Latency: 0.003,
    Correctness: 0.7,
    Correctness_Latency: 0.019,
    BusFactor: 0.3,
    BusFactor_Latency: 0.024,
    ResponsiveMaintainer: 0.6,
    ResponsiveMaintainer_Latency: 0.042,
    License: 1,
    License_Latency: 0.011
  },
  {
    URL: "https://github.com/cloudinary/cloudinary_npm",
    NetScore: 0.6,
    NetScore_Latency: 0.152,
    RampUp: 0.5,
    RampUp_Latency: 0.003,
    Correctness: 0.7,
    Correctness_Latency: 0.109,
    BusFactor: 0.3,
    BusFactor_Latency: 0.004,
    ResponsiveMaintainer: 0.2,
    ResponsiveMaintainer_Latency: 0.013,
    License: 1,
    License_Latency: 0.023
  },
  {
    URL: "https://github.com/lodash/lodash",
    NetScore: 0.5,
    NetScore_Latency: 0.229,
    RampUp: 0.5,
    RampUp_Latency: 0.062,
    Correctness: 0.3,
    Correctness_Latency: 0.042,
    BusFactor: 0.7,
    BusFactor_Latency: 0.084,
    ResponsiveMaintainer: 0.6,
    ResponsiveMaintainer_Latency: 0.039,
    License: 1,
    License_Latency: 0.002
  },
  {
    URL: "https://www.npmjs.com/package/express",
    NetScore: 0,
    NetScore_Latency: 0.137,
    RampUp: 0.5,
    RampUp_Latency: 0.002,
    Correctness: 0.7,
    Correctness_Latency: 0.076,
    BusFactor: 0.3,
    BusFactor_Latency: 0.004,
    ResponsiveMaintainer: 0.6,
    ResponsiveMaintainer_Latency: 0.009,
    License: 0,
    License_Latency: 0.046
  }
];

// Logging each message
// messages.forEach((message) => {
//   logger.info(message);
// });

//logger.info("7 dependencies installed...");

// Log test summary
logTestResults();
