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
    <div className="max-w-7xl mx-auto px-4 md:px-10 pb-32">
      {/* Header Section */}
      <div className="mb-8 mt-2 md:mt-0">
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
          <div className="text-blue-600 flex-shrink-0">
            {type === "outpass" ? (
              <Calendar className="w-10 h-10" />
            ) : (
              <Clock className="w-10 h-10" />
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
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none min-h-[180px] font-bold text-base text-slate-800 placeholder:text-slate-300 placeholder:font-normal resize-none transition-all"
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
                        className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-bold text-base text-slate-800 transition-all cursor-pointer"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">
                        Expected Return
                      </label>
                      <Input
                        type="date"
                        onchangeFunction={handleInputChange(setToDate)}
                        className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-bold text-base text-slate-800 transition-all cursor-pointer"
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
                        className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-bold text-base text-slate-800 transition-all cursor-pointer"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">
                        Return Window
                      </label>
                      <Input
                        type="time"
                        onchangeFunction={handleInputChange(setToTime)}
                        className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-bold text-base text-slate-800 transition-all cursor-pointer"
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
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex gap-4 items-start mb-6">
              <div className="text-blue-600 flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-slate-900 text-sm uppercase tracking-tight">
                  Requirement
                </p>
                <p className="text-slate-500 font-medium text-xs leading-relaxed">
                  All fields are mandatory. Details will be vetted by the
                  authority.
                </p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">
                Notification Sent To
              </p>
              <p className="text-[13px] font-bold text-slate-600 truncate">
                {Student?.email}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={sendDataToBackend}
              disabled={isLoading}
              className="uniz-primary-btn w-full h-[64px] rounded-[2rem] shadow-xl shadow-blue-100"
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
              className="uniz-primary-btn w-full h-[54px] bg-transparent border border-slate-100 text-slate-400 shadow-none hover:shadow-none hover:bg-slate-50 hover:text-blue-600"
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
