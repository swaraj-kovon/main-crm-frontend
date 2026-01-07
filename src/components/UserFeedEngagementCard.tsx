import { useState, useEffect } from "react";
import { fetchUserFeedEngagement, UserFeedEngagementItem } from "../services/insights.api";
import { supabase } from "../pages/supabaseClient";

type UserFeedEngagementItemWithAssign = UserFeedEngagementItem & { assigned_to?: string };

export const UserFeedEngagementCard = ({ dateRange, currentUser }: { dateRange?: { start: string, end: string }, currentUser?: any }) => {
  const [items, setItems] = useState<UserFeedEngagementItemWithAssign[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadData = async (p: number, append = false) => {
    setLoading(true);
    try {
      const data = await fetchUserFeedEngagement(p, 10, dateRange);
      if (append) {
        setItems((prev) => [...prev, ...data]);
      } else {
        const userIds = data.map((u: any) => u.userId);
        let assignments: any[] = [];
        if (userIds.length > 0) {
          const { data: assignData } = await supabase
            .from('user_assignments')
            .select('user_id, assigned_to')
            .in('user_id', userIds);
          if (assignData) assignments = assignData;
        }
        const merged = data.map((u: any) => ({ ...u, assigned_to: assignments.find(a => a.user_id === u.userId)?.assigned_to }));
        setItems(merged);
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

  const loadMoreInModal = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage, true);
  };

  const downloadCSV = async () => {
    const allData = await fetchUserFeedEngagement(1, 'all', dateRange);
    if (!allData.length) return;
    const headers = Object.keys(allData[0]).join(",");
    const rows = allData.map(obj => Object.values(obj).map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user_feed_engagement.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAssign = async (userId: string) => {
    if (!currentUser?.email) return;
    try {
      const { error } = await supabase
        .from('user_assignments')
        .upsert({ user_id: userId, assigned_to: currentUser.email });
      if (error) throw error;
      setItems(prev => prev.map(u => u.userId === userId ? { ...u, assigned_to: currentUser.email } : u));
    } catch (err) {
      console.error("Assignment failed", err);
    }
  };

  const handleRecordActivity = (userId: string) => {
    // Placeholder for recording activity
    console.log("Record activity for", userId);
    alert(`Recording activity for user ${userId}`);
  };

  const List = ({ data }: { data: UserFeedEngagementItemWithAssign[] }) => {
    const statusKeys = Array.from(
      new Set(data.flatMap((item) => Object.keys(item)))
    ).filter((key) => !["userId", "fullName", "totalFeeds", "assigned_to"].includes(key)).sort();

    return (
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#666", borderBottom: "1px solid #eee" }}>
            <th style={{ padding: "8px 12px" }}>User ID</th>
            <th style={{ padding: "8px 12px" }}>User</th>
            <th style={{ padding: "8px 12px", textAlign: "right" }}>Total Feeds</th>
            {statusKeys.map((key) => (
              <th key={key} style={{ padding: "8px 12px", textAlign: "right" }}>{key.replace(/_/g, " ")}</th>
            ))}
            <th style={{ padding: "8px 12px", textAlign: "center" }}>Assign To</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={`${item.userId}-${i}`} style={{ borderBottom: "1px solid #f5f5f5" }}>
              <td style={{ padding: "12px 12px", fontFamily: "monospace", fontSize: 12, color: "#999" }}>{item.userId}</td>
              <td style={{ padding: "12px 12px", fontWeight: 500 }}>{item.fullName}</td>
              <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600 }}>{item.totalFeeds}</td>
              {statusKeys.map((key) => (
                <td key={key} style={{ padding: "12px 12px", textAlign: "right" }}>
                  {item[key] || 0}
                </td>
              ))}
              <td style={{ padding: "12px 12px", textAlign: "center" }}>
                {item.assigned_to ? (
                  item.assigned_to === currentUser?.email ? (
                    <button 
                      onClick={() => handleRecordActivity(item.userId)}
                      style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#2563eb", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
                    >
                      Record Activity
                    </button>
                  ) : (
                    <span style={{ color: "#999", fontSize: 12 }}>Assigned to {item.assigned_to}</span>
                  )
                ) : (
                  <button 
                    onClick={() => handleAssign(item.userId)}
                    style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #2563eb", background: "white", color: "#2563eb", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
                  >
                    Assign Me
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <>
      <div style={{
        background: "#ffffff", borderRadius: 12, padding: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
        gridColumn: "span 2"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>User Feed Engagement</h3>
          <button onClick={handleShowMore} style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", fontSize: 14 }}>
            Show More
          </button>
        </div>
        <List data={items.slice(0, 6)} />
      </div>

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", width: "900px", maxHeight: "80vh", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>User Feed Engagement</h2>
                <button onClick={downloadCSV} style={{ padding: "4px 12px", cursor: "pointer", fontSize: 12 }}>Download CSV</button>
              </div>
              <button onClick={() => setShowModal(false)} style={{ cursor: "pointer", border: "none", background: "none", fontSize: 20 }}>&times;</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: 8 }}>
              <List data={items} />
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button onClick={loadMoreInModal} disabled={loading} style={{ padding: "8px 16px", cursor: "pointer" }}>
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};