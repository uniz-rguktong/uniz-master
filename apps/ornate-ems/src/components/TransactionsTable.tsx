"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, Search, Mail, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionMenu } from "@/components/ActionMenu";
import { Checkbox } from "@/components/Checkbox";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Modal } from "@/components/Modal";
import { useToast } from "@/hooks/useToast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  deleteRegistration,
  updateRegistration,
  createRegistration,
  logExportAction,
} from "@/actions/registrationActions";
import { exportRegistrationsToCSV } from "@/lib/exportUtils";

export function TransactionsTable({
  transactions = [],
  events = [],
  branches = [],
  onDataChange,
  allowEdit = true,
  userType = "coordinator", // 'admin' or 'coordinator'
}: {
  transactions?: any[] | undefined;
  events?: any[] | undefined;
  branches?: string[] | undefined;
  onDataChange?: () => void;
  allowEdit?: boolean;
  userType?: string;
} = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<any[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [addFormData, setAddFormData] = useState<any>({
    studentName: "",
    studentId: "",
    eventId: "",
    amount: "0",
    branch: "",
  });

  useEffect(() => {
    if (events && events.length > 0 && !addFormData.eventId) {
      setAddFormData((prev: any) => ({ ...prev, eventId: events[0].id }));
    }
    if (branches && branches.length > 0 && !addFormData.branch) {
      setAddFormData((prev: any) => ({ ...prev, branch: branches[0] }));
    }
  }, [events, branches]);

  const [editFormData, setEditFormData] = useState<any>({
    studentName: "",
    contact: "",
    eventId: "",
    branch: "",
  });

  // Handlers
  const handleAdd = async () => {
    if (
      !addFormData.studentName ||
      !addFormData.studentId ||
      !addFormData.eventId
    ) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    const response = await createRegistration({
      ...addFormData,
      amount: parseFloat(addFormData.amount),
    });

    if (response.success) {
      showToast("Registration added successfully", "success");
      setShowAddModal(false);
      setAddFormData({
        studentName: "",
        studentId: "",
        eventId: events[0]?.id || "",
        amount: "0",
        branch: branches[0] || "",
      });
      if (onDataChange) onDataChange();
      router.refresh();
    } else {
      showToast(response.error || "Failed to add registration", "error");
    }
  };

  const handleEdit = async () => {
    if (!selectedRegistration || !editFormData.studentName) return;

    const response = await updateRegistration(selectedRegistration.id, {
      studentName: editFormData.studentName,
      eventId: editFormData.eventId,
      contact: editFormData.contact,
    });

    if (response.success) {
      showToast("Registration updated successfully", "success");
      setShowEditModal(false);
      if (onDataChange) onDataChange();
      router.refresh();
    } else {
      showToast(response.error || "Failed to update registration", "error");
    }
  };

  const handleDelete = async () => {
    if (!selectedRegistration) return;

    const response = await deleteRegistration(selectedRegistration.id);

    if (response.success) {
      showToast("Registration deleted successfully", "success");
      setShowDeleteConfirm(false);
      if (onDataChange) onDataChange();
      router.refresh();
    } else {
      showToast(response.error || "Failed to delete registration", "error");
    }
  };

  const handleExport = async (format: string) => {
    const dataToExport =
      selectedIds.length > 0
        ? transactions.filter((r) => selectedIds.includes(r.id))
        : transactions;

    if (dataToExport.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    exportRegistrationsToCSV(
      dataToExport,
      `registrations_export_${new Date().toISOString().split("T")[0]}.csv`,
    );

    await logExportAction({
      count: dataToExport.length,
      format: format,
      type: selectedIds.length > 0 ? "selected" : "all",
    });

    setShowExportModal(false);
    showToast("Export started", "success");
  };

  const openEditModal = (reg: any) => {
    setSelectedRegistration(reg);
    const eventId =
      reg.eventId || events.find((e) => e.title === reg.eventName)?.id || "";

    setEditFormData({
      studentName: reg.studentName,
      contact: reg.contact !== "N/A" ? reg.contact : "",
      eventId: eventId,
      branch: reg.branch,
    });
    setShowEditModal(true);
  };

  // Map fetched data to table structure
  const mappedRegistrations = transactions.map((reg) => {
    // Format displayId: EVENT-ID_PART (e.g., CRI-X0Y1)
    const eventPart = (reg.eventName || "EVT").substring(0, 3).toUpperCase();
    const idPart = (reg.registrationId || reg.id || "").slice(-4).toUpperCase();
    const displayId = `${eventPart}-${idPart}`;

    return {
      id: reg.id,
      displayId: displayId,
      studentName: reg.studentName || "Unknown",
      eventName: reg.eventName || "Unknown Event",
      status:
        reg.status === "CONFIRMED" ||
        reg.status === "confirmed" ||
        reg.status === "Success"
          ? "Success"
          : reg.status === "ATTENDED" || reg.status === "attended"
            ? "Attended"
            : reg.status === "PENDING" || reg.status === "pending"
              ? "Pending"
              : reg.status === "CANCELLED" || reg.status === "cancelled"
                ? "Cancelled"
                : reg.status,
      registrationDate: reg.registrationDate,
      branch: reg.department || "N/A",
      contact: reg.phone || "N/A",
      paymentAmount: reg.paymentAmount ? `₹${reg.paymentAmount}` : "Free",
      eventId: reg.eventId,
    };
  });

  const filteredRegistrations = mappedRegistrations.filter(
    (reg) =>
      reg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.id && reg.id.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRegistrations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRegistrations.map((r: any) => r.id));
    }
  };

  const toggleSelectRow = (id: any) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i: any) => i !== id) : [...prev, id],
    );
  };

  // Pagination
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRegistrations = filteredRegistrations.slice(
    startIndex,
    endIndex,
  );

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleItemsPerPageChange = (value: string) => {
    const numValue = parseInt(value.split(" ")[0] || "0");
    setItemsPerPage(numValue);
    setCurrentPage(1);
  };

  return (
    <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-[12px] mt-[10px] mb-[16px]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#7A7772] uppercase tracking-widest opacity-70">
            Recent Registrations
          </h3>
          <InfoTooltip text="Latest student registrations across all events." />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <div className="relative flex-1 sm:flex-initial hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-sm w-full sm:w-[180px] focus:outline-none"
            />
          </div>

          {selectedIds.length > 0 && (
            <>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-sm font-medium text-[#1A1A1A] hover:bg-[#F9FAFB] shrink-0"
              >
                <Download className="w-4 h-4" />
                <span className="hidden lg:inline">Export</span>
              </button>

              <button
                onClick={() => setShowNotifyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-100 shrink-0"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden lg:inline">Send Email</span>
              </button>
            </>
          )}

          {allowEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] text-white rounded-md text-sm font-medium hover:bg-[#2D2D2D] shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* White Inner Card */}
      <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-[#F3F4F6]">
              <tr>
                <th className="px-6 py-4 text-left">
                  <Checkbox
                    size="sm"
                    checked={
                      filteredRegistrations.length > 0 &&
                      selectedIds.length === filteredRegistrations.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  ID ↑
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Student Name ↑
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Event Name ↑
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Status ↑
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Registration Date ↑
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Payment Amount ↑
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRegistrations.length > 0 ? (
                paginatedRegistrations.map((registration: any, index: any) => (
                  <tr
                    key={registration.id}
                    className={`border-b border-[#F3F4F6] row-hover-effect hover:bg-[#FAFAFA] animate-row-entrance ${index === paginatedRegistrations.length - 1 ? "border-b-0" : ""}`}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <td className="px-6 py-4">
                      <Checkbox
                        size="sm"
                        checked={selectedIds.includes(registration.id)}
                        onChange={() => toggleSelectRow(registration.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#6B7280]">
                        {registration.displayId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[#1A1A1A]">
                        {registration.studentName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#6B7280]">
                        {registration.eventName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const status = registration.status;
                        const isSuccess =
                          status === "Success" ||
                          status === "Attended" ||
                          status === "CONFIRMED" ||
                          status === "ATTENDED";
                        const isPending =
                          status === "Pending" || status === "PENDING";
                        const isRefunded =
                          status === "Refunded" || status === "REFUNDED";

                        const colorClasses = isSuccess
                          ? "bg-[#ECFDF5] text-[#10B981]"
                          : isPending
                            ? "bg-[#FEF3C7] text-[#F59E0B]"
                            : isRefunded
                              ? "bg-[#DBEAFE] text-[#3B82F6]"
                              : "bg-[#FEE2E2] text-[#EF4444]";

                        const dotClasses = isSuccess
                          ? "bg-[#10B981]"
                          : isPending
                            ? "bg-[#F59E0B]"
                            : isRefunded
                              ? "bg-[#3B82F6]"
                              : "bg-[#EF4444]";

                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colorClasses}`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${dotClasses}`}
                            ></div>
                            {status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#1A1A1A]">
                        {new Date(
                          registration.registrationDate,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#1A1A1A]">
                        {registration.branch}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#6B7280]">
                        {registration.contact}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-[#1A1A1A]">
                        {registration.paymentAmount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <ActionMenu
                          actions={
                            [
                              {
                                label: "View Details",
                                icon: "view" as const,
                                onClick: () => {
                                  setSelectedRegistration(registration);
                                  setShowViewModal(true);
                                },
                              },
                              ...(allowEdit
                                ? [
                                    {
                                      label: "Edit Registration",
                                      icon: "edit" as const,
                                      onClick: () =>
                                        openEditModal(registration),
                                    },
                                  ]
                                : []),
                              { divider: true, label: "", onClick: () => {} },
                              {
                                label: "Delete",
                                icon: "delete" as const,
                                onClick: () => {
                                  setSelectedRegistration(registration);
                                  setShowDeleteConfirm(true);
                                },
                                danger: true,
                              },
                            ] as any[]
                          }
                          size="sm"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredRegistrations.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[#F3F4F6]">
            <div className="text-sm text-[#6B7280] text-center sm:text-left">
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredRegistrations.length)} of{" "}
              {filteredRegistrations.length} registrations
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Select
                value={`${itemsPerPage} per page`}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-[130px] px-3 py-1.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A] focus:ring-0">
                  <SelectValue placeholder="10 per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10 per page">10 per page</SelectItem>
                  <SelectItem value="25 per page">25 per page</SelectItem>
                  <SelectItem value="50 per page">50 per page</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-sm font-medium transition-colors ${currentPage === 1 ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed" : "bg-[#F7F8FA] hover:bg-[#F3F4F6] text-[#1A1A1A]"}`}
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 3) pageNum = i + 1;
                  else if (currentPage <= 2) pageNum = i + 1;
                  else if (currentPage >= totalPages - 1)
                    pageNum = totalPages - 2 + i;
                  else pageNum = currentPage - 1 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? "bg-[#1A1A1A] text-white" : "bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#1A1A1A]"}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages || totalPages === 0 ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed" : "bg-[#F7F8FA] hover:bg-[#F3F4F6] text-[#1A1A1A]"}`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Registrations"
        onConfirm={() => handleExport("csv")}
        confirmText="Export Data"
        tooltipText="Export the selected registration data to CSV or Excel format."
      >
        <div className="space-y-4">
          <p className="text-sm text-[#6B7280]">
            You have selected{" "}
            {selectedIds.length > 0 ? selectedIds.length : "all available"}{" "}
            registrations to export.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => handleExport("csv")}
              className="p-4 border border-[#E5E7EB] rounded-xl hover:border-[#1A1A1A] cursor-pointer transition-colors"
            >
              <div className="font-semibold text-[#1A1A1A] mb-1">
                CSV Format
              </div>
              <div className="text-xs text-[#6B7280]">
                Best for data analysis
              </div>
            </div>
            <div
              onClick={() => handleExport("excel")}
              className="p-4 border border-[#E5E7EB] rounded-xl hover:border-[#1A1A1A] cursor-pointer transition-colors"
            >
              <div className="font-semibold text-[#1A1A1A] mb-1">
                Excel Format
              </div>
              <div className="text-xs text-[#6B7280]">
                Best for spreadsheet usage
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showNotifyModal}
        onClose={() => setShowNotifyModal(false)}
        title="Notify Students"
        onConfirm={() => {
          setShowNotifyModal(false);
        }}
        confirmText="Send Notifications"
        tooltipText="Send a bulk notification or email to the selected students."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Message Subject
            </label>
            <input
              type="text"
              placeholder="e.g., Event Update"
              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Message Body
            </label>
            <textarea
              rows={4}
              placeholder="Type your message here..."
              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Registration"
        onConfirm={handleAdd}
        confirmText="Add Registration"
        tooltipText="Manually add a student registration for an event."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Student Name
              </label>
              <input
                type="text"
                value={addFormData.studentName}
                onChange={(e) =>
                  setAddFormData({
                    ...addFormData,
                    studentName: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Student ID
              </label>
              <input
                type="text"
                value={addFormData.studentId}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, studentId: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Select Event
            </label>
            <Select
              value={addFormData.eventId}
              onValueChange={(val) =>
                setAddFormData({ ...addFormData, eventId: val })
              }
            >
              <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                <SelectValue placeholder="Select Event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
                {events.length === 0 && (
                  <SelectItem value="none" disabled>
                    No events found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                value={addFormData.amount}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, amount: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Branch
              </label>
              <Select
                value={addFormData.branch}
                onValueChange={(val) =>
                  setAddFormData({ ...addFormData, branch: val })
                }
              >
                <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                  {branches.length === 0 && (
                    <SelectItem value="N/A" disabled>
                      No branches found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Registration Details"
        tooltipText="View full registration information."
      >
        {selectedRegistration && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">
                  Registration ID
                </label>
                <div className="text-sm font-medium text-[#1A1A1A]">
                  {selectedRegistration.id}
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">
                  Status
                </label>
                <div className="text-sm font-medium text-[#1A1A1A]">
                  {selectedRegistration.status}
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">
                  Student Name
                </label>
                <div className="text-sm font-medium text-[#1A1A1A]">
                  {selectedRegistration.studentName}
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">
                  Event Name
                </label>
                <div className="text-sm font-medium text-[#1A1A1A]">
                  {selectedRegistration.eventName}
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">
                  Branch
                </label>
                <div className="text-sm font-medium text-[#1A1A1A]">
                  {selectedRegistration.branch}
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">
                  Contact
                </label>
                <div className="text-sm font-medium text-[#1A1A1A]">
                  {selectedRegistration.contact}
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">
                  Payment
                </label>
                <div className="text-sm font-medium text-[#1A1A1A]">
                  {selectedRegistration.paymentAmount}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Registration"
        onConfirm={handleEdit}
        confirmText="Save Changes"
        tooltipText="Modify student registration details."
      >
        {selectedRegistration && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Student Name
                </label>
                <input
                  type="text"
                  value={editFormData.studentName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      studentName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Contact
                </label>
                <input
                  type="text"
                  value={editFormData.contact}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      contact: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Event
                </label>
                <Select
                  value={editFormData.eventId}
                  onValueChange={(val) =>
                    setEditFormData({ ...editFormData, eventId: val })
                  }
                >
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                    <SelectValue placeholder="Select Event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Branch
                </label>
                <Select
                  value={editFormData.branch}
                  onValueChange={(val) =>
                    setEditFormData({ ...editFormData, branch: val })
                  }
                >
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Registration"
          message={`Are you sure you want to delete the registration for ${selectedRegistration?.studentName}? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          variant="danger"
        />
      )}
    </div>
  );
}
