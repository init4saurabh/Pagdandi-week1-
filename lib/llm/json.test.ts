import { describe, expect, it } from "vitest";
import { extractFirstJsonObject, parseModelJson } from "./json";
import { questSchema } from "../types";

const valid = { title: "A small trail", intro: "Notice the ordinary.", missions: [1,2,3,4].map((id) => ({ id: String(id), text: "Notice a shape nearby", spokenText: "Notice one nearby shape.", type: "observe" })) };

describe("model JSON handling", () => {
  it("extracts the first balanced object from fenced prose", () => {
    expect(extractFirstJsonObject(`Here:\n\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``)).toEqual(valid);
  });
  it("does not stop at a brace inside a string", () => {
    expect(extractFirstJsonObject('{"text":"a } brace","ok":true} trailing')).toEqual({ text: "a } brace", ok: true });
  });
  it("validates the quest schema", () => {
    expect(parseModelJson(JSON.stringify(valid), questSchema).missions).toHaveLength(4);
  });
  it("rejects too few missions", () => {
    expect(() => parseModelJson(JSON.stringify({ ...valid, missions: valid.missions.slice(0, 2) }), questSchema)).toThrow();
  });
});
