import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert } from "react-native";
import * as Linking from "expo-linking";
import MapView, { Marker } from "react-native-maps";
import { supabase } from "@/lib/supabase";
// import { supabase } from "../supabaseClient";

// 1. Define what a Waypoint row looks like from your database
interface Waypoint {
  id: number;
  session_id: string | null;
  place_name: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
}

export default function MapScreen() {
  // 2. Tell the state to expect an array of Waypoints, not "never"
  const [approvedStops, setApprovedStops] = useState<Waypoint[]>([]);

  useEffect(() => {
    fetchApprovedStops();

    const channel = supabase
      .channel("map-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "waypoints",
          filter: "status=eq.approved",
        },
        (payload) => {
          // 👈 Add the 'payload' parameter here
          console.log("Realtime update received:", payload);
          fetchApprovedStops();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchApprovedStops = async () => {
    const { data, error } = await supabase
      .from("waypoints")
      .select("*")
      .eq("status", "approved");

    if (error) {
      console.error("Error fetching stops:", error.message);
      return;
    }

    if (data) {
      // TypeScript is happy now because data matches Waypoint[]
      setApprovedStops(data as Waypoint[]);
    }
  };

  const startTurnByTurnNavigation = () => {
    if (approvedStops.length === 0) {
      Alert.alert("No Stops", "Approve some passenger requests first!");
      return;
    }

    const nextStop = approvedStops[0];
    const googleMapsUrl = `google.navigation:q=${nextStop.latitude},${nextStop.longitude}`;

    Linking.canOpenURL(googleMapsUrl).then((supported) => {
      if (supported) {
        Linking.openURL(googleMapsUrl);
      } else {
        Linking.openURL(
          `maps://app?daddr=${nextStop.latitude},${nextStop.longitude}`,
        );
      }
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 39.8283,
          longitude: -98.5795,
          latitudeDelta: 20.0,
          longitudeDelta: 20.0,
        }}
      >
        {approvedStops.map((stop) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={stop.place_name}
            pinColor="gold"
          />
        ))}
      </MapView>

      <View style={styles.overlayContainer}>
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={startTurnByTurnNavigation}
        >
          <Text style={styles.navigateText}>Start Voice Navigation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  overlayContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  navigateButton: {
    backgroundColor: "#208AEF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  navigateText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
