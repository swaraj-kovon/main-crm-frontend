import React, { useEffect, useState } from 'react';
import axios from 'axios';
import JobSnapshotDetails from './JobSnapshotDetails';

const SMS_TEMPLATES = [
    {
        sid: "33410",
        name: "p0 app download Hindi",
        content: "Hi {#name#}, aapka abroad job interest update kar rahe hain. Kovon safe & free platform hai. Profile banane ke liye download kare: {#applink#} -Kovon",
        variables: ["name", "applink"]
    },
    {
        sid: "33394",
        name: "Context Trust App Install Hindi",
        content: "Hi {#name#}, yeh {#country#} mein {#jobrole#} aur salary {#salary#} se upar ke jobs ke baare mein hai. Kovon bilkul free hai aur verified foreign employers ke saath kaam karta hai. App download karke safely jobs dekhiye. {#applink#} -Kovon",
        variables: ["name", "country", "jobrole", "salary", "applink"]
    },
    {
        sid: "33387",
        name: "App Open",
        content: "Jobs available for {#jobrole#} in {#country#}. Open your Kovon app and apply today. No charges. Login now: {#applink#} -Kovon",
        variables: ["jobrole", "country", "applink"]
    },
    {
        sid: "33386",
        name: "PO APP DOWNLOAD",
        content: "Hi {#name#}, aapka abroad job interest update kar rahe hain. Kovon safe & free platform hai. Profile banane ke liye download kare: https://vil.ltd/kovon/c/kjobs -Kovon",
        variables: ["name"]
    },
    {
        sid: "33385",
        name: "Context + Trust + App Install",
        content: "Hi {#name#}, this is regarding {#jobrole#} jobs in {#country#} . Kovon is 100% free with verified overseas employers. Download the app to explore safely. {#applink#} -Kovon",
        variables: ["name", "jobrole", "country", "applink"]
    },
    {
        sid: "33205",
        name: "DO Job Search",
        content: "Hi {#name#}, Kovon ne aapke skill ke hisaab se abroad jobs shortlist ki hain. Check karo aur free me apply karo: https://www.kovon.io/ -Kovon",
        variables: ["name"]
    }
];

const WHATSAPP_TEMPLATES = [
    {
        wid: "23781",
        name: "explain_next_step_profile_comp",
        content: "Dear {{1}}, You are now registered on Kovon. To see matching overseas jobs, please add your job role and target country. Takes less than 2 minutes.",
        variables: [{ key: "1", field: "name" }]
    },
    {
        wid: "23780",
        name: "unreg_day0_install_msg_media",
        content: "Hi {{1}} , main aapse {{2}} mein {{3}} ke jobs liye baat karna chah rahi thi. - Kovon par *0* charges - Koi agent nahi - Sirf *verified foreign jobs* hain Yahan se app download karein. Install ke baad DONE reply karein",
        variables: [{ key: "1", field: "name" }, { key: "2", field: "country" }, { key: "3", field: "jobrole" }]
    },
    {
        wid: "23506",
        name: "reg_noapply_day0",
        content: "Aapki profile {{1}} mein {{2}} jobs ke liye ready hai. Live jobs available hain. App kholkar search karein. Main madad kar sakti hoon.",
        variables: [{ key: "1", field: "country" }, { key: "2", field: "jobrole" }]
    },
    {
        wid: "23503",
        name: "unreg_fomo_day4",
        content: "Aap jaise profile wale candidates ne {{1}} mein {{2}} jobs ke liye Kovon par apply kiya hai. Aap bhi bina paisa diye apply kar sakte hain. 🎊 Abhi install karein, aur future secure karein!🌏",
        variables: [{ key: "1", field: "country" }, { key: "2", field: "jobrole" }]
    },
    {
        wid: "23502",
        name: "unreg_day0_install_msg",
        content: "Hi {{1}} , main aapse {{2}} mein {{3}} ke jobs liye baat karna chah rahi thi. - Kovon par *0* charges - Koi agent nahi - Sirf *verified foreign jobs* hain Yahan se app download karein. Install ke baad DONE reply karein",
        variables: [{ key: "1", field: "name" }, { key: "2", field: "country" }, { key: "3", field: "jobrole" }]
    }
];

const getVariableValue = (key, record) => {
    switch (key) {
        case 'name':
            return record.fullName || '';
        case 'country':
            return typeof record.targetCountry === 'object' ? record.targetCountry.name : (record.targetCountry || '');
        case 'jobrole':
            return typeof record.targetJobRole === 'object' ? record.targetJobRole.name : (record.targetJobRole || '');
        case 'salary':
            if (record.jobSnapshot?.salary?.min) {
                return `${record.jobSnapshot.salary.min} ${record.jobSnapshot.salary.currency || ''}`;
            }
            return 'competitive';
        case 'applink':
            return 'https://vil.ltd/kovon/c/kjobs';
        default:
            return '';
    }
};

const SendCommsModal = ({ onClose, record }) => {
    const [commsType, setCommsType] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [sid, setSid] = useState('');
    const [wid, setWid] = useState('');
    const [variables, setVariables] = useState([{ key: '', value: '' }]);
    const [isSending, setIsSending] = useState(false);

    const handleTemplateChange = (e) => {
        const templateName = e.target.value;
        setSelectedTemplate(templateName);

        if (commsType === 'SMS') {
            const template = SMS_TEMPLATES.find(t => t.name === templateName);
            if (template) {
                setSid(template.sid);
                const newVariables = template.variables.map(key => ({
                    key,
                    value: getVariableValue(key, record)
                }));
                setVariables(newVariables);
            } else {
                setSid('');
                setVariables([{ key: '', value: '' }]);
            }
        } else if (commsType === 'Whatsapp') {
            const template = WHATSAPP_TEMPLATES.find(t => t.name === templateName);
            if (template) {
                setWid(template.wid);
                const newVariables = template.variables.map(v => ({
                    key: v.key,
                    value: getVariableValue(v.field, record)
                }));
                setVariables(newVariables);
            } else {
                setWid('');
                setVariables([{ key: '', value: '' }]);
            }
        }
    };

    const handleAddVariable = () => {
        setVariables(prev => [...prev, { key: '', value: '' }]);
    };

    const handleVariableChange = (index, field, value) => {
        setVariables(prev => {
            const newVars = [...prev];
            newVars[index][field] = value;
            return newVars;
        });
    };

    const handleDeleteVariable = (index) => {
        setVariables(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if (!record.phoneNumber) {
            alert('User phone number is not available.');
            return;
        }

        // Parse phone
        let mobile = record.phoneNumber.replace(/\D/g, '');
        if (mobile.startsWith('91') && mobile.length > 10) {
            mobile = mobile.slice(2);
        }

        setIsSending(true);

        if (commsType === 'SMS') {
            if (!sid) {
                alert('SID is required.');
                setIsSending(false);
                return;
            }

            const url = new URL('https://api.authkey.io/request');
            url.searchParams.append('authkey', 'b0d73e4663db5196');
            url.searchParams.append('mobile', mobile);
            url.searchParams.append('country_code', '91');
            url.searchParams.append('sid', sid);

            variables.forEach(({ key, value }) => {
                if (key && value) url.searchParams.append(key, value);
            });

            try {
                const response = await axios.post(url.toString(), "");
                alert(`SMS sent successfully! Response: ${JSON.stringify(response.data)}`);
                onClose();
            } catch (err) {
                alert(`Failed to send SMS. ${err.response?.data?.message || err.message}`);
            } finally {
                setIsSending(false);
            }
        }

        else if (commsType === 'Whatsapp') {
            if (!wid) {
                alert('WID is required.');
                setIsSending(false);
                return;
            }

            const bodyValues = {};
            variables.forEach(({ key, value }) => {
                if (key && value) {
                    bodyValues[key] = value;
                }
            });

            try {
                const response = await axios.post(
                    'https://console.authkey.io/restapi/requestjson.php',
                    {
                        country_code: "91",
                        mobile,
                        wid,
                        type: "text",
                        bodyValues
                    },
                    {
                        headers: {
                            Authorization: "Basic b0d73e4663db5196",
                            "Content-Type": "application/json"
                        }
                    }
                );

                alert(`WhatsApp sent successfully! Response: ${JSON.stringify(response.data)}`);
                onClose();
            } catch (err) {
                alert(`Failed to send WhatsApp. ${err.response?.data?.message || err.message}`);
            } finally {
                setIsSending(false);
            }
        }

        else {
            alert('Please select Comms type.');
            setIsSending(false);
        }
    };

    const getPreviewMessage = () => {
        let template = null;
        if (commsType === 'SMS') {
            template = SMS_TEMPLATES.find(t => t.name === selectedTemplate);
        } else if (commsType === 'Whatsapp') {
            template = WHATSAPP_TEMPLATES.find(t => t.name === selectedTemplate);
        }

        if (!template) return '';

        let message = template.content;
        variables.forEach(({ key, value }) => {
            if (commsType === 'SMS') {
                message = message.split(`{#${key}#}`).join(value || `{#${key}#}`);
            } else if (commsType === 'Whatsapp') {
                message = message.split(`{{${key}}}`).join(value || `{{${key}}}`);
            }
        });
        return message;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[80] flex justify-center items-center" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Send Comms</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Type of Comms</label>
                    <select
                        className="w-full p-2 border rounded"
                        value={commsType}
                        onChange={(e) => {
                            setCommsType(e.target.value);
                            setSelectedTemplate('');
                            setSid('');
                            setWid('');
                            setVariables([{ key: '', value: '' }]);
                        }}
                    >
                        <option value="">-- Select --</option>
                        <option value="SMS">SMS</option>
                        <option value="Whatsapp">Whatsapp</option>
                    </select>
                </div>

                {commsType === 'SMS' && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={selectedTemplate}
                                onChange={handleTemplateChange}
                            >
                                <option value="">-- Select Template --</option>
                                {SMS_TEMPLATES.map(t => (
                                    <option key={t.sid} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">SID</label>
                            <input type="text" className="w-full p-2 border rounded bg-gray-100" value={sid} readOnly />
                        </div>
                    </>
                )}

                {commsType === 'Whatsapp' && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={selectedTemplate}
                                onChange={handleTemplateChange}
                            >
                                <option value="">-- Select Template --</option>
                                {WHATSAPP_TEMPLATES.map(t => (
                                    <option key={t.wid} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">WID</label>
                            <input type="text" className="w-full p-2 border rounded bg-gray-100" value={wid} readOnly />
                        </div>
                    </>
                )}

                {commsType && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Variables</label>
                            {variables.map((variable, index) => (
                                <div key={index} className="flex items-center gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Key"
                                        className="w-1/2 p-2 border rounded"
                                        value={variable.key}
                                        onChange={(e) => handleVariableChange(index, 'key', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Value"
                                        className="w-1/2 p-2 border rounded"
                                        value={variable.value}
                                        onChange={(e) => handleVariableChange(index, 'value', e.target.value)}
                                    />
                                    <button onClick={() => handleDeleteVariable(index)} className="text-red-500 hover:text-red-700 p-1">✕</button>
                                </div>
                            ))}
                            <button onClick={handleAddVariable} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                + Add Variable
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message Preview</label>
                            <div className="p-3 bg-gray-50 border rounded text-sm whitespace-pre-wrap text-gray-800">
                                {getPreviewMessage() || <span className="text-gray-400 italic">Select a template to see preview</span>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={isSending}>Cancel</button>
                            <button onClick={handleSend} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400" disabled={isSending}>
                                {isSending ? 'Sending...' : 'SEND'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


// helper
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
    const [isCommsModalOpen, setIsCommsModalOpen] = useState(false);
    const [country, setCountry] = useState(record.targetCountry || "");
    const [jobRole, setJobRole] = useState(record.targetJobRole || "");
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [countriesList, setCountriesList] = useState([]);
    const [jobRolesList, setJobRolesList] = useState([]);
    const [skills, setSkills] = useState(record.skills ? record.skills.join(', ') : "");
    const [languages, setLanguages] = useState(record.language ? `${record.language.motherTongue || ''} | ${(record.language.other || []).join(', ')}` : "");
    const [dob, setDob] = useState(record.dob ? getSafeDate(record.dob) : "");
    const [gender, setGender] = useState(record.gender || "");
    const [location, setLocation] = useState(record.location ? [record.location.city, record.location.state, record.location.country].filter(Boolean).join(', ') : "");
    const [education, setEducation] = useState(typeof record.education === 'string' ? record.education : (record.education ? JSON.stringify(record.education, null, 2) : ""));
    const [experience, setExperience] = useState(typeof record.experience === 'string' ? record.experience : (record.experience ? JSON.stringify(record.experience, null, 2) : ""));

    useEffect(() => {
        const fetchHistory = async () => {
            if (!record?._id) return;
            setHistoryLoading(true);
            try {
                const endpoint = type === 'user'
                    ? `/api/crm/user-history/${record._id}`
                    : `/api/crm/application-history/${record._id}`;
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
                        axios.get(`/api/crm/countries`),
                        axios.get(`/api/crm/job-roles`)
                    ]);
                    setCountriesList(countriesRes.data);
                    setJobRolesList(jobRolesRes.data);
                } catch (error) { console.error("Error fetching dropdown data", error); }
            }
        };
        fetchDropdownData();
    }, [record.targetCountry, record.targetJobRole, type]);

    const handleInternalSave = () => {
        const selectedCountry = countriesList.find(c => c.name === country);
        const selectedJobRole = jobRolesList.find(r => r.title === jobRole);

        const [motherTongue, otherLangs] = languages.split('|');
        const parsedLanguage = {
            motherTongue: motherTongue?.trim(),
            other: otherLangs ? otherLangs.split(',').map(s => s.trim()).filter(Boolean) : []
        };

        const [city, state, countryLoc] = location.split(',');
        const parsedLocation = {
            city: city?.trim(),
            state: state?.trim(),
            country: countryLoc?.trim()
        };

        onSave({
            ...record,
            tempDisposition: disposition,
            tempNotes: notes,
            tempNextCallDate: nextCallDate,
            fullName: fullName,
            targetCountry: selectedCountry
                ? { id: selectedCountry._id, name: selectedCountry.name }
                : { name: country },
            targetJobRole: selectedJobRole
                ? { id: selectedJobRole._id, name: selectedJobRole.title }
                : { name: jobRole },
            skills: skills.split(',').map(s => s.trim()).filter(Boolean),
            language: parsedLanguage,
            dob: dob,
            gender: gender,
            location: parsedLocation,
            education: education,
            experience: experience
        });
        onClose();
    };

    if (!record) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-end" onClick={onClose} >
                <div className={`h-full w-full ${type === 'application' ? 'max-w-5xl' : 'max-w-lg'} bg-gray-100 shadow-xl z-[70]`} onClick={e => e.stopPropagation()}>
                    <div className="flex h-full">

                        {/* Left Column */}
                        <div className={`${type === 'application' ? 'w-1/2' : 'w-full'} p-6 flex flex-col bg-white overflow-y-auto`}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Record Activity for {type === 'user' ? 'User' : 'Application'}</h2>
                                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2l">&times;</button>
                            </div>

                            <div className="space-y-4 mb-8">
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

                                {type === 'user' && (
                                    <>
                                        <hr className="my-4" />
                                        <h3 className="font-bold mb-2">Profile Details</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                                                <input type="text" className="w-full p-2 border rounded" value={skills} onChange={e => setSkills(e.target.value)} />
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="w-1/2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Languages (Mother | Other1, Other2)</label>
                                                    <input type="text" className="w-full p-2 border rounded" value={languages} onChange={e => setLanguages(e.target.value)} />
                                                </div>
                                                <div className="w-1/2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                                    <select className="w-full p-2 border rounded" value={gender} onChange={e => setGender(e.target.value)}>
                                                        <option value="">Select</option>
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="w-1/2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">DOB</label>
                                                    <input type="date" className="w-full p-2 border rounded" value={dob} onChange={e => setDob(e.target.value)} />
                                                </div>
                                                <div className="w-1/2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location (City, State, Country)</label>
                                                    <input type="text" className="w-full p-2 border rounded" value={location} onChange={e => setLocation(e.target.value)} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Education (JSON)</label>
                                                <textarea className="w-full p-2 border rounded font-mono text-xs" rows="3" value={education} onChange={e => setEducation(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (JSON)</label>
                                                <textarea className="w-full p-2 border rounded font-mono text-xs" rows="3" value={experience} onChange={e => setExperience(e.target.value)} />
                                            </div>
                                        </div>
                                    </>
                                )}

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
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button onClick={handleInternalSave} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                                    Save Changes
                                </button>
                                <button onClick={() => setIsCommsModalOpen(true)} className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700">
                                    Send Comms
                                </button>
                            </div>

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

                        {type === 'application' && (
                            <div className="w-1/2 p-6 overflow-y-auto bg-gray-50 border-l">
                                {record.jobSnapshot && (
                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold mb-4">Job Snapshot</h3>
                                        <JobSnapshotDetails snapshot={record.jobSnapshot} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isCommsModalOpen && <SendCommsModal record={record} onClose={() => setIsCommsModalOpen(false)} />}
        </>
    );
};

export default ModifyModal;
