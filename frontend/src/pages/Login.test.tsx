import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Login } from "./Login";
import { AuthProvider } from "@/hooks/useAuth";
import { publicApi } from "@/services/api";

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
}

describe("Login page", () => {
  it("renders credentials form initially and requires email and password", () => {
    vi.spyOn(publicApi, "config").mockResolvedValue({
      auth_phrase: "My secure typing pattern is unique.",
      min_enrollment_samples: 8,
    });

    renderWithProviders(<Login />);

    expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();

    const continueBtn = screen.getByRole("button", { name: "Continue" });
    fireEvent.click(continueBtn);

    expect(screen.getByText("Enter your email and password.")).toBeInTheDocument();
  });

  it("transitions to typing step and shows phrase typing box when config is loaded", async () => {
    vi.spyOn(publicApi, "config").mockResolvedValue({
      auth_phrase: "My secure typing pattern is unique.",
      min_enrollment_samples: 8,
    });

    renderWithProviders(<Login />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alice@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByText(/Now type the phrase/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("textbox", { name: /Type the phrase/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Back to credentials/i })).toBeInTheDocument();
  });

  it("shows error alert and retry button on typing step if server config fails to load", async () => {
    vi.spyOn(publicApi, "config").mockRejectedValue(new Error("Could not reach the server."));

    renderWithProviders(<Login />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alice@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Back to credentials/i })).toBeInTheDocument();
  });
});

