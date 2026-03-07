import { Check, Edit } from "lucide-react";

const ROLES = [
  {
    id: "super_admin",
    name: "Super Administrator",
    description:
      "Full system access with ability to manage all aspects of the fest.",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    users: 3,
    permissions: [
      "Manage Users & Roles",
      "System Configuration",
      "Database Access",
      "Audit Logs",
      "Push Notifications",
      "Full Content Moderation",
    ],
  }, // Purple for "Royal/Super"
  {
    id: "branch_admin",
    name: "Branch Administrator",
    description: "Manage specific branch portal, events, and registrations.",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    users: 8,
    permissions: [
      "Create Branch Events",
      "View Registrations",
      "Manage Gallery",
      "Branch Analytics",
      "Coordinate Faculty",
    ],
  }, // Blue for standard admin
  {
    id: "sports_admin",
    name: "Sports Administrator",
    description: "Manage all sports fixtures, results, and point tables.",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    users: 2,
    permissions: [
      "Schedule Matches",
      "Update Scores",
      "Team Registration",
      "Venue Management",
      "Sports Leaderboard",
    ],
  }, // Orange for activity/sports
  {
    id: "branch_sports_admin",
    name: "Branch Sports Admin",
    description:
      "Branch-level sports administrator with scoped access to registrations and results.",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    users: 5,
    permissions: [
      "View Sports",
      "Add Registrations",
      "View Results",
      "View Fixtures",
    ],
  },
  {
    id: "club_coordinator",
    name: "Club Coordinator",
    description: "Limited access to manage club-specific events and attendees.",
    color: "bg-green-100 text-green-700 border-green-200",
    users: 15,
    permissions: [
      "Create Club Events",
      "Track Attendance",
      "Submit Reports",
      "View Participants",
    ],
  }, // Green for students/clubs
  {
    id: "hho",
    name: "Helping Hands (HHO)",
    description: "Manage donation drives, volunteers, and social outreach.",
    color: "bg-pink-100 text-pink-700 border-pink-200",
    users: 4,
    permissions: [
      "Campaign Management",
      "Volunteer Coordination",
      "Donation Tracking",
      "Public Announcements",
    ],
  }, // Pink for charity/love
];

export default function RolesPage() {
  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Role Management
            </h1>
            <p className="text-sm text-[#6B7280]">
              Define and audit access levels across the platform.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {ROLES.map((role: any) => (
          <div
            key={role.id}
            className="bg-[#F4F2F0] rounded-[18px] p-2 hover:translate-y-[-2px] transition-transform duration-300"
          >
            <div className="bg-white rounded-[14px] p-6 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${role.color}`}
                >
                  {role.users} Active Users
                </span>
                <div className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                  <Edit className="w-4 h-4 text-gray-500" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">
                {role.name}
              </h3>
              <p className="text-sm text-[#6B7280] mb-6 flex-1">
                {role.description}
              </p>

              <div className="space-y-3">
                <div className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
                  Key Capabilities
                </div>
                <div className="space-y-2">
                  {role.permissions.map((perm: any, i: any) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-[#4B5563]"
                    >
                      <div className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-green-600" />
                      </div>
                      {perm}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">ID: {role.id}</span>
                <span className="text-xs font-medium text-[#1A1A1A] cursor-pointer hover:underline">
                  View Policy Details
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
