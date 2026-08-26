import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DecisionBadge, RiskBadge } from "./Badge";

describe("RiskBadge", () => {
  it("renders a human-readable label for each risk level", () => {
    render(<RiskBadge level="high" />);
    expect(screen.getByText("High risk")).toBeInTheDocument();
  });
});

describe("DecisionBadge", () => {
  it("shows Success for a success decision", () => {
    render(<DecisionBadge decision="success" />);
    expect(screen.getByText("Success")).toBeInTheDocument();
  });

  it("shows Failed for a failed decision", () => {
    render(<DecisionBadge decision="failed" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
});
