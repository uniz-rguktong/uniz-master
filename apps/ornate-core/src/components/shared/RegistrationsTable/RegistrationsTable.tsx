'use client';

import { Mail, Download } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type {
    Registration,
    TeamRegistration,
    RegistrationsTableConfig,
    RegistrationStatus
} from './types';
import { usePathname, useSearchParams } from 'next/navigation';
import { RegistrationsPageHeader } from './components/RegistrationsPageHeader';
import { RegistrationsMetrics } from './components/RegistrationsMetrics';
import { RegistrationsFilters } from './components/RegistrationsFilters';
import { RegistrationsTableContent } from './components/RegistrationsTableContent';
import { TeamRegistrationsTableContent } from './components/TeamRegistrationsTableContent';
import { Modal } from '@/components/Modal';
import { exportRegistrationsToCSV } from '@/lib/exportUtils';
import { ADMIN_CONFIG, SPORTS_CONFIG, CLUBS_CONFIG, HHO_CONFIG } from './configs';
import { AddRegistrationModal } from '@/components/shared/AddRegistrationModal';

const CONFIG_MAP = {
    'admin': ADMIN_CONFIG,
    'sports': SPORTS_CONFIG,
    'clubs': CLUBS_CONFIG,
    'hho': HHO_CONFIG
};

interface RegistrationsTableProps {
    variant: keyof typeof CONFIG_MAP;
    hideSelection?: boolean;
    config?: Partial<RegistrationsTableConfig>;
    initialData?: {
        registrations: Registration[];
        teams?: TeamRegistration[];
        stats?: any;
        trends?: any;
        pagination?: any;
        events?: { id: string; title: string }[];
    };
    actions?: {
        fetchRegistrations: (params: any) => Promise<any>;
        deleteRegistration: (id: string) => Promise<any>;
        deleteTeam?: (id: string) => Promise<any>;
        announceWinners?: (eventId: string) => Promise<any>;
        assignWinnerPrize?: (params: {
            eventId: string;
            targetId: string;
            targetType: 'registration' | 'team';
            rank: 1 | 2 | 3;
        }) => Promise<any>;
    };
}

export default function RegistrationsTable({
    variant,
    hideSelection = false,
    config: configOverride,
    initialData,
    actions
}: RegistrationsTableProps) {
    const baseConfig = CONFIG_MAP[variant];
    const config = { ...baseConfig, ...configOverride };

    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    // Data States
    const [registrations, setRegistrations] = useState<Registration[]>(initialData?.registrations || []);
    const [teams, setTeams] = useState<TeamRegistration[]>(initialData?.teams || []);
    const [pagination, setPagination] = useState(initialData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    const [events] = useState(initialData?.events || []);
    const [stats, setStats] = useState(initialData?.stats || {
        totalOnlineRegistrations: 0,
        totalSpotRegistrations: 0,
        totalRevenue: 0,
        avgAttendanceRate: 0
    });

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const initialEventId = searchParams.get('eventId') || 'all';
    const isBranchAdmin = pathname.startsWith('/branch-admin');
    const hideExport = isBranchAdmin || variant === 'clubs';

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterEvent, setFilterEvent] = useState(initialEventId);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Debounce search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500); // 500ms delay
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Selection States
    const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

    // Modal States
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'reg' | 'team' } | null>(null);
    const [showPrizeModal, setShowPrizeModal] = useState(false);
    const [selectedPrizeRank, setSelectedPrizeRank] = useState<1 | 2 | 3>(1);
    const [winnerTarget, setWinnerTarget] = useState<{
        eventId: string;
        targetId: string;
        targetType: 'registration' | 'team';
        label: string;
    } | null>(null);

    // Fetch logic
    const loadData = useCallback(async () => {
        if (!actions?.fetchRegistrations) return;

        setIsLoading(true);
        try {
            const result = await actions.fetchRegistrations({
                page: currentPage,
                limit: 10,
                search: debouncedSearchQuery,
                status: filterStatus,
                eventId: filterEvent
            });

            if (result.success && result.data) {
                setRegistrations(result.data.registrations);
                if (result.data.teams) setTeams(result.data.teams);
                if (result.data.pagination) setPagination(result.data.pagination);
                if (result.data.stats) setStats(result.data.stats);
            }
        } catch (error) {
            console.error("Failed to load registrations", error);
            showToast("Failed to load data", "error");
        } finally {
            setIsLoading(false);
        }
    }, [actions, currentPage, debouncedSearchQuery, filterStatus, filterEvent, showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handlers
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIndicator = (field: string) => {
        if (sortField !== field) return ' ↕';
        return sortDirection === 'asc' ? ' ↑' : ' ↓';
    };

    const toggleSelectRegRow = (id: string) => {
        setSelectedRegIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAllRegs = () => {
        if (selectedRegIds.length === registrations.length) {
            setSelectedRegIds([]);
        } else {
            setSelectedRegIds(registrations.map(r => r.id));
        }
    };

    const handleReset = () => {
        setSearchQuery('');
        setFilterStatus('all');
        setFilterEvent('all');
        setCurrentPage(1);
        showToast("Filters reset", "success");
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;

        showToast(`Deleting ${itemToDelete.type === 'reg' ? 'registration' : 'team'}...`, "info");

        const action = itemToDelete.type === 'reg' ? actions?.deleteRegistration : actions?.deleteTeam;

        if (action) {
            const result = await action(itemToDelete.id);
            if (result.success) {
                showToast("Deleted successfully", "success");
                if (itemToDelete.type === 'reg') {
                    setRegistrations(prev => prev.filter(r => r.id !== itemToDelete.id));
                } else {
                    setTeams(prev => prev.filter(t => t.id !== itemToDelete.id));
                }
            } else {
                showToast(result.error || "Failed to delete", "error");
            }
        }

        setShowDeleteDialog(false);
        setItemToDelete(null);
    };

    return (
        <div className="p-4 md:p-8 animate-page-entrance">
            <RegistrationsPageHeader
                title={config.title}
                description={config.description}
                breadcrumbs={[
                    { label: 'Dashboard' },
                    { label: 'Registrations' },
                    { label: config.title, active: true }
                ]}
                onSendEmail={() => showToast("Communication module initialized", "info")}
                onExport={() => exportRegistrationsToCSV(registrations as any, `${variant}_registrations_export.csv`)}
                onAddRegistration={undefined}
                showExport={!hideExport}
            />

            {config.showMetrics && (
                <RegistrationsMetrics
                    isLoading={isLoading}
                    stats={stats}
                    trends={initialData?.trends}
                />
            )}

            <div className="flex md:hidden flex-row gap-3 w-full mb-6 mt-[-8px]">
                <button
                    onClick={() => showToast("Communication module initialized", "info")}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Send Email</span>
                </button>
                {!hideExport && (
                    <button
                        onClick={() => exportRegistrationsToCSV(registrations as any, `${variant}_registrations_export.csv`)}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors">
                        <Download className="w-4 h-4 shrink-0" />
                        <span className="whitespace-nowrap">Export Data</span>
                    </button>
                )}
            </div>

            <RegistrationsFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterEvent={filterEvent}
                setFilterEvent={setFilterEvent}
                events={events}
                onReset={handleReset}
            />

            <RegistrationsTableContent
                isLoading={isLoading}
                registrations={registrations}
                columns={config.columns}
                selectedIds={selectedRegIds}
                toggleSelectAll={toggleSelectAllRegs}
                toggleSelectRow={toggleSelectRegRow}
                sortField={sortField}
                sortDirection={sortDirection}
                handleSort={handleSort}
                getSortIndicator={getSortIndicator}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                pagination={pagination}
                itemsPerPage={10}
                onViewDetails={(reg) => { setSelectedItem(reg); setShowDetailsModal(true); }}
                onSendEmail={(reg) => showToast(`Email sent to ${reg.studentName}`, "success")}
                onDelete={(id) => { setItemToDelete({ id, type: 'reg' }); setShowDeleteDialog(true); }}
                {...(actions?.assignWinnerPrize
                    ? {
                        onAnnounceWinners: async (reg: any) => {
                            if (!reg.eventId) {
                                showToast('Event information is missing for this registration.', 'error');
                                return;
                            }
                            setWinnerTarget({
                                eventId: reg.eventId,
                                targetId: reg.id,
                                targetType: 'registration',
                                label: reg.studentName || 'Selected registration'
                            });
                            setSelectedPrizeRank(1);
                            setShowPrizeModal(true);
                        }
                    }
                    : {})}
                title="Individual Registrations"
                tooltipText="List of all individual students registered"
                showSelection={!(hideSelection || variant === 'hho')}
            />

            {config.teamSupport && config.teamColumns && (
                <TeamRegistrationsTableContent
                    isLoading={isLoading}
                    teams={teams}
                    columns={config.teamColumns}
                    selectedIds={selectedTeamIds}
                    toggleSelectAll={() => setSelectedTeamIds(selectedTeamIds.length === teams.length ? [] : teams.map(t => t.id))}
                    toggleSelectRow={(id) => setSelectedTeamIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                    onViewDetails={(team) => { setSelectedItem(team); setShowDetailsModal(true); }}
                    onSendEmail={(team) => showToast(`Email sent to team leader of ${team.teamName}`, "success")}
                    onDelete={(id) => { setItemToDelete({ id, type: 'team' }); setShowDeleteDialog(true); }}
                    {...(actions?.assignWinnerPrize
                        ? {
                            onAnnounceWinners: async (team: any) => {
                                if (!team.eventId) {
                                    showToast('Event information is missing for this team.', 'error');
                                    return;
                                }
                                setWinnerTarget({
                                    eventId: team.eventId,
                                    targetId: team.id,
                                    targetType: 'team',
                                    label: team.teamName || 'Selected team'
                                });
                                setSelectedPrizeRank(1);
                                setShowPrizeModal(true);
                            }
                        }
                        : {})}
                    title="Team Registrations"
                    tooltipText="List of all teams registered for events"
                    showSelection={!(hideSelection || variant === 'hho')}
                />
            )}

            <Modal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                title={selectedItem?.teamName ? 'Team Registration Details' : 'Registration Details'}
                onConfirm={() => setShowDetailsModal(false)}
                confirmText="Close"
                tooltipText="Detailed view of the selected record."
                footer={null}
            >
                {selectedItem && (() => {
                    const isTeam = !!(selectedItem.teamName);
                    return (
                        <div className="space-y-5 text-sm">
                            {/* ---------- TEAM REGISTRATION ---------- */}
                            {isTeam ? (
                                <>
                                    {/* Team Info Header */}
                                    <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                                        <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {(selectedItem.teamName || 'T').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1A1A1A] text-base">{selectedItem.teamName}</p>
                                            <p className="text-xs text-[#6B7280]">{selectedItem.event || ''} • {selectedItem.eventType || ''}</p>
                                        </div>
                                        <span className={`ml-auto text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${selectedItem.status === 'confirmed' || selectedItem.status === 'attended'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : selectedItem.status === 'pending'
                                                    ? 'bg-amber-50 text-amber-600'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>{selectedItem.status}</span>
                                    </div>

                                    {/* Leader Info */}
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Team Leader</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                                                <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase mb-0.5">Name</p>
                                                <p className="text-sm font-semibold text-[#1A1A1A]">{selectedItem.leaderName || '—'}</p>
                                            </div>
                                            <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                                                <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase mb-0.5">Email</p>
                                                <p className="text-sm font-semibold text-[#1A1A1A] truncate">{selectedItem.leaderEmail || '—'}</p>
                                            </div>
                                            {selectedItem.leaderPhone && selectedItem.leaderPhone !== 'N/A' && (
                                                <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                                                    <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase mb-0.5">Phone</p>
                                                    <p className="text-sm font-semibold text-[#1A1A1A]">{selectedItem.leaderPhone}</p>
                                                </div>
                                            )}
                                            <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                                                <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase mb-0.5">Payment</p>
                                                <p className="text-sm font-semibold text-[#1A1A1A]">₹{selectedItem.paymentAmount ?? 0} • {(selectedItem.paymentStatus || 'paid').toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Members */}
                                    {Array.isArray(selectedItem.members) && selectedItem.members.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                                                Team Members ({selectedItem.members.length})
                                            </p>
                                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                                {selectedItem.members.map((member: any, idx: number) => (
                                                    <div key={member.id || idx} className="p-3 rounded-xl border border-[#E5E7EB] bg-white">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="font-bold text-[#1A1A1A] text-sm">{member.name || `Member ${idx + 1}`}</p>
                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${member.role === 'Captain' || member.role === 'LEADER'
                                                                    ? 'bg-[#1A1A1A] text-white'
                                                                    : member.role === 'Vice Captain' || member.role === 'VICE_CAPTAIN'
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : 'bg-[#F3F4F6] text-[#6B7280]'
                                                                }`}>{member.role || 'Member'}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#4B5563]">
                                                            {(member.rollNumber || member.studentId) && (
                                                                <span><span className="text-[#9CA3AF]">Roll:</span> {member.rollNumber || member.studentId}</span>
                                                            )}
                                                            {member.year && member.year !== 'N/A' && (
                                                                <span><span className="text-[#9CA3AF]">Year:</span> {member.year}</span>
                                                            )}
                                                            {(member.department || member.section) && member.department !== 'N/A' && (
                                                                <span><span className="text-[#9CA3AF]">Dept:</span> {member.department || member.section}</span>
                                                            )}
                                                            {member.phone && member.phone !== 'N/A' && (
                                                                <span><span className="text-[#9CA3AF]">Phone:</span> {member.phone || member.phoneNumber}</span>
                                                            )}
                                                            {member.phoneNumber && member.phoneNumber !== 'N/A' && !member.phone && (
                                                                <span><span className="text-[#9CA3AF]">Phone:</span> {member.phoneNumber}</span>
                                                            )}
                                                            {member.email && !member.email.includes('@spot.local') && (
                                                                <span className="col-span-2 truncate"><span className="text-[#9CA3AF]">Email:</span> {member.email}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Registration Meta */}
                                    <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-xs text-[#9CA3AF]">
                                        <span>Registered: {selectedItem.registrationDate ? new Date(selectedItem.registrationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                                        {selectedItem.teamCode && <span className="font-mono bg-[#F3F4F6] px-2 py-0.5 rounded text-[#6B7280]">{selectedItem.teamCode}</span>}
                                    </div>
                                </>
                            ) : (
                                /* ---------- INDIVIDUAL REGISTRATION ---------- */
                                <>
                                    <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                                        <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {(selectedItem.studentName || 'S').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[#1A1A1A] text-base">{selectedItem.studentName}</p>
                                            <p className="text-xs text-[#6B7280]">{selectedItem.rollNumber} • {selectedItem.year}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${selectedItem.status === 'confirmed' || selectedItem.status === 'attended'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : selectedItem.status === 'pending'
                                                    ? 'bg-amber-50 text-amber-600'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>{selectedItem.status}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Event', value: selectedItem.eventName },
                                            { label: 'Department', value: selectedItem.department || selectedItem.branch },
                                            { label: 'Email', value: selectedItem.email },
                                            { label: 'Phone', value: selectedItem.phone },
                                            { label: 'Payment', value: selectedItem.paymentAmount != null ? `₹${selectedItem.paymentAmount}` : null },
                                            { label: 'Payment Status', value: selectedItem.paymentStatus ? selectedItem.paymentStatus.toUpperCase() : null },
                                            { label: 'Transaction ID', value: selectedItem.transactionId },
                                            { label: 'Registration Date', value: selectedItem.registrationDate ? new Date(selectedItem.registrationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null },
                                        ].filter(f => f.value && f.value !== 'N/A' && f.value !== 'undefined').map(({ label, value }) => (
                                            <div key={label} className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                                                <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase mb-0.5">{label}</p>
                                                <p className="text-sm font-semibold text-[#1A1A1A] truncate">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })()}
            </Modal>

            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteDialog(false)}
                title="Delete Record"
                message="Are you sure you want to delete this record? This action cannot be undone."
                variant="danger"
                tooltipText="Confirm record deletion."
                type="danger"
            />

            <Modal
                isOpen={showPrizeModal}
                onClose={() => {
                    setShowPrizeModal(false);
                    setWinnerTarget(null);
                }}
                title="Announce Winners"
                confirmText="OK"
                onConfirm={async () => {
                    if (!winnerTarget || !actions?.assignWinnerPrize) return;

                    const result = await actions.assignWinnerPrize({
                        eventId: winnerTarget.eventId,
                        targetId: winnerTarget.targetId,
                        targetType: winnerTarget.targetType,
                        rank: selectedPrizeRank
                    });

                    if (result?.success) {
                        showToast(result.message || 'Prize assigned and winners updated.', 'success');
                        setShowPrizeModal(false);
                        setWinnerTarget(null);
                        loadData();
                    } else {
                        showToast(result?.error || 'Failed to assign prize.', 'error');
                    }
                }}
                confirmButtonClass="bg-[#10B981] hover:bg-[#059669]"
            >
                <div className="space-y-4">
                    <p className="text-sm text-[#6B7280]">
                        Assign winner prize for <span className="font-semibold text-[#1A1A1A]">{winnerTarget?.label}</span>
                    </p>

                    <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F9FAFB]">
                            <input
                                type="radio"
                                name="winnerPrizeRank"
                                checked={selectedPrizeRank === 1}
                                onChange={() => setSelectedPrizeRank(1)}
                                className="w-4 h-4"
                            />
                            <span className="text-sm font-medium text-[#1A1A1A]">1st Prize</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F9FAFB]">
                            <input
                                type="radio"
                                name="winnerPrizeRank"
                                checked={selectedPrizeRank === 2}
                                onChange={() => setSelectedPrizeRank(2)}
                                className="w-4 h-4"
                            />
                            <span className="text-sm font-medium text-[#1A1A1A]">2nd Prize</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F9FAFB]">
                            <input
                                type="radio"
                                name="winnerPrizeRank"
                                checked={selectedPrizeRank === 3}
                                onChange={() => setSelectedPrizeRank(3)}
                                className="w-4 h-4"
                            />
                            <span className="text-sm font-medium text-[#1A1A1A]">3rd Prize</span>
                        </label>
                    </div>
                </div>
            </Modal>

            <AddRegistrationModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    loadData();
                    // If table doesn't have its own load teams, we might need one.
                    // But usually loadData handles registrations.
                }}
            />
        </div>
    );
}
