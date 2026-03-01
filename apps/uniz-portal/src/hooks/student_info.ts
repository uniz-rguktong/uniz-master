import { useEffect, useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { student } from "../store";
import { STUDENT_INFO } from "../api/endpoints";
import { apiClient } from "../api/apiClient";
import { useSmartPolling } from "./useSmartPolling";

interface StudentData {
  _id: string;
  name: string;
  email: string;
  username: string;
  gender: string;
  is_in_campus: boolean;
  has_pending_requests: boolean;
}

interface StudentInfoResponse {
  success: boolean;
  student?: StudentData;
  msg?: string;
}

export function useStudentData() {
  const setStudent = useSetRecoilState(student);

  const fetchStudentData = useCallback(async () => {
    const token = localStorage.getItem("student_token");
    if (!token) return;
    try {
      const data = await apiClient<StudentInfoResponse>(STUDENT_INFO);

      if (data && data.success && data.student) {
        //@ts-ignore
        setStudent(data.student);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  }, [setStudent]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  useSmartPolling(fetchStudentData, {
    activeInterval: 300000,
    fallbackInterval: 30000,
  });

  return { refetch: fetchStudentData };
}
