import { History, User, Settings, Megaphone, Shield } from "lucide-react";

const LOGS = [
  {
    id: 1,
    action: "Updated Global Settings",
    detail: "Changed max registration limit to 5000",
    user: "Super Admin",
    time: "10 mins ago",
    type: "settings",
  },
  {
    id: 2,
    action: "Broadcast Sent",
    detail: 'Sent "Registration Closing Soon" alert to all users',
    user: "Super Admin",
    time: "2 hours ago",
    type: "announcement",
  },
  {
    id: 3,
    action: "User Role Modified",
    detail: 'Promoted "Rahul K." to Branch Admin (CSE)',
    user: "Super Admin",
    time: "4 hours ago",
    type: "security",
  },
  {
    id: 4,
    action: "Stall Allocated",
    detail: 'Allocated Stall A-12 to "Spice Corner"',
    user: "Super Admin",
    time: "Yesterday",
    type: "action",
  },
];

export default function HistoryPage() {
  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Change History
            </h1>
            <p className="text-sm text-[#6B7280]">
              Audit log of administrative actions.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[18px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {LOGS.map((log: any) => (
            <div
              key={log.id}
              className="p-6 hover:bg-gray-50 transition-colors flex items-start gap-4"
            >
              <div
                className={`p-3 rounded-full shrink-0 
                                ${
                                  log.type === "settings"
                                    ? "bg-blue-50 text-blue-600"
                                    : log.type === "security"
                                      ? "bg-red-50 text-red-600"
                                      : log.type === "announcement"
                                        ? "bg-purple-50 text-purple-600"
                                        : "bg-gray-100 text-gray-600"
                                }`}
              >
                {log.type === "settings" && <Settings className="w-5 h-5" />}
                {log.type === "security" && <Shield className="w-5 h-5" />}
                {log.type === "announcement" && (
                  <Megaphone className="w-5 h-5" />
                )}
                {log.type === "action" && <User className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-[#1A1A1A]">{log.action}</h4>
                  <span className="text-xs text-gray-400">{log.time}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{log.detail}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  Done by{" "}
                  <span className="font-medium text-gray-900">{log.user}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
