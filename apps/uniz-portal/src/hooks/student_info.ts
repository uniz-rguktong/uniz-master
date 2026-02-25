import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { student } from "../store";
import { STUDENT_INFO } from "../api/endpoints";
import { apiClient } from "../api/apiClient";

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

  const fetchStudentData = async () => {
    try {
      const data = await apiClient<StudentInfoResponse>(STUDENT_INFO);

      if (data && data.success && data.student) {
        //@ts-ignore
        setStudent(data.student);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("student_token");
    if (token) {
      fetchStudentData();
    }
  }, []);

  return { refetch: fetchStudentData };
}
