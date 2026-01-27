import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ModifyModal from './ModifyModal';
import { supabase } from './supabaseClient';
import { API_URL, APP_VERSION } from '../config';

const formatDate = (d) => {
  if (!d) return '';
  const val = d.$date || d;
  return new Date(val).toLocaleDateString();
};

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
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Debugging log for Production
    console.log(`[UserLevelFlow] Loaded. Version: ${APP_VERSION}`);
  }, []);

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
      const response = await axios.get(`${API_URL}/crm/user-level`, { params });
      const { data: responseData, total } = response.data;

      // Fetch Supabase overrides (Profiles & Assignments)
      const userIds = responseData.map(u => u._id);
      
      const [sbProfilesResult, sbCrmResult, sbAssignmentsResult] = await Promise.all([
        supabase.from('user_profiles').select('*').in('user_id', userIds),
        supabase.from('userflow_crm').select('*').in('user_id', userIds),
        supabase.from('user_assignments').select('*').in('user_id', userIds)
      ]);

      const sbProfiles = sbProfilesResult.data || [];
      const sbCrmData = sbCrmResult.data || [];
      const sbAssignments = sbAssignmentsResult.data || [];

      const initializedData = responseData.map(u => {
        const sbProfile = sbProfiles.find(p => p.user_id === u._id);
        const sbCrm = sbCrmData.find(c => c.user_id === u._id);
        const sbAssignment = sbAssignments.find(a => a.user_id === u._id);

        return {
          ...u,
          // Merge Profile Data (Supabase > MongoDB)
          skills: sbProfile?.skills || u.skills,
          language: sbProfile?.language || u.language,
          education: sbProfile?.education || u.education,
          experience: sbProfile?.experience || u.experience,
          dob: sbProfile?.dob || u.dob,
          gender: sbProfile?.gender || u.gender,
          location: sbProfile?.location || u.location,
          internationalExp: sbProfile?.international_exp ?? u.internationalExp,
          domesticExp: sbProfile?.domestic_exp ?? u.domesticExp,
          
          // Merge CRM Data (Supabase > MongoDB)
          fullName: sbCrm?.full_name || u.fullName,
          targetCountry: sbCrm?.target_country || u.targetCountry,
          targetJobRole: sbCrm?.target_job_role || u.targetJobRole,
          assignee: sbAssignment?.assigned_to || u.crmData?.assignee || "",
          tempDisposition: sbCrm?.call_disposition || u.crmData?.callDisposition || "",
          tempNotes: sbCrm?.notes || u.crmData?.notes || "",
          tempNextCallDate: sbCrm?.next_call_date ? sbCrm.next_call_date.split('T')[0] : (u.crmData?.nextCallDate ? u.crmData.nextCallDate.split('T')[0] : "")
        };
      });

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
      // Sync with Supabase for Dashboard
      await supabase.from('user_assignments').upsert({ user_id: user._id, assigned_to: assignee });
    } catch (error) {
      console.error("Error assigning user", error);
      alert('Failed to assign. Please try again.');
      fetchData();
    }
  };

  const handleInlineUpdate = async (userId, field, value) => {
    if (!value) return;
    let payload = {};
    try {
      if (field === 'skills') payload = { skills: value.split(',').map(s => s.trim()) };
      else if (field === 'language') {
        const [mother, others] = value.split('|');
        payload = { language: { motherTongue: mother?.trim(), other: others ? others.split(',').map(s => s.trim()) : [] } };
      }
      else if (field === 'dob') payload = { dob: value };
      else if (field === 'gender') payload = { gender: value };
      else if (field === 'location') {
        const [city, state, country] = value.split(',');
        payload = { location: { city: city?.trim(), state: state?.trim(), country: country?.trim() } };
      }

      // Optimistic update
      setData(prev => prev.map(u => u._id === userId ? { ...u, ...payload } : u));
      
      // Sync to Supabase (user_profiles)
      const sbPayload = { user_id: userId, updated_at: new Date().toISOString(), ...payload };
      // Map camelCase to snake_case for specific fields if necessary, but here payload keys match what we want except exp
      // Note: payload keys are 'skills', 'language', 'dob', 'gender', 'location', 'education', 'experience'
      // These match the SQL columns defined above.
      await supabase.from('user_profiles').upsert(sbPayload);
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update user details.");
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
          // Update profile fields
          skills: modifiedUser.skills,
          language: modifiedUser.language,
          education: modifiedUser.education,
          experience: modifiedUser.experience,
          dob: modifiedUser.dob,
          gender: modifiedUser.gender,
          location: modifiedUser.location,
          internationalExp: modifiedUser.internationalExp,
          domesticExp: modifiedUser.domesticExp
        };
      }
      return u;
    }));

    try {
      // 1. Save Profile Data to user_profiles
      const sbProfilePayload = {
        user_id: modifiedUser._id,
        
        // Profile Fields
        skills: modifiedUser.skills,
        language: modifiedUser.language,
        education: modifiedUser.education,
        experience: modifiedUser.experience,
        dob: modifiedUser.dob || null,
        gender: modifiedUser.gender,
        location: modifiedUser.location,
        international_exp: modifiedUser.internationalExp ?? null,
        domestic_exp: modifiedUser.domesticExp ?? null,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase.from('user_profiles').upsert(sbProfilePayload);
      if (profileError) throw profileError;

      // 2. Save CRM Data to userflow_crm
      const crmPayload = {
        user_id: modifiedUser._id,
        call_disposition: modifiedUser.tempDisposition,
        notes: modifiedUser.tempNotes,
        next_call_date: modifiedUser.tempNextCallDate || null,
        full_name: modifiedUser.fullName,
        target_country: typeof modifiedUser.targetCountry === 'object' ? modifiedUser.targetCountry.name : modifiedUser.targetCountry,
        target_job_role: typeof modifiedUser.targetJobRole === 'object' ? modifiedUser.targetJobRole.name : modifiedUser.targetJobRole,
        target_country_id: typeof modifiedUser.targetCountry === 'object' ? modifiedUser.targetCountry.id : null,
        target_job_role_id: typeof modifiedUser.targetJobRole === 'object' ? modifiedUser.targetJobRole.id : null,
      };

      const { data: existingCrm } = await supabase.from('userflow_crm').select('id').eq('user_id', modifiedUser._id).maybeSingle();
      
      if (existingCrm) {
        const { error: crmError } = await supabase.from('userflow_crm').update(crmPayload).eq('id', existingCrm.id);
        if (crmError) throw crmError;
      } else {
        const { error: crmError } = await supabase.from('userflow_crm').insert(crmPayload);
        if (crmError) throw crmError;
      }
      
      alert('Saved successfully to Supabase');
      
      // Refetch to ensure we see the merged data
      setTimeout(() => fetchData(), 500);

    } catch (error) {
      console.error("Error saving data to Supabase", error);
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
      setIsDownloading(true);
      let allData = [];
      const limit = 100;

      const params = {
        page: 1,
        limit,
        applied: filterApplied,
        country: filterCountry,
        jobRole: filterJobRole,
        assignee: filterAssignee,
        missingDetails: filterMissingDetails,
      };

      // Fetch first page to get total count
      const response = await axios.get(`${API_URL}/crm/user-level`, { params });
      const { data: firstPageData, total } = response.data;

      const mapRecord = (u) => ({
            ...u,
            assignee: u.crmData?.assignee || "",
            tempDisposition: u.crmData?.callDisposition || "",
            tempNotes: u.crmData?.notes || "",
            tempNextCallDate: u.crmData?.nextCallDate ? u.crmData.nextCallDate.split('T')[0] : ""
      });

      if (firstPageData && firstPageData.length > 0) {
        allData.push(...firstPageData.map(mapRecord));
      }

      const totalPages = Math.ceil(total / limit);

      if (totalPages > 1) {
        const batchSize = 5;
        for (let i = 2; i <= totalPages; i += batchSize) {
          const batchPromises = [];
          for (let j = i; j < i + batchSize && j <= totalPages; j++) {
            batchPromises.push(axios.get(`${API_URL}/crm/user-level`, { params: { ...params, page: j } }));
          }

          const batchResponses = await Promise.all(batchPromises);
          batchResponses.forEach(res => {
            const { data: pageData } = res.data;
            if (pageData && pageData.length > 0) {
              allData.push(...pageData.map(mapRecord));
            }
          });
        }
      }

      let filteredData = allData;
      if (filterMissingDetails === 'Yes') {
        filteredData = filteredData.filter(u => !u.fullName || !u.targetCountry || !u.targetJobRole);
      } else if (filterMissingDetails === 'No') {
        filteredData = filteredData.filter(u => u.fullName && u.targetCountry && u.targetJobRole);
      }

      const headers = ['S.No', 'User ID', 'Created At', 'Phone Number', 'Full Name', 'Skills', 'Languages', 'Education', 'Experience', 'DOB', 'Gender', 'Location', 'Applied?', 'Latest App Date', 'Target Country', 'Target Job Role', 'Assignee', 'Call Disposition', 'Notes', 'Next Call Date'];
      const csvRows = [headers.join(',')];

      filteredData.forEach((user, index) => {
        const skills = user.skills ? user.skills.join(', ') : '';
        const languages = user.language ? `${user.language.motherTongue || ''} | ${(user.language.other || []).join(', ')}` : '';
        const education = user.education ? (Array.isArray(user.education) ? user.education.map(e => `${e.degree} at ${e.institutionName}`).join('; ') : user.education) : '';
        const experience = user.experience ? (Array.isArray(user.experience) ? user.experience.map(e => `${e.position} at ${e.companyName}`).join('; ') : user.experience) : '';
        const location = user.location ? `${user.location.city || ''} ${user.location.state || ''} ${user.location.country || ''}` : '';

        const row = [
          index + 1,
          user._id,
          user.createdAt ? `"${new Date(user.createdAt.$date || user.createdAt).toLocaleString()}"` : '',
          `"${(user.phoneNumber || '').replace(/"/g, '""')}"`,
          `"${(user.fullName || '').replace(/"/g, '""')}"`,
          `"${skills.replace(/"/g, '""')}"`,
          `"${languages.replace(/"/g, '""')}"`,
          `"${education.replace(/"/g, '""')}"`,
          `"${experience.replace(/"/g, '""')}"`,
          user.dob ? formatDate(user.dob) : '',
          user.gender || '',
          `"${location.replace(/"/g, '""')}"`,
          user.hasApplied ? 'Y' : 'N',
          user.latestApplicationDate ? new Date(user.latestApplicationDate).toLocaleDateString() : '-',
          `"${(user.targetCountry || '').replace(/"/g, '""')}"`,
          `"${(user.targetJobRole || '').replace(/"/g, '""')}"`,
          `"${(user.assignee || '').replace(/"/g, '""')}"`,
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
    } finally {
      setIsDownloading(false);
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

        <button onClick={downloadCSV} disabled={isDownloading} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 ml-auto disabled:bg-gray-400">
          {isDownloading ? 'Downloading...' : 'Download CSV'}
        </button>
      </div>

      <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border w-16">S.No</th>
            <th className="p-2 border">Created At</th>
            <th className="p-2 border">User Info</th>
            <th className="p-2 border">Skills</th>
            <th className="p-2 border">Languages</th>
            <th className="p-2 border">Education</th>
            <th className="p-2 border">Experience</th>
            <th className="p-2 border">DOB</th>
            <th className="p-2 border">Gender</th>
            <th className="p-2 border">Location</th>
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
              <td className="p-2 border text-sm">
                <div>{formatDate(user.createdAt) || '-'}</div>
                <div className="text-xs text-gray-500">
                  {user.createdAt ? new Date(user.createdAt.$date || user.createdAt).toLocaleTimeString() : ''}
                </div>
              </td>
              <td className="p-2 border">
                <div className="font-semibold">{user.fullName}</div>
                <div>{user.phoneNumber}</div>
                <div className="text-xs text-gray-500 font-mono">UID: {user._id}</div>
              </td>
              
              {/* Skills */}
              <td className="p-2 border text-sm">
                {user.skills && user.skills.length > 0 ? (
                  user.skills.join(', ')
                ) : (
                  <input 
                    className="border rounded p-1 w-full text-xs" 
                    placeholder="Add Skills (comma sep)" 
                    onBlur={(e) => handleInlineUpdate(user._id, 'skills', e.target.value)}
                  />
                )}
              </td>

              {/* Languages */}
              <td className="p-2 border text-sm">
                {user.language && (user.language.motherTongue || (user.language.other && user.language.other.length > 0)) ? (
                  <span>{user.language.motherTongue} | {user.language.other?.join(', ')}</span>
                ) : (
                  <input 
                    className="border rounded p-1 w-full text-xs" 
                    placeholder="Mother | Other1, Other2" 
                    onBlur={(e) => handleInlineUpdate(user._id, 'language', e.target.value)}
                  />
                )}
              </td>

              {/* Education */}
              <td className="p-2 border text-sm">
                {user.education && Array.isArray(user.education) && user.education.length > 0 ? (
                  user.education.map((e, i) => (
                    <div key={i} className="mb-2 pb-1 border-b last:border-0">
                      <div className="font-semibold">{e.institutionName}</div>
                      <div>{e.degree} {e.fieldOfStudy ? `(${e.fieldOfStudy})` : ''}</div>
                      <div className="text-xs text-gray-500">{formatDate(e.startDate)} - {formatDate(e.endDate)}</div>
                    </div>
                  ))
                ) : (
                  user.education && !Array.isArray(user.education) ? user.education : <span className="text-gray-400 text-xs italic">No Education</span>
                )}
              </td>

              {/* Experience */}
              <td className="p-2 border text-sm">
                {user.experience && Array.isArray(user.experience) && user.experience.length > 0 ? (
                  user.experience.map((e, i) => (
                    <div key={i} className="mb-2 pb-1 border-b last:border-0">
                      <div className="font-semibold">{e.companyName}</div>
                      <div>{e.position}</div>
                      <div className="text-xs text-gray-500">{formatDate(e.startDate)} - {formatDate(e.endDate)}</div>
                    </div>
                  ))
                ) : (
                  user.experience && !Array.isArray(user.experience) ? user.experience : <span className="text-gray-400 text-xs italic">No Experience</span>
                )}
              </td>

              {/* DOB */}
              <td className="p-2 border text-sm">
                {user.dob ? (
                  formatDate(user.dob)
                ) : (
                  <input 
                    type="date"
                    className="border rounded p-1 w-full text-xs" 
                    onBlur={(e) => handleInlineUpdate(user._id, 'dob', e.target.value)}
                  />
                )}
              </td>

              {/* Gender */}
              <td className="p-2 border text-sm">
                {user.gender ? (
                  user.gender
                ) : (
                  <select 
                    className="border rounded p-1 w-full text-xs"
                    onChange={(e) => handleInlineUpdate(user._id, 'gender', e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>M|F</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                )}
              </td>

              {/* Location */}
              <td className="p-2 border text-sm">
                {user.location && (user.location.city || user.location.country) ? (
                  <span>{user.location.city}, {user.location.state}, {user.location.country}</span>
                ) : (
                  <input 
                    className="border rounded p-1 w-full text-xs" 
                    placeholder="City, State, Country" 
                    onBlur={(e) => handleInlineUpdate(user._id, 'location', e.target.value)}
                  />
                )}
              </td>

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
      </div>
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