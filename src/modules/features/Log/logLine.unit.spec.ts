import { describe, expect, it } from "vitest";
import { formatLogLine, splitLogLine, toLogRows } from "./logLine";

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

    it("emits a date row only when the day changes", () => {
        const rows = toLogRows(["2026-11-13 23:59:59 a", "2026-11-14 00:00:01 b", "2026-11-14 00:00:02 c"]);
        expect(rows).toEqual([
            { kind: "date", date: "2026-11-13" },
            { kind: "line", time: "23:59:59", message: "a" },
            { kind: "date", date: "2026-11-14" },
            { kind: "line", time: "00:00:01", message: "b" },
            { kind: "line", time: "00:00:02", message: "c" },
        ]);
    });
});
