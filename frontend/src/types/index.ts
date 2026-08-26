export type ProfileStatus = "not_started" | "in_progress" | "ready";
export type ModelType = "statistical" | "random_forest" | "svm" | "logistic_regression";
export type RiskLevel = "unknown" | "low" | "medium" | "high";
export type AuthDecision = "success" | "failed";
export type TrainingScope = "user_verification" | "global_multiclass";
export type TrainingStatus = "pending" | "running" | "completed" | "failed" | "insufficient_data";

export interface KeystrokeEvent {
  key: string;
  type: "keydown" | "keyup";
  t: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  typing_profile_status: ProfileStatus;
  created_at: string;
}

export interface RegisterResponse {
  access_token: string;
  token_type: string;
  user: User;
  message: string;
}

export interface LoginResponse {
  decision: AuthDecision;
  risk_level: RiskLevel;
  password_correct: boolean;
  typing_evaluated: boolean;
  similarity_score: number | null;
  similarity_label: string | null;
  method_used: ModelType | null;
  message: string;
  access_token: string | null;
  token_type: string;
  user: User | null;
}

export interface EnrollResponse {
  sample_number: number;
  samples_collected: number;
  min_required: number;
  profile_status: ProfileStatus;
  ready_for_authentication: boolean;
  training_triggered: boolean;
  training_message: string | null;
  feature_summary: {
    mean_dwell_ms: number;
    mean_flight_ms: number;
    typing_speed_cps: number;
    total_duration_ms: number;
  };
}

export interface VerifyPreviewResponse {
  similarity_score: number;
  similarity_label: string;
  method_used: ModelType;
  match: boolean;
}

export interface ActiveModelInfo {
  model_type: ModelType;
  accuracy: number;
  f1_score: number;
  far: number;
  frr: number;
  trained_at: string;
}

export interface ProfileResponse {
  user: User;
  samples_collected: number;
  min_required: number;
  active_model: ActiveModelInfo | null;
  auth_phrase: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface ModelMetrics {
  model_type: ModelType;
  is_active: boolean;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  far: number;
  frr: number;
  cv_accuracy_mean: number;
  cv_accuracy_std: number;
  confusion_matrix: number[][];
  confusion_matrix_labels: string[];
  feature_importance: FeatureImportance[];
  created_at: string;
}

export interface TrainingRunResponse {
  id: number;
  scope: TrainingScope;
  status: TrainingStatus;
  message: string | null;
  dataset_samples: number;
  dataset_users: number;
  best_model_type: string | null;
  started_at: string;
  completed_at: string | null;
  models: ModelMetrics[];
}

export interface DatasetStatsResponse {
  total_users: number;
  users_ready: number;
  total_samples: number;
  total_enrollment_samples: number;
  total_verification_samples: number;
  avg_typing_speed_cps: number;
  avg_dwell_ms: number;
  avg_flight_ms: number;
  samples_per_user: Record<string, number>;
}

export interface AttemptRecord {
  id: number;
  attempted_email: string;
  password_correct: boolean;
  method_used: ModelType | null;
  similarity_score: number | null;
  risk_level: RiskLevel;
  decision: AuthDecision;
  details: Record<string, unknown>;
  created_at: string;
}

export interface ActivityResponse {
  attempts: AttemptRecord[];
  total_success: number;
  total_failed: number;
}

export interface ApiErrorBody {
  detail?: string | { field: string; message: string }[];
}
