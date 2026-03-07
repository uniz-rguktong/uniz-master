import { Download, Search, Filter } from "lucide-react";

const REGISTRATIONS = [
  {
    id: "R180123",
    name: "John Doe",
    branch: "CSE",
    year: "E4",
    event: "Code Marathon",
    status: "Confirmed",
    paid: "Yes",
  },
  {
    id: "R190456",
    name: "Jane Smith",
    branch: "ECE",
    year: "E3",
    event: "Robo Wars",
    status: "Pending",
    paid: "No",
  },
  {
    id: "R200789",
    name: "Mike Ross",
    branch: "MECH",
    year: "E2",
    event: "Cricket",
    status: "Confirmed",
    paid: "Yes",
  },
  // Mocking more data rows
  {
    id: "R210111",
    name: "Rachel Green",
    branch: "CIVIL",
    year: "E1",
    event: "Singing",
    status: "Confirmed",
    paid: "Yes",
  },
];

export default function RegistrationReportsPage() {
  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Registration Data Export
            </h1>
            <p className="text-sm text-[#6B7280]">
              Download participant lists for logistics and attendance.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filter by Branch
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors">
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[18px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID or Name..."
            className="bg-transparent text-sm focus:outline-none w-full"
          />
        </div>
        <table className="w-full">
          <thead className="bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Branch / Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Event
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Payment
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {REGISTRATIONS.map((row: any) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-mono text-xs text-gray-500">
                  {row.id}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-[#1A1A1A]">
                  {row.name}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {row.branch} - {row.year}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">{row.event}</td>
                <td className="px-6 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${row.paid === "Yes" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {row.paid}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <span
                    className={`text-xs font-bold ${row.status === "Confirmed" ? "text-green-600" : "text-yellow-600"}`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
