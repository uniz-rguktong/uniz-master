import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import { CLUBS } from "@/api/endpoints";
import {
  modFetch,
  post,
  day,
  inputCls,
  btnCls,
  cardCls,
} from "@/pages/student/placement/api";

/** Clubs: browse, join, coordinators approve members and post events. Staff create clubs. */
export default function Clubs({ staff = false }: { staff?: boolean }) {
  const f = (u: string, i?: RequestInit) =>
    modFetch(`${CLUBS}${u}`, i, staff ? "staff" : "student");
  const [clubs, setClubs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<Record<string, any[]>>({});
  const [nc, setNc] = useState({
    name: "",
    category: "technical",
    description: "",
    coordinators: "",
  });
  const [ev, setEv] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const [c, e] = await Promise.all([f(""), f("/events")]);
      setClubs(c.clubs || []);
      setEvents(e.events || []);
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Clubs are turned off" : e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  if (!isModuleEnabled("CLUBS"))
    return <DisabledState reason="Clubs are turned off" />;
  const run = async (fn: () => Promise<any>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const openMembers = async (id: string) => {
    try {
      setMembers({
        ...members,
        [id]: (await f(`/${id}/members`)).members || [],
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const name = (id: string) => clubs.find((c) => c.id === id)?.name || "";
  return (
    <ModulePage
      title="Clubs"
      description="Student clubs, members and upcoming events. Events also show in the Information Centre."
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      {events.length > 0 && (
        <div className={cardCls}>
          <p className="font-medium">Upcoming events</p>
          {events.map((e) => (
            <p key={e.id} className="text-slate-600">
              {day(e.startsAt)} . {name(e.clubId)} . {e.title}{" "}
              {e.venue ? `. ${e.venue}` : ""}
            </p>
          ))}
        </div>
      )}
      {staff && (
        <div className={`${cardCls} grid gap-2 md:grid-cols-4`}>
          <input
            className={inputCls}
            placeholder="Club name"
            value={nc.name}
            onChange={(e) => setNc({ ...nc, name: e.target.value })}
          />
          <select
            className={inputCls}
            value={nc.category}
            onChange={(e) => setNc({ ...nc, category: e.target.value })}
          >
            {["technical", "cultural", "sports", "social", "other"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            className={inputCls}
            placeholder="Coordinator usernames, comma separated"
            value={nc.coordinators}
            onChange={(e) => setNc({ ...nc, coordinators: e.target.value })}
          />
          <button
            type="button"
            className={btnCls}
            onClick={() =>
              run(
                () =>
                  f(
                    "",
                    post({
                      ...nc,
                      description: nc.description || undefined,
                      coordinators: nc.coordinators
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    }),
                  ),
                "Club created",
              )
            }
          >
            Create club
          </button>
          <textarea
            className={`${inputCls} md:col-span-4`}
            placeholder="Description"
            value={nc.description}
            onChange={(e) => setNc({ ...nc, description: e.target.value })}
          />
        </div>
      )}
      {clubs.map((c) => (
        <div key={c.id} className={`${cardCls} space-y-2`}>
          <div className="flex flex-wrap justify-between gap-2">
            <span>
              <span className="font-medium text-slate-900">{c.name}</span> .{" "}
              {c.category} {c.active ? "" : ". inactive"}
              {c.description && (
                <span className="block text-slate-600">{c.description}</span>
              )}
            </span>
            <span className="flex gap-2">
              {!staff && !c.myStatus && (
                <button
                  type="button"
                  className={btnCls}
                  onClick={() =>
                    run(() => f(`/${c.id}/join`, post()), "Request sent")
                  }
                >
                  Join
                </button>
              )}
              {!staff && c.myStatus && (
                <>
                  <span className="self-center text-slate-600">
                    {c.myStatus}
                  </span>
                  <button
                    type="button"
                    className="rounded-md border px-2"
                    onClick={() =>
                      run(() => f(`/${c.id}/leave`, post()), "Left")
                    }
                  >
                    Leave
                  </button>
                </>
              )}
              {staff && (
                <button
                  type="button"
                  className="rounded-md border px-2"
                  onClick={() =>
                    run(
                      () =>
                        f(`/${c.id}`, {
                          method: "PUT",
                          body: JSON.stringify({ active: !c.active }),
                        }),
                      "Saved",
                    )
                  }
                >
                  {c.active ? "Deactivate" : "Activate"}
                </button>
              )}
              {(staff || c.coordinator) && (
                <button
                  type="button"
                  className="rounded-md border px-2"
                  onClick={() => openMembers(c.id)}
                >
                  Members
                </button>
              )}
            </span>
          </div>
          {(members[c.id] || []).map((m) => (
            <div key={m.id} className="flex justify-between border-t pt-1">
              <span>
                {m.username} . {m.status}
              </span>
              <span className="flex gap-2">
                {["approved", "rejected"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="rounded-md border px-2"
                    onClick={() =>
                      run(
                        () =>
                          f(`/${c.id}/members/${m.id}`, post({ status: s })),
                        "Updated",
                      ).then(() => openMembers(c.id))
                    }
                  >
                    {s}
                  </button>
                ))}
              </span>
            </div>
          ))}
          {(staff || c.coordinator) && (
            <div className="flex flex-wrap gap-2 border-t pt-2">
              <input
                className={inputCls}
                placeholder="Event title"
                value={ev[c.id]?.title || ""}
                onChange={(e) =>
                  setEv({
                    ...ev,
                    [c.id]: { ...ev[c.id], title: e.target.value },
                  })
                }
              />
              <input
                className={inputCls}
                placeholder="Venue"
                value={ev[c.id]?.venue || ""}
                onChange={(e) =>
                  setEv({
                    ...ev,
                    [c.id]: { ...ev[c.id], venue: e.target.value },
                  })
                }
              />
              <input
                className={inputCls}
                type="datetime-local"
                value={ev[c.id]?.startsAt || ""}
                onChange={(e) =>
                  setEv({
                    ...ev,
                    [c.id]: { ...ev[c.id], startsAt: e.target.value },
                  })
                }
              />
              <button
                type="button"
                className={btnCls}
                onClick={() =>
                  run(
                    () =>
                      f(
                        `/${c.id}/events`,
                        post({
                          title: ev[c.id]?.title,
                          venue: ev[c.id]?.venue || undefined,
                          startsAt: ev[c.id]?.startsAt,
                        }),
                      ),
                    "Event posted",
                  )
                }
              >
                Post event
              </button>
            </div>
          )}
        </div>
      ))}
    </ModulePage>
  );
}
