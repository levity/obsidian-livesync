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

/** One log line as the pane shows it; `showDate` puts a date header above it where the day changes. */
export type LogRow = { key: string; date: string; time: string; message: string; showDate: boolean };

/**
 * Turns stored lines into display rows. `firstSeq` is the running number of the first
 * line, so a line keeps its key while older lines drop off the front of the log.
 * `prevDate` is the date of the line before these, when they continue earlier rows.
 */
export function toLogRows(lines: string[], firstSeq = 0, prevDate = ""): LogRow[] {
    let lastDate = prevDate;
    return lines.map((line, i) => {
        const { date, time, message } = splitLogLine(line);
        const showDate = date !== "" && date !== lastDate;
        if (date) lastDate = date;
        return { key: `${firstSeq + i}`, date, time, message, showDate };
    });
}

/**
 * Carries `rows` (lines from `firstSeq`) forward to a newer snapshot of the capped log
 * (`next`, lines from `nextFirstSeq`): drops the lines that fell off the front and
 * parses only the lines that are new, so each update costs the change, not the whole log.
 */
export function advanceLogRows(rows: LogRow[], firstSeq: number, next: string[], nextFirstSeq: number): LogRow[] {
    const end = firstSeq + rows.length;
    if (nextFirstSeq < firstSeq || nextFirstSeq > end) return toLogRows(next, nextFirstSeq);
    const kept = rows.slice(nextFirstSeq - firstSeq);
    if (kept.length > 0 && kept[0].date && !kept[0].showDate) kept[0] = { ...kept[0], showDate: true };
    const added = toLogRows(next.slice(end - nextFirstSeq), end, kept[kept.length - 1]?.date ?? "");
    return kept.concat(added);
}
