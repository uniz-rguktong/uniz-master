'use client';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/useToast';
import { Award, Plus, Users, X, Save, Trash2, Edit2, Upload, Loader2, Star, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { InfoTooltip } from '@/components/InfoTooltip';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    createBestOutgoingStudent,
    updateBestOutgoingStudent,
    deleteBestOutgoingStudent
} from '@/actions/awardActions';
import { uploadFileToR2 } from '@/lib/upload';

interface BestOutgoingPageClientProps {
    initialStudents: any[];
}

export default function BestOutgoingPageClient({ initialStudents }: BestOutgoingPageClientProps) {
    const { showToast } = useToast();
    const [studentsList, setStudentsList] = useState(initialStudents);

    useEffect(() => {
        setStudentsList(initialStudents);
    }, [initialStudents]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [deleteStudent, setDeleteStudent] = useState<any>(null);

    // Filters
    const [filterGender, setFilterGender] = useState('all');
    const [filterYear, setFilterYear] = useState<string | number>('all');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPhotoUploading, setIsPhotoUploading] = useState(false);

    const [formData, setFormData] = useState<any>({
        name: '',
        rollNumber: '',
        gender: 'male',
        awardYear: new Date().getFullYear(),
        branch: 'OVERALL',
        year: 'IV',
        rating: '',
        achievements: '',
        photo: '',
        isPublished: true,
        isOverall: true
    });

    const resetForm = () => {
        setFormData({
            name: '',
            rollNumber: '',
            gender: 'male',
            awardYear: new Date().getFullYear(),
            branch: 'OVERALL',
            year: 'IV',
            rating: '',
            achievements: '',
            photo: '',
            isPublished: true,
            isOverall: true
        });
        setEditingStudent(null);
    };

    const years = Array.from(new Set(studentsList.map((s: any) => s.awardYear))).sort((a: any, b: any) => b - a);

    const overallStudents = studentsList.filter((student: any) => {
        if (!student.isOverall) return false;
        const matchesGender = filterGender === 'all' || student.gender?.toLowerCase() === filterGender.toLowerCase();
        const matchesYear = filterYear === 'all' || String(student.awardYear) === String(filterYear);
        return matchesGender && matchesYear;
    });

    const branchStudents = studentsList.filter((student: any) => {
        if (student.isOverall) return false;
        const matchesGender = filterGender === 'all' || student.gender?.toLowerCase() === filterGender.toLowerCase();
        const matchesYear = filterYear === 'all' || String(student.awardYear) === String(filterYear);
        return matchesGender && matchesYear;
    });

    const handleEdit = (student: any) => {
        setFormData({
            ...student,
            branch: 'OVERALL',
            isOverall: true,
            rating: student.rating ?? student.cgpa ?? '',
            achievements: Array.isArray(student.achievements) ? student.achievements.join('\n') : student.achievements
        });
        setEditingStudent(student);
        setShowAddModal(true);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Please upload a valid image file', 'error');
            return;
        }

        setIsPhotoUploading(true);
        try {
            const uploadedUrl = await uploadFileToR2(file);
            if (!uploadedUrl) {
                showToast('Failed to upload image', 'error');
                return;
            }
            setFormData((prev: any) => ({ ...prev, photo: uploadedUrl }));
            showToast('Image uploaded successfully', 'success');
        } finally {
            setIsPhotoUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.rollNumber || !formData.rating) {
            showToast('Please fill in required fields (Name, Roll Number, Rating)', 'error');
            return;
        }

        try {
            let result;
            const payload = {
                ...formData,
                branch: 'OVERALL',
                isOverall: true,
                rating: Number(formData.rating)
            };

            if (editingStudent) {
                result = await updateBestOutgoingStudent(payload);
            } else {
                result = await createBestOutgoingStudent(payload);
            }

            if (result.success) {
                showToast(editingStudent ? 'Updated successfully' : 'Added successfully', 'success');
                if (editingStudent) {
                    setStudentsList(prev => prev.map(s => s.id === (result as any).data.id ? (result as any).data : s));
                } else {
                    setStudentsList(prev => [(result as any).data, ...prev]);
                }
                setShowAddModal(false);
                resetForm();
            } else {
                showToast((result as any).error || 'Operation failed', 'error');
            }
        } catch (error) {
            showToast('Something went wrong', 'error');
        }
    };

    const confirmDelete = async () => {
        if (deleteStudent) {
            try {
                const result = await deleteBestOutgoingStudent(deleteStudent.id);
                if (result.success) {
                    setStudentsList(prev => prev.filter(s => s.id !== deleteStudent.id));
                    showToast('Student removed successfully', 'success');
                } else {
                    showToast((result as any).error || 'Failed to delete', 'error');
                }
            } catch (error) {
                showToast('Something went wrong', 'error');
            }
            setDeleteStudent(null);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">Outgoing Students</h1>
                        <InfoTooltip text="Manage and showcase the best outgoing students for each batch" size="md" />
                    </div>
                    <p className="text-sm text-[#6B7280]">Recognize and showcase top-performing graduating students</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowAddModal(true);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-xl text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm w-full md:w-auto"
                >
                    <Plus className="w-5 h-5" />
                    Add New Student
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4">
                <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setFilterGender('all')}
                        className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filterGender === 'all' ?
                            'bg-[#1A1A1A] text-white' :
                            'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterGender('male')}
                        className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filterGender === 'male' ?
                            'bg-[#1A1A1A] text-white' :
                            'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'}`}
                    >
                        Male<span className="hidden sm:inline"> Students</span>
                    </button>
                    <button
                        onClick={() => setFilterGender('female')}
                        className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filterGender === 'female' ?
                            'bg-[#1A1A1A] text-white' :
                            'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'}`}
                    >
                        Female<span className="hidden sm:inline"> Students</span>
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Select
                        value={String(filterYear)}
                        onValueChange={(value) => setFilterYear(value === 'all' ? 'all' : parseInt(value))}
                    >
                        <SelectTrigger className="w-full sm:w-[140px] h-[40px] px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#1A1A1A]">
                            <SelectValue placeholder="All Years" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            {years.map((year: any) => (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Overall Students Section */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-[#1A1A1A]">Overall Outgoing Student</h2>
                            <InfoTooltip text="Top student selected across all branches for the academic year" size="sm" />
                        </div>
                        <p className="text-sm text-[#6B7280]">Top performing students across all branches</p>
                    </div>
                </div>

                {overallStudents.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {overallStudents.map((student: any) => {
                            const ratingValue = student.rating ?? student.cgpa ?? '—';
                            const eventsWonValue = student.eventsWon ?? '—';
                            const eventsParticipatedValue = student.eventsParticipated ?? '—';
                            const achievements = Array.isArray(student.achievements)
                                ? student.achievements.filter(Boolean).slice(0, 4)
                                : [];

                            return (
                                <div key={student.id} className="bg-[#F4F2F0] rounded-[18px] p-[10px] py-[16px] border border-[#E5E7EB]">
                                    <div className="relative flex flex-col sm:flex-row sm:items-start justify-between mb-4 px-3 py-0 mt-1 gap-4">
                                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-3 text-center sm:text-left w-full sm:w-auto">
                                            <div className="relative">
                                                {student.photo ? (
                                                    <Image src={student.photo} alt={student.name} width={80} height={80} className="w-20 h-20 rounded-full object-cover ring-4 ring-[#10B981]/30 shadow-md" />
                                                ) : (
                                                    <div className="w-20 h-20 rounded-full bg-gray-200 ring-4 ring-gray-100 flex items-center justify-center shadow-sm">
                                                        <Users className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#F4F2F0] shadow-md bg-gradient-to-br from-[#10B981] to-[#059669]">
                                                    <Award className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-[20px] font-semibold text-[#1A1A1A] mb-1">{student.name}</h3>
                                                <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-2 flex-wrap justify-center sm:justify-start">
                                                    <span>{student.rollNumber}</span>
                                                    <span>•</span>
                                                    <span>Year {student.year}</span>
                                                </div>
                                                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-[#10B981] to-[#059669] shadow-sm">
                                                    🏆 Overall Best {student.gender === 'male' ? 'Male' : 'Female'} Student {student.awardYear}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 absolute top-0 right-0 sm:relative sm:top-auto sm:right-auto">
                                            <button onClick={() => handleEdit(student)} className="p-2 rounded-lg hover:bg-gray-200 transition-colors bg-white/50 backdrop-blur-sm sm:bg-transparent shadow-sm sm:shadow-none"><Edit2 className="w-5 h-5 text-gray-500" /></button>
                                            <button onClick={() => setDeleteStudent(student)} className="p-2 rounded-lg hover:bg-red-50 transition-colors bg-white/50 backdrop-blur-sm sm:bg-transparent shadow-sm sm:shadow-none"><Trash2 className="w-5 h-5 text-red-500" /></button>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-[14px] p-5">
                                        <div className="grid grid-cols-3 gap-4 mb-5 pb-5 border-b border-[#E5E7EB]">
                                            <div className="text-center">
                                                <div className="text-[24px] font-bold text-[#1A1A1A] mb-1 min-h-[36px] flex items-center justify-center">{ratingValue}</div>
                                                <div className="text-xs text-[#6B7280]">Rating</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[24px] font-bold text-[#1A1A1A] mb-1 min-h-[36px] flex items-center justify-center">{eventsWonValue}</div>
                                                <div className="text-xs text-[#6B7280]">Events Won</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[24px] font-bold text-[#1A1A1A] mb-1 min-h-[36px] flex items-center justify-center">{eventsParticipatedValue}</div>
                                                <div className="text-xs text-[#6B7280]">Participated</div>
                                            </div>
                                        </div>
                                        <div className="mb-5 min-h-[150px]">
                                            <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Key Achievements</h4>
                                            <ul className="space-y-2 min-h-[104px]">
                                                {achievements.length > 0 ? achievements.map((achievement: any, index: any) => (
                                                    <li key={index} className="flex items-center gap-2 text-sm text-[#6B7280]">
                                                        <Award className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                                                        {achievement}
                                                    </li>
                                                )) : (
                                                    <li className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                                                        <Award className="w-4 h-4 text-[#D1D5DB] flex-shrink-0" />
                                                        No achievements added
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">No overall outgoing students found for the selected filters.</div>
                )}
            </div>

            {/* Branch-wise Students Section */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-[#1A1A1A]">Branch-wise Best Outgoing Students</h2>
                            <InfoTooltip text="Students selected by their respective branches (Read-only for Super Admin)" size="sm" />
                        </div>
                        <p className="text-sm text-[#6B7280]">Top students from individual branches</p>
                    </div>
                </div>

                {branchStudents.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {branchStudents.map((student: any) => {
                            const ratingValue = student.rating ?? student.cgpa ?? '—';
                            const achievements = Array.isArray(student.achievements)
                                ? student.achievements.filter(Boolean).slice(0, 4)
                                : [];

                            return (
                                <div key={student.id} className="bg-[#F4F2F0] rounded-[18px] p-[10px] py-[16px] border border-[#E5E7EB]">
                                    <div className="relative flex flex-col sm:flex-row sm:items-start justify-between mb-4 px-3 py-0 mt-1 gap-4">
                                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-3 text-center sm:text-left w-full sm:w-auto">
                                            <div className="relative">
                                                {student.photo ? (
                                                    <Image src={student.photo} alt={student.name} width={80} height={80} className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-100 shadow-md" />
                                                ) : (
                                                    <div className="w-20 h-20 rounded-full bg-gray-200 ring-4 ring-gray-100 flex items-center justify-center shadow-sm">
                                                        <Users className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#F4F2F0] shadow-md bg-blue-500">
                                                    <Star className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-[20px] font-semibold text-[#1A1A1A] mb-1">{student.name}</h3>
                                                <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-2 flex-wrap justify-center sm:justify-start">
                                                    <span className="font-medium text-blue-600">{student.branch}</span>
                                                    <span>•</span>
                                                    <span>{student.rollNumber}</span>
                                                </div>
                                                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-gray-600 bg-gray-100 shadow-sm">
                                                    Best {student.gender === 'male' ? 'Male' : 'Female'} Student {student.awardYear}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-[14px] p-5">
                                        <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-[#E5E7EB]">
                                            <div className="text-center border-r border-[#E5E7EB]">
                                                <div className="text-[24px] font-bold text-[#1A1A1A] mb-1">{ratingValue}</div>
                                                <div className="text-xs text-[#6B7280]">CGPA / Rating</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[24px] font-bold text-[#1A1A1A] mb-1">{student.awardYear}</div>
                                                <div className="text-xs text-[#6B7280]">Batch</div>
                                            </div>
                                        </div>
                                        <div className="min-h-[120px]">
                                            <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Achievements</h4>
                                            <ul className="space-y-2">
                                                {achievements.length > 0 ? achievements.map((achievement: any, index: any) => (
                                                    <li key={index} className="flex items-start gap-2 text-sm text-[#6B7280]">
                                                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                        <span className="line-clamp-2">{achievement}</span>
                                                    </li>
                                                )) : (
                                                    <li className="text-sm text-gray-400 italic">No achievements listed</li>
                                                )}
                                            </ul>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex items-center justify-between text-[11px] text-[#6B7280] font-medium uppercase tracking-wider">
                                                <span>Status: <span className={student.isPublished ? "text-emerald-600" : "text-amber-600"}>{student.isPublished ? 'Published' : 'Draft'}</span></span>
                                                <span className="italic opacity-70">Source: Branch Admin</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
                        No branch-specific students found for the selected filters.
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowAddModal(false); resetForm(); }}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-lg font-bold text-[#1A1A1A]">{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
                                <p className="text-xs text-gray-500">{editingStudent ? 'Update student details' : 'Add a new best outgoing student'}</p>
                            </div>
                            <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-[#1A1A1A] mb-2">Student Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter student name" className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" /></div>
                                <div><label className="block text-sm font-medium text-[#1A1A1A] mb-2">Roll Number *</label><input type="text" value={formData.rollNumber} onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })} placeholder="Enter roll number" className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Gender *</label>
                                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                                        <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm">
                                            <SelectValue placeholder="Select Gender" />
                                        </SelectTrigger>
                                        <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div><label className="block text-sm font-medium text-[#1A1A1A] mb-2">Award Year *</label><input type="number" value={formData.awardYear} onChange={(e) => setFormData({ ...formData, awardYear: parseInt(e.target.value) || new Date().getFullYear() })} className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Category</label>
                                    <input
                                        type="text"
                                        value="Overall Best"
                                        disabled
                                        className="w-full px-4 py-2.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm text-[#6B7280] cursor-not-allowed"
                                    />
                                </div>
                                <div><label className="block text-sm font-medium text-[#1A1A1A] mb-2">Year *</label><input type="text" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-[#1A1A1A] mb-2">Rating *</label><input type="number" step="0.01" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" /></div>
                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Photo Upload</label>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                    <button type="button" onClick={() => !isPhotoUploading && fileInputRef.current?.click()} className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-[#F7F8FA] transition-colors disabled:opacity-60" disabled={isPhotoUploading}>
                                        {isPhotoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        {isPhotoUploading ? 'Uploading...' : 'Upload from Device'}
                                    </button>
                                    {formData.photo && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <Image src={formData.photo} alt="Student preview" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                                            <span className="text-xs text-[#6B7280]">Image uploaded</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Achievements (one per line) *</label>
                                <textarea rows={4} value={formData.achievements} onChange={(e) => setFormData({ ...formData, achievements: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white z-10">
                            <button onClick={() => { setShowAddModal(false); resetForm(); }} className="px-5 py-2.5 border rounded-xl text-sm">Cancel</button>
                            <button onClick={handleSave} className="px-5 py-2.5 bg-[#10B981] text-white rounded-xl text-sm font-medium shadow-lg shadow-green-100 flex items-center gap-2"><Save className="w-4 h-4" /> {editingStudent ? 'Save Changes' : 'Add Student'}</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteStudent}
                onClose={() => setDeleteStudent(null)}
                onConfirm={confirmDelete}
                title="Remove Student"
                message={`Are you sure you want to remove ${deleteStudent?.name}?`}
                confirmLabel="Remove"
                variant="danger"
            />
        </div>
    );
}
