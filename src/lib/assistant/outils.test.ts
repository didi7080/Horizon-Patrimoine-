import { describe, expect, it } from "vitest";
import { parisVersIso } from "./outils";

describe("parisVersIso", () => {
  it("applique le décalage hiver (UTC+1)", () => {
    const iso = parisVersIso("2026-01-15", "14:00");
    expect(iso).toBe("2026-01-15T14:00:00+01:00");
    expect(new Date(iso).toISOString()).toBe("2026-01-15T13:00:00.000Z");
  });

  it("applique le décalage été (UTC+2)", () => {
    const iso = parisVersIso("2026-07-15", "14:00");
    expect(iso).toBe("2026-07-15T14:00:00+02:00");
    expect(new Date(iso).toISOString()).toBe("2026-07-15T12:00:00.000Z");
  });
});
