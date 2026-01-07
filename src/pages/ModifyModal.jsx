import React, { useEffect, useState } from 'react';
import axios from 'axios';
import JobSnapshotDetails from './JobSnapshotDetails';
import { API_URL } from '../config';

const getSafeDate = (dateVal) => {
    if (!dateVal) return "";
    const val = dateVal.$date || dateVal;
    return new Date(val).toISOString().split('T')[0];
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

const ModifyModal = ({ record, type, onClose, onSave }) => {
    const [disposition, setDisposition] = useState(record.tempDisposition || "");
    const [notes, setNotes] = useState(record.tempNotes || "");
    const [nextCallDate, setNextCallDate] = useState(record.tempNextCallDate || "");
    const [fullName, setFullName] = useState(record.fullName || "");
    const [country, setCountry] = useState(record.targetCountry || "");
    const [jobRole, setJobRole] = useState(record.targetJobRole || "");
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // New Fields State
    const [skills, setSkills] = useState(record.skills ? record.skills.join(', ') : "");
    const [languages, setLanguages] = useState(
        record.language ? `${record.language.motherTongue || ''} | ${record.language.other?.join(', ') || ''}` : ""
    );
    const [education, setEducation] = useState(record.education || []);
    const [experience, setExperience] = useState(record.experience || []);
    const [dob, setDob] = useState(getSafeDate(record.dob));
    const [gender, setGender] = useState(record.gender || "");
    const [location, setLocation] = useState(record.location ? [record.location.city, record.location.state, record.location.country].filter(Boolean).join(', ') : "");
    const [internationalExp, setInternationalExp] = useState(record.internationalExp ?? "");
    const [domesticExp, setDomesticExp] = useState(record.domesticExp ?? "");

    const [countriesList, setCountriesList] = useState([]);
    const [jobRolesList, setJobRolesList] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!record?._id) return;
            setHistoryLoading(true);
            try {
                const endpoint = type === 'user' 
                    ? `${API_URL}/crm/user-history/${record._id}` 
                    : `${API_URL}/crm/application-history/${record._id}`;
                const response = await axios.get(endpoint);
                setHistory(response.data);
            } catch (error) {
                console.error("Error fetching history", error);
            } finally {
                setHistoryLoading(false);
            }
        };
        fetchHistory();
    }, [record._id, type]);

    useEffect(() => {
        const fetchDropdownData = async () => {
            if (type === 'user' || (!record.targetCountry || !record.targetJobRole)) {
                try {
                    const [countriesRes, jobRolesRes] = await Promise.all([
                        axios.get(`${API_URL}/crm/countries`),
                        axios.get(`${API_URL}/crm/job-roles`)
                    ]);
                    setCountriesList(countriesRes.data);
                    setJobRolesList(jobRolesRes.data);
                } catch (error) { console.error("Error fetching dropdown data", error); }
            }
        };
        fetchDropdownData();
    }, [record.targetCountry, record.targetJobRole, type]);

    // Handlers for Array Fields
    const handleEducationChange = (index, field, value) => {
        const newEdu = [...education];
        newEdu[index] = { ...newEdu[index], [field]: value };
        setEducation(newEdu);
    };
    const addEducation = () => setEducation([...education, { institutionName: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" }]);
    const removeEducation = (index) => setEducation(education.filter((_, i) => i !== index));

    const handleExperienceChange = (index, field, value) => {
        const newExp = [...experience];
        newExp[index] = { ...newExp[index], [field]: value };
        setExperience(newExp);
    };
    const addExperience = () => setExperience([...experience, { companyName: "", position: "", startDate: "", endDate: "" }]);
    const removeExperience = (index) => setExperience(experience.filter((_, i) => i !== index));


    const handleInternalSave = () => {
        const selectedCountry = countriesList.find(c => c.name === country);
        const selectedJobRole = jobRolesList.find(r => r.title === jobRole);

        // Parse new fields back to object structure
        const parsedSkills = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
        
        let parsedLanguage = { motherTongue: "", other: [] };
        if (languages) {
            const [mother, others] = languages.split('|');
            parsedLanguage = { 
                motherTongue: mother?.trim() || "", 
                other: others ? others.split(',').map(s => s.trim()).filter(Boolean) : [] 
            };
        }

        const [city, state, countryLoc] = location ? location.split(',').map(s => s.trim()) : ["", "", ""];
        const parsedLocation = { city, state, country: countryLoc };

        onSave({
            ...record,
            tempDisposition: disposition,
            tempNotes: notes,
            tempNextCallDate: nextCallDate,
            fullName: fullName,
            targetCountry: selectedCountry 
                ? { id: selectedCountry._id, name: selectedCountry.name } 
                : { name: country }, // Fallback for custom entry
            targetJobRole: selectedJobRole 
                ? { id: selectedJobRole._id, name: selectedJobRole.title } 
                : { name: jobRole }, // Fallback for custom entry
            skills: parsedSkills,
            language: parsedLanguage,
            education: education,
            experience: experience,
            dob: dob,
            gender: gender,
            location: parsedLocation,
            internationalExp: internationalExp === "" ? null : Number(internationalExp),
            domesticExp: domesticExp === "" ? null : Number(domesticExp)
        });
        onClose();
    };

    if (!record) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-end" onClick={onClose} >
            <div className={`h-full w-full ${type === 'application' ? 'max-w-5xl' : 'max-w-lg'} bg-gray-100 shadow-xl z-50`} onClick={e => e.stopPropagation()}>
                <div className="flex h-full">
                    {/* Left Column: Form & History */}
                    <div className={`${type === 'application' ? 'w-1/2' : 'w-full'} p-6 flex flex-col bg-white overflow-y-auto`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Record Activity for {type === 'user' ? 'User' : 'Application'}</h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                        </div>

                        {/* Form */}
                        <div className="space-y-4 mb-8">
                            {/* Basic Info & Joined At */}
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                                    <input type="text" className="w-full p-2 border rounded bg-gray-100" value={record._id} disabled />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Joined At</label>
                                    <input type="text" className="w-full p-2 border rounded bg-gray-100" value={record.createdAt ? new Date(record.createdAt.$date || record.createdAt).toLocaleDateString() : '-'} disabled />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name</label>
                                <input type="text" className="w-full p-2 border rounded" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                            </div>

                            {/* Target Country & Job Role - Always shown, disabled if exists */}
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Country</label>
                                    <input
                                        list="countries-list"
                                        className={`w-full p-2 border rounded ${record.targetCountry ? 'bg-gray-100' : ''}`}
                                        placeholder="Search country..."
                                        defaultValue={country}
                                        onBlur={(e) => setCountry(e.target.value)}
                                        disabled={!!record.targetCountry}
                                    />
                                    <datalist id="countries-list">
                                        {countriesList.map(c => <option key={c._id} value={c.name} />)}
                                    </datalist>
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Job Role</label>
                                    <input
                                        list="jobroles-list"
                                        className={`w-full p-2 border rounded ${record.targetJobRole ? 'bg-gray-100' : ''}`}
                                        placeholder="Search job role..."
                                        defaultValue={jobRole}
                                        onBlur={(e) => setJobRole(e.target.value)}
                                        disabled={!!record.targetJobRole}
                                    />
                                    <datalist id="jobroles-list">
                                        {jobRolesList.map(r => <option key={r._id} value={r.title} />)}
                                    </datalist>
                                </div>
                            </div>

                            {/* New Profile Fields */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                                <input 
                                    type="text" 
                                    className={`w-full p-2 border rounded ${record.skills && record.skills.length > 0 ? 'bg-gray-100' : ''}`}
                                    value={skills} 
                                    onChange={(e) => setSkills(e.target.value)} 
                                    disabled={record.skills && record.skills.length > 0}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Languages (Mother | Other1, Other2)</label>
                                <input 
                                    type="text" 
                                    className={`w-full p-2 border rounded ${record.language && (record.language.motherTongue || record.language.other?.length) ? 'bg-gray-100' : ''}`}
                                    value={languages} 
                                    onChange={(e) => setLanguages(e.target.value)}
                                    disabled={!!(record.language && (record.language.motherTongue || (record.language.other && record.language.other.length > 0)))}
                                />
                            </div>

                            {/* Education Section */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Education</label>
                                    <button onClick={addEducation} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">+ Add</button>
                                </div>
                                {education.map((edu, idx) => (
                                    <div key={idx} className="border p-3 rounded mb-2 bg-gray-50">
                                        {!edu._id && (
                                            <div className="flex justify-end mb-1">
                                                <button onClick={() => removeEducation(idx)} className="text-red-500 text-xs hover:underline">Remove</button>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <input placeholder="Institution Name" className={`p-1 border rounded text-sm ${edu._id ? 'bg-gray-200 text-gray-500' : ''}`} value={edu.institutionName} onChange={e => handleEducationChange(idx, 'institutionName', e.target.value)} disabled={!!edu._id} />
                                            <input placeholder="Degree" className={`p-1 border rounded text-sm ${edu._id ? 'bg-gray-200 text-gray-500' : ''}`} value={edu.degree} onChange={e => handleEducationChange(idx, 'degree', e.target.value)} disabled={!!edu._id} />
                                        </div>
                                        <div className="mb-2">
                                            <input placeholder="Field of Study" className={`w-full p-1 border rounded text-sm ${edu._id ? 'bg-gray-200 text-gray-500' : ''}`} value={edu.fieldOfStudy} onChange={e => handleEducationChange(idx, 'fieldOfStudy', e.target.value)} disabled={!!edu._id} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-500">Start Date</label>
                                                <input type="date" className={`w-full p-1 border rounded text-sm ${edu._id ? 'bg-gray-200 text-gray-500' : ''}`} value={getSafeDate(edu.startDate)} onChange={e => handleEducationChange(idx, 'startDate', e.target.value)} disabled={!!edu._id} />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">End Date</label>
                                                <input type="date" className={`w-full p-1 border rounded text-sm ${edu._id ? 'bg-gray-200 text-gray-500' : ''}`} value={getSafeDate(edu.endDate)} onChange={e => handleEducationChange(idx, 'endDate', e.target.value)} disabled={!!edu._id} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Experience Section */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Experience</label>
                                    <button onClick={addExperience} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">+ Add</button>
                                </div>
                                {experience.map((exp, idx) => (
                                    <div key={idx} className="border p-3 rounded mb-2 bg-gray-50">
                                        {!exp._id && (
                                            <div className="flex justify-end mb-1">
                                                <button onClick={() => removeExperience(idx)} className="text-red-500 text-xs hover:underline">Remove</button>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <input placeholder="Company Name" className={`p-1 border rounded text-sm ${exp._id ? 'bg-gray-200 text-gray-500' : ''}`} value={exp.companyName} onChange={e => handleExperienceChange(idx, 'companyName', e.target.value)} disabled={!!exp._id} />
                                            <input placeholder="Position" className={`p-1 border rounded text-sm ${exp._id ? 'bg-gray-200 text-gray-500' : ''}`} value={exp.position} onChange={e => handleExperienceChange(idx, 'position', e.target.value)} disabled={!!exp._id} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-500">Start Date</label>
                                                <input type="date" className={`w-full p-1 border rounded text-sm ${exp._id ? 'bg-gray-200 text-gray-500' : ''}`} value={getSafeDate(exp.startDate)} onChange={e => handleExperienceChange(idx, 'startDate', e.target.value)} disabled={!!exp._id} />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">End Date</label>
                                                <input type="date" className={`w-full p-1 border rounded text-sm ${exp._id ? 'bg-gray-200 text-gray-500' : ''}`} value={getSafeDate(exp.endDate)} onChange={e => handleExperienceChange(idx, 'endDate', e.target.value)} disabled={!!exp._id} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">DOB</label>
                                    <input 
                                        type="date" 
                                        className={`w-full p-2 border rounded ${record.dob ? 'bg-gray-100' : ''}`}
                                        value={dob} 
                                        onChange={(e) => setDob(e.target.value)}
                                        disabled={!!record.dob}
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <select 
                                        className={`w-full p-2 border rounded ${record.gender ? 'bg-gray-100' : ''}`}
                                        value={gender} 
                                        onChange={(e) => setGender(e.target.value)}
                                        disabled={!!record.gender}
                                    >
                                        <option value="">M|F</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location (City, State, Country)</label>
                                <input 
                                    type="text" 
                                    className={`w-full p-2 border rounded ${record.location && (record.location.city || record.location.country) ? 'bg-gray-100' : ''}`}
                                    value={location} 
                                    onChange={(e) => setLocation(e.target.value)}
                                    disabled={!!(record.location && (record.location.city || record.location.country))}
                                />
                            </div>

                            {/* CRM Fields */}
                            <hr className="my-4" />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Call Disposition</label>
                                <select className="w-full p-2 border rounded" value={disposition} onChange={(e) => setDisposition(e.target.value)} >
                                    <option value="">Select Disposition</option>
                                    {DISPOSITION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea className="w-full p-2 border rounded" rows="4" value={notes} onChange={(e) => setNotes(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Next Call Date (Optional)</label>
                                <input type="date" className="w-full p-2 border rounded" value={nextCallDate} onChange={(e) => setNextCallDate(e.target.value)} />
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration of International exp (Years)</label>
                                    <input 
                                        type="number" 
                                        className={`w-full p-2 border rounded ${record.internationalExp !== undefined && record.internationalExp !== null ? 'bg-gray-100' : ''}`}
                                        value={internationalExp} 
                                        onChange={(e) => setInternationalExp(e.target.value)}
                                        disabled={record.internationalExp !== undefined && record.internationalExp !== null}
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration of Domestic exp (Years)</label>
                                    <input 
                                        type="number" 
                                        className={`w-full p-2 border rounded ${record.domesticExp !== undefined && record.domesticExp !== null ? 'bg-gray-100' : ''}`}
                                        value={domesticExp} 
                                        onChange={(e) => setDomesticExp(e.target.value)}
                                        disabled={record.domesticExp !== undefined && record.domesticExp !== null}
                                    />
                                </div>
                            </div>
                        </div>
                        <button onClick={handleInternalSave} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700" >
                            Save Changes
                        </button>

                        {/* History Timeline */}
                        <div className="mt-10 flex-grow overflow-y-auto">
                            <h3 className="text-xl font-bold mb-4">History</h3>
                            {historyLoading ? (
                                <p>Loading history...</p>
                            ) : (
                                <div className="space-y-6 border-l-2 border-gray-200 pl-6">
                                    {history.length > 0 ? history.map(entry => (
                                        <div key={entry.id} className="relative">
                                            <div className="absolute -left-7 top-1 h-2 w-2 rounded-full bg-blue-500"></div>
                                            <p className="text-sm text-gray-500">{new Date(entry.created_at).toLocaleString()}</p>
                                            <p className="font-semibold">{entry.assignee || 'System'}</p>
                                            {entry.call_disposition && <p className="text-sm">Status: <span className="font-medium">{entry.call_disposition}</span></p>}
                                            {entry.notes && <p className="text-sm bg-gray-50 p-2 rounded mt-1">Notes: {entry.notes}</p>}
                                        </div>
                                    )) : <p>No history found.</p>}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Right Column: Job Snapshot */}
                    {type === 'application' && record.jobSnapshot && (
                        <div className="w-1/2 p-6 overflow-y-auto">
                            <h3 className="text-xl font-bold mb-4">Job Snapshot</h3>
                            <JobSnapshotDetails snapshot={record.jobSnapshot} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModifyModal;