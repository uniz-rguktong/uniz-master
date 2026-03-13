'use client';
import { useState, useEffect } from 'react';

import { Shield, Users, Plus, Search, Edit, Trash2, Key, Lock, ChevronRight, UserPlus, Fingerprint, ShieldAlert, CheckCircle2, XCircle, MoreVertical, LayoutGrid, List } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import { MetricCard } from '@/components/MetricCard';

const roles = [
    {
        id: 1,
        name: 'HHO Admin',
        description: 'Full administrative access to all HHO modules, finances, and volunteer oversight.',
        users: 2,
        color: '#6366F1',
        accent: 'bg-indigo-50 border-indigo-100 text-indigo-600',
        permissions: {
            drives: { view: true, create: true, edit: true, delete: true },
            volunteers: { view: true, create: true, edit: true, delete: true },
            donations: { view: true, create: true, edit: true, delete: true },
            analytics: { view: true, create: true, edit: true, delete: true },
            settings: { view: true, create: true, edit: true, delete: true }
        }
    },
    {
        id: 2,
        name: 'Event Coordinator',
        description: 'Operational management of charity drives, volunteer assignments, and on-ground activities.',
        users: 5,
        color: '#10B981',
        accent: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        permissions: {
            drives: { view: true, create: true, edit: true, delete: false },
            volunteers: { view: true, create: true, edit: true, delete: false },
            donations: { view: true, create: false, edit: false, delete: false },
            analytics: { view: true, create: true, edit: true, delete: false },
            settings: { view: true, create: false, edit: false, delete: false }
        }
    },
    {
        id: 3,
        name: 'Volunteer Lead',
        description: 'Limited access to volunteer team management and attendance tracking for specific drives.',
        users: 12,
        color: '#F59E0B',
        accent: 'bg-amber-50 border-amber-100 text-amber-600',
        permissions: {
            drives: { view: true, create: false, edit: false, delete: false },
            volunteers: { view: true, create: true, edit: true, delete: false },
            donations: { view: false, create: false, edit: false, delete: false },
            analytics: { view: true, create: false, edit: false, delete: false },
            settings: { view: false, create: false, edit: false, delete: false }
        }
    }
];

interface AccessControlPageProps {
    initialUsers?: Array<Record<string, any>>;
    initialLogs?: Array<Record<string, any>>;
}

export function AccessControlPage({ initialUsers = [], initialLogs = [] }: AccessControlPageProps) {
    const [activeTab, setActiveTab] = useState('roles');
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [usersList, setUsersList] = useState(initialUsers);
    const [logsList, setLogsList] = useState(initialLogs);

    useEffect(() => {
        setIsLoading(false);
        if (initialUsers.length > 0) setUsersList(initialUsers);
        if (initialLogs.length > 0) setLogsList(initialLogs);
    }, [initialUsers, initialLogs]);

    const { toast, showToast, hideToast } = useToast();


    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-page-entrance">

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
                    <span>Dashboard</span>
                    <ChevronRight className="w-3 h-3" />
                    <span>Settings</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#1A1A1A] font-medium">Access Control</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Access Control</h1>
                        <p className="text-sm text-[#6B7280]">Manage HHO organizational roles and granular permission matrices</p>
                    </div>

                    <button
                        onClick={() => {
                            const label = activeTab === 'roles' ? 'Role definition modal opened' :
                                activeTab === 'users' ? 'User enrollment modal opened' :
                                    'Audit logs exported successfully';
                            showToast(label, activeTab === 'logs' ? 'success' : 'info');
                        }}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#10B981] text-white rounded-xl text-sm font-medium hover:bg-[#059669] transition-all shadow-sm active:scale-95 group">
                        {activeTab === 'roles' ? (
                            <>
                                <ShieldAlert className="w-4 h-4" />
                                Define Role
                            </>
                        ) : activeTab === 'users' ? (
                            <>
                                <UserPlus className="w-4 h-4" />
                                Enroll User
                            </>
                        ) : (
                            <>
                                <Shield className="w-4 h-4" />
                                Export Logs
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats Cluster */}
            <div className="mb-8">
                {/* Header Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-[12px] mt-[10px] mb-[16px]">
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border bg-indigo-50 text-indigo-600 border-indigo-100">
                            Security Overview
                        </div>
                        <p className="text-sm text-[#6B7280] hidden md:block">Key security metrics for HHO</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: Users, label: 'Total Entities', value: '19', bColor: '#EEF2FF', tColor: '#4F46E5', sub: 'Verified members' },
                        { icon: Shield, label: 'Admin Roles', value: '3', bColor: '#ECFDF5', tColor: '#10B981', sub: 'Defined access levels' },
                        { icon: Fingerprint, label: 'Active Sessions', value: '7', bColor: '#FFFBEB', tColor: '#F59E0B', sub: 'Encrypted connections' },
                        { icon: Lock, label: 'Gatekeepers', value: '0', bColor: '#FFF1F2', tColor: '#E11D48', sub: 'Locked accounts' }
                    ].map((stat: any, i: any) => (
                        <MetricCard
                            key={i}
                            title={stat.label}
                            value={stat.value}
                            icon={stat.icon}
                            iconBgColor={stat.bColor}
                            iconColor={stat.tColor}
                            subtitle={stat.sub}
                            delay={i * 40}
                        />
                    ))}
                </div>
            </div>

            {/* Main Control Panel */}
            <div className="bg-[#F4F2F0] rounded-[18px] pt-2 pr-2 pb-6 pl-2">
                <div className="bg-white rounded-[14px] overflow-hidden shadow-sm border border-[#F3F4F6]">
                    {/* Internal Navigation */}
                    <div className="px-8 pt-8 border-b border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 overflow-hidden">
                                <button
                                    onClick={() => setActiveTab('roles')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'roles' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-[#6B7280] hover:bg-gray-200/50'
                                        }`}
                                >
                                    Roles & Permissions
                                </button>
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-[#6B7280] hover:bg-gray-200/50'
                                        }`}
                                >
                                    System Users
                                </button>
                                <button
                                    onClick={() => setActiveTab('logs')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'logs' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-[#6B7280] hover:bg-gray-200/50'
                                        }`}
                                >
                                    Audit Logs
                                </button>
                            </div>

                            {activeTab !== 'roles' && (
                                <div className="relative min-w-[300px]">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                                    <input
                                        type="text"
                                        placeholder="Search logs or users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm font-medium text-[#1A1A1A] focus:bg-white focus:ring-2 focus:ring-[#10B981] outline-none transition-all"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8">
                        {isLoading ? (
                            <div className="space-y-8">
                                {[...Array(2)].map((_: any, i: any) => (
                                    <div key={i} className="space-y-4">
                                        <Skeleton width="40%" height={24} />
                                        <Skeleton width="100%" height={300} borderRadius={24} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            activeTab === 'roles' ? (
                                <div className="grid grid-cols-1 gap-8">
                                    {roles.map((role: any, idx: any) => (
                                        <div key={role.id} className="bg-[#F4F2F0] rounded-[18px] pt-2 pr-2 pb-6 pl-2 animate-card-entrance" style={{ animationDelay: `${idx * 80}ms` }}>
                                            {/* Header Bar */}
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-[12px] mt-[10px] mb-[16px]">
                                                <div className="flex items-center gap-4">
                                                    <div className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${role.accent}`}>
                                                        {role.name}
                                                    </div>
                                                    <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-xs font-semibold text-[#6B7280]">
                                                        {role.users} Members
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[#6B7280] hidden md:block max-w-sm truncate">{role.description}</p>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => showToast(`Modify role: ${role.name}`, 'info')}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-all shadow-sm">
                                                        <Edit className="w-3 h-3" />
                                                        Modify
                                                    </button>
                                                    {role.id !== 1 && (
                                                        <button
                                                            onClick={() => showToast('Role deleted', 'error')}
                                                            className="p-1.5 bg-white border border-rose-100 text-rose-500 rounded-lg hover:bg-rose-50 transition-all shadow-sm">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* White Inner Card */}
                                            <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden shadow-sm">
                                                <table className="w-full text-left">
                                                    <thead className="bg-white border-b border-[#F3F4F6]">
                                                        <tr>
                                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Control Module</th>
                                                            {['VIEW', 'CREATE', 'EDIT', 'DELETE'].map(action => (
                                                                <th key={action} className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{action}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(role.permissions).map(([module, perms]: [string, any], idx, arr) => (
                                                            <tr key={module} className={`border-b border-[#F3F4F6] row-hover-effect hover:bg-[#FAFAFA] transition-colors ${idx === arr.length - 1 ? 'border-b-0' : ''}`}>
                                                                <td className="px-6 py-4">
                                                                    <div className="text-sm font-medium text-[#1A1A1A] capitalize">
                                                                        {module} Management
                                                                    </div>
                                                                </td>
                                                                {[perms.view, perms.create, perms.edit, perms.delete].map((allowed: any, i: number) => (
                                                                    <td key={i} className="px-6 py-4">
                                                                        <div className="flex justify-center">
                                                                            {allowed ? (
                                                                                <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center ${role.accent} bg-opacity-50`}>
                                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                                </div>
                                                                            ) : (
                                                                                <div className="w-8 h-8 rounded-[10px] bg-gray-50 flex items-center justify-center text-gray-300">
                                                                                    <XCircle className="w-4 h-4" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activeTab === 'users' ? (
                                <div className="bg-[#F4F2F0] rounded-[18px] pt-2 pr-2 pb-6 pl-2">
                                    <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden shadow-sm">
                                        <table className="w-full">
                                            <thead className="bg-white border-b border-[#F3F4F6]">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Identification</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Access Tier</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Telemetry</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Controls</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usersList.filter(u =>
                                                    (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                                                    (u.role?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                                                ).map((user, idx, arr) => (
                                                    <tr key={user.id} className={`border-b border-[#F3F4F6] row-hover-effect hover:bg-[#FAFAFA] transition-all animate-card-entrance ${idx === arr.length - 1 ? 'border-b-0' : ''}`} style={{ animationDelay: `${idx * 40}ms` }}>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-9 h-9 ${user.color} rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md shadow-black/5`}>
                                                                    {user.initial}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-[#1A1A1A]">{user.name}</div>
                                                                    <div className="text-xs text-[#6B7280] mt-0.5">{user.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                                                <span className={`text-xs font-medium uppercase tracking-wide ${user.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                                    {user.status}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm text-[#6B7280]">{user.lastActive}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-emerald-600 transition-all hover:border-emerald-100 hover:bg-emerald-50">
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-rose-500 transition-all hover:border-rose-100 hover:bg-rose-50">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#F4F2F0] rounded-[18px] pt-2 pr-2 pb-6 pl-2">
                                    <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden shadow-sm">
                                        <table className="w-full">
                                            <thead className="bg-white border-b border-[#F3F4F6]">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Initiator</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Security Action</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Target Entity</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">IP Address</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {logsList.filter(log =>
                                                    (log.user?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                                                    (log.action?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                                                    (log.target?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                                                ).map((log, idx, arr) => (
                                                    <tr key={log.id} className={`border-b border-[#F3F4F6] row-hover-effect hover:bg-[#FAFAFA] transition-all animate-card-entrance ${idx === arr.length - 1 ? 'border-b-0' : ''}`} style={{ animationDelay: `${idx * 40}ms` }}>
                                                        <td className="px-6 py-4 text-sm font-medium text-[#1A1A1A]">{log.user}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 border border-amber-100 rounded text-xs font-semibold text-amber-600 uppercase tracking-widest">
                                                                {log.action}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-[#6B7280]">{log.target}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-[#1A1A1A]">
                                                                {new Date(log.timestamp).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-xs text-[#9CA3AF]">
                                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono text-xs text-[#6B7280]">
                                                            {log.ip}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
