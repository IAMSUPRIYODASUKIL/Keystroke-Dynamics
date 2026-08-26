import { useCallback, useEffect, useState } from "react";
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
  if (!stats) return <PageLoader label="Loading dataset and model statistics…" />;

  const activeModel = myRun?.models.find((m) => m.is_active) ?? myRun?.models[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">ML Analytics</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Every number below comes from an actual training run against the collected dataset — nothing
          is simulated.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Enrolled users" value={stats.total_users} hint={`${stats.users_ready} fully enrolled`} />
        <StatTile label="Total samples" value={stats.total_samples} />
        <StatTile label="Avg typing speed" value={`${stats.avg_typing_speed_cps.toFixed(1)} cps`} />
        <StatTile label="Avg dwell time" value={`${stats.avg_dwell_ms.toFixed(0)} ms`} />
      </div>

      <Card title="Samples per user">
        {Object.keys(stats.samples_per_user).length === 0 ? (
          <EmptyState title="No samples yet" description="Enroll at least one user to see this chart." />
        ) : (
          <SamplesPerUserChart samplesPerUser={stats.samples_per_user} />
        )}
      </Card>

      <Card
        title="Your verification model — comparison"
        subtitle="Random Forest vs. SVM vs. Logistic Regression, trained on your enrollment samples vs. other enrolled users"
        actions={
          <Button variant="secondary" isLoading={isTrainingMine} onClick={handleTrainMine}>
            Retrain
          </Button>
        }
      >
        {!myRun || myRun.status !== "completed" ? (
          <EmptyState
            title={myRun?.status === "insufficient_data" ? "Not enough data yet" : "No training run yet"}
            description={
              myRun?.message ??
              "Complete typing enrollment (and have at least one other enrolled user) to train and compare models."
            }
          />
        ) : (
          <>
            <ModelComparisonChart models={myRun.models} />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--color-text-muted)] uppercase">
                    <th className="py-2 pr-4">Model</th>
                    <th className="py-2 pr-4">Accuracy</th>
                    <th className="py-2 pr-4">F1</th>
                    <th className="py-2 pr-4">FAR</th>
                    <th className="py-2 pr-4">FRR</th>
                    <th className="py-2 pr-4">CV accuracy</th>
                    <th className="py-2">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {myRun.models.map((m) => (
                    <tr key={m.model_type} className="border-t border-[var(--color-border)]">
                      <td className="py-2 pr-4 font-medium text-[var(--color-text)]">{MODEL_LABELS[m.model_type]}</td>
                      <td className="py-2 pr-4">{formatPercent(m.accuracy)}</td>
                      <td className="py-2 pr-4">{formatPercent(m.f1_score)}</td>
                      <td className="py-2 pr-4">{formatPercent(m.far)}</td>
                      <td className="py-2 pr-4">{formatPercent(m.frr)}</td>
                      <td className="py-2 pr-4">
                        {formatPercent(m.cv_accuracy_mean)} ± {formatPercent(m.cv_accuracy_std)}
                      </td>
                      <td className="py-2">{m.is_active ? "✓" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              FAR (False Acceptance Rate) is how often an impostor sample was wrongly accepted as
              genuine; FRR (False Rejection Rate) is how often your own sample was wrongly rejected. The
              active model is chosen by highest F1 score, tie-broken toward the lower FAR.
            </p>

            {activeModel && (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-[var(--color-text)]">
                    Confusion matrix — {MODEL_LABELS[activeModel.model_type]}
                  </h4>
                  <ConfusionMatrixTable
                    matrix={activeModel.confusion_matrix}
                    labels={activeModel.confusion_matrix_labels}
                  />
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-[var(--color-text)]">
                    Feature importance — {MODEL_LABELS[activeModel.model_type]}
                  </h4>
                  <FeatureImportanceChart features={activeModel.feature_importance} />
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Card
        title="Multi-user classification (demo)"
        subtitle='"Which enrolled user does this sample resemble?" — trained across every enrolled user'
        actions={
          <Button variant="secondary" isLoading={isTrainingGlobal} onClick={handleTrainGlobal}>
            Train global model
          </Button>
        }
      >
        {!globalRun || globalRun.status !== "completed" ? (
          <EmptyState
            title={globalRun?.status === "insufficient_data" ? "Not enough users yet" : "No training run yet"}
            description={globalRun?.message ?? "At least two fully enrolled users are required."}
          />
        ) : (
          <ModelComparisonChart models={globalRun.models} />
        )}
      </Card>
    </div>
  );
}
