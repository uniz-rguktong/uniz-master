import { Play, Pause, Square, Users, Clock, AlertTriangle } from "lucide-react";
import { getLiveEvents } from "@/actions/superAdminGetters";

export default async function LiveEventsPage() {
  const liveEvents = await getLiveEvents();

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                Live Operations
              </h1>
            </div>
            <p className="text-sm text-[#6B7280] ml-6">
              Real-time control center for currently active events.
            </p>
          </div>
        </div>
      </div>

      {liveEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-500 font-medium">
            No events are currently live.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {liveEvents.map((event: any) => (
            <div
              key={event.id}
              className="bg-white border border-[#E5E7EB] rounded-[18px] p-6 shadow-sm relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A1A]">
                    {event.name}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <span className="font-semibold text-gray-900">
                      {event.venue}
                    </span>
                    • Started {event.startedAt}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    event.status === "Running"
                      ? "bg-green-50 text-green-700 border-green-100"
                      : "bg-yellow-50 text-yellow-700 border-yellow-100"
                  }`}
                >
                  {event.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-[#1A1A1A]">
                    {event.participants}
                  </div>
                  <div className="text-xs text-gray-500">
                    Active Participants
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-[#1A1A1A]">Live</div>
                  <div className="text-xs text-gray-500">Current Status</div>
                </div>
              </div>

              <div className="flex gap-3">
                {event.status === "Running" ? (
                  <button className="flex-1 bg-yellow-50 text-yellow-700 font-medium py-3 rounded-xl hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2">
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                ) : (
                  <button className="flex-1 bg-green-50 text-green-700 font-medium py-3 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" />
                    Resume
                  </button>
                )}
                <button className="flex-1 bg-red-50 text-red-700 font-medium py-3 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                  <Square className="w-4 h-4 fill-current" />
                  End Event
                </button>
                <button className="px-4 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
                  <AlertTriangle className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
