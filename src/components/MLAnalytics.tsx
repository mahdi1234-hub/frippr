"use client";

import { useState } from "react";

interface ModelScore {
  model: string;
  accuracy?: number;
  f1?: number;
  precision?: number;
  recall?: number;
  r2?: number;
  mae?: number;
  rmse?: number;
  cv_mean?: number;
  cv_r2_mean?: number;
  [key: string]: unknown;
}

interface MLResults {
  task_type: string;
  auto_detected_task?: string;
  target?: string;
  dataset_summary?: {
    shape?: { rows: number; columns: number };
    columns?: string[];
    numeric_columns?: string[];
    categorical_columns?: string[];
    missing_values?: Record<string, number>;
  };
  preprocessing?: {
    train_size?: number;
    test_size?: number;
    n_features?: number;
    n_classes?: number;
    class_names?: string[];
  };
  model_comparison?: ModelScore[];
  best_model?: { name: string; params?: string };
  metrics?: Record<string, unknown>;
  plots?: Record<string, string>;
  feature_importance?: Record<string, number>;
  predictions_sample?: Array<{ actual: string | number; predicted: string | number }>;
  cluster_profiles?: Record<string, unknown>;
  anomaly_summary?: Record<string, unknown>;
  models?: Record<string, unknown>;
}

interface MLAnalyticsProps {
  results: MLResults;
}

export function MLAnalytics({ results }: MLAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [expandedPlot, setExpandedPlot] = useState<string | null>(null);

  const taskType = results.auto_detected_task || results.task_type;
  const plots = results.plots || {};
  const plotKeys = Object.keys(plots);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "models", label: "Models" },
    ...(plotKeys.length > 0 ? [{ id: "plots", label: `Plots (${plotKeys.length})` }] : []),
    ...(results.feature_importance && Object.keys(results.feature_importance).length > 0
      ? [{ id: "features", label: "Features" }]
      : []),
    ...(results.predictions_sample && results.predictions_sample.length > 0
      ? [{ id: "predictions", label: "Predictions" }]
      : []),
  ];

  return (
    <div className="animate-chart-reveal">
      <div className="border border-black/10 rounded-[2px] bg-[#fafaf9] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1c1917] text-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">
                AutoML Analytics
              </span>
              <h3 className="font-serif text-lg font-light">
                {taskType === "classification"
                  ? "Classification Analysis"
                  : taskType === "regression"
                    ? "Regression Analysis"
                    : taskType === "clustering"
                      ? "Clustering Analysis"
                      : "Anomaly Detection Analysis"}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {results.target && (
                <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full">
                  Target: {results.target}
                </span>
              )}
              <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full capitalize">
                {taskType}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-black/10 px-6 flex gap-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[10px] uppercase tracking-widest font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-[#1c1917] border-[#1c1917]"
                  : "text-black/40 border-transparent hover:text-black/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <OverviewTab results={results} taskType={taskType} />
          )}
          {activeTab === "models" && (
            <ModelsTab results={results} taskType={taskType} />
          )}
          {activeTab === "plots" && (
            <PlotsTab
              plots={plots}
              expandedPlot={expandedPlot}
              setExpandedPlot={setExpandedPlot}
            />
          )}
          {activeTab === "features" && (
            <FeaturesTab featureImportance={results.feature_importance || {}} />
          )}
          {activeTab === "predictions" && (
            <PredictionsTab predictions={results.predictions_sample || []} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-black/5 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-black/25 font-medium">
            {plotKeys.length} plots generated
          </span>
          <span className="text-[9px] uppercase tracking-widest text-black/25 font-medium">
            Powered by AutoML Pipeline
          </span>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ results, taskType }: { results: MLResults; taskType: string }) {
  const summary = results.dataset_summary;
  const prep = results.preprocessing;
  const best = results.best_model;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summary?.shape && (
          <>
            <KPICard label="Rows" value={summary.shape.rows.toLocaleString()} />
            <KPICard label="Features" value={String(summary.shape.columns)} />
          </>
        )}
        {prep?.n_classes && (
          <KPICard label="Classes" value={String(prep.n_classes)} />
        )}
        {best?.name && <KPICard label="Best Model" value={best.name} />}
        {results.model_comparison && (
          <KPICard
            label="Models Tested"
            value={String(results.model_comparison.length)}
          />
        )}
        {taskType === "classification" && results.model_comparison?.[0] && (
          <KPICard
            label="Best Accuracy"
            value={`${((results.model_comparison[0].accuracy || 0) * 100).toFixed(1)}%`}
          />
        )}
        {taskType === "regression" && results.model_comparison?.[0] && (
          <KPICard
            label="Best R2"
            value={String(results.model_comparison[0].r2 || "N/A")}
          />
        )}
        {results.anomaly_summary && (
          <>
            <KPICard
              label="Anomalies"
              value={String(
                (results.anomaly_summary as Record<string, unknown>).anomalies_detected || 0
              )}
            />
            <KPICard
              label="Anomaly %"
              value={`${(results.anomaly_summary as Record<string, unknown>).anomaly_percentage || 0}%`}
            />
          </>
        )}
      </div>

      {/* Dataset info */}
      {summary?.columns && (
        <div className="bg-white border border-black/10 rounded-[2px] p-4">
          <span className="text-[10px] uppercase tracking-widest text-black/40 font-medium block mb-2">
            Dataset Columns
          </span>
          <div className="flex flex-wrap gap-1.5">
            {summary.columns.map((col) => (
              <span
                key={col}
                className="text-[11px] bg-black/5 px-2 py-1 rounded-[1px] text-black/60"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Class names */}
      {prep?.class_names && (
        <div className="bg-white border border-black/10 rounded-[2px] p-4">
          <span className="text-[10px] uppercase tracking-widest text-black/40 font-medium block mb-2">
            Classes
          </span>
          <div className="flex flex-wrap gap-2">
            {prep.class_names.map((cls) => (
              <span
                key={cls}
                className="text-[11px] bg-[#1c1917] text-white px-3 py-1 rounded-full"
              >
                {cls}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ModelsTab({ results, taskType }: { results: MLResults; taskType: string }) {
  const comparison = results.model_comparison || [];
  const isClassification = taskType === "classification";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10">
            <th className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-black/40 font-medium">
              Model
            </th>
            {isClassification ? (
              <>
                <th className="text-right py-2 px-3 text-[10px] uppercase tracking-widest text-black/40 font-medium">
                  Accuracy
                </th>
                <th className="text-right py-2 px-3 text-[10px] uppercase tracking-widest text-black/40 font-medium">
                  F1
                </th>
                <th className="text-right py-2 px-3 text-[10px] uppercase tracking-widest text-black/40 font-medium">
                  Precision
                </th>
                <th className="text-right py-2 px-3 text-[10px] uppercase tracking-widest text-black/40 font-medium">
                  Recall
                </th>
                <th className="text-right py-2 px-3 text-[10px] uppercase tracking-widest text-black/40 font-medium">
                  CV Mean
                </th>
              </>
            ) : (
              <>
                <th className="text-right py-2 px-3 text-[10px] uppercase tracking-widest text-black/40 font-medium">
                  R2
                </th>
                <th className="text-right py-2 px-3 text-[10px] uppercase tracking-widest text-black/40 font-medium">
                  MAE
                </th>
                <th className="text-right py-2 px-3 text-[10px] uppercase tracking-widest text-black/40 font-medium">
                  RMSE
                </th>
                <th className="text-right py-2 px-3 text-[10px] uppercase tracking-widest text-black/40 font-medium">
                  CV R2
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {comparison.map((m, i) => (
            <tr
              key={m.model}
              className={`border-b border-black/5 ${i === 0 ? "bg-[#1c1917]/5" : ""}`}
            >
              <td className="py-2 px-3 font-light text-[13px]">
                {i === 0 && (
                  <span className="inline-block w-1.5 h-1.5 bg-[#4a7c6f] rounded-full mr-2" />
                )}
                {m.model}
              </td>
              {isClassification ? (
                <>
                  <td className="text-right py-2 px-3 font-mono text-[12px]">
                    {((m.accuracy || 0) * 100).toFixed(1)}%
                  </td>
                  <td className="text-right py-2 px-3 font-mono text-[12px]">
                    {(m.f1 || 0).toFixed(4)}
                  </td>
                  <td className="text-right py-2 px-3 font-mono text-[12px]">
                    {(m.precision || 0).toFixed(4)}
                  </td>
                  <td className="text-right py-2 px-3 font-mono text-[12px]">
                    {(m.recall || 0).toFixed(4)}
                  </td>
                  <td className="text-right py-2 px-3 font-mono text-[12px]">
                    {((m.cv_mean || 0) * 100).toFixed(1)}%
                  </td>
                </>
              ) : (
                <>
                  <td className="text-right py-2 px-3 font-mono text-[12px]">
                    {(m.r2 || 0).toFixed(4)}
                  </td>
                  <td className="text-right py-2 px-3 font-mono text-[12px]">
                    {(m.mae || 0).toFixed(4)}
                  </td>
                  <td className="text-right py-2 px-3 font-mono text-[12px]">
                    {(m.rmse || 0).toFixed(4)}
                  </td>
                  <td className="text-right py-2 px-3 font-mono text-[12px]">
                    {(m.cv_r2_mean || 0).toFixed(4)}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlotsTab({
  plots,
  expandedPlot,
  setExpandedPlot,
}: {
  plots: Record<string, string>;
  expandedPlot: string | null;
  setExpandedPlot: (key: string | null) => void;
}) {
  const plotEntries = Object.entries(plots);

  if (expandedPlot && plots[expandedPlot]) {
    return (
      <div>
        <button
          onClick={() => setExpandedPlot(null)}
          className="mb-3 text-[10px] uppercase tracking-widest text-black/40 font-medium hover:text-black/60 transition-colors"
        >
          &larr; Back to all plots
        </button>
        <div className="bg-white border border-black/10 rounded-[2px] p-4">
          <h4 className="text-sm font-light text-black/70 mb-3">{expandedPlot}</h4>
          <img
            src={`data:image/png;base64,${plots[expandedPlot]}`}
            alt={expandedPlot}
            className="w-full rounded-[2px]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {plotEntries.map(([name, b64]) => (
        <button
          key={name}
          onClick={() => setExpandedPlot(name)}
          className="bg-white border border-black/10 rounded-[2px] p-3 hover:border-black/25 transition-colors text-left"
        >
          <span className="text-[10px] uppercase tracking-widest text-black/40 font-medium block mb-2">
            {name}
          </span>
          <img
            src={`data:image/png;base64,${b64}`}
            alt={name}
            className="w-full rounded-[1px]"
          />
        </button>
      ))}
    </div>
  );
}

function FeaturesTab({ featureImportance }: { featureImportance: Record<string, number> }) {
  const sorted = Object.entries(featureImportance).sort((a, b) => b[1] - a[1]);
  const maxVal = sorted[0]?.[1] || 1;

  return (
    <div className="space-y-2">
      {sorted.map(([name, value]) => (
        <div key={name} className="flex items-center gap-3">
          <span className="text-[12px] font-light text-black/60 w-40 truncate text-right">
            {name}
          </span>
          <div className="flex-1 bg-black/5 rounded-full h-4 overflow-hidden">
            <div
              className="bg-[#1c1917] h-full rounded-full transition-all duration-500"
              style={{ width: `${(value / maxVal) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-black/40 w-16">
            {value.toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PredictionsTab({
  predictions,
}: {
  predictions: Array<{ actual: string | number; predicted: string | number }>;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-black/10">
          <th className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-black/40 font-medium">
            #
          </th>
          <th className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-black/40 font-medium">
            Actual
          </th>
          <th className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-black/40 font-medium">
            Predicted
          </th>
          <th className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-black/40 font-medium">
            Match
          </th>
        </tr>
      </thead>
      <tbody>
        {predictions.map((p, i) => {
          const match = String(p.actual) === String(p.predicted);
          return (
            <tr key={i} className="border-b border-black/5">
              <td className="py-2 px-3 font-mono text-[12px] text-black/40">
                {i + 1}
              </td>
              <td className="py-2 px-3 font-light text-[13px]">{String(p.actual)}</td>
              <td className="py-2 px-3 font-light text-[13px]">{String(p.predicted)}</td>
              <td className="py-2 px-3">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${match ? "bg-[#4a7c6f]" : "bg-[#c0392b]"}`}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function KPICard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-black/10 rounded-[2px] p-3">
      <span className="text-[9px] uppercase tracking-widest text-black/40 font-medium block mb-1">
        {label}
      </span>
      <span className="font-serif text-base font-light text-[#1c1917]">{value}</span>
    </div>
  );
}
