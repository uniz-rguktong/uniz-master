import { useState, useEffect, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { useSearchParams } from 'react-router-dom';
import {
    User, Droplets, Phone, Edit2, GraduationCap, IdCard, DoorOpen, History, Clock, Calendar, MapPin, Mail, Briefcase
} from 'lucide-react';
import axios from 'axios';
import { student } from '../../store';
import { useIsAuth } from '../../hooks/is_authenticated';
import { useStudentData } from '../../hooks/student_info';
import { UPDATE_DETAILS, STUDENT_HISTORY, REQUEST_OUTING, REQUEST_OUTPASS } from '../../api/endpoints';
import { motion, AnimatePresence } from 'framer-motion';
import RequestCard from '../../components/RequestCard';
import { toast } from 'react-toastify';
import { Pagination } from '../../components/Pagination';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Loader2 } from 'lucide-react';
import { InfoCard } from './components/InfoCard';
import AcademicRecord from './components/AcademicRecord';
import { Student } from '../../types';

export const enableOutingsAndOutpasses = true;

// 
// 
// 


export default function StudentProfilePage() {
    useIsAuth();
    const { refetch } = useStudentData();
    const user = useRecoilValue<Student | any>(student);
    const [searchParams, setSearchParams] = useSearchParams();

    // State
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('personal');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Effect to handle URL query param for editing
    useEffect(() => {
        if (searchParams.get('edit') === 'true') {
            setIsEditing(true);
            // Clear the query param so it doesn't persist
            setSearchParams(params => {
                const newParams = new URLSearchParams(params);
                newParams.delete('edit');
                return newParams;
            }, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    // Request State
    const [requestType, setRequestType] = useState<'outing' | 'outpass' | null>(null);
    const [requestForm, setRequestForm] = useState({ reason: '', from: '', to: '' });
    const [requestLoading, setRequestLoading] = useState(false);

    // History State
    const [history, setHistory] = useState<any[]>([]);
    const [historyPagination, setHistoryPagination] = useState({ page: 1, totalPages: 1 });
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    // Fields State
    const [fields, setFields] = useState<any>({
        name: '', gender: '', address: '', bloodGroup: '', phoneNumber: '', dateOfBirth: '',
        fatherName: '', motherName: '', fatherOccupation: '', motherOccupation: '',
        fatherEmail: '', motherEmail: '', fatherAddress: '', motherAddress: '',
        fatherPhoneNumber: '', motherPhoneNumber: '',
    });

    // WebSocket
    useWebSocket(undefined, (msg) => {
        if (msg.type === 'REFRESH_REQUESTS' && msg.payload.userId === user?._id) {
            refetch();
            toast.info(`Request updated: ${msg.payload.status}`);
        }
    });

    // Polling
    useEffect(() => {
        const interval = setInterval(() => { if (user?._id) refetch(); }, 30000);
        return () => clearInterval(interval);
    }, [user]);

    // Init Data
    useEffect(() => {
        if (user && Object.keys(user).length > 0) {
            setFields({
                name: user.name || '',
                gender: user.gender || '',
                address: user.address || user.Address || '', // Handle different casing if any
                bloodGroup: user.blood_group || user.BloodGroup || '',
                phoneNumber: user.phone_number || user.PhoneNumber || '',
                dateOfBirth: user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
                fatherName: user.father_name || '',
                motherName: user.mother_name || '',
                fatherOccupation: user.father_occupation || '',
                motherOccupation: user.mother_occupation || '',
                fatherEmail: user.father_email || '',
                motherEmail: user.mother_email || '',
                fatherAddress: user.father_address || '',
                motherAddress: user.mother_address || '',
                fatherPhoneNumber: user.father_phonenumber || '',
                motherPhoneNumber: user.mother_phonenumber || '',
            });
            setIsLoading(false);
        }
    }, [user]);

    // Fetch History
    const fetchHistory = async (page = 1) => {
        try {
            setIsHistoryLoading(true);
            const token = localStorage.getItem('student_token')?.replace(/^"|"$/g, '');
            const res = await axios.get(`${STUDENT_HISTORY}?page=${page}&limit=5`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setHistory(res.data.history);
                setHistoryPagination(res.data.pagination);
            }
        } catch (err) { console.error(err); } finally { setIsHistoryLoading(false); }
    };

    useEffect(() => {
        if (activeTab === 'permissions') fetchHistory(1);
    }, [activeTab]);

    // Handlers
    const handleFieldChange = useCallback((name: string, value: any) => {
        setFields((prev: any) => ({ ...prev, [name]: value }));
    }, []);



    const handleSubmit = async (e: any) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('student_token')?.replace(/^"|"$/g, '');
            const response = await axios.put(UPDATE_DETAILS, { ...fields }, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data.success) {
                await refetch();
                setIsEditing(false);
                toast.success('Profile updated successfully!');
            } else { toast.error(response.data.msg); }
        } catch (err: any) { toast.error(err.response?.data?.msg || 'Update failed'); }
        setIsSubmitting(false);
    };

    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestType) return;
        setRequestLoading(true);

        try {
            const token = localStorage.getItem('student_token')?.replace(/^"|"$/g, '');

            if (requestType === 'outpass') {
                if (!requestForm.from || !requestForm.to) {
                    toast.error("Please select both From and To dates");
                    setRequestLoading(false);
                    return;
                }

                // Construct dates with specific times as per requirements (9 AM start, 6 PM end)
                const fromDate = new Date(requestForm.from);
                fromDate.setHours(9, 0, 0, 0);

                const toDate = new Date(requestForm.to);
                toDate.setHours(18, 0, 0, 0);

                if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                    toast.error("Invalid date selection");
                    setRequestLoading(false);
                    return;
                }

                if (toDate < fromDate) {
                    toast.error("Return date cannot be before departure date");
                    setRequestLoading(false);
                    return;
                }

                const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

                const myHeaders = new Headers();
                myHeaders.append("Authorization", `Bearer ${token}`);
                myHeaders.append("Content-Type", "application/json");

                const raw = JSON.stringify({
                    "reason": requestForm.reason,
                    "fromDay": fromDate.toISOString(),
                    "toDay": toDate.toISOString(),
                    "days": diffDays
                });

                const requestOptions: RequestInit = {
                    method: "POST",
                    headers: myHeaders,
                    body: raw,
                    redirect: "follow"
                };

                // Using endpoint from constants but fallback to localhost/api if needed, keeping consistency with existing codebase
                const response = await fetch(REQUEST_OUTPASS, requestOptions);
                const result = await response.json();

                if (response.ok && result.success) {
                    toast.success('Outpass requested successfully!');
                    setRequestType(null);
                    setRequestForm({ reason: '', from: '', to: '' });
                } else {
                    console.error("Outpass Error:", result);
                    toast.error(result.msg || result.message || "Failed to request outpass");
                }

            } else {
                // Keep existing Axios logic for 'outing'
                const payload = {
                    reason: requestForm.reason,
                    fromTime: requestForm.from,
                    toTime: requestForm.to
                };

                const res = await axios.post(REQUEST_OUTING, payload, { headers: { Authorization: `Bearer ${token}` } });
                if (res.data.success) {
                    toast.success('Outing requested successfully!');
                    setRequestType(null);
                    setRequestForm({ reason: '', from: '', to: '' });
                } else {
                    toast.error(res.data.msg);
                }
            }
        } catch (err: any) {
            console.error("Request failed", err);
            toast.error(err.message || 'Request failed');
        } finally {
            setRequestLoading(false);
        }
    };

    if (!user && !isLoading) return <div className="flex h-screen items-center justify-center text-neutral-400 font-medium">Loading Student Profile...</div>;

    const personalFields = [
        { icon: <User className="w-4 h-4" />, label: 'Full Name', name: 'name', editable: true },
        { icon: <User className="w-4 h-4" />, label: 'Gender', name: 'gender', editable: true },
        { icon: <MapPin className="w-4 h-4" />, label: 'Address', name: 'address', editable: true, fullWidth: true },
        { icon: <Droplets className="w-4 h-4" />, label: 'Blood Group', name: 'bloodGroup', editable: true },
        { icon: <Phone className="w-4 h-4" />, label: 'Phone', name: 'phoneNumber', editable: true },
        { icon: <Calendar className="w-4 h-4" />, label: 'Date of Birth', name: 'dateOfBirth', editable: true, type: 'date' },
    ];

    const academicFields = [
        { icon: <IdCard className="w-4 h-4" />, label: 'Student ID', name: 'username', value: user?.username },
        { icon: <GraduationCap className="w-4 h-4" />, label: 'Year', name: 'year', value: user?.year },
        { icon: <GraduationCap className="w-4 h-4" />, label: 'Branch', name: 'branch', value: user?.branch },
        { icon: <Briefcase className="w-4 h-4" />, label: 'Section', name: 'section', value: user?.section || 'A' },
        { icon: <DoorOpen className="w-4 h-4" />, label: 'Room No', name: 'roomno', value: user?.roomno || 'N/A' },
    ];


    return (
        <div className="min-h-screen bg-white font-sans text-neutral-900 pb-20">

            <div className="container mx-auto px-4 max-w-5xl relative z-10">

                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 mb-4 md:mb-6">
                    {/* Profile Photo Removed */}

                    <div className="flex-1 mb-0 md:mb-2 text-center md:text-left w-full md:w-auto">
                        <p className="text-lg md:text-xl font-medium text-neutral-500 mb-0.5">Welcome back,</p>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-[#000000] mb-2">{user?.name}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs md:text-sm font-medium text-neutral-600">
                            <div className="flex items-center gap-2">
                                <span className="text-[#800000] font-bold uppercase tracking-widest text-[11px] border border-[#800000] px-1.5 py-0.5 rounded-md">{user?.username}</span>
                                <span className="w-0.5 h-0.5 rounded-full bg-neutral-300"></span>
                                <span className="uppercase tracking-wide font-semibold text-neutral-800">{user?.branch} - {user?.year}</span>
                            </div>
                            {user?.has_pending_requests && (
                                <span className="bg-[#800000] text-white px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide flex items-center gap-1 animate-pulse ml-1">
                                    <Clock className="w-2.5 h-2.5" /> Pending
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 mb-0 md:mb-2 shrink-0">
                        {isEditing ? (
                            <>
                                <button onClick={() => { setIsEditing(false); refetch(); }} className="px-4 py-1.5 rounded-full bg-white border border-neutral-200 text-[#800000] hover:bg-neutral-50 font-bold text-sm transition-all shadow-sm">Cancel</button>
                                <button onClick={handleSubmit} disabled={isSubmitting} className="px-5 py-1.5 rounded-full bg-[#800000] text-white hover:bg-[#600000] font-bold text-sm shadow-md transition-all flex items-center gap-1.5">
                                    {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />} Save
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="hidden md:flex px-5 py-1.5 rounded-full bg-white border border-[#800000] text-[#800000] hover:bg-[#800000] hover:text-white transition-all duration-300 font-bold text-sm items-center gap-1.5">
                                <Edit2 className="w-3 h-3" /> Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-neutral-200 mb-5 overflow-x-auto no-scrollbar">
                    <div className="flex gap-6 min-w-max">
                        {['personal', 'academic', 'family', enableOutingsAndOutpasses ? 'permissions' : ''].filter(Boolean).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab || 'personal')}
                                className={`pb-2 relative text-[11px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'text-[#800000] translate-y-[-1px]' : 'text-neutral-400 hover:text-neutral-600'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#800000]" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                    >
                        {activeTab === 'personal' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {personalFields.map(f => <InfoCard key={f.name} {...f} value={fields[f.name]} isEditing={isEditing} isLoading={isLoading} onValueChange={handleFieldChange} />)}
                            </div>
                        )}

                        {activeTab === 'academic' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1 space-y-4">
                                    <h3 className="text-lg font-bold mb-2">Academic Details</h3>
                                    <div className="grid gap-3">
                                        {academicFields.map(f => <InfoCard key={f.name} {...f} value={f.value} isEditing={false} isLoading={isLoading} />)}
                                    </div>
                                </div>
                                <div className="lg:col-span-2">
                                    {/* Using the new AcademicRecord component */}
                                    <AcademicRecord student={user} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'family' && (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
                                        <h3 className="text-lg font-bold text-neutral-900">Father's Details</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <InfoCard key="fatherName" label="Name" name="fatherName" icon={<User className="w-3 h-3" />} value={fields.fatherName} isEditing={isEditing} onValueChange={handleFieldChange} editable />
                                        <InfoCard key="fatherOccupation" label="Occupation" name="fatherOccupation" icon={<Briefcase className="w-3 h-3" />} value={fields.fatherOccupation} isEditing={isEditing} onValueChange={handleFieldChange} editable />
                                        <InfoCard key="fatherPhoneNumber" label="Phone" name="fatherPhoneNumber" icon={<Phone className="w-3 h-3" />} value={fields.fatherPhoneNumber} isEditing={isEditing} onValueChange={handleFieldChange} editable />
                                        <InfoCard key="fatherEmail" label="Email" name="fatherEmail" type="email" icon={<Mail className="w-3 h-3" />} value={fields.fatherEmail} isEditing={isEditing} onValueChange={handleFieldChange} editable />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
                                        <h3 className="text-lg font-bold text-neutral-900">Mother's Details</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <InfoCard key="motherName" label="Name" name="motherName" icon={<User className="w-3 h-3" />} value={fields.motherName} isEditing={isEditing} onValueChange={handleFieldChange} editable />
                                        <InfoCard key="motherOccupation" label="Occupation" name="motherOccupation" icon={<Briefcase className="w-3 h-3" />} value={fields.motherOccupation} isEditing={isEditing} onValueChange={handleFieldChange} editable />
                                        <InfoCard key="motherPhoneNumber" label="Phone" name="motherPhoneNumber" icon={<Phone className="w-3 h-3" />} value={fields.motherPhoneNumber} isEditing={isEditing} onValueChange={handleFieldChange} editable />
                                        <InfoCard key="motherEmail" label="Email" name="motherEmail" type="email" icon={<Mail className="w-3 h-3" />} value={fields.motherEmail} isEditing={isEditing} onValueChange={handleFieldChange} editable />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'permissions' && (
                            <div className="space-y-8">
                                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                                    <button
                                        onClick={() => setRequestType('outing')}
                                        disabled={user.has_pending_requests}
                                        className="group relative overflow-hidden bg-white hover:bg-[#800000] rounded-xl p-4 transition-all duration-300 border border-neutral-200 hover:border-[#800000] text-left disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-xl"
                                    >
                                        <div className="relative z-10 flex flex-col items-start h-full justify-between gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#800000] text-white group-hover:bg-white group-hover:text-[#800000] flex items-center justify-center shadow-md transition-colors duration-300">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-[#000000] group-hover:text-white mb-0.5 tracking-tight transition-colors">Request Outing</h3>
                                                <p className="font-medium text-xs text-neutral-500 group-hover:text-neutral-200 transition-colors">Short duration leaves (few hours)</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setRequestType('outpass')}
                                        disabled={user.has_pending_requests}
                                        className="group relative overflow-hidden bg-white hover:bg-[#800000] rounded-xl p-4 transition-all duration-300 border border-neutral-200 hover:border-[#800000] text-left disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-xl"
                                    >
                                        <div className="relative z-10 flex flex-col items-start h-full justify-between gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#800000] text-white group-hover:bg-white group-hover:text-[#800000] flex items-center justify-center shadow-md transition-colors duration-300">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-[#000000] group-hover:text-white mb-0.5 tracking-tight transition-colors">Request Outpass</h3>
                                                <p className="font-medium text-xs text-neutral-500 group-hover:text-neutral-200 transition-colors">Long duration leaves (overnight/days)</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 bg-[#800000] text-white rounded-md">
                                            <History className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-lg font-black text-[#800000] tracking-tight">Request History</h3>
                                    </div>

                                    <div className="space-y-3">
                                        {isHistoryLoading ? (
                                            <div className="text-center py-10 text-neutral-400 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">Fetching Records...</div>
                                        ) : history.length > 0 ? (
                                            <>
                                                {history.map(req => <RequestCard key={req._id} request={req} type={req.type} />)}
                                                <Pagination currentPage={historyPagination.page} totalPages={historyPagination.totalPages} onPageChange={p => fetchHistory(p)} className="mt-6" />
                                            </>
                                        ) : (
                                            <div className="text-center py-8 bg-neutral-50 rounded-xl border border-neutral-100">
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 border border-neutral-100 shadow-sm">
                                                    <History className="w-4 h-4 text-neutral-300" />
                                                </div>
                                                <p className="text-neutral-900 font-bold text-sm">No history found</p>
                                                <p className="text-neutral-400 text-xs mt-0.5">Your past requests will appear here</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Modals placed inside main content area to avoid z-index issues, or can be outside. keeping existing loop logic */}
                <AnimatePresence>
                    {/* ... (Existing modals logic) keeping same structure just shifting indentation logic implicitly by nesting */}
                    {requestType && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] p-6 md:p-10 max-w-lg w-full shadow-2xl overflow-hidden relative">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-[#800000] text-white rounded-xl">
                                        {requestType === 'outpass' ? <Calendar className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black capitalize tracking-tight text-[#800000]">New {requestType}</h2>
                                        <p className="text-sm font-medium text-neutral-500">Submit your request details below.</p>
                                    </div>
                                </div>

                                <form onSubmit={handleRequestSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Reason</label>
                                        <textarea
                                            className="w-full bg-neutral-50 p-4 rounded-xl border border-neutral-200 focus:border-[#800000] focus:ring-1 focus:ring-[#800000] focus:outline-none min-h-[120px] font-medium text-neutral-900 placeholder:text-neutral-400 resize-none transition-all"
                                            placeholder="Please explain why you need to leave..."
                                            value={requestForm.reason}
                                            onChange={e => setRequestForm({ ...requestForm, reason: e.target.value })}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">From</label>
                                            <input
                                                type={requestType === 'outpass' ? 'date' : 'time'}
                                                className="w-full bg-neutral-50 p-4 rounded-xl border border-neutral-200 focus:border-[#800000] focus:ring-1 focus:ring-[#800000] focus:outline-none font-bold text-lg text-neutral-900 transition-all"
                                                value={requestForm.from}
                                                onChange={e => setRequestForm({ ...requestForm, from: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">To</label>
                                            <input
                                                type={requestType === 'outpass' ? 'date' : 'time'}
                                                className="w-full bg-neutral-50 p-4 rounded-xl border border-neutral-200 focus:border-[#800000] focus:ring-1 focus:ring-[#800000] focus:outline-none font-bold text-lg text-neutral-900 transition-all"
                                                value={requestForm.to}
                                                onChange={e => setRequestForm({ ...requestForm, to: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-3">
                                        <button type="button" onClick={() => setRequestType(null)} className="flex-1 py-4 rounded-xl font-bold text-neutral-500 hover:bg-neutral-50 hover:text-[#800000] transition-colors">Cancel</button>
                                        <button type="submit" disabled={requestLoading} className="flex-[2] py-4 bg-[#800000] text-white rounded-xl font-bold hover:bg-[#600000] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2">
                                            {requestLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}


                </AnimatePresence>

                {/* Closing divs for the standard layout */}
            </div>
        </div>
    );
}
