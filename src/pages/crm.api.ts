const API_URL = "https://final-crm-backend.onrender.com/api/crm";
const USER_API_URL = "https://final-crm-backend.onrender.com/api/users";

export const fetchUserLevelData = async (params: any) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/user-level?${queryString}`);
  if (!res.ok) throw new Error("Failed to fetch user level data");
  return res.json();
};

export const fetchApplicationLevelData = async (params: any) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/application-level?${queryString}`);
  if (!res.ok) throw new Error("Failed to fetch application level data");
  return res.json();
};

export const updateCrmData = async (data: any) => {
  const res = await fetch(`${API_URL}/crm-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update CRM data");
  return res.json();
};

export const fetchApplicationHistory = async (applicationId: string) => {
  const res = await fetch(`${API_URL}/application-history/${applicationId}`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
};

export const fetchUserHistory = async (userId: string) => {
  const res = await fetch(`${API_URL}/user-history/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
};

export const fetchUserDetails = async (userId: string) => {
  const res = await fetch(`${USER_API_URL}/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch user details");
  return res.json();
};

export const fetchCountries = async () => {
  const res = await fetch(`${API_URL}/countries`);
  if (!res.ok) throw new Error("Failed to fetch countries");
  return res.json();
};

export const fetchJobRoles = async () => {
  const res = await fetch(`${API_URL}/job-roles`);
  if (!res.ok) throw new Error("Failed to fetch job roles");
  return res.json();
};