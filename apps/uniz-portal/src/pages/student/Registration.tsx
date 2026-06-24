/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRecoilValue } from "recoil";
import { student } from "../../store";
import MySubjects from "./components/MySubjects";

export default function Registration() {
  const userData = useRecoilValue<any>(student);
  const studentId = (
    userData?.username ||
    localStorage.getItem("username") ||
    ""
  ).replace(/"/g, "");

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <MySubjects
        studentId={studentId}
        branch={userData?.branch || userData?.department || ""}
        year={userData?.year || ""}
      />
    </div>
  );
}
