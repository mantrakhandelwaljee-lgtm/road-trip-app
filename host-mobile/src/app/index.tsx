import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { openMapsNavigation } from "@/lib/openMapsNavigation";

// Define TypeScript interfaces for Google's Autocomplete response
interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function WelcomeScreen() {
  const [destination, setDestination] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);

  // Grab the API key from your .env file
  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // 1. Fetch Suggestions as the driver types
  const handleSearch = async (text: string) => {
    setDestination(text);

    // Don't waste API calls on 1 or 2 letters
    if (text.length < 3) {
      setPredictions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_API_KEY}`,
      );
      const data = await response.json();

      if (data.status === "OK") {
        setPredictions(data.predictions);
      } else if (data.status === "ZERO_RESULTS") {
        setPredictions([]);
      } else {
        console.error("Google API Error:", data.status, data.error_message);
      }
    } catch (error) {
      console.error("Error fetching places:", error);
    }
  };

  // 2. Lock in the selected destination
  const handleSelectPrediction = (description: string) => {
    setDestination(description);
    setPredictions([]); // Hide the dropdown
    Keyboard.dismiss(); // Close the keyboard
  };

  const handleStartTrip = async () => {
    const trimmed = destination.trim();
    if (!trimmed) {
      Alert.alert(
        "Destination Required",
        "Enter your final destination to start.",
      );
      return;
    }

    setLoading(true);
    const pin = generatePin();

    const { data, error } = await supabase
      .from("sessions")
      .insert({ pin, destination: trimmed })
      .select("id")
      .single();

    setLoading(false);

    if (error || !data) {
      Alert.alert(
        "Could Not Start Trip",
        error?.message ?? "Please try again.",
      );
      return;
    }

    router.push({
      pathname: "/dashboard",
      params: {
        sessionId: data.id,
        pin,
        destination: trimmed,
      },
    });

    openMapsNavigation(trimmed).catch(() => {
      Alert.alert(
        "Maps Unavailable",
        "Could not open a maps app. You can still share the room PIN from the dashboard.",
      );
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.title}>RoadTrip Host</Text>
        <Text style={styles.subtitle}>Where are you headed?</Text>

        <Text style={styles.label}>Final Destination</Text>

        {/* Search Input */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Las Vegas, NV"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={destination}
            onChangeText={handleSearch}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!loading}
          />

          {/* Autocomplete Dropdown */}
          {predictions.length > 0 && (
            <View style={styles.dropdownContainer}>
              <FlatList
                data={predictions}
                keyExtractor={(item) => item.place_id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.predictionRow}
                    onPress={() => handleSelectPrediction(item.description)}
                  >
                    <Text style={styles.predictionMainText} numberOfLines={1}>
                      {item.structured_formatting.main_text}
                    </Text>
                    <Text style={styles.predictionSubText} numberOfLines={1}>
                      {item.structured_formatting.secondary_text}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.startButton, loading && styles.startButtonDisabled]}
          onPress={handleStartTrip}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#000" size="large" />
          ) : (
            <Text style={styles.startButtonText}>Start New Trip</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 48,
  },
  label: {
    color: "#00E676",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 40,
    zIndex: 10, // Ensures the dropdown floats over other elements
  },
  input: {
    backgroundColor: "#1E1E1E",
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "600",
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(0, 230, 118, 0.35)",
  },
  dropdownContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 8,
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(0, 230, 118, 0.35)",
    maxHeight: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    overflow: "hidden",
  },
  predictionRow: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  predictionMainText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  predictionSubText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "500",
  },
  startButton: {
    backgroundColor: "#00E676",
    paddingVertical: 28,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#00E676",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 20,
    elevation: 12,
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonText: {
    color: "#000000",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
