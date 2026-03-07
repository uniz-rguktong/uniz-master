import { MapPin, Monitor, Smartphone, Globe } from "lucide-react";

const LOGIN_ACTIVITY = [
  {
    id: 1,
    user: "Super Admin",
    device: "Chrome on Windows 11",
    location: "Ongole, IN",
    ip: "192.168.1.4",
    time: "Active now",
    status: "Current",
  },
  {
    id: 2,
    user: "Sports Lead",
    device: "Safari on iPhone 15",
    location: "Hyderabad, IN",
    ip: "45.12.32.11",
    time: "10m ago",
    status: "Success",
  },
  {
    id: 3,
    user: "Branch Admin",
    device: "Firefox on MacOS",
    location: "Ongole, IN",
    ip: "12.34.56.78",
    time: "2h ago",
    status: "Success",
  },
  {
    id: 4,
    user: "Super Admin",
    device: "Edge on Windows 10",
    location: "Chennai, IN",
    ip: "103.22.11.5",
    time: "Yesterday",
    status: "Revoked",
  },
];

export default function LoginActivityPage() {
  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Session Manager
            </h1>
            <p className="text-sm text-[#6B7280]">
              Monitor active sessions and login history.
            </p>
          </div>
          <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200">
            Revoke All Sessions
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {LOGIN_ACTIVITY.map((session: any) => (
          <div
            key={session.id}
            className="bg-white p-6 rounded-[18px] border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row items-center justify-between group hover:border-[#1A1A1A] transition-colors"
          >
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="p-4 bg-gray-50 rounded-xl text-gray-500">
                {session.device.includes("iPhone") ? (
                  <Smartphone className="w-6 h-6" />
                ) : (
                  <Monitor className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-[#1A1A1A]">{session.device}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {session.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {session.ip}
                  </span>
                </div>
                <div className="text-xs text-indigo-600 font-medium mt-1">
                  User: {session.user}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0 justify-between md:justify-end">
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase 
                                ${
                                  session.status === "Current"
                                    ? "bg-green-100 text-green-700"
                                    : session.status === "Revoked"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gray-100 text-gray-600"
                                }`}
              >
                {session.status === "Current" ? "● Active Now" : session.time}
              </div>
              {session.status !== "Revoked" && (
                <button className="text-sm font-medium text-red-600 hover:underline">
                  Revoke
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
