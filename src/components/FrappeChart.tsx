"use client";

import { useEffect, useRef, useState } from "react";
import type { ChartConfig } from "@/lib/parseChartBlocks";

interface FrappeChartProps {
  config: ChartConfig;
}

export function FrappeChart({ config }: FrappeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;

    let mounted = true;

    const renderChart = async () => {
      try {
        const frappeModule = await import(
          "frappe-charts/dist/frappe-charts.min.esm"
        );
        const Chart = frappeModule.Chart || frappeModule.default?.Chart;

        if (!Chart) {
          throw new Error("Could not load Frappe Charts library");
        }

        if (!mounted || !chartRef.current) return;

        // Clear previous chart
        chartRef.current.innerHTML = "";

        // Build chart options
        const options: Record<string, unknown> = {
          title: config.title || "",
          data: buildChartData(config),
          type: config.type,
          height: config.height || 280,
          colors: config.colors || [
            "#1c1917",
            "#78716c",
            "#a8a29e",
            "#d6d3d1",
          ],
          animate: config.animate ?? 1,
          truncateLegends: config.truncateLegends ?? true,
        };

        // Bar options
        if (config.barOptions) {
          options.barOptions = config.barOptions;
        }

        // Line options
        if (config.lineOptions) {
          options.lineOptions = config.lineOptions;
        }

        // Axis options
        if (config.axisOptions) {
          options.axisOptions = config.axisOptions;
        }

        // Tooltip options
        if (config.tooltipOptions) {
          options.tooltipOptions = config.tooltipOptions;
        }

        // Navigation
        if (config.isNavigable) {
          options.isNavigable = true;
        }

        // Values over points
        if (config.valuesOverPoints) {
          options.valuesOverPoints = config.valuesOverPoints;
        }

        // Max slices for pie/percentage/donut
        if (config.maxSlices) {
          options.maxSlices = config.maxSlices;
        }

        // Heatmap-specific options
        if (config.type === "heatmap") {
          if (config.discreteDomains !== undefined) {
            options.discreteDomains = config.discreteDomains;
          }
          if (config.radius !== undefined) {
            options.radius = config.radius;
          }
        }

        const chart = new Chart(chartRef.current, options);
        chartInstanceRef.current = chart;

        if (mounted) {
          setIsRendered(true);
        }
      } catch (err) {
        if (mounted) {
          console.error("Chart render error:", err);
          setError(
            err instanceof Error ? err.message : "Failed to render chart"
          );
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(renderChart, 50);

    return () => {
      mounted = false;
      clearTimeout(timer);
      chartInstanceRef.current = null;
    };
  }, [config]);

  if (error) {
    return (
      <div className="border border-black/10 rounded-[2px] p-6 text-center">
        <p className="text-[10px] uppercase tracking-widest text-black/40 font-medium">
          Chart rendering error
        </p>
        <p className="text-xs text-black/30 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className={isRendered ? "animate-chart-reveal" : ""}>
      <div className="border border-black/10 rounded-[2px] bg-white p-6 overflow-hidden">
        {config.title && (
          <div className="mb-4 pb-3 border-b border-black/5">
            <span className="text-[10px] uppercase tracking-widest text-black/40 font-medium">
              Visualization
            </span>
          </div>
        )}
        <div ref={chartRef} className="w-full min-h-[100px]" />
      </div>
    </div>
  );
}

function buildChartData(config: ChartConfig): Record<string, unknown> {
  if (config.type === "heatmap") {
    const dataPoints: Record<string, number> = {};
    if (config.data.dataPoints) {
      for (const [key, value] of Object.entries(config.data.dataPoints)) {
        dataPoints[key] = value;
      }
    }

    const startDate = config.data.start
      ? new Date(config.data.start)
      : new Date();
    const endDate = config.data.end ? new Date(config.data.end) : new Date();

    return {
      dataPoints,
      start: startDate,
      end: endDate,
    };
  }

  const data: Record<string, unknown> = {
    labels: config.data.labels || [],
    datasets: config.data.datasets || [],
  };

  if (config.data.yMarkers) {
    data.yMarkers = config.data.yMarkers;
  }

  if (config.data.yRegions) {
    data.yRegions = config.data.yRegions;
  }

  return data;
}
