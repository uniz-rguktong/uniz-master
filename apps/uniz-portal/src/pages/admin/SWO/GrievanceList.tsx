import { useState, useEffect, useCallback } from "react";
import { toast } from "@/utils/toast-ref";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Search,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  GET_GRIEVANCES_LIST,
  DELETE_GRIEVANCE,
  DELETE_ALL_GRIEVANCES,
  RESOLVE_GRIEVANCE,
} from "../../../api/endpoints";
import { apiClient } from "../../../api/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, type TableColumn } from "@/components/ui/table";
import { StatTile } from "@/components/ui/tile";
import { Tabs } from "@/components/ui/tabs";
import { adminInputClass, adminPageWrapClass } from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";

interface Grievance {
  id: string;
  username?: string | null;
  studentId?: string | null;
  studentName?: string | null;
  studentEmail?: string | null;
  studentBranch?: string | null;
  studentYear?: string | null;
  studentPhone?: string | null;
  category: string;
  description: string;
  isAnonymous: boolean;
  status: "Pending" | "Resolved" | "In Progress";
  createdAt: string;
}

function studentDisplayName(g: Grievance) {
  return g.studentName || g.username || g.studentId || "Unknown student";
}

function studentMetaLine(g: Grievance) {
  const parts = [
    g.username || g.studentId,
    g.studentBranch,
    g.studentYear,
  ].filter(Boolean);
  return parts.join(" • ");
}

export default function GrievanceList() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const fetchGrievances = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient<Grievance[]>(GET_GRIEVANCES_LIST, {
        method: "GET",
      });

      if (Array.isArray(data)) {
        setGrievances(data);
      } else {
        setGrievances([]);
      }
    } catch (error) {
      console.error("Error fetching grievances:", error);
      toast.error("Failed to load grievances.");
      setGrievances([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrievances();
  }, [fetchGrievances]);

  const handleResolve = async (id: string) => {
    if (
      !window.confirm(
        "Mark this grievance as resolved? Verified students will receive an email update.",
      )
    ) {
      return;
    }
    setResolvingId(id);
    try {
      const token =
        localStorage.getItem("admin_token") ||
        localStorage.getItem("faculty_token");
      const res = await fetch(RESOLVE_GRIEVANCE(id), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${(token || "").replace(/^"|"$/g, "")}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to resolve grievance");
      }
      toast.success(
        data.message || "Grievance marked as resolved.",
      );
      fetchGrievances();
    } catch (error: any) {
      toast.error(error.message || "Failed to resolve grievance");
    } finally {
      setResolvingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this grievance?"))
      return;
    try {
      await apiClient(DELETE_GRIEVANCE(id), { method: "DELETE" });
      toast.success("Grievance deleted");
      fetchGrievances();
    } catch (error) {
      toast.error("Failed to delete grievance");
    }
  };

  const handleDeleteAll = async () => {
    if (
      !window.confirm(
        "Are you sure you want to wipe ALL grievances from the database? This cannot be undone.",
      )
    )
      return;
    try {
      await apiClient(DELETE_ALL_GRIEVANCES, { method: "DELETE" });
      toast.success("All grievances cleared");
      fetchGrievances();
    } catch (error) {
      toast.error("Failed to clear grievances");
    }
  };

  const filteredGrievances = grievances.filter((g) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (g.description || "").toLowerCase().includes(q) ||
      (g.username || "").toLowerCase().includes(q) ||
      (g.studentId || "").toLowerCase().includes(q) ||
      (g.studentName || "").toLowerCase().includes(q) ||
      (g.studentEmail || "").toLowerCase().includes(q);
    const matchesCategory =
      filterCategory === "All" || g.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    "All",
    "Hostel",
    "Mess",
    "Academic",
    "Infrastructure",
    "Other",
  ];

  const statusTone = (status: Grievance["status"]) =>
    status === "Resolved" ? "success" : status === "Pending" ? "warning" : "neutral";

  const renderActions = (g: Grievance) => (
    <span className="flex items-center gap-2">
      {g.status !== "Resolved" ? (
        <Button
          type="button"
          size="compact"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            handleResolve(g.id);
          }}
          disabled={resolvingId === g.id}
        >
          <CheckCircle2 size={16} />
          {resolvingId === g.id ? "..." : "Resolve"}
        </Button>
      ) : null}
      <Button
        type="button"
        size="icon"
        variant="destructive"
        aria-label="Delete grievance"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(g.id);
        }}
      >
        <Trash2 size={16} />
      </Button>
    </span>
  );

  const columns: TableColumn<Grievance>[] = [
    {
      id: "student",
      header: "Student Context",
      primary: true,
      cell: (g) => (
        <span>
          <span className="block font-semibold text-head">
            {g.isAnonymous ? "Anonymous" : studentDisplayName(g)}
          </span>
          <span className="mt-0.5 block text-small text-text-2">
            {g.isAnonymous
              ? "Identity Protected"
              : studentMetaLine(g) || "Verified Student"}
          </span>
          {!g.isAnonymous && g.studentEmail ? (
            <span className="mt-0.5 block text-caption text-text-2">{g.studentEmail}</span>
          ) : null}
          <span className="mt-2 flex sm:hidden">{renderActions(g)}</span>
        </span>
      ),
    },
    {
      id: "category",
      header: "Classification",
      meta: true,
      cell: (g) => (
        <span className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{g.category}</Badge>
          <Badge tone={statusTone(g.status)} icon={g.status === "In Progress" ? Clock : undefined}>
            {g.status}
          </Badge>
        </span>
      ),
    },
    {
      id: "statement",
      header: "Statement",
      cell: (g) => (
        <span className="line-clamp-2 max-w-xs text-dense text-text-2">"{g.description}"</span>
      ),
    },
    {
      id: "when",
      header: "Temporal Log",
      meta: true,
      cell: (g) => (
        <span className="tabular-nums text-dense text-text">
          {new Date(g.createdAt).toLocaleDateString()}{" "}
          {new Date(g.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Action",
      label: "Action",
      cell: (g) => <span className="hidden sm:flex">{renderActions(g)}</span>,
    },
  ];

  return (
    <div className={cn(adminPageWrapClass, "pb-16")}>
      <PageHeader
        title="Student Grievances"
        meta="Official dashboard for monitoring and addressing institutional feedback."
        action={
          <Button type="button" variant="outline" onClick={fetchGrievances}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Sync Records
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatTile label="Total Reports" value={grievances.length} />
        <StatTile
          label="Active Tickets"
          value={grievances.filter((g) => g.status === "Pending").length}
          status="warning"
          icon={Clock}
          line="Pending"
        />
        <StatTile
          label="Resolved Actions"
          value={grievances.filter((g) => g.status === "Resolved").length}
          status="success"
          icon={CheckCircle2}
          line="Resolved"
        />
      </div>

      <div className="flex flex-col gap-4">
        <label className="relative block max-w-md">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-3"
            size={18}
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search by name, ID, email, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(adminInputClass, "pl-11")}
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            label="Category"
            tabs={categories.map((cat) => ({ id: cat, label: cat }))}
            value={filterCategory}
            onChange={setFilterCategory}
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            variant="destructive"
            size="compact"
            onClick={handleDeleteAll}
            disabled={grievances.length === 0}
          >
            <Trash2 size={16} />
            Clear all
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-body text-text-2">Accessing Database...</p>
      ) : (
        <Table
          columns={columns}
          rows={filteredGrievances}
          getRowId={(g) => g.id}
          empty={
            <EmptyState
              title="Null Set: No Grievances Found"
              body="Your search parameters did not yield any records from the database. Try adjusting your filters."
              icon={MessageSquare}
            />
          }
        />
      )}
    </div>
  );
}
