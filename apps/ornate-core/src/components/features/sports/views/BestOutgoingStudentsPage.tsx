'use client';
import { useState, useEffect } from 'react';
import { Star, Award, Plus, CheckCircle, Users, UserPlus, Edit2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Modal } from '@/components/Modal';
import { ActionMenu } from '@/components/ActionMenu';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Initial data
const initialStudents = [
  {
    id: 1,
    name: 'Ryan Korsgaard',
    rollNumber: 'CS2021001',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    branch: 'CSE',
    year: 'IV',
    cgpa: 9.8,
    achievements: [
      'Winner - Hackathon 2024',
      'Best Project Award',
      'Research Paper Published',
      '5 Certifications Completed'],

    eventsParticipated: 12,
    eventsWon: 5,
    placementStatus: 'Placed - Google',
    package: '₹45 LPA',
    gender: 'male',
    awardYear: 2025,
    isPublished: true,
    publishedDate: '2025-11-01T10:00:00'
  },
  {
    id: 2,
    name: 'Madelyn Lubin',
    rollNumber: 'CS2021045',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
    branch: 'CSE',
    year: 'IV',
    cgpa: 9.6,
    achievements: [
      'Most Active in Tech Fests',
      'Event Coordinator - 3 Events',
      'Internship at Microsoft',
      'Startup Founder'],

    eventsParticipated: 18,
    eventsWon: 7,
    placementStatus: 'Placed - Microsoft',
    package: '₹38 LPA',
    gender: 'female',
    awardYear: 2025,
    isPublished: true,
    publishedDate: '2025-11-01T10:00:00'
  },
  {
    id: 3,
    name: 'James Wilson',
    rollNumber: 'CS2021067',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
    branch: 'CSE',
    year: 'IV',
    cgpa: 9.4,
    achievements: [
      'Best Technical Skills',
      'Open Source Contributor',
      'Workshop Instructor',
      'Coding Competition Champion'],

    eventsParticipated: 15,
    eventsWon: 8,
    placementStatus: 'Placed - Amazon',
    package: '₹42 LPA',
    gender: 'male',
    awardYear: 2024,
    isPublished: true,
    publishedDate: '2024-11-01T10:00:00'
  },
  {
    id: 4,
    name: 'Sarah Johnson',
    rollNumber: 'CS2021089',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop',
    branch: 'CSE',
    year: 'IV',
    cgpa: 9.7,
    achievements: [
      'Research Excellence Award',
      '3 Patents Filed',
      'International Conference Speaker',
      'Gold Medalist'],

    eventsParticipated: 10,
    eventsWon: 4,
    placementStatus: 'Higher Studies - MIT',
    package: 'Full Scholarship',
    gender: 'female',
    awardYear: 2024,
    isPublished: false,
    publishedDate: null
  }];



export function BestOutgoingStudentsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentsList, setStudentsList] = useState(initialStudents);
  const [filterGender, setFilterGender] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterStatus, setFilterStatus] = useState('published');
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<any>(null);

  const [formData, setFormData] = useState<any>({
    name: '',
    rollNumber: '',
    gender: 'male',
    awardYear: new Date().getFullYear(),
    branch: 'CSE',
    year: 'IV',
    cgpa: '',
    achievements: '',
    placementStatus: '',
    package: '',
    isPublished: true
  });

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
      placementStatus: '',
      package: '',
      isPublished: true
    });
    setEditingStudent(null);
  };

  const { showToast } = useToast();

  const years = Array.from(new Set(studentsList.map((s: any) => s.awardYear))).sort((a: any, b: any) => b - a);

  const filteredStudents = studentsList.filter((student: any) => {
    const matchesGender = filterGender === 'all' || student.gender === filterGender;
    const matchesYear = filterYear === 'all' || student.awardYear === filterYear;
    const matchesStatus = filterStatus === 'all' ||
      filterStatus === 'published' && student.isPublished ||
      filterStatus === 'draft' && !student.isPublished;
    return matchesGender && matchesYear && matchesStatus;
  });

  const handleEdit = (student: any) => {
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      gender: student.gender,
      awardYear: student.awardYear,
      branch: student.branch,
      year: student.year,
      cgpa: student.cgpa,
      achievements: student.achievements.join('\n'),
      placementStatus: student.placementStatus,
      package: student.package,
      isPublished: student.isPublished
    });
    setEditingStudent(student);
  };

  const handleDelete = (student: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Student',
      message: `Are you sure you want to delete ${student.name} from the best outgoing students list? This action cannot be undone.`,
      type: 'danger',
      onConfirm: () => {
        setStudentsList(prev => prev.filter(s => s.id !== student.id));
        showToast(`${student.name} has been removed`, 'success');
        setConfirmDialog(null);
      }
    });
  };

  const handleDownload = (student: any) => {
    showToast(`Downloading ${student.name}'s profile...`, 'info');
  };

  const handlePublishToggle = (student: any) => {
    setStudentsList(prev => prev.map(s =>
      s.id === student.id ? { ...s, isPublished: !s.isPublished } : s
    ));
    if (student.isPublished) {
      showToast(`${student.name}'s profile has been unpublished`, 'info');
    } else {
      showToast(`${student.name}'s profile has been published`, 'success');
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.rollNumber) {
      showToast('Name and Roll Number are required', 'error');
      return;
    }

    const achievementsArray = formData.achievements.split('\n').filter(Boolean);

    if (editingStudent) {
      setStudentsList(prev => prev.map(s =>
        s.id === editingStudent.id ? {
          ...s,
          ...formData,
          achievements: achievementsArray,
          eventsParticipated: s.eventsParticipated || 0, // Preserve or default
          eventsWon: s.eventsWon || 0
        } : s
      ));
      showToast('Student updated successfully', 'success');
    } else {
      const newStudent = {
        id: Date.now(),
        ...formData,
        achievements: achievementsArray,
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop', // Default placeholder
        eventsParticipated: 0,
        eventsWon: 0,
        publishedDate: new Date().toISOString()
      };
      setStudentsList(prev => [newStudent, ...prev]);
      showToast('Student added successfully', 'success');
    }
    setShowAddModal(false);
    resetForm();
  };

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
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
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Best Outgoing Students</h1>
            <p className="text-sm text-[#6B7280]">Recognize and showcase top-performing graduating students</p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm w-full md:w-auto">

            <Plus className="w-5 h-5" />
            Add Student
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          {isLoading ? (
            <>
              <div className="bg-[#F4F2F0] rounded-[18px] p-2">
                <div className="bg-white rounded-[14px] p-4 flex items-center gap-3">
                  <Skeleton width={40} height={40} borderRadius={8} />
                  <div className="flex-1">
                    <Skeleton width="40%" height={14} className="mb-2" />
                    <Skeleton width="20%" height={24} />
                  </div>
                </div>
              </div>
              <div className="bg-[#F4F2F0] rounded-[18px] p-2">
                <div className="bg-white rounded-[14px] p-4 flex items-center gap-3">
                  <Skeleton width={40} height={40} borderRadius={8} />
                  <div className="flex-1">
                    <Skeleton width="40%" height={14} className="mb-2" />
                    <Skeleton width="20%" height={24} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#F4F2F0] rounded-[18px] p-2 pt-2 pr-2 pb-6 pl-2">
                <div className="bg-white rounded-[14px] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-[#3B82F6]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-[#6B7280]">Total Students</div>
                      <div className="text-2xl font-semibold text-[#1A1A1A]">{studentsList.length}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#F4F2F0] rounded-[12px] p-2">
                <div className="bg-white rounded-[10px] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#D1FAE5] rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-[#10B981]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-[#6B7280]">Published</div>
                      <div className="text-2xl font-semibold text-[#10B981]">
                        {studentsList.filter((s: any) => s.isPublished).length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-4 gap-4">
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterGender('all')}
              className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filterGender === 'all' ?
                'bg-[#1A1A1A] text-white' :
                'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'}`
              }>
              All
            </button>
            <button
              onClick={() => setFilterGender('male')}
              className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filterGender === 'male' ?
                'bg-[#1A1A1A] text-white' :
                'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'} truncate`
              }>
              Male <span className="hidden sm:inline">Students</span>
            </button>
            <button
              onClick={() => setFilterGender('female')}
              className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filterGender === 'female' ?
                'bg-[#1A1A1A] text-white' :
                'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'} truncate`
              }>
              Female <span className="hidden sm:inline">Students</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Year Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilterYear('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterYear === 'all' ?
                  'bg-[#F7F8FA] border border-[#1A1A1A] text-[#1A1A1A]' :
                  'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'}`
                }>
                All Years
              </button>
              {years.map((year: any) =>
                <button
                  key={year}
                  onClick={() => setFilterYear(year)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterYear === year ?
                    'bg-[#F7F8FA] border border-[#1A1A1A] text-[#1A1A1A]' :
                    'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'}`
                  }>
                  {year}
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-2">
              {['published', 'draft', 'all'].map((status: any) =>
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filterStatus === status ?
                    'bg-[#F7F8FA] border border-[#1A1A1A] text-[#1A1A1A]' :
                    'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'}`
                  }>
                  {status}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          [...Array(4)].map((_: any, i: any) => (
            <div key={i} className="bg-[#F4F2F0] rounded-[18px] p-[10px] px-[10px] py-[16px]">
              <div className="flex items-start justify-between mb-[18px] px-[12px]">
                <div className="flex items-start gap-3">
                  <Skeleton width={80} height={80} borderRadius="50%" />
                  <div className="pt-2">
                    <Skeleton width={150} height={24} className="mb-2" />
                    <Skeleton width={100} height={14} />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-[14px] p-5">
                <div className="grid grid-cols-3 gap-4 mb-5 pb-5 border-b border-[#E5E7EB]">
                  <div className="space-y-2">
                    <Skeleton width="60%" height={24} className="mx-auto" />
                    <Skeleton width="40%" height={10} className="mx-auto" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton width="60%" height={24} className="mx-auto" />
                    <Skeleton width="40%" height={10} className="mx-auto" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton width="60%" height={24} className="mx-auto" />
                    <Skeleton width="40%" height={10} className="mx-auto" />
                  </div>
                </div>
                <div className="space-y-3 mb-5">
                  <Skeleton width="40%" height={14} />
                  <Skeleton width="90%" height={12} />
                  <Skeleton width="85%" height={12} />
                  <Skeleton width="80%" height={12} />
                </div>
                <Skeleton width="100%" height={60} borderRadius={8} />
              </div>
            </div>
          ))
        ) : (
          filteredStudents.map((student: any) =>
            <div
              key={student.id}
              className="bg-[#F4F2F0] rounded-[18px] p-[10px] px-[10px] py-[16px] animate-card-entrance"
              style={{ animationDelay: `${studentsList.indexOf(student) * 40}ms` }}>

              {/* Header / Profile Row */}
              <div className="relative flex flex-col sm:flex-row sm:items-start justify-between mb-4 px-3 py-0 mt-1 mr-0.5 ml-0 gap-4">
                {/* Profile content - forced center on mobile */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-3 text-center sm:text-left w-full sm:w-auto flex-1">
                  {/* Profile Image with Badge */}
                  <div className="relative">
                    <Image
                      src={student.photo}
                      alt={student.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover" />

                    <div
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#F4F2F0] shadow-md"
                      style={{ backgroundColor: student.gender === 'male' ? '#3B82F6' : '#EC4899' }}>

                      <Star className="w-4 h-4 text-white fill-current" />
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="flex-1">
                    <h3 className="text-[20px] font-semibold text-[#1A1A1A] mb-1">
                      {student.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-2 flex-wrap justify-center sm:justify-start">
                      <span>{student.rollNumber}</span>
                      <span>•</span>
                      <span>{student.branch} - Year {student.year}</span>
                    </div>
                    <div
                      className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: student.gender === 'male' ? '#3B82F6' : '#EC4899' }}>

                      Best {student.gender === 'male' ? 'Male' : 'Female'} Student {student.awardYear}
                    </div>
                  </div>
                </div>

                {/* Icons - Absolute on mobile to allow true center for profile */}
                <div className="flex items-center gap-1 sm:gap-2 absolute top-0 right-0 sm:relative sm:top-auto sm:right-auto shrink-0">
                  <button
                    onClick={() => handleEdit(student)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit Student"
                  >
                    <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(student)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete Student"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Inner White Card */}
              <div className="bg-white rounded-[14px] p-5">
                {/* Statistics Row */}
                <div className="grid grid-cols-3 gap-4 mb-5 pb-5 border-b border-[#E5E7EB]">
                  <div className="text-center">
                    <div className="text-[24px] font-bold text-[#1A1A1A] mb-1">{student.cgpa}</div>
                    <div className="text-xs text-[#6B7280]">CGPA</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[24px] font-bold text-[#1A1A1A] mb-1">{student.eventsWon}</div>
                    <div className="text-xs text-[#6B7280]">Events Won</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[24px] font-bold text-[#1A1A1A] mb-1">{student.eventsParticipated}</div>
                    <div className="text-xs text-[#6B7280]">Participated</div>
                  </div>
                </div>

                {/* Key Achievements Section */}
                <div className="mb-5">
                  <div className="text-sm font-semibold text-[#1A1A1A] mb-3">Key Achievements</div>
                  <ul className="space-y-2">
                    {student.achievements.slice(0, 3).map((achievement: any, index: any) =>
                      <li key={index} className="flex items-start gap-2 text-sm text-[#6B7280]">
                        <Award className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        <span>{achievement}</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Placement Status Section */}
                <div className="p-4 bg-[#F7F8FA] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">Placement Status</div>
                      <div className="text-sm font-semibold text-[#1A1A1A]">
                        {student.placementStatus}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#6B7280] mb-1">Package</div>
                      <div className="text-lg font-bold text-[#10B981]">{student.package}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {filteredStudents.length === 0 &&
        <div className="text-center py-12 bg-white rounded-xl">
          <UserPlus className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-[#6B7280] mb-4">No students found matching your filters</p>
          <button
            onClick={() => {
              setFilterGender('all');
              setFilterYear('all');
              setFilterStatus('published');
            }}
            className="text-sm text-[#3B82F6] hover:underline">

            Clear filters
          </button>
        </div>
      }

      {/* Add/Edit Student Modal */}
      {(showAddModal || editingStudent) &&
        <Modal
          isOpen={true}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
          title={editingStudent ? 'Edit Best Outgoing Student' : 'Add Best Outgoing Student'}
          size="lg"
          onConfirm={handleSave}
          confirmText={editingStudent ? 'Update Student' : 'Add Student'}
          confirmButtonClass="bg-[#10B981] hover:bg-[#059669]">

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Student Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter student name"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Roll Number *
                </label>
                <input
                  type="text"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  placeholder="Enter roll number"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Gender *
                </label>
                <Select value={formData.gender} onValueChange={(val) => setFormData({ ...formData, gender: val })}>
                  <SelectTrigger className="w-full h-[46px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#10B981]">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Award Year *
                </label>
                <input
                  type="number"
                  value={formData.awardYear}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                    setFormData({ ...formData, awardYear: val });
                  }}
                  placeholder="2025"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Branch *
                </label>
                <Select value={formData.branch} onValueChange={(val) => setFormData({ ...formData, branch: val })}>
                  <SelectTrigger className="w-full h-[46px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#10B981]">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSE">CSE</SelectItem>
                    <SelectItem value="ECE">ECE</SelectItem>
                    <SelectItem value="ME">ME</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="EEE">EEE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Year *
                </label>
                <Select value={formData.year} onValueChange={(val) => setFormData({ ...formData, year: val })}>
                  <SelectTrigger className="w-full h-[46px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#10B981]">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">I</SelectItem>
                    <SelectItem value="II">II</SelectItem>
                    <SelectItem value="III">III</SelectItem>
                    <SelectItem value="IV">IV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  CGPA *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cgpa}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    setFormData({ ...formData, cgpa: val });
                  }}
                  placeholder="9.5"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Achievements *
              </label>
              <textarea
                rows={4}
                value={formData.achievements}
                onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                placeholder="Enter achievements (one per line)"
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] resize-none" />

            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Placement Status *
                </label>
                <input
                  type="text"
                  value={formData.placementStatus}
                  onChange={(e) => setFormData({ ...formData, placementStatus: e.target.value })}
                  placeholder="e.g., Placed - Google"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Package *
                </label>
                <input
                  type="text"
                  value={formData.package}
                  onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                  placeholder="e.g., ₹45 LPA"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Upload Photo
              </label>
              <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-8 text-center hover:border-[#10B981] transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-[#F7F8FA] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-[#6B7280]" />
                </div>
                <p className="text-sm text-[#6B7280] mb-1">
                  <span className="text-[#10B981] font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-[#9CA3AF]">PNG, JPG (max. 2MB)</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-4 h-4 rounded border-[#D1D5DB]" />

              <label className="text-sm text-[#1A1A1A]">Publish immediately</label>
            </div>
          </div>
        </Modal>
      }

      {/* Confirm Dialog */}
      {confirmDialog &&
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type} />

      }

      {/* Toast Notifications */}

    </div>);

}
