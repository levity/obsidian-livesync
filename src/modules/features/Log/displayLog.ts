import { debounce } from "@/deps.ts";
import { logMessages } from "@vrtmrz/livesync-commonlib/compat/mock_and_interop/stores";

// The log pane shows the most recent lines, kept apart from the full log history.
export const DISPLAY_LOG_LIMIT = 2000;

const logForDisplay = [] as string[];
// Running number of logForDisplay[0]: how many lines have dropped off the front so far.
let firstSeq = 0;
let publishedFirstSeq = 0;

// Debounced so a burst of log entries makes one UI update.
const updateLogMessage = debounce(() => {
    const excess = logForDisplay.length - DISPLAY_LOG_LIMIT;
    if (excess > 0) {
        logForDisplay.splice(0, excess);
        firstSeq += excess;
    }
    publishedFirstSeq = firstSeq;
    logMessages.value = [...logForDisplay];
}, 25);

export function addDisplayLog(log: string) {
    logForDisplay.push(log);
    updateLogMessage();
}

/** Running number of the first line in `logMessages.value`, so the pane can tell dropped lines from new ones. */
export function displayLogFirstSeq() {
    return publishedFirstSeq;
}
