import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { render, screen } from "@/test/test-utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MessageActions } from "../MessageActions";

const renderMessageActions = (props?: Partial<React.ComponentProps<typeof MessageActions>>) =>
  render(
    <TooltipProvider>
      <MessageActions
        messageId={1}
        role="assistant"
        content="Perception answer"
        onFork={vi.fn()}
        onToggleLike={vi.fn()}
        {...props}
      />
    </TooltipProvider>
  );

describe("MessageActions", () => {
  it("shows a like button for assistant messages and calls the toggle handler", async () => {
    const user = userEvent.setup();
    const onToggleLike = vi.fn();

    renderMessageActions({ onToggleLike });

    await user.click(screen.getByRole("button", { name: /like message/i }));

    expect(onToggleLike).toHaveBeenCalledTimes(1);
  });

  it("renders liked state accessibly", () => {
    renderMessageActions({ isLiked: true });

    expect(screen.getByRole("button", { name: /unlike message/i })).toBeInTheDocument();
  });

  it("does not show a like button for user messages", () => {
    renderMessageActions({ role: "user" });

    expect(screen.queryByRole("button", { name: /like message/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /unlike message/i })).not.toBeInTheDocument();
  });
});
