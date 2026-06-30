import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function JoinScreen() {
  const [pin, setPin] = useState("");
  const router = useRouter();

  const handleJoin = async () => {
    // 1. Look for a session with this PIN
    const { data, error } = await supabase
      .from("sessions")
      .select("id, destination")
      .eq("pin", pin)
      .single();

    if (error || !data) {
      Alert.alert("Oops", "Invalid PIN. Please check with your driver.");
      return;
    }

    // 2. Navigate to the Suggestion screen with the sessionId
    router.push({
      pathname: "/suggest",
      params: { sessionId: data.id, destination: data.destination },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Trip</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 6-Digit PIN"
        keyboardType="number-pad"
        maxLength={6}
        value={pin}
        onChangeText={setPin}
      />
      <TouchableOpacity style={styles.button} onPress={handleJoin}>
        <Text style={styles.buttonText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 12,
    color: "#fff",
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
