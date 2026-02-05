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
  // fetchTotalJobsTrend,
  fetchTotalTicketsTrend,
  fetchTotalFeedsTrend
} from "../services/insights.api";
import { fetchDashboardPreferences, saveDashboardPreferences } from "../services/dashboard-preferences.api";
import { supabase } from "./supabaseClient";

interface DashboardPreferences {
  selectedCards: string[];
}

const CARD_COMPONENTS: Record<string, any> = {
  "TotalTicketsCard": TotalTicketsCard,
  "TotalJobsCard": TotalJobsCard,
  "EmployerPolicyStatusCard": EmployerPolicyStatusCard,
  "StatusDistributionCard": StatusDistributionCard,
  "ApplicationStatusTrendCard": ApplicationStatusTrendCard,
  "TrendCardUsers": (props: any) => <TrendCard title="Users" fetchData={fetchTotalUsersTrend} color="#3b82f6" {...props} />,
  // "TrendCardJobs": (props: any) => <TrendCard title="Jobs" fetchData={fetchTotalJobsTrend} color="#10b981" {...props} />,
  "TopJobRolesCard": TopJobRolesCard,
  "TopTargetRolesCard": TopTargetRolesCard,
  "TopApplicantsCard": TopApplicantsCard,
  "TopApplicantsSummaryCard": TopApplicantsSummaryCard,
  "UserApplicationListCardApplied": (props: any) => <UserApplicationListCard title="Users Who Applied" filter="applied" {...props} />,
  "UserApplicationListCardNotApplied": (props: any) => <UserApplicationListCard title="Users Who Have Not Applied" filter="not_applied" {...props} />,
  "JobsByCompanyCard": JobsByCompanyCard,
  "JobsByCompanyComparisonCard": JobsByCompanyComparisonCard,
  "CompanyPopularityCard": CompanyPopularityCard,
  "JobStatusListCard": JobStatusListCard,
  "CompanyStatusCountsCard": CompanyStatusCountsCard,
  "TopCountriesCard": TopCountriesCard,
  "TopCountriesComparisonCard": TopCountriesComparisonCard,
  "UserFeedEngagementCard": UserFeedEngagementCard,
  "TopCommunitiesCard": TopCommunitiesCard,
  "IncompleteProfilesCard": IncompleteProfilesCard,
};

const CARD_NAMES: Record<string, string> = {
  "TotalTicketsCard": "Total Tickets",
  "TotalJobsCard": "Total Jobs",
  "EmployerPolicyStatusCard": "Employer Policy Status",
  "StatusDistributionCard": "Status Distribution",
  "ApplicationStatusTrendCard": "Application Status Trend",
  "TrendCardUsers": "Users Trend",
  // "TrendCardJobs": "Jobs Trend",
  "TopJobRolesCard": "Top Job Roles",
  "TopTargetRolesCard": "Top Target Roles",
  "TopApplicantsCard": "Top Applicants",
  "TopApplicantsSummaryCard": "Top Applicants Summary",
  "UserApplicationListCardApplied": "Users Who Applied",
  "UserApplicationListCardNotApplied": "Users Who Have Not Applied",
  "JobsByCompanyCard": "Jobs by Company",
  "JobsByCompanyComparisonCard": "Jobs by Company Comparison",
  "CompanyPopularityCard": "Company Popularity",
  "JobStatusListCard": "Job Status List",
  "CompanyStatusCountsCard": "Company Status Counts",
  "TopCountriesCard": "Top Countries",
  "TopCountriesComparisonCard": "Top Countries Comparison",
  "UserFeedEngagementCard": "User Feed Engagement",
  "TopCommunitiesCard": "Top Communities",
  "IncompleteProfilesCard": "Incomplete Profiles",
};

export const MyDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [usersApplied, setUsersApplied] = useState<number | null>(null);
  const [totalApplications, setTotalApplications] = useState<number | null>(null);
  const [completedProfiles, setCompletedProfiles] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [statCardsLoading, setStatCardsLoading] = useState(true);
  const [dashboardPreferences, setDashboardPreferences] = useState<DashboardPreferences>({ selectedCards: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [availableCards] = useState<string[]>([
    "TotalTicketsCard",
    "TotalJobsCard",
    "EmployerPolicyStatusCard",
    "StatusDistributionCard",
    "ApplicationStatusTrendCard",
    "TrendCardUsers",
    // "TrendCardJobs",
    "TopJobRolesCard",
    "TopTargetRolesCard",
    "TopApplicantsCard",
    "TopApplicantsSummaryCard",
    "UserApplicationListCardApplied",
    "UserApplicationListCardNotApplied",
    "JobsByCompanyCard",
    "JobsByCompanyComparisonCard",
    "CompanyPopularityCard",
    "JobStatusListCard",
    "CompanyStatusCountsCard",
    "TopCountriesCard",
    "TopCountriesComparisonCard",
    "UserFeedEngagementCard",
    "TopCommunitiesCard",
    "IncompleteProfilesCard",
  ]);

  const apiDateRange = useMemo(() => ({
    start: dateRange.start,
    end: dateRange.end ? `${dateRange.end}T23:59:59` : ""
  }), [dateRange]);

  const loadInsights = useCallback(async () => {
    try {
      const usersPromise = fetchTotalUsers(apiDateRange);
      const usersAppStatusPromise = fetchUserApplicationStatus(1, 'all', 'applied', apiDateRange);
      const applicantsSummaryPromise = fetchTopApplicantsSummary(1, 'all', apiDateRange);
      const incompletePromise = fetchIncompleteProfiles(1, 'all', apiDateRange);

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

  const loadDashboardPreferences = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const preferences = await fetchDashboardPreferences(currentUser.id);
      setDashboardPreferences(preferences);
    } catch (err) {
      console.error("Failed to load dashboard preferences", err);
      // Fallback to localStorage if API fails
      const savedPrefs = localStorage.getItem(`dashboardPrefs_${currentUser.id}`);
      if (savedPrefs) {
        setDashboardPreferences(JSON.parse(savedPrefs));
      }
    }
  }, [currentUser]);

  const handleSaveDashboardPreferences = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const success = await saveDashboardPreferences(currentUser.id, dashboardPreferences);
      if (success) {
        setIsEditing(false);
      } else {
        // Fallback to localStorage if API fails
        localStorage.setItem(`dashboardPrefs_${currentUser.id}`, JSON.stringify(dashboardPreferences));
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to save dashboard preferences", err);
      // Fallback to localStorage if API fails
      localStorage.setItem(`dashboardPrefs_${currentUser.id}`, JSON.stringify(dashboardPreferences));
      setIsEditing(false);
    }
  }, [currentUser, dashboardPreferences]);

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

  useEffect(() => {
    loadDashboardPreferences();
  }, [loadDashboardPreferences]);

  const handleCardToggle = (cardId: string) => {
    setDashboardPreferences(prev => {
      const isSelected = prev.selectedCards.includes(cardId);
      return {
        ...prev,
        selectedCards: isSelected 
          ? prev.selectedCards.filter(id => id !== cardId)
          : [...prev.selectedCards, cardId]
      };
    });
  };

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
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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

        {isEditing ? (
          <div style={{ display: "flex", gap: 12 }}>
            <button 
              onClick={handleSaveDashboardPreferences}
              style={{
                background: "#22c55e",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Save Dashboard
            </button>
            <button 
              onClick={() => setIsEditing(false)}
              style={{
                background: "#ef4444",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsEditing(true)}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Customize Dashboard
          </button>
        )}
      </div>

      {isEditing && (
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 24,
          marginBottom: 24
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: "bold" }}>
            Select Cards for Your Dashboard
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 12
          }}>
            {availableCards.map(cardId => (
              <label key={cardId} style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: 12,
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                cursor: "pointer"
              }}>
                <input
                  type="checkbox"
                  checked={dashboardPreferences.selectedCards.includes(cardId)}
                  onChange={() => handleCardToggle(cardId)}
                  style={{ width: 16, height: 16 }}
                />
                <span>{CARD_NAMES[cardId]}</span>
              </label>
            ))}
          </div>
        </div>
      )}

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

        {dashboardPreferences.selectedCards.map(cardId => {
          const CardComponent = CARD_COMPONENTS[cardId];
          if (!CardComponent) return null;
          
          return (
            <CardComponent 
              key={cardId}
              dateRange={apiDateRange}
              currentUser={currentUser}
            />
          );
        })}
      </div>
    </>
  );
};