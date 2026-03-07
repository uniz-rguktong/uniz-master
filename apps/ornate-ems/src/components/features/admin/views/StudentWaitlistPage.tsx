"use client";
import { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface StudentWaitlistPageProps {
  initialRegistrations?: Array<Record<string, any>>;
}

export function StudentWaitlistPage({
  initialRegistrations = [],
}: StudentWaitlistPageProps) {
  const [registrations, setRegistrations] = useState(initialRegistrations);

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/student"
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#1A1A1A] mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Events
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">
            My Waitlist
          </h1>
          <p className="text-[#6B7280]">
            Events where you are currently on the waiting list
          </p>
        </div>

        {registrations.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-[#9CA3AF]" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">
              No waitlisted events
            </h3>
            <p className="text-[#6B7280] max-w-sm mx-auto">
              You haven't been added to any event waitlists yet. Explore events
              and register to join them!
            </p>
            <Link
              href="/student"
              className="inline-block mt-6 px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-bold hover:bg-[#2D2D2D] transition-all"
            >
              Explore Events
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-800">
                Being on a waitlist doesn't guarantee participation. You will be
                notified via email if a seat becomes available and your
                registration is confirmed.
              </p>
            </div>

            {registrations.map((reg: any, index: any) => (
              <div
                key={reg.id}
                className="bg-white rounded-[24px] border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-[#F3F4F6] text-[#6B7280] rounded-full text-xs font-bold uppercase tracking-wider">
                        {reg.category}
                      </span>
                      <span className="text-xs text-[#9CA3AF]">
                        Registered on{" "}
                        {new Date(reg.registrationDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">
                      {reg.eventName}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2.5 text-[#6B7280] text-sm">
                        <Calendar className="w-4 h-4 text-[#9CA3AF]" />
                        {new Date(reg.date).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-2.5 text-[#6B7280] text-sm">
                        <MapPin className="w-4 h-4 text-[#9CA3AF]" />
                        {reg.venue}
                      </div>
                      <div className="flex items-center gap-2.5 text-[#6B7280] text-sm">
                        <Users className="w-4 h-4 text-[#9CA3AF]" />
                        Capacity: {reg.capacity}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-6 bg-[#F9FAFB] rounded-2xl md:min-w-[160px] border border-[#F3F4F6]">
                    <div className="text-3xl font-bold text-[#1A1A1A] mb-1">
                      #{reg.waitlistPosition}
                    </div>
                    <div className="text-xs text-[#6B7280] font-medium uppercase tracking-wider">
                      Waitlist Pos
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
