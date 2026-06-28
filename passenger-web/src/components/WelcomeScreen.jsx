import { MapPin, User, Car } from "lucide-react";

export default function WelcomeScreen({
  pin,
  setPin,
  passengerName,
  setPassengerName,
  onJoin,
  isJoining,
  joinError,
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12">
      <div className="mb-10 flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/30 bg-slate-900/60 shadow-lg shadow-cyan-400/10 backdrop-blur-md">
          <Car className="h-10 w-10 text-cyan-400" strokeWidth={2} />
        </div>
        <h1 className="text-center text-4xl font-bold tracking-tight text-white">
          RoadTrip
        </h1>
        <p className="max-w-xs text-center text-lg text-slate-400">
          Join your driver&apos;s trip and suggest stops along the way
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="space-y-3">
          <label
            htmlFor="pin"
            className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-cyan-400"
          >
            <MapPin className="h-4 w-4" />
            Room PIN
          </label>
          <input
            id="pin"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-5 text-center text-4xl font-bold tracking-[0.4em] text-white placeholder:text-slate-600 backdrop-blur-md focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
          />
        </div>

        <div className="space-y-3">
          <label
            htmlFor="name"
            className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-emerald-400"
          >
            <User className="h-4 w-4" />
            Your Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Passenger name"
            value={passengerName}
            onChange={(e) => setPassengerName(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-5 text-xl text-white placeholder:text-slate-600 backdrop-blur-md focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
          />
        </div>

        {joinError && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-base text-red-400">
            {joinError}
          </p>
        )}

        <button
          type="button"
          onClick={onJoin}
          disabled={isJoining || pin.length !== 6 || !passengerName.trim()}
          className="w-full rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 px-6 py-6 text-xl font-bold text-white shadow-lg shadow-cyan-400/20 backdrop-blur-md transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:border-cyan-400/60 enabled:hover:shadow-cyan-400/30"
        >
          {isJoining ? "Joining…" : "Join Road Trip"}
        </button>
      </div>
    </div>
  );
}
