import { Search, Filter, ShieldCheck, FileText } from "lucide-react";

const AUDIT_LOGS = [
  {
    id: "LOG-4521",
    action: "Update Settings",
    actor: "Super Admin",
    ip: "192.168.1.45",
    target: "Global Config",
    time: "Feb 12, 14:30:22",
    status: "Success",
  },
  {
    id: "LOG-4522",
    action: "Delete User",
    actor: "Ops Manager",
    ip: "10.0.0.12",
    target: "User: R181234",
    time: "Feb 12, 13:15:00",
    status: "Success",
  },
  {
    id: "LOG-4523",
    action: "Login Attempt",
    actor: "Unknown",
    ip: "45.32.11.8",
    target: "Portal Login",
    time: "Feb 12, 12:00:05",
    status: "Failed",
  },
  {
    id: "LOG-4524",
    action: "Publish Event",
    actor: "Super Admin",
    ip: "192.168.1.45",
    target: "Event: Hackathon",
    time: "Feb 11, 09:45:30",
    status: "Success",
  },
];

export default function AuditLogsPage() {
  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              System Audit Trail
            </h1>
            <p className="text-sm text-[#6B7280]">
              Immutable record of all administrative actions.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Action, IP, or Actor..."
              className="text-sm focus:outline-none w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[18px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F9FAFB] border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Log ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Action
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Actor
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Target Resource
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                IP Address
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Timestamp
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                Outcome
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {AUDIT_LOGS.map((log: any) => (
              <tr key={log.id} className="hover:bg-gray-50 font-mono text-sm">
                <td className="px-6 py-4 text-gray-400">{log.id}</td>
                <td className="px-6 py-4 font-semibold text-[#1A1A1A] font-sans">
                  {log.action}
                </td>
                <td className="px-6 py-4 text-indigo-600">{log.actor}</td>
                <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]">
                  {log.target}
                </td>
                <td className="px-6 py-4 text-gray-500">{log.ip}</td>
                <td className="px-6 py-4 text-gray-500">{log.time}</td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`px-2 py-0.5 rounded textxs font-bold uppercase 
                                        ${log.status === "Success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                  >
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
        <p>Showing 4 of 12,458 logs</p>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
