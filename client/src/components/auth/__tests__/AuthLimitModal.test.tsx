import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { render, screen } from "@/test/test-utils";
import { AuthLimitModal } from "../AuthLimitModal";

describe("AuthLimitModal", () => {
  it("shows the OSS BYOK limit copy and opens runtime settings from the CTA", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onOpenRuntimeSettings = vi.fn();

    render(
      <AuthLimitModal
        isOpen={true}
        onClose={onClose}
        turnsUsed={3}
        onOpenRuntimeSettings={onOpenRuntimeSettings}
      />
    );

    expect(screen.getByText(/add your key to keep chatting/i)).toBeInTheDocument();
    expect(screen.getByText(/3 free OSS chat turns/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add api key/i }));

    expect(onOpenRuntimeSettings).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
