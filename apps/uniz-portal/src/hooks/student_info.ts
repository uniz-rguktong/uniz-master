import { useEffect, useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { student, studentAuthLoading } from "../store";
import { STUDENT_INFO } from "../api/endpoints";
import { apiClient } from "../api/apiClient";

let lastFetchTime = 0;
let fetchPromise: Promise<any> | null = null;
let globalSetStudent: any = null;
let globalSetAuthLoading: any = null;
let isPollingStarted = false;

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
  const setAuthLoading = useSetRecoilState(studentAuthLoading);

  // Keep references to the latest setters for the global interval
  useEffect(() => {
    globalSetStudent = setStudent;
    globalSetAuthLoading = setAuthLoading;
  }, [setStudent, setAuthLoading]);

  const fetchStudentData = useCallback(async (force = false) => {
    const token = localStorage.getItem("student_token");
    if (!token) {
      // No token – nothing to wait for, stop loading immediately
      setAuthLoading(false);
      return;
    }

    const now = Date.now();
    // Prevent duplicate calls. If not forced, skip if less than 60s since last fetch
    if (!force && now - lastFetchTime < 60000) {
      return fetchPromise;
    }

    if (fetchPromise) return fetchPromise;

    fetchPromise = apiClient<StudentInfoResponse>(STUDENT_INFO, {}, false)
      .then((data) => {
        if (data && data.success && data.student) {
          lastFetchTime = Date.now();
          if (globalSetStudent) {
            globalSetStudent(data.student);
          } else {
            //@ts-ignore
            setStudent(data.student);
          }
        }
      })
      .catch((error) => console.error("Error fetching student data:", error))
      .finally(() => {
        fetchPromise = null;
        // Mark auth loading as done — the /me call has resolved (success or fail)
        if (globalSetAuthLoading) {
          globalSetAuthLoading(false);
        } else {
          setAuthLoading(false);
        }
      });

    return fetchPromise;
  }, [setStudent, setAuthLoading]);

  useEffect(() => {
    fetchStudentData();

    if (!isPollingStarted) {
      isPollingStarted = true;
      // Start global polling exactly every 1 minute
      setInterval(() => {
        const token = localStorage.getItem("student_token");
        if (token && globalSetStudent) {
          apiClient<StudentInfoResponse>(STUDENT_INFO, {}, false)
            .then((data) => {
              if (data && data.success && data.student) {
                lastFetchTime = Date.now();
                globalSetStudent(data.student);
              }
            })
            .catch(console.error);
        }
      }, 60000);
    }
  }, [fetchStudentData]);

  return { refetch: () => fetchStudentData(true) };
}
