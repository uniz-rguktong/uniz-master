/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

import { Input, Textarea } from "../../components/Input";
import { Button } from "@/components/Button";
import { Alert } from "@/components/ui/alert";
import { useNavigate } from "react-router";
import { useRecoilValue } from "recoil";
import { student } from "../../store";
import { useStudentData } from "../../hooks/student_info";
import { REQUEST_OUTING, REQUEST_OUTPASS } from "../../api/endpoints";
import { useIsAuth } from "../../hooks/is_authenticated";
import { apiClient } from "../../api/apiClient";
import { toast } from "@/utils/toast-ref";

type RequestCompProps = {
  type: "outpass" | "outing";
};

const modalTitleClass =
  "font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head";

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
    <div className="mx-auto w-full max-w-[640px]">
      <Button
        type="button"
        variant="ghost"
        size="compact"
        className="mb-4"
        onClick={() => navigateTo("/student")}
      >
        Back
      </Button>

      <div className="rounded-xl border border-border bg-panel p-6 min-[821px]:p-8">
        <h2 className={modalTitleClass}>
          Request {type === "outing" ? "outing" : "outpass"}
        </h2>
        <p className="mt-2 text-body text-text-2">
          Faculty review this request. All fields are required.
        </p>

        <div className="mt-6 space-y-4">
          <Textarea
            label="Reason"
            onChange={handleInputChange(setReason)}
            placeholder="Clearly explain the purpose of your request..."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {type === "outpass" ? (
              <>
                <Input
                  label="From"
                  type="date"
                  onchangeFunction={handleInputChange(setFromDate)}
                />
                <Input
                  label="To"
                  type="date"
                  onchangeFunction={handleInputChange(setToDate)}
                />
              </>
            ) : (
              <>
                <Input
                  label="From"
                  type="time"
                  onchangeFunction={handleInputChange(setFromTime)}
                />
                <Input
                  label="To"
                  type="time"
                  onchangeFunction={handleInputChange(setToTime)}
                />
              </>
            )}
          </div>

          <Alert tone="neutral" title="Where updates are sent">
            {Student?.email}
          </Alert>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigateTo(
                  `/student/${type === "outing" ? "outpass" : "outing"}/request${type === "outing" ? "outpass" : "outing"}`,
                )
              }
            >
              Switch to {type === "outing" ? "outpass" : "outing"}
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={isLoading}
              onClick={sendDataToBackend}
            >
              Submit request
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
