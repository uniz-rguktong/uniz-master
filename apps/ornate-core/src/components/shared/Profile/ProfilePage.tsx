"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Shield,
  Save,
  Camera,
  ChevronRight,
  User,
  ChevronLeft,
  Fingerprint,
  Eye,
  EyeOff,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  updateAdminProfile,
  updatePassword,
} from "@/actions/adminProfileActions";
import { useToast } from "@/hooks/useToast";
import { useSession } from "next-auth/react";
import { uploadFileToR2 } from "@/lib/upload";
import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

interface ProfilePageProps {
  initialProfile: any;
  variant?: "admin" | "clubs" | "sports" | "hho";
  fullHeight?: boolean;
}

export default function ProfilePage({
  initialProfile,
  variant = "admin",
  fullHeight = true,
}: ProfilePageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(!initialProfile);
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();
  const { update } = useSession();

  // Form States
  const [profileData, setProfileData] = useState<any>({
    firstName: "",
    lastName: "",
    designation: "",
    phone: "",
    bio: "",
    profilePicture: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [passwordData, setPasswordData] = useState<any>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Initialize data
  useEffect(() => {
    if (initialProfile) {
      const nameParts = (initialProfile.name || "").split(" ");
      setProfileData({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        designation: initialProfile.designation || "",
        phone: initialProfile.phone || "",
        bio: initialProfile.bio || "",
        profilePicture: initialProfile.profilePicture || "",
      });

      setIsLoading(false);
    }
  }, [initialProfile]);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Ensure file is an image
    if (!file.type.startsWith("image/")) {
      showToast("Please upload a valid image file", "error");
      return;
    }

    // Limit size (e.g., to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size should be less than 5MB", "error");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const url = await uploadFileToR2(file);
      if (url) {
        setProfileData((prev: any) => ({ ...prev, profilePicture: url }));
        showToast(
          "Photo uploaded successfully. Save changes to keep it.",
          "success",
        );
      } else {
        showToast("Failed to upload photo", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to upload photo", "error");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "profile") {
        const formData = new FormData();
        Object.entries(profileData).forEach(([key, value]) =>
          formData.append(key, value as string),
        );

        const result = await updateAdminProfile(formData);
        if (result.success) {
          showToast("Profile updated successfully", "success");
          await update({
            name: profileData.firstName + " " + profileData.lastName,
            designation: profileData.designation,
            profilePicture: profileData.profilePicture,
          });
        } else {
          showToast(result.error || "Failed to update profile", "error");
        }
      } else if (activeTab === "security") {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          showToast("New passwords do not match", "error");
          setIsLoading(false);
          return;
        }
        if (!passwordData.currentPassword) {
          showToast("Please enter current password", "error");
          setIsLoading(false);
          return;
        }

        const result = await updatePassword(
          passwordData.currentPassword,
          passwordData.newPassword,
        );
        if (result.success) {
          showToast("Password updated successfully", "success");
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        } else {
          showToast(result.error || "Failed to update password", "error");
        }
      }
    } catch (error) {
      showToast("An unexpected error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Personal Information", icon: User },
    { id: "security", label: "Login & Security", icon: Shield },
  ];

  const isCoordinatorProfilePage = pathname?.startsWith("/coordinator/");

  return (
    <div
      className={`p-4 md:p-8 animate-page-entrance ${fullHeight ? "min-h-screen" : "min-h-full"}`}
    >
      {isCoordinatorProfilePage && (
        <div className="mb-6">
          <button
            onClick={() => router.push("/coordinator")}
            className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#1A1A1A] transition-colors text-sm md:text-[15px] font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#1A1A1A] font-medium">Profile Settings</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">
              Account Settings
            </h1>
            <p className="text-sm text-[#6B7280]">
              Manage your profile and security settings.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Nav */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#F4F2F0] rounded-[18px] p-2 flex flex-col gap-2">
            {tabs.map((tab: any) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-[#1A1A1A] shadow-sm border border-[#E5E7EB]"
                      : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white/50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${activeTab === tab.id ? "text-[#10B981]" : ""}`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* Profile Quick Look */}
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
            <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
              {isLoading && !initialProfile ? (
                <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                  <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-3xl" />
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2">
                      <Skeleton className="h-10 w-40" />
                      <Skeleton className="h-10 w-40" />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-[#F3F4F6] shadow-md group-hover:shadow-lg transition-all">
                      {profileData.profilePicture ? (
                        <img
                          src={profileData.profilePicture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1A1A1A] to-[#4B5563] flex items-center justify-center text-white text-3xl md:text-4xl font-black">
                          {(
                            profileData.firstName[0] ||
                            initialProfile?.name?.[0] ||
                            "A"
                          ).toUpperCase()}
                          {(profileData.lastName[0] || "")?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border border-[#E5E7EB] rounded-2xl flex items-center justify-center text-[#1A1A1A] hover:bg-[#F3F4F6] transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {isUploadingPhoto ? (
                        <div className="w-4 h-4 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                      <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A]">
                        {profileData.firstName} {profileData.lastName}
                      </h2>
                      <span className="inline-flex px-2 py-0.5 bg-[#DBEAFE] text-[#3B82F6] rounded text-xs font-semibold uppercase tracking-wider border border-[#DBEAFE]/50">
                        {initialProfile?.role?.replace("_", " ") || "User"}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B7280] font-medium mb-6">
                      {isCoordinatorProfilePage
                        ? "Event Coordinator"
                        : `${profileData.designation || "No Designation"} • ${initialProfile?.branch ? initialProfile.branch.toUpperCase() : "General"}`}
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <div className="px-3 md:px-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl flex items-center gap-2 text-xs font-medium text-[#1A1A1A]">
                        <Mail className="w-4 h-4 text-[#3B82F6]" />
                        {initialProfile?.email}
                      </div>
                      <div className="px-3 md:px-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl flex items-center gap-2 text-xs font-medium text-[#1A1A1A]">
                        <Fingerprint className="w-4 h-4 text-[#10B981]" />
                        REF-{initialProfile?.id?.slice(-6).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Detailed Sections */}
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
            <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-6 md:p-8">
              {isLoading && !initialProfile ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <div className="animate-page-entrance">
                  {/* Personal Information */}
                  {activeTab === "profile" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1A1A1A]">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={profileData.firstName}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1A1A1A]">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={profileData.lastName}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-all"
                        />
                      </div>
                      {!isCoordinatorProfilePage && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[#1A1A1A]">
                            Designation
                          </label>
                          <input
                            type="text"
                            name="designation"
                            value={profileData.designation}
                            onChange={handleProfileChange}
                            placeholder="e.g. Head of Department"
                            className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-all"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1A1A1A]">
                          Phone Reference
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                          <input
                            type="tel"
                            name="phone"
                            value={profileData.phone}
                            onChange={handleProfileChange}
                            placeholder="+91 98765 43210"
                            className="w-full pl-12 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-all"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-[#1A1A1A]">
                          Institutional Bio
                        </label>
                        <textarea
                          rows={4}
                          name="bio"
                          value={profileData.bio}
                          onChange={handleProfileChange}
                          placeholder="Briefly describe your role and experience..."
                          className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-all resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Security */}
                  {activeTab === "security" && (
                    <div className="space-y-8 max-w-2xl">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[#1A1A1A]">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-all"
                            />
                            <button
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[#1A1A1A]">
                              New Password
                            </label>
                            <input
                              type="password"
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              placeholder="Minimum 12 characters"
                              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[#1A1A1A]">
                              Confirm Password
                            </label>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] text-white rounded-xl text-sm font-medium hover:bg-[#059669] transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
