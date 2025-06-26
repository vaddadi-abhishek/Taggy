// app/PrivacyPolicy.tsx
import React from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Privacy Policy</Text>

        <Text style={styles.updated}>Last updated: June 26, 2025</Text>

        <Text style={styles.p}>
          Taggy is committed to protecting your privacy. This Privacy Policy
          explains how we handle your data, and we've made it easy to
          understand.
        </Text>

        <Text style={styles.heading}>1. No Personal Data Collection</Text>
        <Text style={styles.p}>
          We don’t collect or store your name, email, location, or any
          personally identifiable information. You use Taggy anonymously.
        </Text>

        <Text style={styles.heading}>2. Everything is Stored Locally</Text>
        <Text style={styles.p}>
          All your data – saved bookmarks, manual tags, AI-generated summaries,
          and account tokens – are stored only on your device. We do not use any
          cloud or external database.
        </Text>

        <Text style={styles.heading}>3. OAuth Safety</Text>
        <Text style={styles.p}>
          Connected platforms (like Reddit) use OAuth 2.0. We never see your
          passwords. Access tokens stay on your device and are encrypted.
        </Text>

        <Text style={styles.heading}>4. No AI Server Calls</Text>
        <Text style={styles.p}>
          Any AI features in the app do not send data to external AI models or
          cloud services. Your content never leaves your phone.
        </Text>

        <Text style={styles.heading}>5. Automatic Data Removal</Text>
        <Text style={styles.p}>
          Logging out, disconnecting an account, or uninstalling the app
          deletes all related data – including tags, settings, and tokens.
        </Text>

        <Text style={styles.heading}>6. No Tracking, Ads or Analytics</Text>
        <Text style={styles.p}>
          We don’t use trackers like Google Analytics or show ads. Taggy is
          private, clean, and respectful of your space.
        </Text>

        <Text style={styles.heading}>7. Third-party Responsibility</Text>
        <Text style={styles.p}>
          If there’s a breach on a connected platform (e.g., Reddit), Taggy
          isn’t responsible as we don’t control their systems. We only use their
          public APIs.
        </Text>

        <Text style={styles.heading}>8. Total Transparency</Text>
        <Text style={styles.p}>
          Taggy doesn’t access your data, and everything stays client-side.
          Future updates will continue to follow these privacy-first values.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    color: "#222",
  },
  updated: {
    fontSize: 12,
    color: "#666",
    marginBottom: 20,
  },
  heading: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    color: "#333",
  },
  p: {
    fontSize: 14,
    lineHeight: 22,
    color: "#444",
    marginTop: 8,
  },
});
