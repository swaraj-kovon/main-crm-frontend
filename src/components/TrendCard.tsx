import { useState, useEffect } from "react";
import { TrendSeries } from "../services/insights.api";
import { SimpleLineChart } from "./SimpleCharts";

interface TrendCardProps {
  title: string;
  fetchData: (dates?: { start: string; end: string }) => Promise<TrendSeries[]>;
  dateRange?: { start: string; end: string };
  color?: string;
}

export const TrendCard = ({ title, fetchData, dateRange, color }: TrendCardProps) => {
  const [data, setData] = useState<TrendSeries[]>([]);

  useEffect(() => {
    const load = async () => {
      let range = dateRange;
      // Default to last 7 days if no range provided
      if (!dateRange?.start && !dateRange?.end) {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        range = {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
      
      try {
        const result = await fetchData(range);
        // Override color if provided
        if (color && result.length > 0) {
            result[0].color = color;
        }
        setData(result);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [dateRange, fetchData, color]);

  return (
    <div style={{
      background: "#ffffff", borderRadius: 12, padding: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.05)"
    }}>
      <h4 style={{ margin: "0 0 16px 0", fontSize: 14, color: "#666" }}>{title} Trend</h4>
      <SimpleLineChart data={data} height={400} />
    </div>
  );
};