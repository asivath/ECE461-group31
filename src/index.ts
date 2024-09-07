import { exit } from "process";
import { logTestResults } from "./logger.ts";
import { getLogger } from "./logger.ts";

const logger = getLogger();

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("No command provided");
  process.exit(1);
}

const commandOrFile = args[0];

switch (commandOrFile) {
  case "test":
    logger.info("Running tests");
    await logTestResults().catch((e) => {
      logger.debug(e);
      console.error(e);
      exit(1);
    });
    break;
  default:
    logger.info("Processing URL file");
    // TODO: Run URL processing
    console.error("Command not implemented for: ", commandOrFile);
}
