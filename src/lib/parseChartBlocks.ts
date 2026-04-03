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

export interface ParsedSegment {
  type: "text" | "chart";
  content: string;
  chartConfig?: ChartConfig;
}

export function parseChartBlocks(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const chartRegex = /```chart\s*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = chartRegex.exec(text)) !== null) {
    // Add text before the chart block
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim();
      if (textContent) {
        segments.push({ type: "text", content: textContent });
      }
    }

    // Parse the chart JSON
    try {
      const jsonStr = match[1].trim();
      const chartConfig = JSON.parse(jsonStr) as ChartConfig;
      segments.push({
        type: "chart",
        content: match[0],
        chartConfig,
      });
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
