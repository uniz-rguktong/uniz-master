import { Download, Filter, Table } from "lucide-react";

const PORTAL_DATA = [
  {
    portal: "Student Portal",
    users: "2.4k",
    sessions: "12.5k",
    avgDuration: "5m 12s",
    errors: "12 (0.1%)",
  },
  {
    portal: "Sports Portal",
    users: "850",
    sessions: "3.2k",
    avgDuration: "8m 45s",
    errors: "5 (0.2%)",
  },
  {
    portal: "Admin Console",
    users: "45",
    sessions: "1.2k",
    avgDuration: "15m 30s",
    errors: "0 (0%)",
  },
];

export default function PortalReportsPage() {
  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Portal Performance Report
            </h1>
            <p className="text-sm text-[#6B7280]">
              Detailed breakdown of traffic and stability by interface.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[18px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F9FAFB] border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Portal Name
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                Active Users
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                Total Sessions
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                Avg Duration
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                Errors Reported
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {PORTAL_DATA.map((row: any) => (
              <tr key={row.portal} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold text-[#1A1A1A]">
                  {row.portal}
                </td>
                <td className="px-6 py-4 text-right text-gray-600 font-mono">
                  {row.users}
                </td>
                <td className="px-6 py-4 text-right text-gray-600 font-mono">
                  {row.sessions}
                </td>
                <td className="px-6 py-4 text-right text-gray-600 font-mono">
                  {row.avgDuration}
                </td>
                <td className="px-6 py-4 text-right text-red-600 font-mono font-medium">
                  {row.errors}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
