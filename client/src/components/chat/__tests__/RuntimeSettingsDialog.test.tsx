import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { render, screen } from "@/test/test-utils";
import { saveRuntimeConfig } from "@/lib/runtime-config";
import { RuntimeSettingsDialog } from "../RuntimeSettingsDialog";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    token: null,
  }),
}));

describe("RuntimeSettingsDialog", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows provider-specific model suggestions and lets the user pick one quickly", async () => {
    const user = userEvent.setup();

    saveRuntimeConfig({
      modelProvider: "google",
      modelName: "gemini-2.0-flash",
      apiKey: "",
      searchProvider: "duckduckgo",
      baseUrl: "",
      tavilyApiKey: "",
    });

    render(<RuntimeSettingsDialog isOpen={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText(/suggested models for this provider/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /gemini 2.5 pro/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /gemini 2.5 pro/i }));

    expect(screen.getByLabelText(/model name/i)).toHaveValue("gemini-2.5-pro");
  });
});
