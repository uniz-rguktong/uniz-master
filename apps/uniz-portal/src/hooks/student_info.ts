import { useEffect, useCallback } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { student, studentAuthLoading, studentProfileError } from "../store";
import { STUDENT_BOOTSTRAP } from "../api/endpoints";
import { apiClient } from "../api/apiClient";
import {
  clearAllStudentSessionCaches,
  getActiveStudentUsername,
  readBootstrapCache,
  writeBootstrapCache,
  writeProfileCache,
} from "../utils/studentSessionCache";
import { seedAcademicCachesFromBootstrap } from "../utils/academicCache";
import { asAttendanceList, asGradeList } from "../utils/bootstrapNormalize";

const PROFILE_LOAD_ERROR =
  "We couldn't load your profile. Please try again.";
const NETWORK_ERROR =
  "Network connection error. Please check your internet.";

let lastFetchTime = 0;
let fetchPromise: Promise<any> | null = null;
let globalSetStudent: any = null;
let globalSetAuthLoading: any = null;
let globalSetProfileError: any = null;
let isPollingStarted = false;

function setProfileErrorMessage(message: string | null) {
  const setter = globalSetProfileError;
  if (setter) setter(message);
}

function applyBootstrapToState(
  payload: {
    student?: Record<string, unknown>;
    grades?: unknown;
    attendance?: unknown;
  },
  setStudent: (v: any) => void,
) {
  if (!payload.student) return;
  const merged = {
    ...payload.student,
    grades: asGradeList(
      payload.grades ?? (payload.student as { grades?: unknown }).grades,
    ),
    attendance: asAttendanceList(
      payload.attendance ??
        (payload.student as { attendance?: unknown }).attendance,
    ),
  };
  setStudent(merged);
}

/** Call on logout to clear deduplication + scoped caches. */
export function resetStudentDataCache() {
  lastFetchTime = 0;
  fetchPromise = null;
  setProfileErrorMessage(null);
  clearAllStudentSessionCaches();
}

interface BootstrapResponse {
  success: boolean;
  student?: Record<string, unknown>;
  grades?: unknown;
  attendance?: unknown;
  source?: string;
}

export function useStudentData() {
  const setStudent = useSetRecoilState(student);
  const setAuthLoading = useSetRecoilState(studentAuthLoading);
  const setProfileError = useSetRecoilState(studentProfileError);
  const error = useRecoilValue(studentProfileError);

  useEffect(() => {
    globalSetStudent = setStudent;
    globalSetAuthLoading = setAuthLoading;
    globalSetProfileError = setProfileError;
  }, [setStudent, setAuthLoading, setProfileError]);

  const fetchStudentData = useCallback(
    async (force = false) => {
      const owner = getActiveStudentUsername();
      if (!owner) {
        setAuthLoading(false);
        setProfileError(null);
        return;
      }

      const cachedStale = readBootstrapCache(owner, true);
      if (cachedStale?.student) {
        const setter = globalSetStudent ?? setStudent;
        applyBootstrapToState(cachedStale, setter);
        setProfileError(null);
        setAuthLoading(false);

        if (!force && readBootstrapCache(owner, false)?.student) {
          return;
        }
      }

      const now = Date.now();
      if (!force && now - lastFetchTime < 60000) {
        return fetchPromise;
      }

      if (fetchPromise) return fetchPromise;

      fetchPromise = apiClient<BootstrapResponse>(STUDENT_BOOTSTRAP, {}, false)
        .then((data) => {
          if (data && data.success && data.student) {
            lastFetchTime = Date.now();
            const payload = {
              student: data.student,
              grades: data.grades,
              attendance: data.attendance,
            };
            writeBootstrapCache(owner, payload);
            writeProfileCache(owner, data.student);
            const year = String(data.student.year || "E4");
            seedAcademicCachesFromBootstrap(
              owner,
              year,
              data.grades,
              data.attendance,
            );
            const setter = globalSetStudent ?? setStudent;
            applyBootstrapToState(payload, setter);
            setProfileErrorMessage(null);
          } else {
            setProfileErrorMessage(PROFILE_LOAD_ERROR);
          }
        })
        .catch((err) => {
          console.error("Error fetching student bootstrap:", err);
          const message =
            err?.message?.toLowerCase?.().includes("fetch") ||
            err?.name === "TypeError"
              ? NETWORK_ERROR
              : PROFILE_LOAD_ERROR;
          setProfileErrorMessage(message);
        })
        .finally(() => {
          fetchPromise = null;
          const loadingSetter = globalSetAuthLoading ?? setAuthLoading;
          loadingSetter(false);
        });

      return fetchPromise;
    },
    [setStudent, setAuthLoading, setProfileError],
  );

  useEffect(() => {
    fetchStudentData();

    if (!isPollingStarted) {
      isPollingStarted = true;
      setInterval(() => {
        const owner = getActiveStudentUsername();
        if (owner && globalSetStudent) {
          apiClient<BootstrapResponse>(STUDENT_BOOTSTRAP, {}, false)
            .then((data) => {
              if (data && data.success && data.student) {
                lastFetchTime = Date.now();
                const payload = {
                  student: data.student,
                  grades: data.grades,
                  attendance: data.attendance,
                };
                writeBootstrapCache(owner, payload);
                applyBootstrapToState(payload, globalSetStudent);
                setProfileErrorMessage(null);
              }
            })
            .catch(() => {
              /* silent background poll */
            });
        }
      }, 60000);
    }
  }, [fetchStudentData]);

  return { refetch: () => fetchStudentData(true), error };
}
