import { useState, useEffect } from "react";
import { fetchUserApplicationStatus, UserAppStatus } from "../services/insights.api";
import { supabase } from "../pages/supabaseClient";

interface Props {
  title: string;
  filter: 'applied' | 'not_applied';
  dateRange?: { start: string, end: string };
  currentUser?: any;
}

type UserAppStatusWithAssign = UserAppStatus & { assigned_to?: string };

export const UserApplicationListCard = ({ title, filter, dateRange, currentUser }: Props) => {
  const [users, setUsers] = useState<UserAppStatusWithAssign[]>([]);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadData = async (p: number, append = false) => {
    setLoading(true);
    try {
      const response = await fetchUserApplicationStatus(p, 10, filter, dateRange);
      if (append) {
        // We would need to fetch assignments for new items here too, but for simplicity in append mode:
        setUsers((prev) => [...prev, ...response.data]);
      } else {
        const userIds = response.data.map((u: any) => u.userId);
        let assignments: any[] = [];
        if (userIds.length > 0) {
          const { data } = await supabase
            .from('user_assignments')
            .select('user_id, assigned_to')
            .in('user_id', userIds);
          if (data) assignments = data;
        }
        const merged = response.data.map((u: any) => ({ ...u, assigned_to: assignments.find(a => a.user_id === u.userId)?.assigned_to }));
        setUsers(merged);
      }
      setTotal(response.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [filter, dateRange]);

  const handleShowMore = () => {
    setShowModal(true);
  };

  const loadMoreInModal = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage, true);
  };

  const downloadCSV = async () => {
    const response = await fetchUserApplicationStatus(1, 'all', filter, dateRange);
    const allData = response.data;
    if (!allData.length) return;
    const headers = Object.keys(allData[0]).join(",");
    const rows = allData.map(obj => Object.values(obj).map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/ /g, "_")}.csv`;
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
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, assigned_to: currentUser.email } : u));
    } catch (err) {
      console.error("Assignment failed", err);
    }
  };

  const handleRecordActivity = (userId: string) => {
    // Placeholder for recording activity
    console.log("Record activity for", userId);
    alert(`Recording activity for user ${userId}`);
  };

  const List = ({ items }: { items: UserAppStatusWithAssign[] }) => (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr style={{ textAlign: "left", color: "#666", borderBottom: "1px solid #eee" }}>
          <th style={{ padding: "8px 0" }}>User ID</th>
          <th style={{ padding: "8px 0" }}>Name</th>
          {filter !== 'applied' && <th style={{ padding: "8px 0" }}>Target Country</th>}
          {filter !== 'applied' && <th style={{ padding: "8px 0" }}>Target Role</th>}
          <th style={{ padding: "8px 0" }}>Assign To</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={`${item.userId}-${i}`} style={{ borderBottom: "1px solid #f5f5f5" }}>
            <td style={{ padding: "12px 0", color: "#999", fontSize: 12, fontFamily: "monospace" }}>
              {item.userId}
            </td>
            <td style={{ padding: "12px 0", fontWeight: 500 }}>{item.fullName}</td>
            {filter !== 'applied' && <td style={{ padding: "12px 0", color: "#666" }}>{item.targetCountry}</td>}
            {filter !== 'applied' && <td style={{ padding: "12px 0", color: "#666" }}>{item.targetJobRole}</td>}
            <td style={{ padding: "12px 0" }}>
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

  return (
    <>
      <div style={{
        background: "#ffffff", borderRadius: 12, padding: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
        gridColumn: "span 2"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>
            {title} <span style={{ color: "#999", fontWeight: "normal", marginLeft: 8 }}>({total})</span>
          </h3>
          <button onClick={handleShowMore} style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", fontSize: 14 }}>
            Show More
          </button>
        </div>
        <List items={users.slice(0, 5)} />
      </div>

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", width: "800px", maxHeight: "80vh", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
                <button onClick={downloadCSV} style={{ padding: "4px 12px", cursor: "pointer", fontSize: 12 }}>Download CSV</button>
              </div>
              <button onClick={() => setShowModal(false)} style={{ cursor: "pointer", border: "none", background: "none", fontSize: 20 }}>&times;</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: 8 }}>
              <List items={users} />
              <div style={{ textAlign: "center", marginTop: 20 }}><button onClick={loadMoreInModal} disabled={loading} style={{ padding: "8px 16px", cursor: "pointer" }}>{loading ? "Loading..." : "Load More"}</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};