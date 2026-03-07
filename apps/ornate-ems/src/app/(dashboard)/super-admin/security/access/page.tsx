import { Database, Filter, Eye } from "lucide-react";

const ACCESS_LOGS = [
  {
    id: 1,
    dataset: "Student Records",
    accessedBy: "Branch Admin (CSE)",
    method: "Export CSV",
    records: 450,
    time: "2h ago",
  },
  {
    id: 2,
    dataset: "Payment History",
    accessedBy: "Super Admin",
    method: "Direct Query",
    records: 1,
    time: "4h ago",
  },
  {
    id: 3,
    dataset: "Feedback",
    accessedBy: "Club Lead",
    method: "View Dashboard",
    records: "View Only",
    time: "Yesterday",
  },
];

export default function AccessLogsPage() {
  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Data Access Governance
            </h1>
            <p className="text-sm text-[#6B7280]">
              Track who is viewing or exporting sensitive data.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[18px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F9FAFB] border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Dataset
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Accessed By
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Method
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Volume
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ACCESS_LOGS.map((log: any) => (
              <tr key={log.id} className="hover:bg-gray-50 font-mono text-sm">
                <td className="px-6 py-4 text-[#1A1A1A] font-semibold font-sans">
                  {log.dataset}
                </td>
                <td className="px-6 py-4 text-indigo-600 font-sans">
                  {log.accessedBy}
                </td>
                <td className="px-6 py-4 text-gray-600">{log.method}</td>
                <td className="px-6 py-4 text-gray-600">{log.records}</td>
                <td className="px-6 py-4 text-right text-gray-500">
                  {log.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
