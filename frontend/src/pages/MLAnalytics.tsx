import { useCallback, useEffect, useState } from "react";
import {
  BrainCircuit,
  Users,
  Database,
  Gauge,
  Clock,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { PageLoader } from "@/components/PageLoader";
import { EmptyState } from "@/components/EmptyState";
import { ModelComparisonChart } from "@/components/charts/ModelComparisonChart";
import { FeatureImportanceChart } from "@/components/charts/FeatureImportanceChart";
import { ConfusionMatrixTable } from "@/components/charts/ConfusionMatrixTable";
import { SamplesPerUserChart } from "@/components/charts/SamplesPerUserChart";
import { mlApi, friendlyErrorMessage } from "@/services/api";
import type { DatasetStatsResponse, TrainingRunResponse } from "@/types";
import { MODEL_LABELS, formatPercent } from "@/utils/format";

export function MLAnalytics() {
  const [stats, setStats] = useState<DatasetStatsResponse | null>(null);
  const [myRun, setMyRun] = useState<TrainingRunResponse | null>(null);
  const [globalRun, setGlobalRun] = useState<TrainingRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTrainingGlobal, setIsTrainingGlobal] = useState(false);
  const [isTrainingMine, setIsTrainingMine] = useState(false);

  const load = useCallback(async () => {
    try {
      const [statsData, myRunData, globalRunData] = await Promise.all([
        mlApi.datasetStats(),
        mlApi.myStatus(),
        mlApi.globalStatus(),
      ]);
      setStats(statsData);
      setMyRun(myRunData);
      setGlobalRun(globalRunData);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleTrainMine() {
    setIsTrainingMine(true);
    try {
      await mlApi.trainMine();
      await load();
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setIsTrainingMine(false);
    }
  }

  async function handleTrainGlobal() {
    setIsTrainingGlobal(true);
    try {
      await mlApi.trainGlobal();
      await load();
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setIsTrainingGlobal(false);
    }
  }

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!stats) return <PageLoader label="Loading machine learning analytics & benchmarks…" />;

  const activeModel = myRun?.models.find((m) => m.is_active) ?? myRun?.models[0];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
              ML Research Laboratory
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
              <BrainCircuit size={12} />
              Tri-Classifier Ensemble
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Transparent algorithmic evaluation across Random Forest, Support Vector Machines, and Logistic Regression.
          </p>
        </div>
      </div>

      {/* Dataset Telemetry Stat Tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={Users}
          accent="cyan"
          label="Enrolled Profiles"
          value={stats.total_users}
          hint={`${stats.users_ready} ready for scoring`}
        />
        <StatTile
          icon={Database}
          accent="violet"
          label="Keystroke Samples"
          value={stats.total_samples}
          hint="Captured timing matrices"
        />
        <StatTile
          icon={Gauge}
          accent="emerald"
          label="Average Cadence"
          value={`${stats.avg_typing_speed_cps.toFixed(1)} cps`}
          hint="Characters per second"
        />
        <StatTile
          icon={Clock}
          accent="amber"
          label="Mean Dwell Time"
          value={`${stats.avg_dwell_ms.toFixed(0)} ms`}
          hint="Key depression duration"
        />
      </div>

      {/* Samples Per User Distribution Chart */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[var(--color-accent)]" />
            <span>Dataset Distribution</span>
          </div>
        }
        subtitle="Keystroke sample density across enrolled user cohorts"
      >
        {Object.keys(stats.samples_per_user).length === 0 ? (
          <EmptyState title="No samples captured yet" description="Enroll at least one user to populate this chart." />
        ) : (
          <SamplesPerUserChart samplesPerUser={stats.samples_per_user} />
        )}
      </Card>

      {/* Model Comparison & Tri-Model Performance */}
      <Card
        variant="glow"
        title={
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-[var(--color-accent)]" />
            <span>Your Personal Verification Ensemble</span>
          </div>
        }
        subtitle="Random Forest vs. SVM vs. Logistic Regression trained on your authentic samples against impostors"
        actions={
          <Button
            variant="secondary"
            size="sm"
            isLoading={isTrainingMine}
            onClick={handleTrainMine}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={isTrainingMine ? "animate-spin" : ""} />
            <span>Retrain Models</span>
          </Button>
        }
      >
        {!myRun || myRun.status !== "completed" ? (
          <EmptyState
            title={myRun?.status === "insufficient_data" ? "Insufficient Training Data" : "No Training Run Yet"}
            description={
              myRun?.message ??
              "Complete typing enrollment (with at least one other enrolled user) to train and compare classifiers."
            }
          />
        ) : (
          <div className="flex flex-col gap-6">
            <ModelComparisonChart models={myRun.models} />

            {/* Performance Benchmark Table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/60 backdrop-blur-md">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="py-3 px-4">Classifier</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">F1 Score</th>
                    <th className="py-3 px-4">FAR (False Accept)</th>
                    <th className="py-3 px-4">FRR (False Reject)</th>
                    <th className="py-3 px-4">CV Accuracy (k-fold)</th>
                    <th className="py-3 px-4 text-center">Active Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] font-mono text-xs">
                  {myRun.models.map((m) => (
                    <tr
                      key={m.model_type}
                      className={
                        m.is_active
                          ? "bg-[var(--color-accent)]/5 font-semibold text-[var(--color-text)]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]"
                      }
                    >
                      <td className="py-3 px-4 font-sans font-medium text-[var(--color-text)] flex items-center gap-2">
                        {m.is_active && (
                          <span className="flex h-2 w-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                        )}
                        {MODEL_LABELS[m.model_type]}
                      </td>
                      <td className="py-3 px-4">{formatPercent(m.accuracy)}</td>
                      <td className="py-3 px-4">{formatPercent(m.f1_score)}</td>
                      <td className="py-3 px-4 text-amber-400">{formatPercent(m.far)}</td>
                      <td className="py-3 px-4 text-rose-400">{formatPercent(m.frr)}</td>
                      <td className="py-3 px-4">
                        {formatPercent(m.cv_accuracy_mean)} ± {formatPercent(m.cv_accuracy_std)}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        {m.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                            <ShieldCheck size={11} />
                            Primary
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-muted)] text-[11px]">Benchmarked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-3.5 text-xs text-[var(--color-text-muted)]">
              <HelpCircle size={15} className="shrink-0 text-[var(--color-accent)] mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-[var(--color-text)]">FAR (False Acceptance Rate)</strong> measures how often an unauthorized imposter rhythm is mistakenly validated.{" "}
                <strong className="text-[var(--color-text)]">FRR (False Rejection Rate)</strong> measures how often your authentic rhythm is wrongly challenged. The system automatically selects the primary classifier with optimal F1 tie-broken toward minimal FAR.
              </p>
            </div>

            {/* Confusion Matrix & Feature Weights */}
            {activeModel && (
              <div className="grid gap-6 lg:grid-cols-2 pt-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-[var(--color-accent)]" />
                    <h4 className="text-sm font-semibold text-[var(--color-text)]">
                      Confusion Matrix — {MODEL_LABELS[activeModel.model_type]}
                    </h4>
                  </div>
                  <ConfusionMatrixTable
                    matrix={activeModel.confusion_matrix}
                    labels={activeModel.confusion_matrix_labels}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[var(--color-accent)]" />
                    <h4 className="text-sm font-semibold text-[var(--color-text)]">
                      Feature Weight Ranking — {MODEL_LABELS[activeModel.model_type]}
                    </h4>
                  </div>
                  <FeatureImportanceChart features={activeModel.feature_importance} />
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Global Multi-User Classifier (Demo) */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[var(--color-accent)]" />
            <span>Multi-User Global Classification (Demo Benchmark)</span>
          </div>
        }
        subtitle='"Which enrolled user does this cadence match?" — trained across all enrolled profiles'
        actions={
          <Button
            variant="secondary"
            size="sm"
            isLoading={isTrainingGlobal}
            onClick={handleTrainGlobal}
            className="flex items-center gap-1.5"
          >
            <BrainCircuit size={13} />
            <span>Train Global Model</span>
          </Button>
        }
      >
        {!globalRun || globalRun.status !== "completed" ? (
          <EmptyState
            title={globalRun?.status === "insufficient_data" ? "Insufficient Cohort Size" : "No Global Run Yet"}
            description={globalRun?.message ?? "At least two fully enrolled users are required for multi-class ranking."}
          />
        ) : (
          <ModelComparisonChart models={globalRun.models} />
        )}
      </Card>
    </div>
  );
}

