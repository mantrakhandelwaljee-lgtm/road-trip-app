import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";

// Mock Local Search Provider simulating Google Places network response
const mockFetchPlaces = async (query) => {
  await new Promise((resolve) => setTimeout(resolve, 400)); // Simulate network lag
  const locations = [
    {
      name: "Starbucks Coffee",
      address: "123 Main St, Central Route",
      lat: 34.0522,
      lng: -118.2437,
    },
    {
      name: "Shell Gas Station",
      address: "456 Highway 101 West",
      lat: 34.0622,
      lng: -118.2537,
    },
    {
      name: "Grand Canyon Visitor Center",
      address: "AZ-64, Grand Canyon Village",
      lat: 36.0544,
      lng: -112.1401,
    },
    {
      name: "McDonald's Fast Food",
      address: "789 Rest Stop Blvd",
      lat: 34.0722,
      lng: -118.2637,
    },
    {
      name: "Yosemite National Park Valley",
      address: "California Hwy 41",
      lat: 37.8651,
      lng: -119.5383,
    },
  ];
  return locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(query.toLowerCase()) ||
      loc.address.toLowerCase().includes(query.toLowerCase()),
  );
};

export default function PlaceSearch({ onSelectPlace }) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Guard against empty inputs
    if (!input.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // 2. Race Condition Flag: track if this specific lifecycle render loop is active
    let isCurrentRequest = true;
    setIsLoading(true);

    // 3. The Debouncer Implementation
    const debounceTimer = setTimeout(async () => {
      try {
        const data = await mockFetchPlaces(input);

        // Only update state if no newer keystroke has overridden this block execution
        if (isCurrentRequest) {
          setResults(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching places:", error);
        if (isCurrentRequest) setIsLoading(false);
      }
    }, 400); // 400ms delay window

    // 4. Cleanup Lifecycle: Fires automatically when the user types a new character
    return () => {
      isCurrentRequest = false; // Kills old pending race conditions
      clearTimeout(debounceTimer); // Vaporizes the old network timer
    };
  }, [input]);

  return (
    <div className="w-full max-w-md mx-auto relative p-4">
      <label className="block text-sm font-medium text-slate-300 mb-1">
        Suggest a Trip Stop
      </label>

      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a location or point of interest..."
          className="w-full pl-10 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <div className="absolute left-3 top-3.5 text-slate-400">
          <Search size={18} />
        </div>
        {isLoading && (
          <div className="absolute right-3 top-3.5 text-blue-400 animate-spin">
            <Loader2 size={18} />
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {results.length > 0 && (
        <div className="absolute left-4 right-4 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
          {results.map((place, index) => (
            <button
              key={index}
              onClick={() => {
                onSelectPlace(place);
                setInput(place.name);
                setResults([]);
              }}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-700 text-left transition-colors border-b border-slate-700/50 last:border-0"
            >
              <div className="mt-1 text-slate-400 shrink-0">
                <MapPin size={16} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {place.name}
                </div>
                <div className="text-xs text-slate-400">{place.address}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
