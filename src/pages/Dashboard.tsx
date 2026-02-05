import { useState, useEffect, useCallback, useMemo } from "react";
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

  // Separate loading states for stat cards to prevent blocking
  const [statCardsLoading, setStatCardsLoading] = useState(true);

  const apiDateRange = useMemo(() => ({
    start: dateRange.start,
    end: dateRange.end ? `${dateRange.end}T23:59:59` : ""
  }), [dateRange]);

  const loadInsights = useCallback(async () => {
    try {
      // Load stat cards independently
      const usersPromise = fetchTotalUsers(apiDateRange);
      const usersAppStatusPromise = fetchUserApplicationStatus(1, 'all', 'applied', apiDateRange);
      const applicantsSummaryPromise = fetchTopApplicantsSummary(1, 'all', apiDateRange);
      const incompletePromise = fetchIncompleteProfiles(1, 'all', apiDateRange);

      // Wait for all stat cards to load
      const [users, usersAppStatus, applicantsSummary, incomplete] = await Promise.all([
        usersPromise,
        usersAppStatusPromise,
        applicantsSummaryPromise,
        incompletePromise
      ]);

      setData(users);
      setUsersApplied(usersAppStatus.total);
      const totalApps = applicantsSummary.reduce((sum, u) => sum + (u.totalApplications || 0), 0);
      setTotalApplications(totalApps);
      setCompletedProfiles(users.value - incomplete.total);

      setError(null);
      setStatCardsLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load insights");
      setStatCardsLoading(false);
    } finally {
      setLoading(false);
    }
  }, [apiDateRange]);


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
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @media (max-width: 768px) {
            .dashboard-grid {
              grid-template-columns: 1fr !important;
              gap: 24px !important;
            }
            
            .stat-cards-grid {
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
            }
          }
          
          @media (max-width: 480px) {
            .stat-cards-grid {
              grid-template-columns: 1fr !important;
            }
          }

          .dashboard-grid th, .dashboard-grid td {
            padding-right: 24px;
          }
        `}
      </style>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24, gap: 12, alignItems: "center" }}>
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

      <div className="stat-cards-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 24,
        marginBottom: 24
      }}>
        {!statCardsLoading && data ? (
          <StatCard label="Total Users" value={data.value} updatedAt={data.updatedAt} />
        ) : (
          <div style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "120px",
            flexDirection: "column",
            gap: "8px"
          }}>
            <div style={{
              width: "20px",
              height: "20px",
              border: "2px solid #f3f4f6",
              borderTop: "2px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <span style={{ color: "#6b7280", fontSize: "14px" }}>Loading...</span>
          </div>
        )}
        {!statCardsLoading && usersApplied !== null ? (
          <StatCard label="Total Users Applied" value={usersApplied} updatedAt={data?.updatedAt} />
        ) : (
          <div style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "120px",
            flexDirection: "column",
            gap: "8px"
          }}>
            <div style={{
              width: "20px",
              height: "20px",
              border: "2px solid #f3f4f6",
              borderTop: "2px solid #10b981",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <span style={{ color: "#6b7280", fontSize: "14px" }}>Loading...</span>
          </div>
        )}
        {!statCardsLoading && totalApplications !== null ? (
          <StatCard label="Total Applications" value={totalApplications} updatedAt={data?.updatedAt} />
        ) : (
          <div style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "120px",
            flexDirection: "column",
            gap: "8px"
          }}>
            <div style={{
              width: "20px",
              height: "20px",
              border: "2px solid #f3f4f6",
              borderTop: "2px solid #f59e0b",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <span style={{ color: "#6b7280", fontSize: "14px" }}>Loading...</span>
          </div>
        )}
        {!statCardsLoading && completedProfiles !== null ? (
          <StatCard label="Total Completed Profiles" value={completedProfiles} updatedAt={data?.updatedAt} />
        ) : (
          <div style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "120px",
            flexDirection: "column",
            gap: "8px"
          }}>
            <div style={{
              width: "20px",
              height: "20px",
              border: "2px solid #f3f4f6",
              borderTop: "2px solid #8b5cf6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <span style={{ color: "#6b7280", fontSize: "14px" }}>Loading...</span>
          </div>
        )}
      </div>

      <div className="dashboard-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
        gap: "24px"
      }}>
        {error && (
          <div style={{ color: "red", gridColumn: "1/-1" }}>
            {error} - Check console for CORS or network errors
          </div>
        )}
        
        {loading && !data && <div>Loading insights...</div>}

        {/* Stat Cards */}
        <TotalTicketsCard dateRange={apiDateRange} />
        <TotalJobsCard dateRange={apiDateRange} />
        

        {/* Swapped Cards */}
        <EmployerPolicyStatusCard dateRange={apiDateRange} />
        <StatusDistributionCard />

        {/* Application Status Trend - Takes more space naturally */}
        <ApplicationStatusTrendCard dateRange={apiDateRange} />

        {/* Swapped Cards */}
        <TrendCard title="Users" fetchData={fetchTotalUsersTrend} dateRange={apiDateRange} color="#3b82f6" />
        {/* <TrendCard title="Jobs" fetchData={fetchTotalJobsTrend} dateRange={apiDateRange} color="#10b981" /> */}
        <TopJobRolesCard dateRange={apiDateRange} />
        <TopTargetRolesCard dateRange={apiDateRange} />
        <TopApplicantsCard dateRange={apiDateRange} />
        <TopApplicantsSummaryCard dateRange={apiDateRange} />

        {/* User Lists */}
        <UserApplicationListCard title="Users Who Applied" filter="applied" dateRange={apiDateRange} currentUser={currentUser} />
        <UserApplicationListCard title="Users Who Have Not Applied" filter="not_applied" dateRange={apiDateRange} currentUser={currentUser} />

        {/* Company Cards */}
        <JobsByCompanyCard dateRange={apiDateRange} />
        <JobsByCompanyComparisonCard dateRange={apiDateRange} />
        <CompanyPopularityCard dateRange={apiDateRange} />

        {/* Status and Country Cards */}
        <JobStatusListCard dateRange={apiDateRange} />
        <CompanyStatusCountsCard dateRange={apiDateRange} />
        <TopCountriesCard dateRange={apiDateRange} />

        {/* Comparison Cards */}
        <TopCountriesComparisonCard dateRange={apiDateRange} />
        <UserFeedEngagementCard dateRange={apiDateRange} currentUser={currentUser} />

        {/* Final Cards */}
        <TopCommunitiesCard dateRange={apiDateRange} />
        <IncompleteProfilesCard dateRange={apiDateRange} />
      </div>
    </>
  );
};
