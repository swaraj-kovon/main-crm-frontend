import { useState, useEffect, useCallback } from "react";
import { StatCard } from "../components/StatCard";
import { TotalJobsCard } from "../components/TotalJobsCard";
import { TopApplicantsCard } from "../components/TopApplicantsCard";
import { TotalTicketsCard } from "../components/TotalTicketsCard";
import { TotalFeedsCard } from "../components/TotalFeedsCard";
import { StatusDistributionCard } from "../components/StatusDistributionCard";
import { TopJobRolesCard } from "../components/TopJobRolesCard";
import { EmployerPolicyStatusCard } from "../components/EmployerPolicyStatusCard";
import { TopApplicantsSummaryCard } from "../components/TopApplicantsSummaryCard";
import { UserApplicationListCard } from "../components/UserApplicationListCard";
import { IncompleteProfilesCard } from "../components/IncompleteProfilesCard";
import { JobsByCompanyCard } from "../components/JobsByCompanyCard";
import { CompanyPopularityCard } from "../components/CompanyPopularityCard";
import { JobStatusListCard } from "../components/JobStatusListCard";
import { CompanyStatusCountsCard } from "../components/CompanyStatusCountsCard";
import { TopCountriesCard } from "../components/TopCountriesCard";
import { UserFeedEngagementCard } from "../components/UserFeedEngagementCard";
import { TopTargetRolesCard } from "../components/TopTargetRolesCard";
import { TopCommunitiesCard } from "../components/TopCommunitiesCard";
import { TrendCard } from "../components/TrendCard";
import { ApplicationStatusTrendCard } from "../components/ApplicationStatusTrendCard";
import { TopCountriesComparisonCard } from "../components/TopCountriesComparisonCard";
import { JobsByCompanyComparisonCard } from "../components/JobsByCompanyComparisonCard";
import { 
  fetchTotalUsers,
  fetchUserApplicationStatus,
  fetchTopApplicantsSummary,
  fetchIncompleteProfiles,
  fetchTotalUsersTrend,
  fetchTotalJobsTrend,
  fetchTotalTicketsTrend,
  fetchTotalFeedsTrend
} from "../services/insights.api";

import { supabase } from "./supabaseClient";

export const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [usersApplied, setUsersApplied] = useState<number | null>(null);
  const [totalApplications, setTotalApplications] = useState<number | null>(null);
  const [completedProfiles, setCompletedProfiles] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadInsights = useCallback(async () => {
    try {
      const users = await fetchTotalUsers(dateRange);
      setData(users);

      const usersAppStatus = await fetchUserApplicationStatus(1, 'all', 'applied', dateRange);
      setUsersApplied(usersAppStatus.total);

      const applicantsSummary = await fetchTopApplicantsSummary(1, 'all', dateRange);
      const totalApps = applicantsSummary.reduce((sum, u) => sum + (u.totalApplications || 0), 0);
      setTotalApplications(totalApps);

      const incomplete = await fetchIncompleteProfiles(1, 'all', dateRange);
      setCompletedProfiles(users.value - incomplete.total);

      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);


  useEffect(() => {
    loadInsights();
    const interval = setInterval(loadInsights, 60000);
    return () => clearInterval(interval);
  }, [loadInsights]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20, gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: "#666" }}>Date Range:</span>
        <input 
          type="date" 
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          style={{ padding: "8px", borderRadius: 6, border: "1px solid #ddd" }}
        />
        <input 
          type="date" 
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          style={{ padding: "8px", borderRadius: 6, border: "1px solid #ddd" }}
        />
        <button 
          onClick={() => setDateRange({ start: "", end: "" })}
          style={{ 
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "white",
            padding: "6px 12px",
            borderRadius: 20,
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            border: "1px solid #f0f0f0",
            cursor: "pointer"
          }}
        >
          <style>
            {`
              @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
                100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
              }
            `}
          </style>
          <div style={{
            width: 10,
            height: 10,
            backgroundColor: "#22c55e",
            borderRadius: "50%",
            animation: "pulse 2s infinite"
          }} />
          <span style={{ color: "#22c55e", fontWeight: "bold", fontSize: 12, letterSpacing: 1 }}>LIVE</span>
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "24px" }}>
        {error && (
          <div style={{ color: "red", gridColumn: "1/-1" }}>
            {error} - Check console for CORS or network errors
          </div>
        )}
        
        {loading && !data && <div>Loading insights...</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: 'wrap' }}>
            {data && (
              <StatCard label="Total Users" value={data.value} updatedAt={data.updatedAt} />
            )}

            {usersApplied !== null && (
              <StatCard label="Users Applied" value={usersApplied} updatedAt={new Date().toISOString()} />
            )}

            {totalApplications !== null && (
              <StatCard label="Applications" value={totalApplications} updatedAt={new Date().toISOString()} />
            )}

            {completedProfiles !== null && (
              <StatCard label="Completed Profiles" value={completedProfiles} updatedAt={new Date().toISOString()} />
            )}

          </div>

          <TrendCard title="Users" fetchData={fetchTotalUsersTrend} dateRange={dateRange} color="#3b82f6" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <TotalJobsCard dateRange={dateRange} />
          <TrendCard title="Jobs" fetchData={fetchTotalJobsTrend} dateRange={dateRange} color="#10b981" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <TotalTicketsCard dateRange={dateRange} />
          <TrendCard title="Tickets" fetchData={fetchTotalTicketsTrend} dateRange={dateRange} color="#f59e0b" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <TotalFeedsCard dateRange={dateRange} />
          <TrendCard title="Feeds" fetchData={fetchTotalFeedsTrend} dateRange={dateRange} color="#8b5cf6" />
        </div>

        <EmployerPolicyStatusCard dateRange={dateRange} />

        <StatusDistributionCard />
        
        <ApplicationStatusTrendCard dateRange={dateRange} />

        <TopApplicantsCard dateRange={dateRange} />

        <TopJobRolesCard dateRange={dateRange} />

        <TopTargetRolesCard dateRange={dateRange} />

        <TopApplicantsSummaryCard dateRange={dateRange} />

        <UserApplicationListCard title="Users Who Applied" filter="applied" dateRange={dateRange} currentUser={currentUser} />

        <UserApplicationListCard title="Users Who Have Not Applied" filter="not_applied" dateRange={dateRange} currentUser={currentUser} />

        <JobsByCompanyCard dateRange={dateRange} />

        <JobsByCompanyComparisonCard dateRange={dateRange} />

        <CompanyPopularityCard dateRange={dateRange} />

        <JobStatusListCard dateRange={dateRange} />

        <CompanyStatusCountsCard dateRange={dateRange} />

        <TopCountriesCard dateRange={dateRange} />

        <TopCountriesComparisonCard dateRange={dateRange} />

        <UserFeedEngagementCard dateRange={dateRange} currentUser={currentUser} />

        <TopCommunitiesCard dateRange={dateRange} />

        <IncompleteProfilesCard dateRange={dateRange} />
      </div>
    </>
  );
};
