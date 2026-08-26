import axios, { AxiosError } from "axios";
import type {
  ActivityResponse,
  DatasetStatsResponse,
  EnrollResponse,
  KeystrokeEvent,
  LoginResponse,
  ProfileResponse,
  RegisterResponse,
  TrainingRunResponse,
  VerifyPreviewResponse,
} from "@/types";
import { clearToken, getToken } from "./tokenStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(error);
  },
);

/** Extract a friendly message from any Axios error thrown by these calls. */
export function friendlyErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Could not reach the server. Please check your connection and try again.";
    }
    const data = error.response.data as { detail?: unknown } | undefined;
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail) && data.detail.length > 0) {
      const first = data.detail[0] as { message?: string };
      return first.message ?? "The server rejected the request.";
    }
    if (error.response.status >= 500) {
      return "An unexpected server error occurred. Please try again.";
    }
    return "The request could not be completed.";
  }
  return "Something went wrong. Please try again.";
}

export const publicApi = {
  config: () =>
    apiClient
      .get<{ auth_phrase: string; min_enrollment_samples: number }>("/api/public/config")
      .then((r) => r.data),
};

export const authApi = {
  register: (payload: { name: string; email: string; password: string; confirm_password: string }) =>
    apiClient.post<RegisterResponse>("/api/auth/register", payload).then((r) => r.data),

  login: (payload: { email: string; password: string; events: KeystrokeEvent[] }) =>
    apiClient.post<LoginResponse>("/api/auth/login", payload).then((r) => r.data),
};

export const typingApi = {
  enroll: (events: KeystrokeEvent[]) =>
    apiClient.post<EnrollResponse>("/api/typing/enroll", { events }).then((r) => r.data),

  verifyPreview: (events: KeystrokeEvent[]) =>
    apiClient.post<VerifyPreviewResponse>("/api/typing/verify-preview", { events }).then((r) => r.data),
};

export const profileApi = {
  get: () => apiClient.get<ProfileResponse>("/api/profile").then((r) => r.data),
  deleteTypingData: () => apiClient.delete("/api/profile/typing-data"),
};

export const mlApi = {
  trainMine: () => apiClient.post<TrainingRunResponse>("/api/ml/train").then((r) => r.data),
  trainGlobal: () => apiClient.post<TrainingRunResponse>("/api/ml/train/global").then((r) => r.data),
  myStatus: () => apiClient.get<TrainingRunResponse | null>("/api/ml/status").then((r) => r.data),
  globalStatus: () =>
    apiClient.get<TrainingRunResponse | null>("/api/ml/status/global").then((r) => r.data),
  datasetStats: () => apiClient.get<DatasetStatsResponse>("/api/ml/dataset-stats").then((r) => r.data),
};

export const activityApi = {
  history: (limit = 25) =>
    apiClient.get<ActivityResponse>("/api/authentication/history", { params: { limit } }).then((r) => r.data),
};
