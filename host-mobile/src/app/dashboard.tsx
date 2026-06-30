import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { supabase } from "@/lib/supabase";
import type { Waypoint } from "@/types/database";

const PASSENGER_WEB_URL =
  process.env.EXPO_PUBLIC_PASSENGER_WEB_URL ??
  "https://road-trip-app-vpb4.vercel.app/";

type Stop = Pick<Waypoint, "id" | "place_name" | "status">;

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default function DashboardScreen() {
  const params = useLocalSearchParams<{
    sessionId: string;
    pin: string;
    destination: string;
  }>();

  const sessionId = param(params.sessionId);
  const pin = param(params.pin);
  const destination = param(params.destination);

  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  const inviteLink = useMemo(() => `${PASSENGER_WEB_URL}/?room=${pin}`, [pin]);

  const fetchPendingStops = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from("stops")
      .select("id, place_name, status")
      .eq("session_id", sessionId)
      .eq("status", "pending");

    if (error) {
      console.error("Failed to fetch stops:", error.message);
      return;
    }

    setStops(data ?? []);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetchPendingStops().finally(() => setLoading(false));

    const channel = supabase
      .channel(`stops:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stops",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as Stop;
            if (row.status === "pending") {
              setStops((prev) =>
                prev.some((s) => s.id === row.id) ? prev : [...prev, row],
              );
            }
            return;
          }

          if (payload.eventType === "UPDATE") {
            const row = payload.new as Stop;
            if (row.status === "pending") {
              setStops((prev) => {
                const exists = prev.some((s) => s.id === row.id);
                if (exists) {
                  return prev.map((s) => (s.id === row.id ? row : s));
                }
                return [...prev, row];
              });
            } else {
              setStops((prev) => prev.filter((s) => s.id !== row.id));
            }
          }

          if (payload.eventType === "DELETE") {
            const row = payload.old as { id: string };
            setStops((prev) => prev.filter((s) => s.id !== row.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchPendingStops]);

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Join our road trip! Scan the QR code or open: ${inviteLink}`,
        url: inviteLink,
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleUpdateStop = async (
    id: string,
    newStatus: "approved" | "rejected",
  ) => {
    const { error } = await supabase
      .from("stops")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      Alert.alert("Update Failed", error.message);
      return;
    }

    setStops((prev) => prev.filter((s) => s.id !== id));
  };

  const renderStop = ({ item }: { item: Stop }) => (
    <View style={styles.stopCard}>
      <Text style={styles.stopName} numberOfLines={2}>
        {item.place_name}
      </Text>
      <View style={styles.stopActions}>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => handleUpdateStop(item.id, "approved")}
          activeOpacity={0.85}
        >
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleUpdateStop(item.id, "rejected")}
          activeOpacity={0.85}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.pinLabel}>ROOM PIN</Text>
        <Text style={styles.pinValue}>{pin || "------"}</Text>

        {destination ? (
          <Text style={styles.destination} numberOfLines={2}>
            → {destination}
          </Text>
        ) : null}

        <View style={styles.qrRow}>
          <View style={styles.qrWrapper}>
            {pin ? (
              <QRCode
                value={inviteLink}
                size={180}
                backgroundColor="#FFFFFF"
                color="#121212"
              />
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareLink}
            activeOpacity={0.85}
          >
            <Text style={styles.shareButtonIcon}>↗</Text>
            <Text style={styles.shareButtonText}>Share{"\n"}Link</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Suggested Stops</Text>

      {loading ? (
        <ActivityIndicator color="#00E676" size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={stops}
          keyExtractor={(item) => item.id}
          renderItem={renderStop}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Waiting for passengers to suggest stops…
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  pinLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 4,
    textAlign: "center",
  },
  pinValue: {
    color: "#00E676",
    fontSize: 72,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 8,
    marginTop: 4,
    textShadowColor: "rgba(0, 230, 118, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  destination: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
    opacity: 0.85,
  },
  qrRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    gap: 20,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#00E676",
  },
  shareButton: {
    backgroundColor: "#1E1E1E",
    borderWidth: 2,
    borderColor: "#00E676",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
    minHeight: 120,
  },
  shareButtonIcon: {
    color: "#00E676",
    fontSize: 36,
    fontWeight: "900",
    marginBottom: 4,
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 26,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    flexGrow: 1,
  },
  stopCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  stopName: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 20,
  },
  stopActions: {
    flexDirection: "row",
    gap: 16,
  },
  approveButton: {
    flex: 1,
    backgroundColor: "#00E676",
    paddingVertical: 22,
    borderRadius: 14,
    alignItems: "center",
  },
  approveButtonText: {
    color: "#000000",
    fontSize: 26,
    fontWeight: "900",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#FF5252",
    paddingVertical: 22,
    borderRadius: 14,
    alignItems: "center",
  },
  rejectButtonText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
  },
  emptyText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 16,
  },
  loader: {
    marginTop: 40,
  },
});
