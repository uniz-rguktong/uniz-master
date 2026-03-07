import {
  Building2,
  Music,
  Trophy,
  Heart,
  Search,
  UserPlus,
  RefreshCw,
  MoreVertical,
} from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ASSIGNMENTS = [
  {
    id: "cse",
    resource: "Computer Science Dept",
    type: "Branch",
    icon: Building2,
    admins: [
      {
        name: "John Doe",
        image:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
        email: "cse@admin.com",
      },
    ],
    status: "Active",
  },
  {
    id: "ece",
    resource: "Electronics Dept",
    type: "Branch",
    icon: Building2,
    admins: [
      {
        name: "Sarah Conn",
        image:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        email: "ece@admin.com",
      },
    ],
    status: "Active",
  },
  {
    id: "club_music",
    resource: "Music Club",
    type: "Club",
    icon: Music,
    admins: [],
    status: "Unassigned",
  },
  {
    id: "sports",
    resource: "Sports Division",
    type: "Department",
    icon: Trophy,
    admins: [
      {
        name: "Mike Ross",
        image:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
        email: "sports@admin.com",
      },
    ],
    status: "Active",
  },
  {
    id: "hho",
    resource: "HHO Charity",
    type: "Organization",
    icon: Heart,
    admins: [
      {
        name: "Rachel Zane",
        image:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        email: "hho@admin.com",
      },
    ],
    status: "Active",
  },
];

export default function PortalAssignmentsPage() {
  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Portal Assignments
            </h1>
            <p className="text-sm text-[#6B7280]">
              Manage which admins control which portals and departments.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors">
            <RefreshCw className="w-4 h-4" />
            Sync Assignments
          </button>
        </div>
      </div>

      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-3 mt-2.5 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Find a portal or admin..."
              className="pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            />
          </div>
          <div className="flex gap-2">
            <Select defaultValue="All Types">
              <SelectTrigger className="w-[140px] px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Types">All Types</SelectItem>
                <SelectItem value="Branch">Branch</SelectItem>
                <SelectItem value="Club">Club</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-white border-b border-[#F3F4F6]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Resource / Portal
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Assigned Admins
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ASSIGNMENTS.map((item: any) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#FAFAFA] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-[#1A1A1A]">
                        {item.resource}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.admins.length > 0 ? (
                      <div className="flex items-center gap-2">
                        {item.admins.map((admin: any, idx: any) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 pr-4"
                          >
                            <Image
                              src={admin.image}
                              alt={admin.name}
                              width={28}
                              height={28}
                              className="rounded-full border border-white shadow-sm"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm text-[#1A1A1A] leading-tight">
                                {admin.name}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {admin.email}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600 text-sm italic">
                        <AlertTriangle className="w-4 h-4" />
                        No admin assigned
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium 
                                            ${item.status === "Active" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${item.status === "Active" ? "bg-green-600" : "bg-yellow-600"}`}
                      ></span>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface AlertTriangleProps {
  className?: string;
}

function AlertTriangle({ className }: AlertTriangleProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
