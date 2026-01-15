import { useState, useEffect } from "react";
import { fetchJobsByCountryAnalysis, JobCountryAnalysis } from "../services/insights.api";

export const JobsByCountryCard = ({ dateRange }: { dateRange?: { start: string, end: string } }) => {
  const [items, setItems] = useState<JobCountryAnalysis[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = async (page: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const response = await fetchJobsByCountryAnalysis(page, 10, dateRange);
      if (append) {
        setItems((prev) => [...prev, ...response.data]);
      } else {
        setItems(response.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [dateRange]);

  const handleShowMore = () => {
    setShowModal(true);
  };

  const downloadCSV = async () => {
    const response = await fetchJobsByCountryAnalysis(1, 'all', dateRange);
    const allData = response.data;
    if (!allData.length) return;
    
    const rows = [];
    rows.push(["Country", "Job Role", "Count"].join(","));
    
    allData.forEach((item: JobCountryAnalysis) => {
      item.jobs.forEach(job => {
        rows.push(`"${item.country}","${job.role}",${job.count}`);
      });
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jobs_by_country.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const List = ({ data }: { data: JobCountryAnalysis[] }) => (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr style={{ textAlign: "left", color: "#666", borderBottom: "1px solid #eee" }}>
          <th style={{ padding: "8px 0" }}>Country</th>
          <th style={{ padding: "8px 0" }}>Job</th>
          <th style={{ padding: "8px 0", textAlign: "right" }}>Count</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, i) => {
          return item.jobs.map((job, j) => (
            <tr key={`${item.country}-${job.role}-${j}`} style={{ borderBottom: j === item.jobs.length - 1 ? "1px solid #f5f5f5" : "none" }}>
              {j === 0 && (
                <td 
                  rowSpan={item.jobs.length} 
                  style={{ 
                    padding: "12px 0", 
                    fontWeight: 500, 
                    verticalAlign: "top",
                    borderRight: "1px solid #f0f0f0",
                    width: "35%"
                  }}
                >
                  {item.country || "Unknown"}
                  <div style={{ fontSize: 11, color: "#999", fontWeight: "normal", marginTop: 4 }}>
                    Total: {item.totalCount}
                  </div>
                </td>
              )}
              <td style={{ padding: "8px 12px", color: "#333", verticalAlign: "top" }}>{job.role}</td>
              <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 600, verticalAlign: "top" }}>{job.count}</td>
            </tr>
          ));
        })}
      </tbody>
    </table>
  );

  return (
    <>
      <div style={{
        background: "#ffffff", borderRadius: 12, padding: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
        gridColumn: "span 2"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Jobs by Country</h3>
          <button onClick={handleShowMore} style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", fontSize: 14 }}>
            Show More
          </button>
        </div>
        <List data={items.slice(0, 5)} />
      </div>

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", width: "800px", maxHeight: "80vh", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Jobs by Country</h2>
                <button onClick={downloadCSV} style={{ padding: "4px 12px", cursor: "pointer", fontSize: 12 }}>Download CSV</button>
              </div>
              <button onClick={() => setShowModal(false)} style={{ cursor: "pointer", border: "none", background: "none", fontSize: 20 }}>&times;</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: 8 }}>
              <List data={items} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
