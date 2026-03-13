'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { Star, Award, Plus, CheckCircle, Users, UserPlus, X, Save, Trash2, Edit2 } from 'lucide-react';
import Image from 'next/image';
import { InfoTooltip } from '@/components/InfoTooltip';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getBestOutgoingStudents,
  createBestOutgoingStudent,
  updateBestOutgoingStudent,
  deleteBestOutgoingStudent,
  toggleStudentPublish
} from '@/actions/awardActions';

export function BestOutgoingStudentsPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [filterGender, setFilterGender] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [deleteStudent, setDeleteStudent] = useState<any>(null);

  const [formData, setFormData] = useState<any>({
    name: '',
    rollNumber: '',
    gender: 'male',
    awardYear: new Date().getFullYear(),
    branch: 'CSE',
    year: 'IV',
    cgpa: '',
    achievements: '',
    placementStatus: 'Placed',
    company: '',
    package: '',
    photo: '',
    isPublished: true,
    isOverall: false
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const result = await getBestOutgoingStudents();
      if (result.success) {
        setStudentsList(result.data);
      }
    } catch (error) {
      showToast('Failed to fetch students', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rollNumber: '',
      gender: 'male',
      awardYear: new Date().getFullYear(),
      branch: 'CSE',
      year: 'IV',
      cgpa: '',
      achievements: '',
      placementStatus: 'Placed',
      company: '',
      package: '',
      photo: '',
      isPublished: true,
      isOverall: false
    });
    setEditingStudent(null);
  };

  const years = Array.from(new Set(studentsList.map((s: any) => s.awardYear))).sort((a: any, b: any) => b - a);
  const branches = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE'];

  const filteredStudents = studentsList.filter((student: any) => {
    const matchesGender = filterGender === 'all' || student.gender?.toLowerCase() === filterGender.toLowerCase();
    const matchesYear = filterYear === 'all' || String(student.awardYear) === String(filterYear);
    return matchesGender && matchesYear;
  });

  const handleEdit = (student: any) => {
    setFormData({
      ...student,
      achievements: Array.isArray(student.achievements) ? student.achievements.join('\n') : student.achievements
    });
    setEditingStudent(student);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.rollNumber) {
      showToast('Please fill in required fields (Name, Roll Number)', 'error');
      return;
    }

    try {
      let result;
      if (editingStudent) {
        result = await updateBestOutgoingStudent(formData);
      } else {
        result = await createBestOutgoingStudent(formData);
      }

      if (result.success) {
        showToast(editingStudent ? 'Updated successfully' : 'Added successfully', 'success');
        fetchStudents();
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
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span>›</span>
          <span>Content Management</span>
          <span>›</span>
          <span className="text-[#1A1A1A] font-medium">Best Outgoing Students</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-[28px] font-bold text-[#1A1A1A]">Best Outgoing Students</h1>
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
            Add Student
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          <button onClick={() => setFilterGender('all')} className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filterGender === 'all' ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'}`}>All</button>
          <button onClick={() => setFilterGender('male')} className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filterGender === 'male' ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'} truncate`}>Male<span className="hidden sm:inline"> Students</span></button>
          <button onClick={() => setFilterGender('female')} className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filterGender === 'female' ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'} truncate`}>Female<span className="hidden sm:inline"> Students</span></button>
        </div>

        <Select value={String(filterYear)} onValueChange={(value) => setFilterYear(value)}>
          <SelectTrigger className="w-full sm:w-[140px] h-[40px] px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map((year: any) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#F4F2F0] rounded-[18px] p-[10px] py-[16px] animate-pulse">
              {/* Skeleton UI */}
            </div>
          ))
        ) : (
          filteredStudents.map((student: any) => (
            <div key={student.id} className="bg-[#F4F2F0] rounded-[18px] p-[10px] py-[16px] h-full flex flex-col">
              <div className="relative flex flex-col sm:flex-row sm:items-start justify-between mb-4 px-3 py-0 mt-1 gap-4">
                {/* Profile content - forced center on mobile */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-3 text-center sm:text-left w-full sm:w-auto">
                  <div className="relative">
                    {student.photo ? (
                      <Image src={student.photo} alt={student.name} width={80} height={80} className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center"><Users className="w-8 h-8 text-gray-400" /></div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#F4F2F0] shadow-md" style={{ backgroundColor: student.gender === 'male' ? '#3B82F6' : '#EC4899' }}>
                      <Star className="w-4 h-4 text-white fill-current" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[20px] font-semibold text-[#1A1A1A] mb-1">{student.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-2 flex-wrap justify-center sm:justify-start">
                      {student.rollNumber} • {student.branch} - Year {student.year}
                    </div>
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: student.gender === 'male' ? '#3B82F6' : '#EC4899' }}>
                      Best {student.gender === 'male' ? 'Male' : 'Female'} Student {student.awardYear}
                    </div>
                    <div className="mt-1 min-h-[20px]">
                      {student.isOverall && <div className="text-xs font-bold text-[#10B981]">🏆 Overall Best Student</div>}
                    </div>
                  </div>
                </div>

                {/* Icons - Absolute on mobile to allow true center for profile */}
                {!student.isOverall && (
                  <div className="flex items-center gap-2 absolute top-0 right-0 sm:relative sm:top-auto sm:right-auto">
                    <button onClick={() => handleEdit(student)} className="p-2 rounded-lg hover:bg-gray-200 transition-colors"><Edit2 className="w-5 h-5 text-gray-500" /></button>
                    <button onClick={() => setDeleteStudent(student)} className="p-2 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-5 h-5 text-red-500" /></button>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-[14px] p-5 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-[#E5E7EB]">
                  <div className="text-center border-r border-[#E5E7EB]"><div className="text-[24px] font-bold text-[#1A1A1A] mb-1">{student.cgpa}</div><div className="text-xs text-[#6B7280]">CGPA</div></div>
                  <div className="text-center"><div className="text-[24px] font-bold text-[#1A1A1A] mb-1">{student.awardYear}</div><div className="text-xs text-[#6B7280]">Award Year</div></div>
                </div>
                <div className="mb-5 flex-1 flex flex-col">
                  <div className="text-sm font-semibold text-[#1A1A1A] mb-3">Key Achievements</div>
                  <div className="h-32 overflow-y-auto pr-1 custom-scrollbar">
                    <ul className="space-y-2">
                      {student.achievements?.map((a: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#6B7280]">
                          <Award className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-4 bg-[#F7F8FA] rounded-xl border border-[#E5E7EB]/50 mt-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">Placement & Career</div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#1A1A1A]">{student.placementStatus}</span>
                        {student.placementStatus === 'Placed' && student.company && (
                          <span className="text-xs text-[#10B981] font-medium">{student.company}</span>
                        )}
                      </div>
                    </div>
                    {student.placementStatus === 'Placed' && student.package && (
                      <div className="text-right">
                        <div className="text-xs text-[#6B7280] mb-1">Package</div>
                        <div className="text-lg font-extrabold text-[#1A1A1A] tracking-tight">{student.package} <span className="text-[10px] font-medium text-[#6B7280]">LPA</span></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{editingStudent ? 'Edit Student' : 'Add Student'}</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border p-2 rounded" />
              <input type="text" placeholder="Roll Number" value={formData.rollNumber} onChange={e => setFormData({ ...formData, rollNumber: e.target.value })} className="border p-2 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
              </Select>
              <input
                type="number"
                placeholder="Award Year"
                value={formData.awardYear ?? ''}
                onChange={e => setFormData({ ...formData, awardYear: e.target.value })}
                className="border p-2 rounded outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Select value={formData.branch} onValueChange={v => setFormData({ ...formData, branch: v })}>
                <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                <SelectContent>{branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={formData.year} onValueChange={v => setFormData({ ...formData, year: v })}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent><SelectItem value="I">I</SelectItem><SelectItem value="II">II</SelectItem><SelectItem value="III">III</SelectItem><SelectItem value="IV">IV</SelectItem></SelectContent>
              </Select>
              <input
                type="number"
                step="0.01"
                placeholder="CGPA"
                value={formData.cgpa ?? ''}
                onChange={e => setFormData({ ...formData, cgpa: e.target.value })}
                className="border p-2 rounded outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
              />
            </div>
            <textarea rows={4} placeholder="Achievements (one per line)" value={formData.achievements} onChange={e => setFormData({ ...formData, achievements: e.target.value })} className="w-full border p-2 rounded mb-4" />
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#6B7280] mb-2">Placement Status</label>
              <div className="flex flex-wrap gap-2">
                {['Placed', 'Higher Studies', 'Entrepreneur', 'Competitive Exams'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, placementStatus: status })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.placementStatus === status
                      ? 'bg-[#10B981] text-white shadow-md shadow-[#10B981]/20'
                      : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {formData.placementStatus === 'Placed' && (
              <div className="grid grid-cols-2 gap-4 mb-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#6B7280]">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Microsoft"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#10B981] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#6B7280]">Annual Package (LPA)</label>
                  <input
                    type="text"
                    placeholder="e.g. 12 LPA"
                    value={formData.package}
                    onChange={e => setFormData({ ...formData, package: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#10B981] focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#10B981] text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteStudent} onClose={() => setDeleteStudent(null)} onConfirm={confirmDelete} title="Confirm Delete" message={`Remove ${deleteStudent?.name}?`} variant="danger" />
    </div>
  );
}