import { useLogout } from "../../../hooks/useLogout";
import LibraryAdmin from "./LibraryAdmin";

/** Landing page for the librarian admin role. */
export default function LibrarianDashboard() {
  const { logout } = useLogout();
  return (
 <div className="min-h-screen bg-slate-50">
 <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
 <span className="font-semibold text-slate-900">Library Desk</span>
        <button
          type="button"
          onClick={() => logout()}
 className="rounded-md border border-slate-300 px-3 py-1 text-sm"
        >
          Sign out
        </button>
      </header>
      <LibraryAdmin />
    </div>
  );
}
