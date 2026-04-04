export interface ChartConfig {
  type: "bar" | "line" | "axis-mixed" | "pie" | "percentage" | "heatmap" | "donut" | "scatter";
  title?: string;
  data: {
    labels?: string[];
    datasets?: Array<{
      name?: string;
      values: number[];
      chartType?: "bar" | "line";
    }>;
    dataPoints?: Record<string, number>;
    start?: string;
    end?: string;
    yMarkers?: Array<{
      label: string;
      value: number;
      options?: { labelPos?: string };
    }>;
    yRegions?: Array<{
      label: string;
      start: number;
      end: number;
      options?: { labelPos?: string };
    }>;
  };
  height?: number;
  colors?: string[];
  barOptions?: {
    spaceRatio?: number;
    stacked?: number;
    height?: number;
  };
  lineOptions?: {
    regionFill?: number;
    dotSize?: number;
    hideDots?: number;
    hideLine?: number;
    heatline?: number;
    spline?: number;
  };
  axisOptions?: {
    xAxisMode?: string;
    yAxisMode?: string;
    xIsSeries?: boolean | number;
  };
  tooltipOptions?: {
    formatTooltipX?: string;
    formatTooltipY?: string;
  };
  isNavigable?: boolean;
  valuesOverPoints?: number;
  maxSlices?: number;
  discreteDomains?: number;
  radius?: number;
  animate?: number;
  truncateLegends?: boolean;
}

export interface DashboardConfig {
  title: string;
  description?: string;
  columns?: number;
  charts: ChartConfig[];
  kpis?: Array<{
    label: string;
    value: string;
    change?: string;
    trend?: "up" | "down" | "neutral";
  }>;
}

export interface ParsedSegment {
  type: "text" | "chart" | "dashboard";
  content: string;
  chartConfig?: ChartConfig;
  dashboardConfig?: DashboardConfig;
}

/**
 * Sanitize common LLM JSON mistakes:
 * - Remove % signs from numeric values in arrays: [25%, 20%] -> [25, 20]
 * - Remove $ signs from numeric values in arrays: [$80, $90] -> [80, 90]
 * - Fix trailing commas before closing brackets
 */
function sanitizeJsonValues(json: string): string {
  // Remove %, $ from values inside arrays: [ 25%, $80 ] -> [ 25, 80 ]
  let sanitized = json.replace(/:\s*\[([^\]]*)\]/g, (match, inner) => {
    const cleaned = inner.replace(/[$%]/g, "").replace(/\s+/g, " ");
    return ": [" + cleaned + "]";
  });
  // Remove trailing commas before ] or }
  sanitized = sanitized.replace(/,\s*([}\]])/g, "$1");
  return sanitized;
}

export function parseChartBlocks(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  // Match both ```chart and ```dashboard blocks
  const blockRegex = /```(chart|dashboard)\s*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = blockRegex.exec(text)) !== null) {
    // Add text before the block
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim();
      if (textContent) {
        segments.push({ type: "text", content: textContent });
      }
    }

    const blockType = match[1] as "chart" | "dashboard";
    const jsonStr = match[2].trim();

    // Parse the JSON - sanitize common LLM mistakes first
    try {
      const sanitized = sanitizeJsonValues(jsonStr);
      if (blockType === "dashboard") {
        const dashboardConfig = JSON.parse(sanitized) as DashboardConfig;
        segments.push({
          type: "dashboard",
          content: match[0],
          dashboardConfig,
        });
      } else {
        const chartConfig = JSON.parse(sanitized) as ChartConfig;
        segments.push({
          type: "chart",
          content: match[0],
          chartConfig,
        });
      }
    } catch (e) {
      // If JSON parsing fails, treat as text
      segments.push({ type: "text", content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const textContent = text.slice(lastIndex).trim();
    if (textContent) {
      segments.push({ type: "text", content: textContent });
    }
  }

  return segments;
}
