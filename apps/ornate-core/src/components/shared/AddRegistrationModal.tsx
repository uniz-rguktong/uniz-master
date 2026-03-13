'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { getSports, type FormattedSport } from '@/actions/sportGetters';
import { getCoordinatorEventDetails, type CoordinatorEventDetails } from '@/actions/coordinatorGetters';
import {
    createSportSpotTeamRegistration,
    createSportRegistration
} from '@/actions/sportRegistrationActions';
import { Loader2, Plus, Trash2, Users, User, Mail, Smartphone, Hash, School, Layers, Save, X } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';

const memberSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    rollNumber: z.string().min(5, 'Valid Student ID is required').toUpperCase(),
    email: z.string().email('Valid email is required'),
    phone: z.string().regex(/^[0-9]{10}$/, '10-digit phone number is required').or(z.literal('')),
    branch: z.string().min(1, 'Branch is required'),
    year: z.string().min(1, 'Year is required'),
    section: z.string().min(1, 'Section is required'),
    role: z.enum(['Captain', 'Vice Captain', 'Member'])
});

const teamRegistrationSchema = z.object({
    teamName: z.string().min(2, 'Team name is required'),
    members: z.array(memberSchema).min(1, 'At least one member is required')
});

const individualRegistrationSchema = z.object({
    studentName: z.string().min(2, 'Name is required'),
    studentId: z.string().min(5, 'Valid Student ID is required').toUpperCase(),
    email: z.string().email('Valid email is required'),
    phone: z.string().regex(/^[0-9]{10}$/, '10-digit phone number is required'),
    year: z.string().min(1, 'Year is required'),
    branch: z.string().min(1, 'Branch is required'),
    section: z.string().min(1, 'Section is required'),
});

interface AddRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialSportId?: string | undefined;
}

export function AddRegistrationModal({ isOpen, onClose, onSuccess, initialSportId }: AddRegistrationModalProps) {
    const { showToast } = useToast();
    const [sports, setSports] = useState<FormattedSport[]>([]);
    const [selectedSportId, setSelectedSportId] = useState<string>('');
    const [sportDetails, setSportDetails] = useState<CoordinatorEventDetails | null>(null);
    const [isLoadingSports, setIsLoadingSports] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrationType, setRegistrationType] = useState<'individual' | 'team' | null>(null);

    const teamForm = useForm<z.infer<typeof teamRegistrationSchema>>({
        resolver: zodResolver(teamRegistrationSchema),
        defaultValues: {
            teamName: '',
            members: [{ name: '', rollNumber: '', email: '', phone: '', branch: '', year: '', section: '', role: 'Captain' }]
        }
    });

    const individualForm = useForm<z.infer<typeof individualRegistrationSchema>>({
        resolver: zodResolver(individualRegistrationSchema),
        defaultValues: {
            studentName: '', studentId: '', email: '', phone: '', year: '', branch: '', section: ''
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: teamForm.control,
        name: 'members'
    });

    useEffect(() => {
        if (isOpen) {
            fetchSports();
            if (initialSportId) {
                setSelectedSportId(initialSportId);
            }
        } else {
            teamForm.reset();
            individualForm.reset();
            setSelectedSportId('');
            setRegistrationType(null);
            setSportDetails(null);
        }
    }, [isOpen, initialSportId]);

    const fetchSports = async () => {
        setIsLoadingSports(true);
        const res = await getSports();
        if (res.success && res.sports) {
            setSports(res.sports);
        }
        setIsLoadingSports(false);
    };

    useEffect(() => {
        if (selectedSportId) {
            fetchSportDetails(selectedSportId);
        }
    }, [selectedSportId]);

    const fetchSportDetails = async (id: string) => {
        setIsLoadingDetails(true);
        try {
            const res = await getCoordinatorEventDetails(id);
            if (res.success && res.event) {
                setSportDetails(res.event);
                const type = res.event.eventType?.toLowerCase() === 'team' ? 'team' : 'individual';
                setRegistrationType(type);

                if (type === 'team') {
                    teamForm.reset({
                        teamName: '',
                        members: [{ name: '', rollNumber: '', email: '', phone: '', branch: '', year: '', section: '', role: 'Captain' }]
                    });
                } else {
                    individualForm.reset();
                }
            } else {
                showToast(res.error || 'Failed to load tournament details', 'error');
            }
        } catch (error) {
            showToast('An error occurred while fetching details', 'error');
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const onTeamSubmit = async (data: z.infer<typeof teamRegistrationSchema>) => {
        setIsSubmitting(true);
        try {
            const result = await createSportSpotTeamRegistration({
                sportId: selectedSportId,
                teamName: data.teamName,
                members: data.members,
            });

            if (result.success) {
                showToast(result.message || 'Team registration added successfully', 'success');
                onSuccess();
                onClose();
            } else {
                showToast(result.error || 'Failed to add team registration', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const onIndividualSubmit = async (data: z.infer<typeof individualRegistrationSchema>) => {
        setIsSubmitting(true);
        try {
            const result = await createSportRegistration({
                sportId: selectedSportId,
                studentName: data.studentName,
                studentId: data.studentId,
                email: data.email,
                phone: data.phone,
                year: data.year,
                branch: data.branch,
                section: data.section,
            });

            if (result.success) {
                showToast(result.message || 'Registration added successfully', 'success');
                onSuccess();
                onClose();
            } else {
                showToast(result.error || 'Failed to add registration', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const addNewMember = () => {
        if (sportDetails?.teamSizeMax && fields.length >= sportDetails.teamSizeMax) {
            showToast(`Maximum ${sportDetails.teamSizeMax} members allowed`, 'error');
            return;
        }
        const role = fields.length === 1 ? 'Vice Captain' : 'Member';
        append({ name: '', rollNumber: '', email: '', phone: '', branch: '', year: '', section: '', role: role as any });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Manual Registration"
            size="lg"
        >
            <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
                {!initialSportId && (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Target Sport</label>
                        <div className="relative">
                            <select
                                value={selectedSportId}
                                onChange={(e) => setSelectedSportId(e.target.value)}
                                disabled={isLoadingSports}
                                className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold focus:border-indigo-500 outline-none transition-all appearance-none pr-10"
                            >
                                <option value="">-- Select Sport --</option>
                                {sports.map(sport => (
                                    <option key={sport.id} value={sport.id}>
                                        {sport.name} • {sport.category}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                {isLoadingSports ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                            </div>
                        </div>
                    </div>
                )}

                {isLoadingDetails ? (
                    <div className="py-20 text-center animate-pulse">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4">Syncing Tournament Profile...</p>
                    </div>
                ) : sportDetails ? (
                    <div className="space-y-6 animate-page-entrance">
                        <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                    {registrationType === 'individual' ? <User className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 leading-none">{sportDetails.title}</h4>
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1.5">{registrationType} Squad Form</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fee</p>
                                <p className="text-sm font-black text-gray-900">₹{sportDetails.fee}</p>
                            </div>
                        </div>

                        {registrationType === 'team' ? (
                            <form onSubmit={teamForm.handleSubmit(onTeamSubmit)} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Team Identity</label>
                                    <Input
                                        {...teamForm.register('teamName')}
                                        placeholder="e.g. Phoenix Rebels"
                                        error={teamForm.formState.errors.teamName?.message}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Roster ({fields.length})</h5>
                                        <button
                                            type="button"
                                            onClick={addNewMember}
                                            className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                                        >
                                            + Add Member
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {fields.map((field, idx) => (
                                            <div key={field.id} className="p-5 rounded-[24px] border border-gray-100 bg-gray-50/50 space-y-4 relative group">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider ${idx === 0 ? 'bg-orange-100 text-orange-600' :
                                                        idx === 1 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {idx === 0 ? 'Captain' : idx === 1 ? 'Vice Captain' : `Member ${idx + 1}`}
                                                    </span>
                                                    {idx > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => remove(idx)}
                                                            className="text-gray-300 hover:text-rose-500 p-1 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input {...teamForm.register(`members.${idx}.name` as const)} placeholder="Name" error={teamForm.formState.errors.members?.[idx]?.name?.message} />
                                                    <Input {...teamForm.register(`members.${idx}.rollNumber` as const)} placeholder="Student ID" error={teamForm.formState.errors.members?.[idx]?.rollNumber?.message} />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input {...teamForm.register(`members.${idx}.email` as const)} placeholder="Email" error={teamForm.formState.errors.members?.[idx]?.email?.message} />
                                                    <Input {...teamForm.register(`members.${idx}.phone` as const)} placeholder="Phone" error={teamForm.formState.errors.members?.[idx]?.phone?.message} />
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <select {...teamForm.register(`members.${idx}.year` as const)} className="h-10 px-3 rounded-xl border border-gray-200 text-xs font-bold bg-white outline-none focus:border-indigo-500 transition-colors">
                                                        <option value="">Year</option>
                                                        {['I', 'II', 'III', 'IV'].map(y => <option key={y} value={y}>{y}</option>)}
                                                    </select>
                                                    <Input {...teamForm.register(`members.${idx}.branch` as const)} placeholder="Branch" className="h-10 text-xs" />
                                                    <Input {...teamForm.register(`members.${idx}.section` as const)} placeholder="Sec" className="h-10 text-xs" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2">
                                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all border border-gray-100">Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2">
                                        <Save className="w-4 h-4" />
                                        {isSubmitting ? 'Registering...' : 'Complete Roster'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={individualForm.handleSubmit(onIndividualSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <Input {...individualForm.register('studentName')} placeholder="e.g. Rahul Sharma" error={individualForm.formState.errors.studentName?.message} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Student ID</label>
                                        <Input {...individualForm.register('studentId')} placeholder="e.g. S123456" error={individualForm.formState.errors.studentId?.message} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <Input {...individualForm.register('email')} placeholder="student@college.edu" error={individualForm.formState.errors.email?.message} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                        <Input {...individualForm.register('phone')} placeholder="10-digit mobile" error={individualForm.formState.errors.phone?.message} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Current Year</label>
                                        <select {...individualForm.register('year')} className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold bg-white outline-none focus:border-indigo-500 transition-colors">
                                            <option value="">-- Year --</option>
                                            {['I', 'II', 'III', 'IV'].map(y => <option key={y} value={y}>{y + ' Year'}</option>)}
                                        </select>
                                        {individualForm.formState.errors.year && <p className="text-[10px] text-red-500 font-bold ml-1">{individualForm.formState.errors.year.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Branch</label>
                                        <Input {...individualForm.register('branch')} placeholder="e.g. CSE" error={individualForm.formState.errors.branch?.message} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Section</label>
                                        <Input {...individualForm.register('section')} placeholder="e.g. A" error={individualForm.formState.errors.section?.message} />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all border border-gray-100">Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2">
                                        <Save className="w-4 h-4" />
                                        {isSubmitting ? 'Registering...' : 'Register Individual'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[32px] bg-gray-50/30">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-200">
                            <Plus className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select an active sport to start registration</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
