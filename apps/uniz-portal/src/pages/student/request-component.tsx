/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

import { Input } from "../../components/Input";
import { useNavigate } from "react-router";
import { useRecoilValue } from "recoil";
import { student } from "../../store";
import { useStudentData } from "../../hooks/student_info";
import { REQUEST_OUTING, REQUEST_OUTPASS } from "../../api/endpoints";
import { useIsAuth } from "../../hooks/is_authenticated";
import { apiClient } from "../../api/apiClient";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  Send,
  RefreshCw,
} from "lucide-react";

type RequestCompProps = {
  type: "outpass" | "outing";
};

export default function RequestComp({ type }: RequestCompProps) {
  useIsAuth();
  useStudentData();
  const [reason, setReason] = useState(null);
  const [from_date, setFromDate] = useState<string | null>(null);
  const [to_date, setToDate] = useState<string | null>(null);
  const [from_time, setFromTime] = useState<string | null>(null);
  const [to_time, setToTime] = useState<string | null>(null);
  const Student = useRecoilValue(student);
  const [isLoading, setLoading] = useState(false);
  const navigateTo = useNavigate();

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<any>>) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setter(event.target.value);
      };

  const sendDataToBackend = async () => {
    if (
      (type === "outpass" && (!from_date || !to_date || !reason)) ||
      (type === "outing" && (!from_time || !to_time || !reason))
    ) {
      toast.error("Please fill all the mandatory fields.");
      return;
    }

    let bodyData;

    try {
      if (type === "outpass") {
        const start = new Date(from_date!);
        const end = new Date(to_date!);

        if (start < new Date(new Date().setHours(0, 0, 0, 0))) {
          toast.error("From date cannot be in the past.");
          return;
        }
        if (end < start) {
          toast.error("To date cannot be before From date.");
          return;
        }

        bodyData = {
          reason,
          fromDay: start.toISOString(),
          toDay: end.toISOString(),
        };
      } else {
        const today = new Date();
        const start = new Date(today);
        const [startHours, startMinutes] = from_time!.split(":").map(Number);
        start.setHours(startHours, startMinutes, 0, 0);

        const end = new Date(today);
        const [endHours, endMinutes] = to_time!.split(":").map(Number);
        end.setHours(endHours, endMinutes, 0, 0);

        if (end <= start) {
          toast.error("Return time must be after leaving time.");
          return;
        }

        bodyData = {
          reason,
          fromTime: start.toISOString(),
          toTime: end.toISOString(),
        };
      }

      const endpoint = type === "outing" ? REQUEST_OUTING : REQUEST_OUTPASS;
      setLoading(true);

      const data = await apiClient(endpoint, {
        method: "POST",
        body: JSON.stringify(bodyData),
      });

      if (data && data.success) {
        toast.success(
          `${type.charAt(0).toUpperCase() + type.slice(1)} request submitted successfully.`,
        );
        navigateTo("/student");
      }
    } catch (error: any) {
      console.error("Submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 pb-32">
      {/* Header Section */}
      <div className="mb-10">
        <button
          onClick={() => navigateTo("/student")}
          className="text-slate-400 hover:text-blue-600 font-bold text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 mb-8 transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 px-2">
          <div className="text-center md:text-left">
            <p className="text-lg font-medium text-slate-400 mb-0.5 tracking-tight">
              New Application
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter mb-2">
              Request {type === "outing" ? "Outing" : "Outpass"}
            </h1>
            <p className="text-slate-400 font-bold text-[13px] uppercase tracking-widest opacity-60">
              Campus Leave Authorization
            </p>
          </div>
          <div className="p-4 bg-white text-blue-600 rounded-3xl border border-slate-100 shadow-sm shrink-0 transition-transform hover:scale-105 duration-500">
            {type === "outpass" ? (
              <Calendar className="w-8 h-8" />
            ) : (
              <Clock className="w-8 h-8" />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">
                  Reason for {type}
                </label>
                <textarea
                  onChange={handleInputChange(setReason)}
                  placeholder="Clearly explain the purpose of your request..."
                  className="w-full bg-slate-50/50 p-6 rounded-2xl border border-slate-100/50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none min-h-[160px] font-bold text-base text-slate-700 placeholder:text-slate-200 placeholder:font-normal resize-none transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {type === "outpass" ? (
                  <>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">
                        Departure Date
                      </label>
                      <Input
                        type="date"
                        onchangeFunction={handleInputChange(setFromDate)}
                        className="w-full bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-bold text-base text-slate-700 transition-all cursor-pointer shadow-inner"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">
                        Expected Return
                      </label>
                      <Input
                        type="date"
                        onchangeFunction={handleInputChange(setToDate)}
                        className="w-full bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-bold text-base text-slate-700 transition-all cursor-pointer shadow-inner"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">
                        Exit Time
                      </label>
                      <Input
                        type="time"
                        onchangeFunction={handleInputChange(setFromTime)}
                        className="w-full bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-bold text-base text-slate-700 transition-all cursor-pointer shadow-inner"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">
                        Return Window
                      </label>
                      <Input
                        type="time"
                        onchangeFunction={handleInputChange(setToTime)}
                        className="w-full bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-bold text-base text-slate-700 transition-all cursor-pointer shadow-inner"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info & Action */}
        <div className="space-y-6">
          <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100/50">
            <div className="flex gap-4 items-start mb-6">
              <div className="p-3 bg-white text-blue-600 rounded-xl shadow-sm border border-slate-100/50 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Requirement</p>
                <p className="text-slate-400 font-medium text-xs leading-relaxed">
                  All fields are mandatory. Details will be vetted by the authority.
                </p>
              </div>
            </div>

            <div className="p-5 bg-white/60 rounded-2xl border border-white shadow-sm">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Notification Sent To</p>
              <p className="text-[13px] font-bold text-slate-700 truncate">{Student?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={sendDataToBackend}
              disabled={isLoading}
              className="group w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Submit Request
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <button
              onClick={() =>
                navigateTo(
                  `/student/${type === "outing" ? "outpass" : "outing"}/request${type === "outing" ? "outpass" : "outing"}`,
                )
              }
              className="w-full py-4 bg-transparent border border-slate-100 text-slate-400 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Switch to {type === "outing" ? "Outpass" : "Outing"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
