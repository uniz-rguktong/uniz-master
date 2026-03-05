import { useSetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { is_authenticated, adminUsername, student, resetTokenState } from "../store";
import { clearSession } from "../utils/security";
import { resetStudentDataCache } from "./student_info";

export function useLogout() {
    const setAuth = useSetRecoilState(is_authenticated);
    const setAdmin = useSetRecoilState(adminUsername);
    const setStudent = useSetRecoilState(student);
    const setResetToken = useSetRecoilState(resetTokenState);
    const navigate = useNavigate();

    const logout = () => {
        // 1. Storage & Cookies
        clearSession();

        // 2. Reset /me fetch cache so next login always triggers a fresh call
        resetStudentDataCache();

        // 2. Global State Reset
        setAuth({ is_authnticated: false, type: "" });
        setAdmin(null);
        setStudent({
            _id: "",
            username: "",
            name: "",
            email: "",
            gender: "",
            year: "",
            branch: "",
            section: "",
            roomno: "",
            has_pending_requests: false,
            is_in_campus: true,
            grades: [],
            attendance: [],
            blood_group: "",
            phone_number: "",
            date_of_birth: "",
            father_name: "",
            father_phonenumber: "",
            mother_name: "",
            mother_phonenumber: "",
            outings_list: [],
            outpasses_list: [],
            profile_url: "",
            created_at: "",
            updated_at: "",
        });
        setResetToken(null);

        // 3. Navigation
        navigate("/", { replace: true });
    };

    return { logout };
}
