'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Users, UserCheck, Eye, CalendarPlus, GraduationCap } from 'lucide-react';
import { ActionMenu } from '@/components/ActionMenu';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { InfoTooltip } from '@/components/InfoTooltip';
import Image from 'next/image';
import { updateAdminUser, resetAdminPassword, deleteAdminUser, updateStudentUser, deleteStudentUser, resetStudentPassword, getEventsForAssignment, assignEventToStudent } from '@/actions/superAdminActions';
import { MetricCard } from '@/components/MetricCard';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";



export default function UsersClient({ 
    initialUsers, 
    initialStudents = [], 
    totalRegistrations = 0,
    totalStudentsCount = 0 
}: { 
    initialUsers: any[]; 
    initialStudents?: any[]; 
    totalRegistrations?: number;
    totalStudentsCount?: number;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [editFormData, setEditFormData] = useState<any>({
        name: '',
        email: '',
        role: ''
    });
    const [showEditModal, setShowEditModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState('All Roles');
    const [selectedPortal, setSelectedPortal] = useState('All Portals');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const { showToast } = useToast();

    // Use initial users from props and keep them in sync
    const [users, setUsers] = useState(initialUsers);
    const [students, setStudents] = useState(initialStudents);

    // Student-specific modals
    const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);
    const [showStudentEditModal, setShowStudentEditModal] = useState(false);
    const [showAssignEventModal, setShowAssignEventModal] = useState(false);
    const [studentEditFormData, setStudentEditFormData] = useState<any>({
        name: '', email: '', branch: '', currentYear: '', phone: ''
    });
    const [availableEvents, setAvailableEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [eventsLoading, setEventsLoading] = useState(false);
    const [assigningEvent, setAssigningEvent] = useState(false);
    const [windowStart, setWindowStart] = useState(1);

    // Sync window when page changes through non-arrow means (like filters)
    useEffect(() => {
        if (currentPage === 1) {
            setWindowStart(1);
        } else if (currentPage > 1) {
            // Ensure currentPage is within the window
            // On desktop we use 5, on mobile 2. We'll handle this in the navigation logic.
        }
    }, [currentPage]);

    // Sync state if initialUsers/initialStudents change (e.g., after server-side revalidation)
    useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    useEffect(() => {
        setStudents(initialStudents);
    }, [initialStudents]);

    // Determine which data source to use based on selected role filter
    const isStudentFilter = selectedRole === 'Students';
    const activeDataSource = isStudentFilter ? students : users;

    const filteredUsers = activeDataSource.filter((user: any) => {
        // Search Filter
        const searchTerms = searchQuery.toLowerCase().trim();
        const matchesSearch = !searchTerms ||
            user.name.toLowerCase().includes(searchTerms) ||
            user.email.toLowerCase().includes(searchTerms) ||
            user.role.toLowerCase().includes(searchTerms);

        // Role Filter — for students, all entries are already students so skip role check
        const matchesRole = isStudentFilter || selectedRole === 'All Roles' || user.role === selectedRole;

        // Portal Filter (works for both admin portal and student branch)
        const matchesPortal = selectedPortal === 'All Portals' ||
            (user.portal && user.portal.toString().toLowerCase() === selectedPortal.toString().toLowerCase());

        return matchesSearch && matchesRole && matchesPortal;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const isMobile = window.innerWidth < 768;
            const windowSize = isMobile ? 2 : 5;

            if (currentPage < windowStart + windowSize - 1 && currentPage < totalPages) {
                // Highlight moves to next button within current window
                setCurrentPage(prev => prev + 1);
            } else if (currentPage < totalPages) {
                // Highlight is on last button, slide window forward
                setCurrentPage(prev => prev + 1);
                setWindowStart(prev => prev + 1);
            }
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            if (currentPage > windowStart) {
                // Highlight moves to previous button within current window
                setCurrentPage(prev => prev - 1);
            } else {
                // Highlight is on first button, slide window back
                setCurrentPage(prev => prev - 1);
                setWindowStart(prev => Math.max(1, prev - 1));
            }
        }
    };

    const totalCoordinators = users.filter((user: any) => ['Event Coordinator', 'Sports Coordinator'].includes(user.role)).length;

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
            <div className="mb-8">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] truncate">User Management</h1>
                        <p className="text-sm text-gray-500 line-clamp-1">Manage admins, roles, and permissions across the platform.</p>
                    </div>
                    <div className="shrink-0 mt-1">
                        <button
                            onClick={() => showToast('Export started! Download will begin shortly.', 'success')}
                            className="flex items-center gap-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs md:text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">Export Users</span>
                            <span className="sm:hidden">Export</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <MetricCard
                    title="Total Registrations"
                    value={totalRegistrations.toLocaleString()}
                    icon={Users}
                    iconBgColor="#EFF6FF"
                    iconColor="#3B82F6"
                    infoText="Total registrations across the website"
                />
                <MetricCard
                    title="Registered Students"
                    value={totalStudentsCount.toLocaleString()}
                    icon={GraduationCap}
                    iconBgColor="#FFF7ED"
                    iconColor="#F97316"
                    infoText="Total student accounts in the platform"
                />
                <MetricCard
                    title="Event Coordinators"
                    value={totalCoordinators}
                    icon={UserCheck}
                    iconBgColor="#F0FDF4"
                    iconColor="#10B981"
                    infoText="Users assigned coordinator roles"
                />
            </div>

            <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-3 mt-2.5 mb-4">
                    <div className="relative flex-1 w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Select
                            value={selectedRole}
                            onValueChange={(value) => {
                                setSelectedRole(value);
                                setSelectedPortal('All Portals');
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-[180px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All Roles">All Roles</SelectItem>
                                <SelectItem value="Super Admin">Super Admin</SelectItem>
                                <SelectItem value="Branch Admin">Branch Admin</SelectItem>
                                <SelectItem value="Clubs">Clubs</SelectItem>
                                <SelectItem value="Sports">Sports</SelectItem>
                                <SelectItem value="HHO">HHO</SelectItem>
                                <SelectItem value="Event Coordinator">Event Coordinator</SelectItem>
                                <SelectItem value="Students">Students</SelectItem>
                                <SelectItem value="Ornate Committee">Ornate Committee</SelectItem>
                            </SelectContent>
                        </Select>

                        {selectedRole === 'Branch Admin' && (
                            <Select
                                value={selectedPortal}
                                onValueChange={(value) => setSelectedPortal(value)}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A] animate-fade-in">
                                    <SelectValue placeholder="All Portals" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All Portals">All Portals</SelectItem>
                                    <SelectItem value="CSE">CSE</SelectItem>
                                    <SelectItem value="ECE">ECE</SelectItem>
                                    <SelectItem value="EEE">EEE</SelectItem>
                                    <SelectItem value="MECH">MECH</SelectItem>
                                    <SelectItem value="CIVIL">CIVIL</SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        {selectedRole === 'Clubs' && (
                            <Select
                                value={selectedPortal}
                                onValueChange={(value) => setSelectedPortal(value)}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A] animate-fade-in">
                                    <SelectValue placeholder="All Portals" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All Portals">All Portals</SelectItem>
                                    <SelectItem value="TechXcel">TechXcel</SelectItem>
                                    <SelectItem value="SarvaSrijana">SarvaSrijana</SelectItem>
                                    <SelectItem value="Artix">Artix</SelectItem>
                                    <SelectItem value="Kaladharani">Kaladharani</SelectItem>
                                    <SelectItem value="Khelsaathi">Khelsaathi</SelectItem>
                                    <SelectItem value="ICRO">ICRO</SelectItem>
                                    <SelectItem value="PixelRO">PixelRO</SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        {selectedRole === 'Students' && (
                            <Select
                                value={selectedPortal}
                                onValueChange={(value) => { setSelectedPortal(value); setCurrentPage(1); }}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A] animate-fade-in">
                                    <SelectValue placeholder="All Branches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All Portals">All Branches</SelectItem>
                                    <SelectItem value="CSE">CSE</SelectItem>
                                    <SelectItem value="ECE">ECE</SelectItem>
                                    <SelectItem value="EEE">EEE</SelectItem>
                                    <SelectItem value="MECH">MECH</SelectItem>
                                    <SelectItem value="CIVIL">CIVIL</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white border-b border-[#F3F4F6]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            User
                                            <InfoTooltip text="Name and registered email address" size="sm" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            {isStudentFilter ? 'Branch' : 'Role'}
                                            <InfoTooltip text={isStudentFilter ? 'Student branch' : 'Assigned access level'} size="sm" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            {isStudentFilter ? 'Year' : 'Portal'}
                                            <InfoTooltip text={isStudentFilter ? 'Current academic year' : 'Department or club affiliation'} size="sm" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            {isStudentFilter ? 'Registrations' : 'Status'}
                                            <InfoTooltip text={isStudentFilter ? 'Total event registrations' : 'Current account standing'} size="sm" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            {isStudentFilter ? 'Status' : 'Last Login'}
                                            <InfoTooltip text={isStudentFilter ? 'Current account standing' : 'Time since last activity'} size="sm" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.map((user: any, index: number) => (
                                    <tr key={user.id} className={`border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors ${index === currentUsers.length - 1 ? 'border-b-0' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Image src={user.avatar} alt={user.name} width={36} height={36} className="rounded-full object-cover" />
                                                <div>
                                                    <div className="text-sm font-medium text-[#1A1A1A]">{user.name}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                                                {isStudentFilter ? (user.portal || 'N/A') : user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">{isStudentFilter ? (user.currentYear || 'N/A') : user.portal}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isStudentFilter ? (
                                                <span className="text-sm font-medium text-gray-700">{user.registrationCount ?? 0}</span>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium 
                                                ${user.status === 'Active' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' :
                                                        user.status === 'Suspended' ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20' :
                                                            'bg-red-50 text-red-700 ring-1 ring-red-600/20'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-600' : user.status === 'Suspended' ? 'bg-yellow-600' : 'bg-red-600'}`}></span>
                                                    {user.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isStudentFilter ? (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-green-600/20`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-500">{user.lastLogin}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end">
                                                <ActionMenu
                                                    actions={isStudentFilter ? [
                                                        {
                                                            label: 'View Details',
                                                            icon: 'eye',
                                                            onClick: () => {
                                                                setSelectedUser(user);
                                                                setShowStudentDetailModal(true);
                                                            }
                                                        },
                                                        {
                                                            label: 'Assign Event',
                                                            icon: 'plus',
                                                            onClick: async () => {
                                                                setSelectedUser(user);
                                                                setSelectedEventId('');
                                                                setEventsLoading(true);
                                                                setShowAssignEventModal(true);
                                                                try {
                                                                    const result = await getEventsForAssignment();
                                                                    if ('error' in result) {
                                                                        showToast(result.error || 'Failed to load events', 'error');
                                                                    } else if (result.data) {
                                                                        setAvailableEvents(result.data);
                                                                    }
                                                                } catch {
                                                                    showToast('Failed to load events', 'error');
                                                                } finally {
                                                                    setEventsLoading(false);
                                                                }
                                                            }
                                                        },
                                                        {
                                                            label: 'Edit Student',
                                                            icon: 'edit',
                                                            onClick: () => {
                                                                setSelectedUser(user);
                                                                setStudentEditFormData({
                                                                    name: user.name,
                                                                    email: user.email,
                                                                    branch: user.portal === 'N/A' ? '' : user.portal,
                                                                    currentYear: user.currentYear === 'N/A' ? '' : user.currentYear,
                                                                    phone: user.phone || ''
                                                                });
                                                                setShowStudentEditModal(true);
                                                            }
                                                        },
                                                        {
                                                            label: 'Reset Password',
                                                            icon: 'settings',
                                                            onClick: () => {
                                                                setSelectedUser(user);
                                                                setShowResetModal(true);
                                                            }
                                                        },
                                                        { divider: true, label: '' },
                                                        {
                                                            label: 'Delete Student',
                                                            icon: 'trash',
                                                            onClick: () => {
                                                                setSelectedUser(user);
                                                                setShowDeleteModal(true);
                                                            },
                                                            danger: true
                                                        },
                                                    ] : [
                                                        {
                                                            label: 'Edit User',
                                                            icon: 'edit',
                                                            onClick: () => {
                                                                setSelectedUser(user);
                                                                setEditFormData({
                                                                    name: user.name,
                                                                    email: user.email,
                                                                    role: user.role
                                                                });
                                                                setShowEditModal(true);
                                                            }
                                                        },
                                                        {
                                                            label: 'Reset Password',
                                                            icon: 'settings',
                                                            onClick: () => {
                                                                setSelectedUser(user);
                                                                setShowResetModal(true);
                                                            }
                                                        },
                                                        { divider: true, label: '' },
                                                        {
                                                            label: 'Delete User',
                                                            icon: 'trash',
                                                            onClick: () => {
                                                                setSelectedUser(user);
                                                                setShowDeleteModal(true);
                                                            },
                                                            danger: true
                                                        },
                                                    ]}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="px-4 md:px-6 py-4 border-t border-[#F3F4F6] flex items-center justify-between gap-4">
                    <div className="text-left">
                        <div className="text-xs md:text-sm text-gray-500 font-medium whitespace-nowrap">
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="p-2 text-gray-600 bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            aria-label="Previous page"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>

                        {/* Mobile Page Numbers */}
                        <div className="flex items-center gap-1.5 md:hidden">
                            {[windowStart, windowStart + 1].filter(p => p <= totalPages).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center ${currentPage === p
                                        ? 'bg-[#1A1A1A] text-white font-bold'
                                        : 'text-gray-600 bg-white border border-[#E5E7EB]'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        {/* Desktop Page Numbers */}
                        <div className="hidden md:flex items-center gap-2">
                            {[...Array(5)].map((_, i) => {
                                const p = windowStart + i;
                                if (p > totalPages) return null;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={`w-9 h-9 text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center ${currentPage === p
                                            ? 'bg-[#1A1A1A] text-white font-bold'
                                            : 'text-gray-600 bg-white border border-[#E5E7EB] hover:bg-gray-50'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 text-gray-600 bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            aria-label="Next page"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Admin User Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit User"
                confirmText="Save Changes"
                onConfirm={async () => {
                    // Validation
                    if (!editFormData?.name?.trim() || !editFormData?.email?.trim()) {
                        showToast('Name and email are required', 'error');
                        return;
                    }
                    if (!editFormData.email.includes('@')) {
                        showToast('Please enter a valid email address', 'error');
                        return;
                    }

                    const result = await updateAdminUser(selectedUser.id, editFormData);
                    if ('error' in result) {
                        showToast(result.error || 'Failed to update user', 'error');
                    } else {
                        showToast('User details updated successfully', 'success');
                        setShowEditModal(false);
                    }
                }}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={editFormData?.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={editFormData?.email}
                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <Select
                                value={editFormData?.role}
                                onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
                            >
                                <SelectTrigger className="w-full bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Super Admin">Super Admin</SelectItem>
                                    <SelectItem value="Branch Admin">Branch Admin</SelectItem>
                                    <SelectItem value="Clubs">Clubs</SelectItem>
                                    <SelectItem value="Sports">Sports</SelectItem>
                                    <SelectItem value="HHO">HHO</SelectItem>
                                    <SelectItem value="Event Coordinator">Event Coordinator</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                                Active
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Student Detail Modal */}
            <Modal
                isOpen={showStudentDetailModal}
                onClose={() => setShowStudentDetailModal(false)}
                title="Student Details"
                size="lg"
            >
                {selectedUser?.isStudent && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <Image src={selectedUser.avatar} alt={selectedUser.name} width={56} height={56} className="rounded-full object-cover" />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-[#1A1A1A]">{selectedUser.name}</h3>
                                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-green-600/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                Active
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="text-xs text-gray-500 mb-1">Branch</div>
                                <div className="text-sm font-medium text-[#1A1A1A]">{selectedUser.portal || 'N/A'}</div>
                            </div>
                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="text-xs text-gray-500 mb-1">Current Year</div>
                                <div className="text-sm font-medium text-[#1A1A1A]">{selectedUser.currentYear || 'N/A'}</div>
                            </div>
                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="text-xs text-gray-500 mb-1">Phone</div>
                                <div className="text-sm font-medium text-[#1A1A1A]">{selectedUser.phone || 'N/A'}</div>
                            </div>
                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="text-xs text-gray-500 mb-1">Total Registrations</div>
                                <div className="text-sm font-medium text-[#1A1A1A]">{selectedUser.registrationCount ?? 0}</div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Event Registrations</h4>
                            {selectedUser.registrations && selectedUser.registrations.length > 0 ? (
                                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                    {selectedUser.registrations.map((reg: any) => (
                                        <div key={reg.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-[#1A1A1A] truncate">{reg.eventTitle}</div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(reg.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    {reg.eventCategory && <span className="ml-2 text-gray-400">• {reg.eventCategory}</span>}
                                                </div>
                                            </div>
                                            <span className={`flex-shrink-0 ml-3 px-2 py-0.5 rounded-full text-xs font-medium
                                            ${reg.status === 'CONFIRMED' ? 'bg-green-50 text-green-700' :
                                                    reg.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                                                        reg.status === 'WAITLISTED' ? 'bg-blue-50 text-blue-700' :
                                                            'bg-red-50 text-red-700'}`}>
                                                {reg.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-sm text-gray-400 bg-gray-50 rounded-lg">
                                    No event registrations yet
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Student Modal */}
            <Modal
                isOpen={showStudentEditModal}
                onClose={() => setShowStudentEditModal(false)}
                title="Edit Student"
                confirmText="Save Changes"
                onConfirm={async () => {
                    // Validation
                    if (!studentEditFormData?.name?.trim() || !studentEditFormData?.email?.trim()) {
                        showToast('Name and email are required', 'error');
                        return;
                    }
                    if (!studentEditFormData.email.includes('@')) {
                        showToast('Please enter a valid email address', 'error');
                        return;
                    }

                    const result = await updateStudentUser(selectedUser.id, studentEditFormData);
                    if ('error' in result) {
                        showToast(result.error || 'Failed to update student', 'error');
                    } else {
                        showToast('Student details updated successfully', 'success');
                        setShowStudentEditModal(false);
                    }
                }}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={studentEditFormData.name}
                            onChange={(e) => setStudentEditFormData({ ...studentEditFormData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={studentEditFormData.email}
                            onChange={(e) => setStudentEditFormData({ ...studentEditFormData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                            <Select
                                value={studentEditFormData.branch}
                                onValueChange={(value) => setStudentEditFormData({ ...studentEditFormData, branch: value })}
                            >
                                <SelectTrigger className="w-full bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                                    <SelectValue placeholder="Select Branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CSE">CSE</SelectItem>
                                    <SelectItem value="ECE">ECE</SelectItem>
                                    <SelectItem value="EEE">EEE</SelectItem>
                                    <SelectItem value="MECH">MECH</SelectItem>
                                    <SelectItem value="CIVIL">CIVIL</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Year</label>
                            <Select
                                value={studentEditFormData.currentYear}
                                onValueChange={(value) => setStudentEditFormData({ ...studentEditFormData, currentYear: value })}
                            >
                                <SelectTrigger className="w-full bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1st Year">1st Year</SelectItem>
                                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                                    <SelectItem value="4th Year">4th Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            value={studentEditFormData.phone}
                            onChange={(e) => setStudentEditFormData({ ...studentEditFormData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                            placeholder="Enter phone number"
                        />
                    </div>
                </div>
            </Modal>

            {/* Assign Event Modal */}
            <Modal
                isOpen={showAssignEventModal}
                onClose={() => setShowAssignEventModal(false)}
                title={`Assign Event to ${selectedUser?.name || 'Student'}`}
                confirmText={assigningEvent ? 'Assigning...' : 'Assign Event'}
                onConfirm={async () => {
                    if (!selectedEventId) {
                        showToast('Please select an event', 'error');
                        return;
                    }
                    setAssigningEvent(true);
                    try {
                        const result = await assignEventToStudent(selectedUser.id, selectedEventId);
                        if ('error' in result) {
                            showToast(result.error || 'Failed to assign event', 'error');
                        } else {
                            const statusMsg = result.status === 'WAITLISTED'
                                ? `Student waitlisted for "${result.eventTitle}" (event at capacity)`
                                : `Student successfully registered for "${result.eventTitle}"`;
                            showToast(statusMsg, 'success');
                            setShowAssignEventModal(false);
                        }
                    } catch {
                        showToast('Failed to assign event', 'error');
                    } finally {
                        setAssigningEvent(false);
                    }
                }}
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Image src={selectedUser?.avatar || ''} alt={selectedUser?.name || ''} width={40} height={40} className="rounded-full object-cover" />
                        <div>
                            <div className="text-sm font-medium text-[#1A1A1A]">{selectedUser?.name}</div>
                            <div className="text-xs text-gray-500">{selectedUser?.email}</div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
                        {eventsLoading ? (
                            <div className="text-center py-4 text-sm text-gray-500">Loading events...</div>
                        ) : availableEvents.length === 0 ? (
                            <div className="text-center py-4 text-sm text-gray-400 bg-gray-50 rounded-lg">No open events available</div>
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {availableEvents.map((event: any) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        onClick={() => setSelectedEventId(event.id)}
                                        className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedEventId === event.id
                                            ? 'border-[#1A1A1A] bg-gray-50 ring-1 ring-[#1A1A1A]'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            } ${event.isFull ? 'opacity-60' : ''}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-[#1A1A1A] truncate">{event.title}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    {event.category && <span className="ml-2 text-gray-400">• {event.category}</span>}
                                                    {event.venue && <span className="ml-2 text-gray-400">• {event.venue}</span>}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 ml-3 text-right">
                                                <div className="text-xs text-gray-500">{event.registrationCount}/{event.maxCapacity}</div>
                                                {event.isFull && <span className="text-[10px] text-orange-600 font-medium">FULL</span>}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Reset Password Dialog */}
            <ConfirmDialog
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={async () => {
                    const tempPass = Math.random().toString(36).slice(-10);
                    const resetFn = selectedUser?.isStudent ? resetStudentPassword : resetAdminPassword;
                    const result = await resetFn(selectedUser.id, tempPass);
                    if ('error' in result) {
                        showToast(result.error || 'Failed to reset password', 'error');
                    } else {
                        showToast(`Password reset successfully. New password: ${tempPass}`, 'success');
                        setShowResetModal(false);
                    }
                }}
                title="Reset Password"
                message={`Are you sure you want to reset the password for ${selectedUser?.email}? A new temporary password will be generated.`}
                confirmLabel="Confirm Reset"
                variant="info"
            />

            {/* Delete User Dialog */}
            <ConfirmDialog
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={async () => {
                    const deleteFn = selectedUser?.isStudent ? deleteStudentUser : deleteAdminUser;
                    const result = await deleteFn(selectedUser.id);
                    if ('error' in result) {
                        showToast(result.error || 'Failed to delete user', 'error');
                    } else {
                        showToast(`${selectedUser?.name} has been deleted`, 'success');
                        setShowDeleteModal(false);
                    }
                }}
                title={selectedUser?.isStudent ? 'Delete Student' : 'Delete User'}
                message={`Are you sure you want to permanently delete ${selectedUser?.name}?${selectedUser?.isStudent ? ' All their event registrations will also be removed.' : ''} This action cannot be undone.`}
                confirmLabel={selectedUser?.isStudent ? 'Delete Student' : 'Delete User'}
                variant="danger"
            />
        </div>
    );
}
