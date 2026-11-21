import { Link } from "react-router-dom";
import { getAdminSectionPath } from "@/utils/adminSectionRoutes";
import { parseJwt } from "@/utils/security";
import { resolveAdminPortalRole } from "@/utils/adminRole";

export function WebsiteEditorLink() {
  const token = localStorage.getItem("admin_token");
  const role = resolveAdminPortalRole(token ? parseJwt(token) : null);
  if (role !== "webadmin") return null;
  return (
    <p className="mb-4 text-[14px] leading-5 text-text-2">
      <Link
        to={getAdminSectionPath("website_editor")}
        className="font-medium text-head underline-offset-2 hover:underline"
      >
        Open the website editor
      </Link>
    </p>
  );
}
