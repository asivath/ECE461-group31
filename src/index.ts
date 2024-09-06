import { exit } from "process";
import { logTestResults } from "./logger.ts";

await logTestResults().catch((err) => {
  console.error(err);
  exit(1);
});
