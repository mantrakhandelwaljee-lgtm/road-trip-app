import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function SuggestScreen() {
  const { sessionId, destination } = useLocalSearchParams();
  const [stopName, setStopName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSuggest = async () => {
    if (!stopName.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase.from("stops").insert([
      {
        session_id: sessionId,
        description: stopName,
        status: "pending",
      },
    ]);

    setIsSubmitting(false);

    if (error) {
      Alert.alert("Error", "Could not send suggestion. Try again.");
    } else {
      Alert.alert("Sent!", "Your suggestion has been sent to the driver.");
      setStopName(""); // Clear input
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Heading to: {destination}</Text>
      <Text style={styles.subHeader}>What do you want to add?</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g., Coffee, Gas, Scenic View"
        placeholderTextColor="#64748b"
        value={stopName}
        onChangeText={setStopName}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSuggest}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Suggest Stop</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 24,
    justifyContent: "center",
  },
  header: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  subHeader: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#0f172a",
    padding: 20,
    borderRadius: 16,
    color: "#fff",
    fontSize: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  button: {
    backgroundColor: "#10b981",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
