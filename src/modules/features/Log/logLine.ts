// Log lines are stored as plain strings: "YYYY-MM-DD HH:mm:ss message".
// The fixed-width, locale-independent stamp lets the log pane split a line
// back into its parts without guessing at the locale's date format.

const pad = (n: number) => `${n}`.padStart(2, "0");

export function formatLogTimestamp(date: Date): string {
    const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    return `${day} ${time}`;
}

export function formatLogLine(date: Date, message: string): string {
    return `${formatLogTimestamp(date)} ${message}`;
}

export type LogLineParts = { date: string; time: string; message: string };

const LOG_LINE_PATTERN = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([\s\S]*)$/;

/** Splits a stored log line. Lines without a recognizable stamp come back as message only. */
export function splitLogLine(line: string): LogLineParts {
    const m = LOG_LINE_PATTERN.exec(line);
    if (!m) return { date: "", time: "", message: line };
    return { date: m[1], time: m[2], message: m[3] };
}

export type LogRow =
    | { kind: "date"; key: string; date: string }
    | { kind: "line"; key: string; time: string; message: string };

/**
 * Turns stored lines into display rows, with a date row wherever the day changes.
 * `firstSeq` is the running number of the first line, so a line keeps its key
 * while older lines drop off the front of the log.
 */
export function toLogRows(lines: string[], firstSeq = 0): LogRow[] {
    const rows: LogRow[] = [];
    let lastDate = "";
    lines.forEach((line, i) => {
        const { date, time, message } = splitLogLine(line);
        if (date && date !== lastDate) {
            rows.push({ kind: "date", key: `d${date}`, date });
            lastDate = date;
        }
        rows.push({ kind: "line", key: `${firstSeq + i}`, time, message });
    });
    return rows;
}

/**
 * How many lines dropped off the front between two snapshots of the capped log:
 * the smallest n for which `next` continues `prev.slice(n)`.
 */
export function countDropped(prev: string[], next: string[]): number {
    for (let n = 0; n < prev.length; n++) {
        const kept = prev.length - n;
        if (kept > next.length) continue;
        let same = true;
        for (let i = 0; i < kept; i++) {
            if (prev[n + i] !== next[i]) {
                same = false;
                break;
            }
        }
        if (same) return n;
    }
    return prev.length;
}
