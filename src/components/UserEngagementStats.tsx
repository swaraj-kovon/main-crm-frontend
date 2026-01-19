interface UserEngagementStatsProps {
  dateRange?: { start: string; end: string };
  usersApplied: number;
  totalApplications: number;
  completedProfiles: number;
  updatedAt?: string;
}

export const UserEngagementStats = ({
  dateRange,
  usersApplied,
  totalApplications,
  completedProfiles,
  updatedAt,
}: UserEngagementStatsProps) => {

  const StatItem = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => (
    <div
      style={{
        flex: 1,
        minWidth: "120px",
        background: "#f9fafb",
        borderRadius: 8,
        padding: "12px 16px",
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 12, color: "#666", marginBottom: 4, fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
        {value}
      </div>
    </div>
  );

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: 12, padding: 20,
      boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
      display: "flex", gap: 16,
      flexWrap: "wrap"
    }}>
      <StatItem label="Users Applied" value={usersApplied} color="#3b82f6" />
      <StatItem
        label="Applications"
        value={totalApplications}
        color="#10b981"
      />
      <StatItem
        label="Profiles Completed"
        value={completedProfiles}
        color="#8b5cf6"
      />
    </div>
  );
};