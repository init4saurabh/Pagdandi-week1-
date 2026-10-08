import { describe, expect, it } from "vitest";
import { clampVisibleSeconds, formatDuration } from "./tracking";

describe("screen-time calculations", () => {
  it("never reports visible time above elapsed time", () => expect(clampVisibleSeconds(120, 160)).toBe(120));
  it("never reports negative time", () => expect(clampVisibleSeconds(120, -2)).toBe(0));
  it("formats mixed minutes and seconds", () => expect(formatDuration(160)).toBe("2 min 40 sec"));
});
