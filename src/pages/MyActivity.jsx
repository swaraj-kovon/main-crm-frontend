import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ModifyModal from './ModifyModal';
import { supabase } from './supabaseClient';

const DISPOSITION_OPTIONS = [
  "CALL_ATTEMPT_NO_ANSWER", "CALL_ATTEMPT_NOT_REACHABLE", "CALL_ATTEMPT_WRONG_NUMBER",
  "CALL_ATTEMPT_BUSY_DECLINED", "VOICEMAIL_SENT", "FOLLOW_UP_SCHEDULED",
  "CONNECTED_SCREENING_COMPLETED", "CONNECTED_INTERESTED", "CONNECTED_NOT_INTERESTED",
  "CONNECTED_REQUESTED_CALLBACK", "CONNECTED_NEEDS_MORE_INFO", "QUALIFIED_MEETS_ALL_CRITERIA",
  "PARTIALLY_QUALIFIED_MISSING_DOCUMENTS", "PARTIALLY_QUALIFIED_MISSING_EXPERIENCE",
  "NOT_QUALIFIED", "UNDER_REVIEW_VERIFICATION_IN_PROGRESS", "DOCUMENTS_SUBMITTED_PENDING_REVIEW",
  "DOCUMENTS_APPROVED", "DOCUMENTS_REJECTED_REUPLOAD_REQUIRED", "VERIFICATION_COMPLETED",
  "VERIFICATION_FAILED", "INTERVIEW_SCHEDULED", "INTERVIEW_RESCHEDULED",
  "INTERVIEW_COMPLETED_SELECTED", "INTERVIEW_COMPLETED_ON_HOLD", "INTERVIEW_COMPLETED_REJECTED",
  "CANDIDATE_NO_SHOW_INTERVIEW", "OFFER_EXTENDED", "OFFER_ACCEPTED", "OFFER_DECLINED",
  "ONBOARDING_INITIATED", "ONBOARDING_COMPLETED", "CANDIDATE_UNRESPONSIVE",
  "CANDIDATE_WITHDREW_APPLICATION", "CANDIDATE_JOINED_ANOTHER_EMPLOYER", "DUPLICATE_APPLICATION",
  "APPLICATION_CLOSED_BY_EMPLOYER", "VISA_DOCUMENTATION_STARTED", "VISA_APPROVED",
  "TRAVEL_SCHEDULED", "CANDIDATE_DEPLOYED", "DEPLOYMENT_DELAYED",
];

const MyActivity = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalType, setModalType] = useState(null); // 'user' or 'application'
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // --- User Level State ---
  const [userData, setUserData] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userFilters, setUserFilters] = useState({ applied: '', country: '', jobRole: '' });
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);

  // --- App Level State ---
  const [appData, setAppData] = useState([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appFilters, setAppFilters] = useState({ userInfo: '', country: '', jobRole: '', disposition: '' });
  const [appPage, setAppPage] = useState(1);
  const [appTotal, setAppTotal] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Fetch User Level Data
  useEffect(() => {
    if (currentUser?.email) {
      fetchUserData();
      const interval = setInterval(fetchUserData, 60000);
      return () => clearInterval(interval);
    }
  }, [currentUser, userPage, userFilters]);

  // Fetch Application Level Data
  useEffect(() => {
    if (currentUser?.email) {
      fetchAppData();
      const interval = setInterval(fetchAppData, 60000);
      return () => clearInterval(interval);
    }
  }, [currentUser, appPage, appFilters]);

  const fetchUserData = async () => {
    setUserLoading(true);
    try {
      const params = {
        page: userPage,
        limit: 100,
        applied: userFilters.applied,
        country: userFilters.country,
        jobRole: userFilters.jobRole,
        assignee: currentUser.email, // Hardcoded to current user
      };
      const response = await axios.get('/api/crm/user-level', { params });
      const { data: responseData, total } = response.data;
      const initializedData = responseData.map(u => ({
        ...u,
        assignee: u.crmData?.assignee || "",
        tempDisposition: u.crmData?.callDisposition || "",
        tempNotes: u.crmData?.notes || "",
        tempNextCallDate: u.crmData?.nextCallDate ? u.crmData.nextCallDate.split('T')[0] : ""
      }));
      setUserData(initializedData);
      setUserTotal(total);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching user data", error);
    } finally {
      setUserLoading(false);
    }
  };

  const fetchAppData = async () => {
    setAppLoading(true);
    try {
      const params = {
        page: appPage,
        limit: 100,
        userInfo: appFilters.userInfo,
        country: appFilters.country,
        jobRole: appFilters.jobRole,
        disposition: appFilters.disposition,
        assignee: currentUser.email, // Hardcoded to current user
      };
      const response = await axios.get('/api/crm/application-level', { params });
      const { data: responseData, total } = response.data;
      const initializedData = responseData.map(u => ({
        ...u,
        assignee: u.crmData?.assignee || "",
        tempDisposition: u.crmData?.callDisposition || "",
        tempNotes: u.crmData?.notes || "",
        tempNextCallDate: u.crmData?.nextCallDate ? u.crmData.nextCallDate.split('T')[0] : ""
      }));
      setAppData(initializedData);
      setAppTotal(total);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching app data", error);
    } finally {
      setAppLoading(false);
    }
  };

  const handleUserSave = async (modifiedUser) => {
    // Optimistic Update
    setUserData(prev => prev.map(u => u._id === modifiedUser._id ? {
      ...u,
      tempDisposition: modifiedUser.tempDisposition,
      tempNotes: modifiedUser.tempNotes,
      tempNextCallDate: modifiedUser.tempNextCallDate,
      fullName: modifiedUser.fullName,
      targetCountry: modifiedUser.targetCountry.name || u.targetCountry,
      targetJobRole: modifiedUser.targetJobRole.name || u.targetJobRole,
    } : u));

    try {
      await axios.post('/api/crm/crm-update', {
        userId: modifiedUser._id,
        callDisposition: modifiedUser.tempDisposition,
        notes: modifiedUser.tempNotes,
        nextCallDate: modifiedUser.tempNextCallDate,
        fullName: modifiedUser.fullName,
        targetCountry: modifiedUser.targetCountry,
        targetJobRole: modifiedUser.targetJobRole,
      });
      alert('Saved successfully');
      setTimeout(fetchUserData, 500);
    } catch (error) {
      console.error("Error saving user data", error);
      alert('Error saving data');
      fetchUserData();
    }
  };

  const handleAppSave = async (modifiedApp) => {
    // Optimistic Update
    setAppData(prev => prev.map(u => u._id === modifiedApp._id ? {
      ...u,
      tempDisposition: modifiedApp.tempDisposition,
      tempNotes: modifiedApp.tempNotes,
      tempNextCallDate: modifiedApp.tempNextCallDate,
      fullName: modifiedApp.fullName,
      targetCountry: modifiedApp.targetCountry.name || u.targetCountry,
      targetJobRole: modifiedApp.targetJobRole.name || u.targetJobRole,
    } : u));

    try {
      await axios.post('/api/crm/crm-update', {
        userId: modifiedApp.userId,
        applicationId: modifiedApp._id,
        callDisposition: modifiedApp.tempDisposition,
        notes: modifiedApp.tempNotes,
        nextCallDate: modifiedApp.tempNextCallDate,
        fullName: modifiedApp.fullName,
        targetCountry: modifiedApp.targetCountry,
        targetJobRole: modifiedApp.targetJobRole,
      });
      alert('Saved successfully');
      setTimeout(fetchAppData, 500);
    } catch (error) {
      console.error("Error saving app data", error);
      alert('Error saving data');
      fetchAppData();
    }
  };

  const openModal = (record, type) => {
    setSelectedRecord(record);
    setModalType(type);
    setModalOpen(true);
  };

  const downloadUserCSV = async () => {
    try {
      const params = {
        page: 1,
        limit: 100000,
        applied: userFilters.applied,
        country: userFilters.country,
        jobRole: userFilters.jobRole,
        assignee: currentUser.email,
      };
      const response = await axios.get('/api/crm/user-level', { params });
      const { data: responseData } = response.data;
      const allData = responseData.map(u => ({
        ...u,
        assignee: u.crmData?.assignee || "",
        tempDisposition: u.crmData?.callDisposition || "",
        tempNotes: u.crmData?.notes || "",
        tempNextCallDate: u.crmData?.nextCallDate ? u.crmData.nextCallDate.split('T')[0] : ""
      }));

      const headers = ['S.No', 'User ID', 'Phone Number', 'Full Name', 'Applied?', 'Latest App Date', 'Target Country', 'Target Job Role', 'Call Disposition', 'Notes', 'Next Call Date'];
      const csvRows = [headers.join(',')];
      allData.forEach((user, index) => {
        const row = [
          index + 1,
          user._id,
          `"${(user.phoneNumber || '').replace(/"/g, '""')}"`,
          `"${(user.fullName || '').replace(/"/g, '""')}"`,
          user.hasApplied ? 'Y' : 'N',
          user.latestApplicationDate ? new Date(user.latestApplicationDate).toLocaleDateString() : '-',
          `"${(user.targetCountry || '').replace(/"/g, '""')}"`,
          `"${(user.targetJobRole || '').replace(/"/g, '""')}"`,
          `"${(user.tempDisposition || '').replace(/"/g, '""')}"`,
          `"${(user.tempNotes || '').replace(/"/g, '""')}"`,
          user.tempNextCallDate || ''
        ];
        csvRows.push(row.join(','));
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-user-activity.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading user CSV", error);
    }
  };

  const downloadAppCSV = async () => {
    try {
      const params = {
        page: 1,
        limit: 100000,
        userInfo: appFilters.userInfo,
        country: appFilters.country,
        jobRole: appFilters.jobRole,
        disposition: appFilters.disposition,
        assignee: currentUser.email,
      };
      const response = await axios.get('/api/crm/application-level', { params });
      const { data: responseData } = response.data;
      const allData = responseData.map(u => ({
        ...u,
        assignee: u.crmData?.assignee || "",
        tempDisposition: u.crmData?.callDisposition || "",
        tempNotes: u.crmData?.notes || "",
        tempNextCallDate: u.crmData?.nextCallDate ? u.crmData.nextCallDate.split('T')[0] : ""
      }));

      const headers = ['Application ID', 'User ID', 'Created At', 'Full Name', 'Phone Number', 'Target Country', 'Target Job Role', 'Job Title', 'Company', 'Assignee'];
      const csvRows = [headers.join(',')];
      allData.forEach(user => {
        const row = [
          user._id,
          user.userId,
          user.createdAt ? `"${new Date(user.createdAt).toLocaleString()}"` : '',
          `"${(user.fullName || '').replace(/"/g, '""')}"`,
          `"${(user.phoneNumber || '').replace(/"/g, '""')}"`,
          `"${(user.targetCountry || '').replace(/"/g, '""')}"`,
          `"${(user.targetJobRole || '').replace(/"/g, '""')}"`,
          `"${(user.jobTitle || '').replace(/"/g, '""')}"`,
          `"${(user.companyName || '').replace(/"/g, '""')}"`,
          `"${(user.assignee || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-app-activity.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading app CSV", error);
    }
  };

  const uniqueUserCountries = [...new Set(userData.map(item => item.targetCountry).filter(Boolean))];
  const uniqueUserRoles = [...new Set(userData.map(item => item.targetJobRole).filter(Boolean))];
  const uniqueAppCountries = [...new Set(appData.map(item => item.targetCountry).filter(Boolean))];
  const uniqueAppRoles = [...new Set(appData.map(item => item.targetJobRole).filter(Boolean))];

  if (!currentUser) return <div className="p-4">Please log in to view your activity.</div>;

  return (
    <>
      {modalOpen && (
        <div style={{ position: 'relative', zIndex: 9999 }}>
          <ModifyModal 
            record={selectedRecord} 
            type={modalType} 
            onClose={() => setModalOpen(false)} 
            onSave={modalType === 'user' ? handleUserSave : handleAppSave} 
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Activity</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Live
            </div>
            <span className="text-sm text-gray-500">Updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* --- User Level Section --- */}
        <div className="mb-12 border-b pb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">My User Assignments</h3>
          </div>

          <div className="flex gap-4 mb-4 flex-wrap items-center">
            <select 
              className="border p-2 rounded"
              value={userFilters.applied}
              onChange={(e) => setUserFilters(prev => ({ ...prev, applied: e.target.value }))}
            >
              <option value="">Filter Applied: All</option>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
            <select 
              className="border p-2 rounded"
              value={userFilters.country}
              onChange={(e) => setUserFilters(prev => ({ ...prev, country: e.target.value }))}
            >
              <option value="">Filter Country: All</option>
              {uniqueUserCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              className="border p-2 rounded"
              value={userFilters.jobRole}
              onChange={(e) => setUserFilters(prev => ({ ...prev, jobRole: e.target.value }))}
            >
              <option value="">Filter Job Role: All</option>
              {uniqueUserRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={downloadUserCSV} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 ml-auto">Download CSV</button>
          </div>

          {userLoading ? <div>Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border w-16">S.No</th>
                    <th className="p-2 border">User ID</th>
                    <th className="p-2 border">Phone Number</th>
                    <th className="p-2 border">Full Name</th>
                    <th className="p-2 border">Applied?</th>
                    <th className="p-2 border">Latest App Date</th>
                    <th className="p-2 border">Target Country</th>
                    <th className="p-2 border">Target Job Role</th>
                    <th className="p-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {userData.map((user, index) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="p-2 border text-center">{(userPage - 1) * 100 + index + 1}</td>
                      <td className="p-2 border text-xs font-mono">{user._id}</td>
                      <td className="p-2 border">{user.phoneNumber}</td>
                      <td className="p-2 border">{user.fullName}</td>
                      <td className="p-2 border text-center">
                        <span className={`px-2 py-1 rounded ${user.hasApplied ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.hasApplied ? 'Y' : 'N'}
                        </span>
                      </td>
                      <td className="p-2 border">
                        {user.latestApplicationDate ? new Date(user.latestApplicationDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-2 border">{user.targetCountry || '-'}</td>
                      <td className="p-2 border">{user.targetJobRole || '-'}</td>
                      <td className="p-2 border text-center">
                        <button
                          onClick={() => openModal(user, 'user')}
                          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 whitespace-nowrap text-sm"
                        >
                          Record Activity
                        </button>
                      </td>
                    </tr>
                  ))}
                  {userData.length === 0 && <tr><td colSpan="9" className="p-4 text-center text-gray-500">No user records assigned to you.</td></tr>}
                </tbody>
              </table>
              <div className="flex justify-center items-center mt-4 gap-4">
                <button onClick={() => setUserPage(p => Math.max(p - 1, 1))} disabled={userPage === 1} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">Previous</button>
                <span>Page {userPage}</span>
                <button onClick={() => setUserPage(p => p + 1)} disabled={userPage * 100 >= userTotal} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>

        {/* --- Application Level Section --- */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">My Application Assignments</h3>
          </div>

          <div className="flex gap-4 mb-4 flex-wrap items-center">
            <input 
              type="text" 
              placeholder="Search User Info..." 
              className="border p-2 rounded"
              value={appFilters.userInfo}
              onChange={(e) => setAppFilters(prev => ({ ...prev, userInfo: e.target.value }))}
            />
            <select 
              className="border p-2 rounded"
              value={appFilters.country}
              onChange={(e) => setAppFilters(prev => ({ ...prev, country: e.target.value }))}
            >
              <option value="">Filter Country: All</option>
              {uniqueAppCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              className="border p-2 rounded"
              value={appFilters.jobRole}
              onChange={(e) => setAppFilters(prev => ({ ...prev, jobRole: e.target.value }))}
            >
              <option value="">Filter Job Role: All</option>
              {uniqueAppRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select 
              className="border p-2 rounded"
              value={appFilters.disposition}
              onChange={(e) => setAppFilters(prev => ({ ...prev, disposition: e.target.value }))}
            >
              <option value="">Filter Disposition: All</option>
              {DISPOSITION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <button onClick={downloadAppCSV} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 ml-auto">Download CSV</button>
          </div>

          {appLoading ? <div>Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border w-16">S.No</th>
                    <th className="p-2 border">Created At</th>
                    <th className="p-2 border">User Info</th>
                    <th className="p-2 border">Target Country</th>
                    <th className="p-2 border">Target Job Role</th>
                    <th className="p-2 border">Job Info</th>
                    <th className="p-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appData.map((user, index) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="p-2 border text-center">{(appPage - 1) * 100 + index + 1}</td>
                      <td className="p-2 border text-sm">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                        <div className="text-xs text-gray-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleTimeString() : ''}
                        </div>
                      </td>
                      <td className="p-2 border">
                        <div className="font-bold">{user.fullName}</div>
                        <div className="text-sm text-gray-600">{user.phoneNumber}</div>
                        <div className="text-xs text-gray-400 font-mono">UID: {user.userId}</div>
                      </td>
                      <td className="p-2 border">{user.targetCountry || '-'}</td>
                      <td className="p-2 border">{user.targetJobRole || '-'}</td>
                      <td className="p-2 border">
                        <div className="font-medium text-sm">{user.jobTitle}</div>
                        <div className="text-xs text-gray-500">{user.companyName}</div>
                        <div className="text-xs text-gray-500">
                          {user.jobSnapshot?.salary?.min || 0} - {user.jobSnapshot?.salary?.max || 0} {user.jobSnapshot?.salary?.currency || ''}
                        </div>
                      </td>
                      <td className="p-2 border text-center">
                        <button
                          onClick={() => openModal(user, 'application')}
                          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 whitespace-nowrap text-sm"
                        >
                          Record Activity
                        </button>
                      </td>
                    </tr>
                  ))}
                  {appData.length === 0 && <tr><td colSpan="7" className="p-4 text-center text-gray-500">No application records assigned to you.</td></tr>}
                </tbody>
              </table>
              <div className="flex justify-center items-center mt-4 gap-4">
                <button onClick={() => setAppPage(p => Math.max(p - 1, 1))} disabled={appPage === 1} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">Previous</button>
                <span>Page {appPage}</span>
                <button onClick={() => setAppPage(p => p + 1)} disabled={appPage * 100 >= appTotal} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyActivity;