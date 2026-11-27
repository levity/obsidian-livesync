import { describe, expect, it } from "vitest";
import { advanceLogRows, formatLogLine, splitLogLine, toLogRows } from "./logLine";

describe("logLine", () => {
    it("formats a 24-hour stamp followed by a space", () => {
        const line = formatLogLine(new Date(2026, 10, 14, 15, 4, 9), "Replication completed");
        expect(line).toBe("2026-11-14 15:04:09 Replication completed");
    });

    it("round-trips multi-line messages", () => {
        const line = formatLogLine(new Date(2026, 0, 2, 0, 0, 0), "Error\n[StackTrace]: x");
        expect(splitLogLine(line)).toEqual({ date: "2026-01-02", time: "00:00:00", message: "Error\n[StackTrace]: x" });
    });

    it("leaves unstamped lines alone", () => {
        expect(splitLogLine("no stamp here")).toEqual({ date: "", time: "", message: "no stamp here" });
    });

    it("shows the date only where the day changes", () => {
        const rows = toLogRows(["2026-11-13 23:59:59 a", "2026-11-14 00:00:01 b", "2026-11-14 00:00:02 c"], 7);
        expect(rows).toEqual([
            { key: "7", date: "2026-11-13", time: "23:59:59", message: "a", showDate: true },
            { key: "8", date: "2026-11-14", time: "00:00:01", message: "b", showDate: true },
            { key: "9", date: "2026-11-14", time: "00:00:02", message: "c", showDate: false },
        ]);
    });

    it("advances rows by dropping old lines and parsing only new ones", () => {
        const lines = ["2026-11-14 00:00:01 a", "2026-11-14 00:00:02 b", "2026-11-14 00:00:03 c"];
        const rows = toLogRows(lines, 10);
        const next = ["2026-11-14 00:00:03 c", "2026-11-14 00:00:04 d", "2026-11-15 00:00:00 e"];
        const advanced = advanceLogRows(rows, 10, next, 12);
        expect(advanced).toEqual(toLogRows(next, 12));
        // Unchanged rows are reused, not re-parsed.
        expect(advanceLogRows(rows, 10, [...lines, "2026-11-14 00:00:04 d"], 10)[1]).toBe(rows[1]);
    });

    it("rebuilds when the snapshot does not continue the rows", () => {
        const rows = toLogRows(["2026-11-14 00:00:01 a"], 0);
        expect(advanceLogRows(rows, 0, ["2026-11-14 00:00:09 z"], 5)).toEqual(toLogRows(["2026-11-14 00:00:09 z"], 5));
    });
});
