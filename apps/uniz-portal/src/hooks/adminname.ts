import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { adminUsername } from "../store";

export function useAdminname() {
  const setadminname = useSetRecoilState(adminUsername);

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setadminname(typeof parsed === "string" ? parsed : stored);
      } catch {
        setadminname(stored);
      }
    }
  }, []);
}
