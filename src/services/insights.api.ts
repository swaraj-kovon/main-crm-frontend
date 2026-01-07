import { API_URL } from '../config';

export const fetchTotalUsers = async (dates?: {start: string, end: string}) => {
  const res = await fetch(`${API_URL}/insights/total-users?startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export interface TopApplicant {
  userId: string;
  fullName: string;
  jobRole: string;
  roleCount: number;
  totalApplications: number;
}

export const fetchTopApplicants = async (page = 1, limit: number | 'all' = 10, dates?: {start: string, end: string}): Promise<TopApplicant[]> => {
  const res = await fetch(`${API_URL}/insights/top-applicants?page=${page}&limit=${limit}&startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch top applicants");
  return res.json();
};

export interface StatusStat {
  status: string;
  count: number;
}

export const fetchApplicationStatusStats = async (): Promise<StatusStat[]> => {
  const res = await fetch(`${API_URL}/insights/application-status`);
  if (!res.ok) throw new Error("Failed to fetch status stats");
  return res.json();
};

export interface TopJobRole {
  role: string;
  count: number;
}

export const fetchTopJobRoles = async (page = 1, limit: number | 'all' = 10, dates?: {start: string, end: string}): Promise<TopJobRole[]> => {
  const res = await fetch(`${API_URL}/insights/top-job-roles?page=${page}&limit=${limit}&startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch top job roles");
  return res.json();
};

export interface ApplicantSummary {
  userId: string;
  fullName: string;
  totalApplications: number;
  mostAppliedRole: string;
}

export const fetchTopApplicantsSummary = async (page = 1, limit: number | 'all' = 10, dates?: {start: string, end: string}): Promise<ApplicantSummary[]> => {
  const res = await fetch(`${API_URL}/insights/top-applicants-summary?page=${page}&limit=${limit}&startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch top applicants summary");
  return res.json();
};

export interface UserLanguage {
  motherTongue: string;
  other: string[];
}

export interface UserLocation {
  city: string;
  state: string;
  country: string;
}

export interface Education {
  institutionName: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate: string;
  isOngoing: boolean;
  _id?: string;
}

export interface Experience {
  companyName: string;
  position: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  isCurrentJob: boolean;
  location: string;
  _id?: string;
}

export interface UserAppStatus {
  userId: string;
  createdAt: string;
  phoneNumber: string;
  fullName: string;
  targetCountry: string;
  targetJobRole: string;
  skills: string[];
  language: UserLanguage;
  education: Education[];
  experience: Experience[];
  dob: string;
  gender: string;
  location: UserLocation;
  internationalExp?: number;
  domesticExp?: number;
}

export interface UserAppStatusResponse {
  data: UserAppStatus[];
  total: number;
}

export const fetchUserApplicationStatus = async (page = 1, limit: number | 'all' = 10, filter: 'applied' | 'not_applied', dates?: {start: string, end: string}): Promise<UserAppStatusResponse> => {
  const res = await fetch(`${API_URL}/insights/users-application-status?page=${page}&limit=${limit}&filter=${filter}&startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch user application status");
  return res.json();
};

export const updateUser = async (userId: string, data: any) => {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
};

export interface IncompleteProfile {
  _id: string;
  fullName?: string;
  targetCountry?: any;
  targetJobRole?: any;
}

export interface IncompleteProfilesResponse {
  data: IncompleteProfile[];
  total: number;
}

export const fetchIncompleteProfiles = async (page = 1, limit: number | 'all' = 10, dates?: {start: string, end: string}): Promise<IncompleteProfilesResponse> => {
  const res = await fetch(`${API_URL}/insights/incomplete-profiles?page=${page}&limit=${limit}&startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch incomplete profiles");
  return res.json();
};

export interface JobByCompany {
  companyName: string;
  jobCount: number;
  totalApplications: number;
}

export interface JobsByCompanyResponse {
  data: JobByCompany[];
  meta: { totalJobs: number; totalCompanies: number };
}

export const fetchJobsByCompany = async (page = 1, limit: number | 'all' = 10, dates?: {start: string, end: string}): Promise<JobsByCompanyResponse> => {
  const res = await fetch(`${API_URL}/insights/jobs-by-company?page=${page}&limit=${limit}&startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch jobs by company");
  return res.json();
};

export interface CompanyPopularityItem {
  companyName: string;
  jobTitle: string;
  positions: number;
  positionFilled: number;
  applicationCount: number;
}

export const fetchCompanyPopularity = async (page = 1, limit: number | 'all' = 10, dates?: {start: string, end: string}): Promise<CompanyPopularityItem[]> => {
  const res = await fetch(`${API_URL}/insights/company-popularity?page=${page}&limit=${limit}&startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch company popularity");
  return res.json();
};

export interface JobStatusItem {
  companyName: string;
  title: string;
  status: string;
}

export const fetchJobStatusList = async (page = 1, limit: number | 'all' = 10, dates?: {start: string, end: string}): Promise<JobStatusItem[]> => {
  const res = await fetch(`${API_URL}/insights/job-status-list?page=${page}&limit=${limit}&startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch job status list");
  return res.json();
};

export interface CompanyStatusCount {
  companyName: string;
  total: number;
  [key: string]: string | number;
}

export const fetchCompanyStatusCounts = async (page = 1, limit: number | 'all' = 10, dates?: {start: string, end: string}): Promise<CompanyStatusCount[]> => {
  const res = await fetch(`${API_URL}/insights/company-status-counts?page=${page}&limit=${limit}&startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch company status counts");
  return res.json();
};

export interface JobStatsResponse {
  total: number;
  breakdown: { status: string; count: number }[];
  updatedAt: string;
}

export const fetchTotalJobs = async (dates?: {start: string, end: string}): Promise<JobStatsResponse> => {
  const res = await fetch(`${API_URL}/insights/total-jobs?startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch total jobs");
  return res.json();
};

export interface TicketStatsResponse {
  total: number;
  breakdown: { status: string; count: number }[];
  updatedAt: string;
}

export const fetchTotalTickets = async (dates?: {start: string, end: string}): Promise<TicketStatsResponse> => {
  const res = await fetch(`${API_URL}/insights/total-tickets?startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch total tickets");
  return res.json();
};

export interface EmployerPolicyStatusResponse {
  accepted: number;
  notAccepted: number;
  total: number;
}

export const fetchEmployerPolicyStatus = async (dates?: {start: string, end: string}): Promise<EmployerPolicyStatusResponse> => {
  const res = await fetch(`${API_URL}/insights/employer-policy-status?startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch employer policy status");
  return res.json();
};

export interface TopCountryItem {
  country: string;
  count: number;
}

export interface TopCountriesResponse {
  byUser: { data: TopCountryItem[], total: number };
  byJob: { data: TopCountryItem[], total: number };
}

export const fetchTopCountries = async (limit: number | 'all' = 10, dates?: {start: string, end: string}): Promise<TopCountriesResponse> => {
  const res = await fetch(`${API_URL}/insights/top-countries?limit=${limit}&startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch top countries");
  return res.json();
};

export const fetchTopTargetRoles = async (page = 1, limit: number | 'all' = 10, dates?: {start: string, end: string}): Promise<TopJobRole[]> => {
  const res = await fetch(`${API_URL}/insights/top-target-roles?page=${page}&limit=${limit}&startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch top target roles");
  return res.json();
};

export interface FeedStatsResponse {
  total: number;
  breakdown: { status: string; count: number }[];
  updatedAt: string;
}

export const fetchTotalFeeds = async (dates?: {start: string, end: string}): Promise<FeedStatsResponse> => {
  const res = await fetch(`${API_URL}/insights/total-feeds?startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch total feeds");
  return res.json();
};

export interface UserFeedEngagementItem {
  userId: string;
  fullName: string;
  totalFeeds: number;
  [key: string]: string | number;
}

export const fetchUserFeedEngagement = async (page = 1, limit: number | 'all' = 10, dates?: {start: string, end: string}): Promise<UserFeedEngagementItem[]> => {
  const res = await fetch(`${API_URL}/insights/user-feed-engagement?page=${page}&limit=${limit}&startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch user feed engagement");
  return res.json();
};

export interface TopCommunityItem {
  communityName: string;
  memberCount: number;
}

export const fetchTopCommunities = async (page = 1, limit: number | 'all' = 10, dates?: {start: string, end: string}): Promise<TopCommunityItem[]> => {
  const res = await fetch(`${API_URL}/insights/top-communities?page=${page}&limit=${limit}&startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch top communities");
  return res.json();
};

export interface TrendSeries {
  label: string;
  color: string;
  points: { date: string, value: number }[];
}

export const fetchTotalUsersTrend = async (dates?: {start: string, end: string}): Promise<TrendSeries[]> => {
  const res = await fetch(`${API_URL}/insights/total-users-trend?startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch users trend");
  return res.json();
};

export const fetchTotalJobsTrend = async (dates?: {start: string, end: string}): Promise<TrendSeries[]> => {
  const res = await fetch(`${API_URL}/insights/total-jobs-trend?startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch jobs trend");
  return res.json();
};

export const fetchTotalTicketsTrend = async (dates?: {start: string, end: string}): Promise<TrendSeries[]> => {
  const res = await fetch(`${API_URL}/insights/total-tickets-trend?startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch tickets trend");
  return res.json();
};

export const fetchTotalFeedsTrend = async (dates?: {start: string, end: string}): Promise<TrendSeries[]> => {
  const res = await fetch(`${API_URL}/insights/total-feeds-trend?startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch feeds trend");
  return res.json();
};

export const fetchEmployerPolicyTrend = async (dates?: {start: string, end: string}): Promise<TrendSeries[]> => {
  const res = await fetch(`${API_URL}/insights/employer-policy-trend?startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch policy trend");
  return res.json();
};

export const fetchTopCommunitiesTrend = async (dates?: {start: string, end: string}): Promise<TrendSeries[]> => {
  const res = await fetch(`${API_URL}/insights/top-communities-trend?startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch community trend");
  return res.json();
};

export interface AppStatusTrendItem {
  date: string;
  status: string;
  count: number;
}

export const fetchApplicationStatusTrend = async (dates?: {start: string, end: string}): Promise<AppStatusTrendItem[]> => {
  const res = await fetch(`${API_URL}/insights/application-status-trend?startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch application status trend");
  return res.json();
};

export const fetchTopCountriesTrend = async (dates?: {start: string, end: string}): Promise<{ topCountries: string[], data: { date: string, country: string, count: number }[] }> => {
  const res = await fetch(`${API_URL}/insights/top-countries-trend?startDate=${dates?.start || ''}&endDate=${dates?.end || ''}`);
  if (!res.ok) throw new Error("Failed to fetch top countries trend");
  return res.json();
};