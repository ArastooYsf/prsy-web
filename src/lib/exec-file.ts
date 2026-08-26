import { execFile } from "child_process";
import { promisify } from "util";

// Single shared wrapper for every place this project shells out to a system
// binary (Lighthouse, 7z, ...) instead of each call site re-promisifying its
// own copy.
export const execFileAsync = promisify(execFile);
