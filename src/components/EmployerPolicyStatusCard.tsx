import { useState, useEffect } from "react";
import { fetchEmployerPolicyStatus, EmployerPolicyStatusResponse } from "../services/insights.api";
import { SimplePieChart } from "./SimpleCharts";

export const EmployerPolicyStatusCard = ({ dateRange }: { dateRange?: { start: string, end: string } }) => {
  const [data, setData] = useState<EmployerPolicyStatusResponse | null>(null);

  useEffect(() => {
    fetchEmployerPolicyStatus(dateRange).then(setData).catch(console.error);
  }, [dateRange]);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: 16,
        minHeight: "auto" // no forced tall height
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>Employer Policy Status</span>
        <span style={{ fontSize: 22, fontWeight: 700 }}>{data ? data.total : "..."}</span>
      </div>

      {data && (
        <div style={{ marginTop: 4 }}>
          <SimplePieChart
            width={120}  
            height={120}
            data={[
              { label: "Accepted", value: data.accepted, color: "#1e8e3e" },
              { label: "Not Accepted", value: data.notAccepted, color: "#d93025" }
            ]}
          />
        </div>
      )}
    </div>
  );
};
