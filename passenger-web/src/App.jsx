import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  Autocomplete,
} from "@react-google-maps/api";

// Grab the API key from your Vite .env file
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = {
  width: "100%",
  height: "50vh", // Takes up top half of the screen
};

export default function App() {
  const [session, setSession] = useState(null);
  const [directions, setDirections] = useState(null);
  const [passengerLocation, setPassengerLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refs for the Autocomplete search bar
  const autocompleteRef = useRef(null);

  // Load Google Maps API (Includes 'places' library for autocomplete)
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    libraries: ["places"],
  });

  useEffect(() => {
    // 1. Extract the room PIN from the URL (e.g., vercel.app/?room=123456)
    const urlParams = new URLSearchParams(window.location.search);
    const roomPin = urlParams.get("room");

    if (roomPin) {
      joinSession(roomPin);
    } else {
      setLoading(false);
    }
  }, []);

  const joinSession = async (pin) => {
    console.log("🔍 Joining session with PIN:", pin);
    // 2. Fetch the trip destination from Supabase
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("pin", pin)
      .single();

    if (data) {
      console.log("✅ Session found:", data);
      setSession(data);
      getUserLocation(data.destination);
    } else {
      console.error("❌ Session not found", error);
      setLoading(false);
    }
  };

  // Add a ref to store the watch ID so we can clean it up later
  const watchIdRef = useRef(null);

  const getUserLocation = (finalDestination) => {
    if (navigator.geolocation) {
      // Use watchPosition to track movement
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newOrigin = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          setPassengerLocation(newOrigin);
          // Recalculate route whenever the location changes
          calculateRoute(newOrigin, finalDestination);
        },
        (error) => {
          console.error("Location tracking error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
          distanceFilter: 50, // Only refresh if they move at least 50 meters
        },
      );
    }
  };

  // CLEANUP: Stop tracking when the component unmounts
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const calculateRoute = (origin, destination) => {
    // 4. Ask Google Maps to draw the path from the car to the destination
    if (!window.google) return;
    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        }
        setLoading(false);
      },
    );
  };

  const [stops, setStops] = useState([]);

  // Fetch initial stops and listen for driver approvals/rejections
  useEffect(() => {
    if (!session) return;

    const fetchStops = async () => {
      const { data, error } = await supabase
        .from("stops")
        .select("*")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false }); // Newest suggestions first

      if (data) setStops(data);
    };

    fetchStops();

    // The Magic: Real-time listener for the passenger
    const stopSubscription = supabase
      .channel(`stops:${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERTS, UPDATES, and DELETES
          schema: "public",
          table: "stops",
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          // Just re-fetch the list if anything changes
          fetchStops();
        },
      )
      .subscribe();

    return () => supabase.removeChannel(stopSubscription);
  }, [session]);

  const handlePlaceSelect = async () => {
    // 5. When passenger picks a place from the Autocomplete dropdown
    const place = autocompleteRef.current.getPlace();

    if (place && place.geometry) {
      const placeName = place.name;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      console.log("🚀 Sending stop suggestion:", { session_id: session.id, place_name: placeName });

      // 6. Send the suggestion directly to Supabase
      const { data, error } = await supabase.from("stops").insert({
        session_id: session.id,
        place_name: placeName,
        status: "pending",
      }).select();

      if (error) {
        console.error("❌ Failed to insert stop:", error);
        alert(`Failed to send suggestion: ${error.message}`);
      } else {
        console.log("✅ Successfully inserted stop:", data);
        alert(`Sent "${placeName}" to the driver for approval!`);
        // Clear the input field
        document.getElementById("autocomplete-input").value = "";
      }
    }
  };

  if (!isLoaded || loading)
    return (
      // 1. Mint/Teal background gradient replacing the dark zinc
      <div className="flex flex-col h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-slate-800 font-sans overflow-hidden">
        {/* TOP HALF: Map */}
        <div className="w-full h-1/2 relative shadow-inner">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={10}
            center={passengerLocation || { lat: 39.8283, lng: -98.5795 }}
            options={{ disableDefaultUI: true }}
          >
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  polylineOptions: { strokeColor: "#14b8a6", strokeWeight: 6 },
                }} // Teal route line
              />
            )}
          </GoogleMap>
        </div>

        {/* BOTTOM HALF: Suggestion Interface (Glassmorphism) */}
        {/* 2. Translucent white background with heavy backdrop blur */}
        <div className="flex-1 p-6 bg-white/60 backdrop-blur-2xl rounded-t-[40px] -mt-8 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-white flex flex-col">
          {/* Subtle pull-tab UI indicator */}
          <div className="w-12 h-1.5 bg-teal-200/60 rounded-full mx-auto mb-6"></div>

          <h2 className="text-3xl font-extrabold text-teal-950 mb-1 tracking-tight">
            Co-Pilot Dashboard
          </h2>
          <p className="text-sm font-medium text-teal-700/80 mb-8 flex items-center gap-2">
            📍 Heading to:{" "}
            <span className="text-teal-900 font-bold">
              {session.destination}
            </span>
          </p>

          <label className="block text-xs font-bold text-teal-600 uppercase tracking-widest mb-3 pl-1">
            Suggest a Stop
          </label>

          {/* 3. The Input: Bright, soft shadow, with amber focus glow */}
          <div className="relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl mb-6">
            <Autocomplete
              onLoad={(autocomplete) => {
                autocompleteRef.current = autocomplete;
                if (passengerLocation) {
                  const circle = new window.google.maps.Circle({
                    center: passengerLocation,
                    radius: 50000,
                  });
                  autocomplete.setBounds(circle.getBounds());
                }
              }}
              onPlaceChanged={handlePlaceSelect}
            >
              <input
                id="autocomplete-input"
                type="text"
                placeholder="Search food, gas, restrooms..."
                className="w-full bg-white/90 text-slate-800 rounded-2xl p-5 pl-12 border-2 border-transparent focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 text-lg transition-all placeholder:text-slate-400"
              />
            </Autocomplete>
            {/* Magnifying glass emoji acting as an icon */}
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-70">
              🔍
            </span>
          </div>

          {/* 4. Quick Action Chips (Matching the UI proposal) */}
          <div className="flex gap-3 justify-between mt-auto pb-4">
            {["⛽️ Gas", "🍔 Food", "☕️ Coffee"].map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  document.getElementById("autocomplete-input").value =
                    chip.split(" ")[1];
                }}
                className="flex-1 py-3 px-2 bg-white/50 hover:bg-white shadow-sm border border-white/80 rounded-xl text-sm font-bold text-teal-800 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
}
