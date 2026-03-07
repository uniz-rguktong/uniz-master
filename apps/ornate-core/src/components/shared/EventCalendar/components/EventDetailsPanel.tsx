"use client";

import type { CalendarEvent } from "../types";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Info,
  Settings,
  Trash2,
} from "lucide-react";

interface EventDetailsPanelProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit?: ((event: CalendarEvent) => void) | undefined;
  onDelete?: ((eventId: string | number) => void) | undefined;
}

export function EventDetailsPanel({
  event,
  onClose,
  onEdit,
  onDelete,
}: EventDetailsPanelProps) {
  if (!event) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] transition-opacity"
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out border-l border-[#E5E7EB] ${event ? "translate-x-0" : "translate-x-full"}`}
      >
        {event && (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-[#E5E7EB] flex items-start justify-between bg-[#F9FAFB]">
              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-1">
                  {event.title}
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white inline-block"
                  style={{ backgroundColor: event.categoryColor }}
                >
                  {event.category}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1A1A1A]">
                      Date
                    </h4>
                    <p className="text-sm text-[#4B5563]">
                      {new Date(event.date).toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1A1A1A]">
                      Time
                    </h4>
                    <p className="text-sm text-[#4B5563]">{event.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1A1A1A]">
                      Venue
                    </h4>
                    <p className="text-sm text-[#4B5563]">{event.venue}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1A1A1A]">
                      Attendance
                    </h4>
                    <p className="text-sm text-[#4B5563]">
                      {event.registrations} / {event.capacity} registered
                    </p>
                  </div>
                </div>
              </section>

              {event.description && (
                <section>
                  <h4 className="text-sm font-semibold text-[#1A1A1A] mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    Description
                  </h4>
                  <p className="text-sm text-[#4B5563] leading-relaxed">
                    {event.description}
                  </p>
                </section>
              )}
            </div>

            <div className="p-6 border-t border-[#E5E7EB] bg-gray-50 flex flex-col gap-3">
              <div className="flex gap-3">
                {onEdit && (
                  <button
                    onClick={() => onEdit(event)}
                    className="flex-1 py-2.5 bg-[#1A1A1A] text-white rounded-xl font-semibold hover:bg-[#2D2D2D] transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Edit Event
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(event.id)}
                    className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
