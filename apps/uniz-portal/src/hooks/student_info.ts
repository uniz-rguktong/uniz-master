import { useEffect, useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { student, studentAuthLoading } from "../store";
import { STUDENT_INFO } from "../api/endpoints";
import { apiClient } from "../api/apiClient";

const CACHE_KEY = "uniz_student_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes — background refresh after this

let lastFetchTime = 0;
let fetchPromise: Promise<any> | null = null;
let globalSetStudent: any = null;
let globalSetAuthLoading: any = null;
let isPollingStarted = false;

/** Read from localStorage cache */
function readCache(): { data: any; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Write to localStorage cache */
function writeCache(data: any) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Storage quota — silently ignore
  }
}

/** Call this on logout to clear the deduplication cache. */
export function resetStudentDataCache() {
  lastFetchTime = 0;
  fetchPromise = null;
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

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

  const fetchStudentData = useCallback(
    async (force = false) => {
      const token = localStorage.getItem("student_token");
      if (!token) {
        setAuthLoading(false);
        return;
      }

      // ── Instant cache rehydration ──────────────────────────────────────────
      const cached = readCache();
      if (cached && cached.data) {
        // Push cached data immediately — UI renders without waiting for network
        const setter = globalSetStudent ?? setStudent;
        setter(cached.data);

        // If the cache is fresh enough and not forced, skip the network call
        if (!force && Date.now() - cached.timestamp < CACHE_TTL) {
          const loadingSetter = globalSetAuthLoading ?? setAuthLoading;
          loadingSetter(false);
          return;
        }
        // Cache is stale — still show cached data but fetch in background
        const loadingSetter = globalSetAuthLoading ?? setAuthLoading;
        loadingSetter(false); // Don't block UI — data already shown from cache
      }
      // ── End instant cache rehydration ─────────────────────────────────────

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
            writeCache(data.student); // ← persist to localStorage
            const setter = globalSetStudent ?? setStudent;
            setter(data.student);
          }
        })
        .catch((error) => console.error("Error fetching student data:", error))
        .finally(() => {
          fetchPromise = null;
          const loadingSetter = globalSetAuthLoading ?? setAuthLoading;
          loadingSetter(false);
        });

      return fetchPromise;
    },
    [setStudent, setAuthLoading],
  );

  useEffect(() => {
    fetchStudentData();

    if (!isPollingStarted) {
      isPollingStarted = true;
      setInterval(() => {
        const token = localStorage.getItem("student_token");
        if (token && globalSetStudent) {
          apiClient<StudentInfoResponse>(STUDENT_INFO, {}, false)
            .then((data) => {
              if (data && data.success && data.student) {
                lastFetchTime = Date.now();
                writeCache(data.student);
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
