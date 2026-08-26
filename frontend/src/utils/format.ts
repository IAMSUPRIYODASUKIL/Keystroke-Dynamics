import type { ModelType } from "@/types";

export const MODEL_LABELS: Record<ModelType, string> = {
  statistical: "Statistical baseline",
  random_forest: "Random Forest",
  svm: "Support Vector Machine",
  logistic_regression: "Logistic Regression",
};

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatMs(value: number): string {
  return `${value.toFixed(0)} ms`;
}
