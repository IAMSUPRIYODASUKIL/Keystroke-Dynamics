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
import { PageHeader } from "@/components/PageHeader";
import { Stagger, StaggerItem } from "@/components/Reveal";
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
  if (!stats) return <PageLoader label="Loading analytics and benchmarks…" />;

  const activeModel = myRun?.models.find((m) => m.is_active) ?? myRun?.models[0];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-(--color-accent)/30 bg-(--color-accent)/10 px-3 py-1 text-xs font-semibold text-(--color-accent)">
            <BrainCircuit size={12} />
            Tri-classifier ensemble
          </span>
        }
        title={
          <>
            ML research <em className="ember-text pr-1 font-normal">laboratory</em>
          </>
        }
        description="Transparent evaluation across Random Forest, Support Vector Machines and Logistic Regression."
      />

      {/* Dataset Telemetry Stat Tiles */}
      <Stagger step={0.07} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatTile icon={Users} accent="ember" label="Enrolled Profiles" value={stats.total_users} hint={`${stats.users_ready} ready for scoring`} />
        </StaggerItem>
        <StaggerItem>
          <StatTile icon={Database} accent="ember" label="Keystroke Samples" value={stats.total_samples} hint="Captured timing matrices" />
        </StaggerItem>
        <StaggerItem>
          <StatTile icon={Gauge} accent="emerald" label="Average Cadence" value={`${stats.avg_typing_speed_cps.toFixed(1)} cps`} hint="Characters per second" />
        </StaggerItem>
        <StaggerItem>
          <StatTile icon={Clock} accent="amber" label="Mean Dwell Time" value={`${stats.avg_dwell_ms.toFixed(0)} ms`} hint="Key depression duration" />
        </StaggerItem>
      </Stagger>

      {/* Samples Per User Distribution Chart */}
      <Card
        title={
          <div className="flex items-center gap-3">
            <BarChart3 size={20} className="text-(--color-accent)" />
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
          <div className="flex items-center gap-3">
            <Cpu size={20} className="text-(--color-accent)" />
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
            <div className="overflow-x-auto rounded-2xl border border-(--color-border) bg-(--color-bg-subtle) shadow-(--field-shadow)">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-(--color-border) text-[11px] font-semibold tracking-[0.12em] text-(--color-text-muted) uppercase">
                    <th className="px-4 py-3.5">Classifier</th>
                    <th className="px-4 py-3.5">Accuracy</th>
                    <th className="px-4 py-3.5">F1 Score</th>
                    <th className="px-4 py-3.5">FAR (False Accept)</th>
                    <th className="px-4 py-3.5">FRR (False Reject)</th>
                    <th className="px-4 py-3.5">CV Accuracy (k-fold)</th>
                    <th className="px-4 py-3.5 text-center">Active Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-border-subtle) font-mono text-xs">
                  {myRun.models.map((m) => (
                    <tr
                      key={m.model_type}
                      className={
                        m.is_active
                          ? "bg-(--color-accent)/8 font-semibold text-(--color-text)"
                          : "text-(--color-text-secondary) hover:bg-(--color-surface-highlight)"
                      }
                    >
                      <td className="flex items-center gap-2 px-4 py-3.5 font-sans font-medium text-(--color-text)">
                        {m.is_active && (
                          <span className="flex h-2 w-2 rounded-full bg-(--color-accent)" />
                        )}
                        {MODEL_LABELS[m.model_type]}
                      </td>
                      <td className="px-4 py-3.5">{formatPercent(m.accuracy)}</td>
                      <td className="px-4 py-3.5">{formatPercent(m.f1_score)}</td>
                      <td className="px-4 py-3.5 text-(--color-warning)">{formatPercent(m.far)}</td>
                      <td className="px-4 py-3.5 text-(--color-danger)">{formatPercent(m.frr)}</td>
                      <td className="px-4 py-3.5">
                        {formatPercent(m.cv_accuracy_mean)} ± {formatPercent(m.cv_accuracy_std)}
                      </td>
                      <td className="px-4 py-3.5 text-center font-sans">
                        {m.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-(--color-success)/30 bg-(--color-success)/12 px-2.5 py-0.5 text-[11px] font-bold text-(--color-success)">
                            <ShieldCheck size={11} />
                            Primary
                          </span>
                        ) : (
                          <span className="text-(--color-text-muted) text-[11px]">Benchmarked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-start gap-2 rounded-2xl border border-(--color-border) bg-(--color-surface-highlight) p-4 text-xs text-(--color-text-muted)">
              <HelpCircle size={15} className="shrink-0 text-(--color-accent) mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-(--color-text)">FAR (False Acceptance Rate)</strong> measures how often an unauthorized imposter rhythm is mistakenly validated.{" "}
                <strong className="text-(--color-text)">FRR (False Rejection Rate)</strong> measures how often your authentic rhythm is wrongly challenged. The system automatically selects the primary classifier with optimal F1 tie-broken toward minimal FAR.
              </p>
            </div>

            {/* Confusion Matrix & Feature Weights */}
            {activeModel && (
              <div className="grid gap-6 lg:grid-cols-2 pt-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-(--color-accent)" />
                    <h4 className="font-display text-lg font-medium tracking-tight text-(--color-text)">
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
                    <Sparkles size={16} className="text-(--color-accent)" />
                    <h4 className="font-display text-lg font-medium tracking-tight text-(--color-text)">
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
          <div className="flex items-center gap-3">
            <Users size={20} className="text-(--color-accent)" />
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

