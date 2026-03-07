"use client";
import { useState, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Trash2,
  Edit2,
  Download,
  Search,
  Plus,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { Skeleton, MetricCardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/useToast";
import Image from "next/image";

const INITIAL_BRANCH_LOGOS = [
  {
    id: 1,
    branchName: "CSE",
    fullName: "Computer Science & Engineering",
    logoUrl:
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=300&fit=crop",
    uploadDate: "2025-11-01T10:00:00",
    status: "active",
    format: "PNG",
    size: "124 KB",
  },
  {
    id: 2,
    branchName: "ECE",
    fullName: "Electronics & Communication",
    logoUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=300&fit=crop",
    uploadDate: "2025-10-25T14:30:00",
    status: "active",
    format: "SVG",
    size: "42 KB",
  },
  {
    id: 3,
    branchName: "MECH",
    fullName: "Mechanical Engineering",
    logoUrl:
      "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&h=300&fit=crop",
    uploadDate: "2025-10-20T09:00:00",
    status: "inactive",
    format: "PNG",
    size: "156 KB",
  },
];

interface BranchLogoUser {
  role?: string;
  branch?: string;
}

interface BranchLogoPageProps {
  user?: BranchLogoUser;
}

export function BranchLogoPage({ user }: BranchLogoPageProps) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [logos, setLogos] = useState(INITIAL_BRANCH_LOGOS);
  const [searchQuery, setSearchQuery] = useState("");

  const userBranch = user?.branch?.toUpperCase();
  const isSuperAdmin = user?.role === "super_admin";

  // Filter logos based on user branch
  const displayedLogos = userBranch
    ? logos.filter((l) => l.branchName === userBranch)
    : logos;

  const filteredLogos = displayedLogos.filter(
    (logo) =>
      logo.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      logo.fullName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const hasBranchLogo =
    userBranch && logos.some((l) => l.branchName === userBranch);

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [selectedLogo, setSelectedLogo] = useState<any>(null);
  const [branchName, setBranchName] = useState("");
  const [fullName, setFullName] = useState("");
  const [logoPreview, setLogoPreview] = useState<any>(null);
  const [status, setStatus] = useState("active");

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setLogoPreview(URL.createObjectURL(file));
        showToast(`Selected file: ${file.name}`, "info");
      }
    };
    input.click();
  };

  const resetForm = () => {
    setBranchName("");
    setFullName("");
    setLogoPreview(null);
    setStatus("active");
    setSelectedLogo(null);
  };

  const handleCreateLogo = () => {
    if (!branchName || !fullName || !logoPreview) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    // Check if branch already exists
    const normalizedBranch = branchName.trim().toUpperCase();
    if (logos.find((l) => l.branchName === normalizedBranch)) {
      showToast(
        `A logo for ${normalizedBranch} already exists. Please edit the existing one.`,
        "error",
      );
      return;
    }

    const newLogo = {
      id: Date.now(),
      branchName: normalizedBranch,
      fullName,
      logoUrl: logoPreview,
      uploadDate: new Date().toISOString(),
      status,
      format: "PNG", // Default for simulation
      size: "0 KB",
    };

    setLogos([newLogo, ...logos]);
    setShowUploadModal(false);
    resetForm();
    showToast("Branch logo uploaded successfully", "success");
  };

  const handleUpdateLogo = () => {
    if (!branchName || !fullName) {
      showToast("Please fill in required fields", "error");
      return;
    }

    const normalizedBranch = branchName.trim().toUpperCase();

    // Check if new branch code conflicts with another existing branch (other than itself)
    if (
      logos.find(
        (l) => l.branchName === normalizedBranch && l.id !== selectedLogo.id,
      )
    ) {
      showToast(`A logo for ${normalizedBranch} already exists.`, "error");
      return;
    }

    setLogos(
      logos.map((l) =>
        l.id === selectedLogo.id
          ? {
              ...l,
              branchName: normalizedBranch,
              fullName,
              logoUrl: logoPreview || l.logoUrl,
              status,
            }
          : l,
      ),
    );

    setShowEditModal(false);
    resetForm();
    showToast("Branch logo updated successfully", "success");
  };

  const handleDeleteLogo = () => {
    setLogos(logos.filter((l) => l.id !== selectedLogo.id));
    setShowDeleteModal(false);
    resetForm();
    showToast("Branch logo deleted", "success");
  };

  const openEditModal = (logo: any) => {
    setSelectedLogo(logo);
    setBranchName(logo.branchName);
    setFullName(logo.fullName);
    setLogoPreview(logo.logoUrl);
    setStatus(logo.status);
    setShowEditModal(true);
  };

  const openDeleteModal = (logo: any) => {
    setSelectedLogo(logo);
    setShowDeleteModal(true);
  };

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span className="whitespace-nowrap">Dashboard</span>
          <span className="whitespace-nowrap">›</span>
          <span className="whitespace-nowrap">Sports</span>
          <span className="whitespace-nowrap">›</span>
          <span className="text-[#1A1A1A] font-medium whitespace-nowrap">
            Branch Logos
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">
              Sports Branch Logos
            </h1>
            <p className="text-sm text-[#6B7280]">
              {userBranch
                ? `Manage the official logo for the ${userBranch} branch`
                : "Manage branch logos for sports events and results"}
            </p>
          </div>

          {!hasBranchLogo && (
            <button
              onClick={() => {
                resetForm();
                if (userBranch) setBranchName(userBranch);
                setShowUploadModal(true);
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm w-full md:w-auto"
            >
              <Plus className="w-5 h-5" />
              Upload New Logo
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search branches..."
            className="pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Logos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#F4F2F0] rounded-[24px] p-2">
              <div className="bg-white rounded-[18px] p-6 shadow-sm border border-[#E5E7EB]">
                <Skeleton width="100%" height={120} className="mb-4" />
                <Skeleton width="60%" height={20} className="mb-2" />
                <Skeleton width="40%" height={14} />
              </div>
            </div>
          ))
        ) : filteredLogos.length > 0 ? (
          filteredLogos.map((logo: any) => (
            <div
              key={logo.id}
              className="bg-[#F4F2F0] rounded-[24px] p-2 group"
            >
              <div className="bg-white rounded-[18px] p-6 shadow-sm border border-[#E5E7EB] h-full flex flex-col">
                <div className="relative aspect-square mb-4 bg-[#F9FAFB] rounded-xl border border-dashed border-[#E5E7EB] flex items-center justify-center overflow-hidden">
                  <Image
                    src={logo.logoUrl}
                    alt={logo.branchName}
                    width={120}
                    height={120}
                    className="object-contain"
                  />
                  <div
                    className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      logo.status === "active"
                        ? "bg-[#D1FAE5] text-[#10B981]"
                        : "bg-[#F3F4F6] text-[#6B7280]"
                    }`}
                  >
                    {logo.status}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#1A1A1A]">
                    {logo.branchName}
                  </h3>
                  <p className="text-xs text-[#6B7280] mb-4">{logo.fullName}</p>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <button
                    onClick={() => openEditModal(logo)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-lg text-xs font-medium hover:bg-[#F9FAFB] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(logo)}
                    className="p-2 bg-white border border-[#E5E7EB] text-[#EF4444] rounded-lg hover:bg-[#FEF2F2] hover:border-[#FCA5A5] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-[#F9FAFB] rounded-2xl border border-dashed border-[#E5E7EB]">
            <ImageIcon className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1A1A1A]">
              No logos found
            </h3>
            <p className="text-sm text-[#6B7280]">
              Try adjusting your search query
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Branch Logo"
        onConfirm={handleCreateLogo}
        confirmText="Upload Logo"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Branch Code (e.g. CSE) *
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              disabled={!!userBranch}
              className={`w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] ${userBranch ? "bg-[#F9FAFB] cursor-not-allowed" : ""}`}
              placeholder="Enter branch code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Full Branch Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              placeholder="Enter full branch name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Logo File *
            </label>
            <div
              onClick={handleFileUpload}
              className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-8 text-center cursor-pointer hover:border-[#10B981] transition-colors bg-[#F9FAFB]"
            >
              {logoPreview ? (
                <div className="flex flex-col items-center">
                  <Image
                    src={logoPreview}
                    alt="Preview"
                    width={80}
                    height={80}
                    className="object-contain mb-2"
                  />
                  <p className="text-xs text-[#10B981] font-medium">
                    Click to change
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                  <p className="text-sm text-[#6B7280]">Click to upload logo</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    PNG, SVG, or JPG (max 2MB)
                  </p>
                </>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Initial Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={status === "active"}
                  onChange={() => setStatus("active")}
                  className="w-4 h-4"
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={status === "inactive"}
                  onChange={() => setStatus("inactive")}
                  className="w-4 h-4"
                />
                <span className="text-sm">Inactive</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Branch Logo"
        onConfirm={handleUpdateLogo}
        confirmText="Update Changes"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Branch Code *
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              disabled={!!userBranch}
              className={`w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] ${userBranch ? "bg-[#F9FAFB] cursor-not-allowed" : ""}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Full Branch Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Logo File
            </label>
            <div
              onClick={handleFileUpload}
              className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-6 text-center cursor-pointer hover:border-[#10B981] transition-colors"
            >
              <Image
                src={logoPreview}
                alt="Preview"
                width={60}
                height={60}
                className="object-contain mx-auto mb-2"
              />
              <p className="text-xs text-[#6B7280]">Click to change image</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={status === "active"}
                  onChange={() => setStatus("active")}
                  className="w-4 h-4"
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={status === "inactive"}
                  onChange={() => setStatus("inactive")}
                  className="w-4 h-4"
                />
                <span className="text-sm">Inactive</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
        onConfirm={handleDeleteLogo}
        confirmText="Delete Logo"
        confirmButtonClass="bg-[#EF4444] hover:bg-[#DC2626]"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-[#FEF2F2] text-[#EF4444] rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">
            Delete Branch Logo?
          </h3>
          <p className="text-sm text-[#6B7280]">
            Are you sure you want to delete the logo for{" "}
            <span className="font-bold text-[#1A1A1A]">
              {selectedLogo?.branchName}
            </span>
            ? This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}
