import { describe, expect, it } from "vitest";

import {
  getDefaultModelNameForProvider,
  getRuntimeModelSuggestions,
} from "../runtime-config";

describe("runtime-config model suggestions", () => {
  it("returns provider-specific suggestions", () => {
    expect(getRuntimeModelSuggestions("groq").map((item) => item.value)).toContain(
      "llama-3.3-70b-versatile",
    );
    expect(getRuntimeModelSuggestions("google").map((item) => item.value)).toContain(
      "gemini-2.5-pro",
    );
    expect(getRuntimeModelSuggestions("openai_compatible").map((item) => item.value)).toContain(
      "gpt-4.1-mini",
    );
  });

  it("uses the first suggestion as the provider default", () => {
    expect(getDefaultModelNameForProvider("openai_compatible")).toBe("gpt-4o-mini");
    expect(getDefaultModelNameForProvider("groq")).toBe("llama-3.3-70b-versatile");
    expect(getDefaultModelNameForProvider("google")).toBe("gemini-2.0-flash");
  });
});
