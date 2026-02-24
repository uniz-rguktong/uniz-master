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
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <div className="mb-10">
        <button
          onClick={() => navigateTo("/student")}
          className="text-neutral-500 hover:text-black font-bold text-sm flex items-center gap-2 mb-6 transition-colors"
        >
          ← Back to Dashboard
        </button>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-black tracking-tighter mb-2">
              Request {type === "outing" ? "Outing" : "Outpass"}
            </h1>
            <p className="text-neutral-500 font-medium">
              Please fill in the details below for approval.
            </p>
          </div>
          <div className="bg-neutral-50 p-3 rounded-2xl">
            {type === "outpass" ? (
              <svg
                className="w-8 h-8 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white space-y-8">
        {/* Form Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">
              Reason for {type}
            </label>
            <textarea
              onChange={handleInputChange(setReason)}
              placeholder="Please explain why you need to leave..."
              className="w-full bg-neutral-50 p-4 rounded-xl border border-neutral-200 focus:border-black focus:ring-1 focus:ring-black focus:outline-none min-h-[140px] font-medium text-neutral-900 placeholder:text-neutral-400 resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {type === "outpass" ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">
                    From Date
                  </label>
                  <Input
                    type="date"
                    onchangeFunction={handleInputChange(setFromDate)}
                    className="w-full bg-neutral-50 p-4 rounded-xl border border-neutral-200 focus:border-black focus:ring-1 focus:ring-black focus:outline-none font-bold text-lg text-neutral-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">
                    To Date
                  </label>
                  <Input
                    type="date"
                    onchangeFunction={handleInputChange(setToDate)}
                    className="w-full bg-neutral-50 p-4 rounded-xl border border-neutral-200 focus:border-black focus:ring-1 focus:ring-black focus:outline-none font-bold text-lg text-neutral-900 transition-all"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">
                    From Time
                  </label>
                  <Input
                    type="time"
                    onchangeFunction={handleInputChange(setFromTime)}
                    className="w-full bg-neutral-50 p-4 rounded-xl border border-neutral-200 focus:border-black focus:ring-1 focus:ring-black focus:outline-none font-bold text-lg text-neutral-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">
                    To Time
                  </label>
                  <Input
                    type="time"
                    onchangeFunction={handleInputChange(setToTime)}
                    className="w-full bg-neutral-50 p-4 rounded-xl border border-neutral-200 focus:border-black focus:ring-1 focus:ring-black focus:outline-none font-bold text-lg text-neutral-900 transition-all"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 flex gap-4">
          <div className="p-2 bg-black text-white rounded-lg h-fit">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-sm space-y-1">
            <p className="font-bold text-black">Important Request Notes</p>
            <ul className="text-neutral-500 font-medium list-disc ml-4 space-y-1">
              <li>All fields are mandatory.</li>
              <li>
                Updates sent to{" "}
                <span className="text-black font-bold">{Student?.email}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 space-y-4">
          <button
            onClick={sendDataToBackend}
            disabled={isLoading}
            className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "Submit Request"
            )}
          </button>

          <button
            onClick={() =>
              navigateTo(
                `/student/${type === "outing" ? "outpass" : "outing"}/request${type === "outing" ? "outpass" : "outing"}`,
              )
            }
            className="w-full py-4 bg-white border-2 border-neutral-100 text-neutral-600 rounded-xl font-bold hover:bg-neutral-50 hover:text-black hover:border-black transition-all"
          >
            Switch to {type === "outing" ? "Outpass" : "Outing"} Request
          </button>
        </div>
      </div>
    </div>
  );
}
