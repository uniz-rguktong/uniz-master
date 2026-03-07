"use client";
import {
  Building2,
  Users,
  Calendar,
  Activity,
  ExternalLink,
  Settings,
  MoreVertical,
  Plus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { InfoTooltip } from "@/components/InfoTooltip";
import { useToast } from "@/hooks/useToast";

const PORTALS = [
  {
    id: "cse",
    name: "Computer Science (CSE)",
    type: "Branch",
    url: "/cse",
    stats: { users: 1200, events: 15, active: true },
    admin: {
      name: "Dr. A. Smith",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    },
    banner:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=200&fit=crop",
  },
  {
    id: "ece",
    name: "Electronics (ECE)",
    type: "Branch",
    url: "/ece",
    stats: { users: 950, events: 12, active: true },
    admin: {
      name: "Prof. B. Jones",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    },
    banner:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&h=200&fit=crop",
  },
  {
    id: "sports",
    name: "Sports Division",
    type: "Division",
    url: "/sports",
    stats: { users: 4500, events: 25, active: true },
    admin: {
      name: "Coach Mike",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    },
    banner:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=200&fit=crop",
  },
  {
    id: "hho",
    name: "Helping Hands",
    type: "Organization",
    url: "/hho",
    stats: { users: 300, events: 5, active: true },
    admin: {
      name: "Sarah L.",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    },
    banner:
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=500&h=200&fit=crop",
  },
  {
    id: "mech",
    name: "Mechanical (MECH)",
    type: "Branch",
    url: "/mech",
    stats: { users: 800, events: 8, active: false },
    admin: { name: "Unassigned", image: null },
    banner:
      "https://images.unsplash.com/photo-1537462713505-9b697200160d?w=500&h=200&fit=crop",
  },
];

export default function PortalsPage() {
  const { showToast } = useToast();
  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                Unified Portals
              </h1>
              <InfoTooltip
                text="Manage distinct microsites for branches and organizations"
                size="md"
              />
            </div>
            <p className="text-sm text-[#6B7280]">
              Central command for all departmental and organizational
              microsites.
            </p>
          </div>
          <button
            onClick={() => showToast("Portal deployment started!", "info")}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Deploy New Portal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {PORTALS.map((portal: any) => (
          <div
            key={portal.id}
            className="group bg-white rounded-[18px] border border-[#E5E7EB] hover:border-[#1A1A1A] hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
          >
            {/* Banner Image */}
            <div className="h-32 w-full relative bg-gray-100">
              <Image
                src={portal.banner}
                alt={portal.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

              <div className="absolute top-3 right-3 flex gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md 
                                    ${portal.stats.active ? "bg-green-500/90 text-white" : "bg-gray-500/90 text-white"}`}
                >
                  {portal.stats.active ? "Live" : "Maintenance"}
                </span>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs font-semibold text-indigo-600 mb-1 uppercase tracking-wider">
                    {portal.type}
                  </div>
                  <h3 className="text-lg font-bold text-[#1A1A1A]">
                    {portal.name}
                  </h3>
                </div>
                <div className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-100 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-[#1A1A1A]">
                    {portal.stats.users}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase font-medium">
                    Users
                  </div>
                </div>
                <div className="text-center border-l border-gray-100">
                  <div className="text-lg font-semibold text-[#1A1A1A]">
                    {portal.stats.events}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase font-medium">
                    Events
                  </div>
                </div>
                <div className="text-center border-l border-gray-100">
                  <div className="flex items-center justify-center h-full">
                    <Activity className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Admin & Actions */}
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {portal.admin.image ? (
                    <Image
                      src={portal.admin.image}
                      alt={portal.admin.name}
                      width={24}
                      height={24}
                      className="rounded-full border border-gray-200"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="w-3 h-3 text-gray-400" />
                    </div>
                  )}
                  <span className="text-xs text-gray-600 font-medium">
                    {portal.admin.name}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/super-admin/portals/settings?id=${portal.id}`}
                    className="p-2 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                  <Link
                    href={portal.url}
                    target="_blank"
                    className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Portal Card */}
        <button
          onClick={() =>
            showToast("Microsite configuration modal will appear here", "info")
          }
          className="group border-2 border-dashed border-[#E5E7EB] rounded-[18px] p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-[#1A1A1A] hover:bg-gray-50 transition-all min-h-[300px]"
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors duration-300">
            <Plus className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1A1A1A] text-lg">
              Add Microsite
            </h3>
            <p className="text-sm text-[#6B7280] max-w-[200px] mx-auto mt-1">
              Deploy a new branch or club portal with one click.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
