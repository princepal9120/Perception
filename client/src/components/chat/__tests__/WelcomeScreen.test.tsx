import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { render, screen } from "@/test/test-utils";
import { WelcomeScreen } from "../WelcomeScreen";

describe("WelcomeScreen", () => {
  it("shows an upfront API key CTA when runtime settings are not configured", async () => {
    const user = userEvent.setup();
    const onOpenRuntimeSettings = vi.fn();

    render(
      <WelcomeScreen
        onSuggestedPrompt={vi.fn()}
        onOpenRuntimeSettings={onOpenRuntimeSettings}
        remainingFreeTurns={3}
        hasRuntimeConfig={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add api key/i }));

    expect(onOpenRuntimeSettings).toHaveBeenCalledTimes(1);
  });

  it("hides the API key CTA once runtime settings are active", () => {
    render(
      <WelcomeScreen
        onSuggestedPrompt={vi.fn()}
        onOpenRuntimeSettings={vi.fn()}
        remainingFreeTurns={0}
        hasRuntimeConfig={true}
      />,
    );

    expect(screen.queryByRole("button", { name: /add api key/i })).not.toBeInTheDocument();
  });
});
