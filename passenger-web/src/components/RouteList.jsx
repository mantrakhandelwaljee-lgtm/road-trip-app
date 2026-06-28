import { MapPin, User } from "lucide-react";

function StatusBadge({ status }) {
  if (status === "approved") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-emerald-400">
        Approved
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border border-red-400/40 bg-red-500/20 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-red-400">
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 animate-pulse items-center rounded-full border border-amber-400/40 bg-amber-400/20 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-amber-400">
      Pending
    </span>
  );
}

export default function RouteList({ waypoints }) {
  if (waypoints.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-6 py-12 text-center backdrop-blur-md">
        <MapPin className="mx-auto mb-3 h-8 w-8 text-slate-600" />
        <p className="text-lg text-slate-500">No stops suggested yet</p>
        <p className="mt-1 text-sm text-slate-600">
          Search above to suggest your first stop
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {waypoints.map((waypoint) => (
        <li
          key={waypoint.id}
          className="flex min-h-[5rem] items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4 backdrop-blur-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
            <MapPin className="h-6 w-6 text-cyan-400" />
          </div>

          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-lg font-semibold text-white">
              {waypoint.place_name}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-400">
              <User className="h-3.5 w-3.5 shrink-0" />
              {waypoint.suggested_by}
            </p>
          </div>

          <StatusBadge status={waypoint.status} />
        </li>
      ))}
    </ul>
  );
}
