import { useCallback, useEffect, useRef, useState } from "react";
import { Navigation, Search, MapPin, MapPinOff, Loader2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { fetchPlaces } from "../lib/fetchPlaces";
import RouteList from "./RouteList";

export default function Dashboard({
  activeSession,
  passengerName,
  onSuggestStop,
}) {
  const [coords, setCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState("loading");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [waypoints, setWaypoints] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoStatus("ready");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const loadWaypoints = useCallback(async () => {
    const { data, error } = await supabase
      .from("waypoints")
      .select("*")
      .eq("session_id", activeSession.id)
      .order("id", { ascending: true });

    if (!error && data) {
      setWaypoints(data);
    }
  }, [activeSession.id]);

  useEffect(() => {
    loadWaypoints();

    const channel = supabase
      .channel(`waypoints-${activeSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waypoints",
          filter: `session_id=eq.${activeSession.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setWaypoints((prev) => [...prev, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setWaypoints((prev) =>
              prev.map((wp) =>
                wp.id === payload.new.id ? payload.new : wp,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setWaypoints((prev) =>
              prev.filter((wp) => wp.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSession.id, loadWaypoints]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const results = fetchPlaces(
      searchQuery,
      coords?.lat,
      coords?.lng,
    );
    setSuggestions(results);
    setShowDropdown(results.length > 0);
  }, [searchQuery, coords]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPlace = async (place) => {
    setSearchQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    await onSuggestStop(place.place_name, place.latitude, place.longitude);
    await loadWaypoints();
  };

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 px-5 py-5 backdrop-blur-md">
        <p className="text-xs font-medium uppercase tracking-widest text-cyan-400">
          Destination
        </p>
        <div className="mt-1 flex items-center gap-3">
          <Navigation className="h-6 w-6 shrink-0 text-emerald-400" />
          <h1 className="text-xl font-bold text-white">
            {activeSession.destination}
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Riding as{" "}
          <span className="font-medium text-slate-300">{passengerName}</span>
        </p>
      </header>

      <main className="flex-1 space-y-6 px-5 py-6">
        {geoStatus === "loading" && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4 text-slate-400 backdrop-blur-md">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            <span className="text-base">Getting your location…</span>
          </div>
        )}

        {geoStatus === "denied" && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-amber-300 backdrop-blur-md">
            <MapPinOff className="h-5 w-5 shrink-0" />
            <span className="text-base">
              Location access denied — search still works with default coords
            </span>
          </div>
        )}

        <div ref={searchRef} className="relative">
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-cyan-400" />
            <input
              type="text"
              placeholder="Search for a stop…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 py-5 pl-14 pr-5 text-xl text-white placeholder:text-slate-500 backdrop-blur-md focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            />
          </div>

          {showDropdown && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur-lg">
              {suggestions.map((place) => (
                <li key={place.place_name}>
                  <button
                    type="button"
                    onClick={() => handleSelectPlace(place)}
                    className="flex w-full min-h-[4.5rem] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-cyan-400/10 active:bg-cyan-400/20"
                  >
                    <MapPin className="h-5 w-5 shrink-0 text-cyan-400" />
                    <span className="text-lg font-medium text-white">
                      {place.place_name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <section>
          <h2 className="mb-4 text-left text-sm font-medium uppercase tracking-widest text-slate-400">
            Route Stops
          </h2>
          <RouteList waypoints={waypoints} />
        </section>
      </main>
    </div>
  );
}
