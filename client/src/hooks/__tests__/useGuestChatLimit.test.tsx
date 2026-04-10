import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { MAX_FREE_CHAT_TURNS, useGuestChatLimit } from "../useGuestChatLimit";

describe("useGuestChatLimit", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("matches the 3-turn OSS onboarding copy and gates after the third turn", () => {
    const { result } = renderHook(() => useGuestChatLimit());

    expect(MAX_FREE_CHAT_TURNS).toBe(3);
    expect(result.current.remainingTurns).toBe(3);
    expect(result.current.hasReachedLimit).toBe(false);

    act(() => {
      result.current.incrementCount();
      result.current.incrementCount();
      result.current.incrementCount();
    });

    expect(result.current.remainingTurns).toBe(0);
    expect(result.current.hasReachedLimit).toBe(true);
    expect(window.localStorage.getItem("perception_guest_chat_count")).toBe("3");
  });
});
