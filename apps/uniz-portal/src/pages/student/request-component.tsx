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
      <div className="mb-10 mt-2 md:mt-0">
        <button
          onClick={() => navigateTo("/student")}
          className="text-slate-400 hover:text-indigo-600 font-bold text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 mb-10 transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Protocol Terminal
        </button>

        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-slate-400 font-medium text-[11px] mb-2 uppercase tracking-[0.2em] leading-none">
              Institutional Exit terminal
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight leading-none mb-3">
              Request {type === "outing" ? "Outing" : "Outpass"}
            </h1>
            <p className="text-slate-400 font-medium text-[13px] opacity-80">
              Campus Leave Authorization Protocol
            </p>
          </div>
          <div className="text-indigo-600 flex-shrink-0 hidden md:block">
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
          <div className="bg-white rounded-xl p-6 md:p-8 border border-slate-100 shadow-sm">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Reason for {type}
                </label>
                <textarea
                  onChange={handleInputChange(setReason)}
                  placeholder="Clearly explain the purpose of your request..."
                  className="w-full bg-slate-50 border border-slate-50 rounded-xl p-6 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none min-h-[160px] font-semibold text-base text-slate-800 placeholder:text-slate-300 placeholder:font-normal resize-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {type === "outpass" ? (
                  <>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                        Departure Date
                      </label>
                      <Input
                        type="date"
                        onchangeFunction={handleInputChange(setFromDate)}
                        className="w-full bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-50 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none font-semibold text-base text-slate-800 transition-all cursor-pointer"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                        Expected Return
                      </label>
                      <Input
                        type="date"
                        onchangeFunction={handleInputChange(setToDate)}
                        className="w-full bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-50 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none font-semibold text-base text-slate-800 transition-all cursor-pointer"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                        Exit Time
                      </label>
                      <Input
                        type="time"
                        onchangeFunction={handleInputChange(setFromTime)}
                        className="w-full bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-50 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none font-semibold text-base text-slate-800 transition-all cursor-pointer"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                        Return Window
                      </label>
                      <Input
                        type="time"
                        onchangeFunction={handleInputChange(setToTime)}
                        className="w-full bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-50 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none font-semibold text-base text-slate-800 transition-all cursor-pointer"
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
          <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm">
            <div className="flex gap-4 items-start mb-6">
              <div className="text-blue-500 flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900 text-sm tracking-tight">
                  Authorization Note
                </p>
                <p className="text-slate-500 font-medium text-xs leading-relaxed">
                  Terminal requests are vetted by faculty. All fields are
                  mandatory for successful processing.
                </p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-50">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                Receipt Channel
              </p>
              <p className="text-[13px] font-semibold text-slate-600 truncate">
                {Student?.email}
              </p>
            </div>
          </div>

          <div className="space-y-4 pb-20 md:pb-0">
            <button
              onClick={sendDataToBackend}
              disabled={isLoading}
              className="w-full h-[58px] bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-base transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 flex items-center justify-center gap-3"
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
              className="w-full h-[54px] border border-slate-100 text-slate-400 font-bold text-sm rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Switch to {type === "outing" ? "Outpass" : "Outing"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
