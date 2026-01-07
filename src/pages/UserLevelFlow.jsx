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

const UserLevelFlow = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterApplied, setFilterApplied] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterJobRole, setFilterJobRole] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterMissingDetails, setFilterMissingDetails] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedUserForModify, setSelectedUserForModify] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentUser, setCurrentUser] = useState(null);
  const [assignees, setAssignees] = useState([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [currentPage, filterApplied, filterCountry, filterJobRole, filterAssignee, filterMissingDetails]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const syncAssignees = async () => {
      const { data: sbData } = await supabase
        .from('user_assignments')
        .select('assigned_to');
      
      const sbAssignees = sbData ? sbData.map(item => item.assigned_to).filter(Boolean) : [];
      const localAssignees = data.map(u => u.assignee).filter(Boolean);
      const unique = [...new Set([...sbAssignees, ...localAssignees])].sort();
      setAssignees(unique);
    };
    syncAssignees();
  }, [data]);

  const fetchData = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 100,
        applied: filterApplied,
        country: filterCountry,
        jobRole: filterJobRole,
        assignee: filterAssignee,
        missingDetails: filterMissingDetails,
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

      let filteredData = initializedData;
      if (filterMissingDetails === 'Yes') {
        filteredData = filteredData.filter(u => !u.fullName || !u.targetCountry || !u.targetJobRole);
      } else if (filterMissingDetails === 'No') {
        filteredData = filteredData.filter(u => u.fullName && u.targetCountry && u.targetJobRole);
      }

      setTotalRecords(total);
      setData(filteredData);
      setLoading(false);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching user level data", error);
      setLoading(false);
    }
  };

  const handleAssign = async (user) => {
    if (!currentUser?.email) return;
    const assignee = currentUser.email;

    // Update local state immediately
    setData(prev => prev.map(u => u._id === user._id ? { ...u, assignee } : u));

    try {
      // Update CRM API
      await axios.post('/api/crm/crm-update', {
        userId: user._id,
        assignee: assignee
      });
      // Sync with Supabase for Dashboard
      await supabase.from('user_assignments').upsert({ user_id: user._id, assigned_to: assignee });
    } catch (error) {
      console.error("Error assigning user", error);
      alert('Failed to assign. Please try again.');
      fetchData();
    }
  };

  const handleSaveFromModal = async (modifiedUser) => {
    // Optimistic UI Update
    setData(prev => prev.map(u => {
      if (u._id === modifiedUser._id) {
        return {
          ...u,
          // Update fields from the modal
          tempDisposition: modifiedUser.tempDisposition,
          tempNotes: modifiedUser.tempNotes,
          tempNextCallDate: modifiedUser.tempNextCallDate,
          // Also update the main display fields if they were changed
          fullName: modifiedUser.fullName,
          targetCountry: modifiedUser.targetCountry.name || u.targetCountry,
          targetJobRole: modifiedUser.targetJobRole.name || u.targetJobRole,
        };
      }
      return u;
    }));

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
      
      const originalUser = data.find(u => u._id === modifiedUser._id);
      const needsRefetch = 
        (modifiedUser.fullName && modifiedUser.fullName !== originalUser?.fullName) ||
        (modifiedUser.targetCountry.name && modifiedUser.targetCountry.name !== originalUser?.targetCountry) ||
        (modifiedUser.targetJobRole.name && modifiedUser.targetJobRole.name !== originalUser?.targetJobRole);

      if (needsRefetch) {
        // A small delay can help ensure the database has processed the update before we query it again.
        setTimeout(() => fetchData(), 500);
      }
    } catch (error) {
      console.error("Error saving CRM data", error);
      alert('Error saving data');
      // On error, refetch to revert the optimistic UI update
      fetchData();
    }
  };

  const openModifyModal = (user) => {
    setSelectedUserForModify(user);
    setIsModalOpen(true);
  };

  const uniqueCountries = [...new Set(data.map(item => item.targetCountry).filter(Boolean))];
  const uniqueJobRoles = [...new Set(data.map(item => item.targetJobRole).filter(Boolean))];

  const downloadCSV = async () => {
    try {
      const params = {
        page: 1,
        limit: 100000,
        applied: filterApplied,
        country: filterCountry,
        jobRole: filterJobRole,
        assignee: filterAssignee,
        missingDetails: filterMissingDetails,
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

      let filteredData = allData;
      if (filterMissingDetails === 'Yes') {
        filteredData = filteredData.filter(u => !u.fullName || !u.targetCountry || !u.targetJobRole);
      } else if (filterMissingDetails === 'No') {
        filteredData = filteredData.filter(u => u.fullName && u.targetCountry && u.targetJobRole);
      }

      const headers = ['S.No', 'User ID', 'Phone Number', 'Full Name', 'Applied?', 'Latest App Date', 'Target Country', 'Target Job Role', 'Call Disposition', 'Notes', 'Next Call Date'];
      const csvRows = [headers.join(',')];

      filteredData.forEach((user, index) => {
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
      a.download = `user-level-data.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CSV", error);
      alert("Failed to download CSV");
    }
  };

  if (loading) return <div>Loading User Flow...</div>;

  return (
    <>
      {isModalOpen && (
        <div style={{ position: 'relative', zIndex: 9999 }}>
          <ModifyModal record={selectedUserForModify} type="user" onClose={() => setIsModalOpen(false)} onSave={handleSaveFromModal} />
        </div>
      )}

    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">User Level Workflow</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Live
          </div>
          <span className="text-sm text-gray-500">Updated: {lastUpdated.toLocaleTimeString()}</span>
          <button onClick={fetchData} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">Refresh</button>
        </div>
      </div>
      
      <div className="flex gap-4 mb-4">
        <div className="bg-blue-100 p-2 rounded">Total: <strong>{data.length}</strong></div>
        <div className="bg-green-100 p-2 rounded">Filtered: <strong>{totalRecords}</strong></div>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap items-center">
        <select 
          className="border p-2 rounded"
          value={filterApplied}
          onChange={(e) => setFilterApplied(e.target.value)}
        >
          <option value="">Filter Applied: All</option>
          <option value="Y">Yes</option>
          <option value="N">No</option>
        </select>

        <select 
          className="border p-2 rounded"
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
        >
          <option value="">Filter Country: All</option>
          {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select 
          className="border p-2 rounded"
          value={filterJobRole}
          onChange={(e) => setFilterJobRole(e.target.value)}
        >
          <option value="">Filter Job Role: All</option>
          {uniqueJobRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select 
          className="border p-2 rounded"
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
        >
          <option value="">Filter Assignee: All</option>
          <option value="Unassigned">Unassigned</option>
          {assignees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select 
          className="border p-2 rounded"
          value={filterMissingDetails}
          onChange={(e) => setFilterMissingDetails(e.target.value)}
        >
          <option value="">Filter Missing Details: All</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>

        <button onClick={downloadCSV} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 ml-auto">Download CSV</button>
      </div>

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
            <th className="p-2 border">Assign To</th>
          </tr>
        </thead>
        <tbody>
          {data.map((user, index) => (
            <tr key={user._id} className="hover:bg-gray-50">
              <td className="p-2 border text-center">{(currentPage - 1) * 100 + index + 1}</td>
              <td className="p-2 border text-xs font-mono">{user._id}</td>
              <td className="p-2 border">{user.phoneNumber}</td>
              <td className="p-2 border">{user.fullName}</td>
              <td className="p-2 border text-center">
                <span className={`px-2 py-1 rounded ${user.hasApplied ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.hasApplied ? 'Y' : 'N'}
                </span>
              </td>
              <td className="p-2 border">
                {user.latestApplicationDate 
                  ? new Date(user.latestApplicationDate).toLocaleDateString() 
                  : '-'}
              </td>
              <td className="p-2 border">{user.targetCountry || '-'}</td>
              <td className="p-2 border">{user.targetJobRole || '-'}</td>
              <td className="p-2 border">
                <div className="flex items-center gap-2">
                  {user.assignee ? (
                    user.assignee === currentUser?.email ? (
                      // Assigned to me: Show nothing here, Record Activity button is shown below
                      <span className="hidden"></span>
                    ) : (
                      <span className="text-xs text-gray-500">Assigned to {user.assignee}</span>
                    )
                  ) : (
                    <button
                      onClick={() => handleAssign(user)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs whitespace-nowrap"
                    >
                      Assign Me
                    </button>
                  )}
                  
                  {(user.assignee === currentUser?.email) && (
                    <button
                      onClick={() => openModifyModal(user)}
                      className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 whitespace-nowrap"
                    >
                      Record Activity
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-center items-center mt-4 gap-4">
        <button 
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {currentPage} of {Math.ceil(totalRecords / 100)}</span>
        <button 
          onClick={() => setCurrentPage(p => p + 1)} 
          disabled={currentPage * 100 >= totalRecords}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
    </>
  );
};

export default UserLevelFlow;