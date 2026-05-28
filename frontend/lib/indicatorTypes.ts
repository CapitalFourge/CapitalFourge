// Type definition for indicator data
export interface IndicatorData {
  id: string;
  data: { [key: string]: number | string }[];
  type: "line" | "area" | "histogram";
  yAxisId?: number;
  stroke?: string;
  fill?: string;
}