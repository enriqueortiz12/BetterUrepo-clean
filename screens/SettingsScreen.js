"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, Platform, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../lib/supabase"
import GlassmorphicCard from "../components/GlassmorphicCard"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const SettingsScreen = ({ navigation }) => {
  const { signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [useBiometrics, setUseBiometrics] = useState(false)
  const [autoSyncData, setAutoSyncData] = useState(true)
  const [showCalories, setShowCalories] = useState(true)
  const [useMetricSystem, setUseMetricSystem] = useState(false)
  const [saveWorkoutHistory, setSaveWorkoutHistory] = useState(true)

  // Load settings from storage on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await AsyncStorage.getItem("userSettings")
        if (settings) {
          const parsedSettings = JSON.parse(settings)
          setNotificationsEnabled(parsedSettings.notificationsEnabled ?? true)
          setDarkMode(parsedSettings.darkMode ?? true)
          setUseBiometrics(parsedSettings.useBiometrics ?? false)
          setAutoSyncData(parsedSettings.autoSyncData ?? true)
          setShowCalories(parsedSettings.showCalories ?? true)
          setUseMetricSystem(parsedSettings.useMetricSystem ?? false)
          setSaveWorkoutHistory(parsedSettings.saveWorkoutHistory ?? true)
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }

    loadSettings()
  }, [])

  // Save settings to storage when they change
  const saveSettings = async () => {
    try {
      const settings = {
        notificationsEnabled,
        darkMode,
        useBiometrics,
        autoSyncData,
        showCalories,
        useMetricSystem,
        saveWorkoutHistory,
      }
      await AsyncStorage.setItem("userSettings", JSON.stringify(settings))
    } catch (error) {
      console.error("Error saving settings:", error)
      Alert.alert("Error", "Failed to save settings")
    }
  }

  // Save settings whenever they change
  useEffect(() => {
    saveSettings()
  }, [notificationsEnabled, darkMode, useBiometrics, autoSyncData, showCalories, useMetricSystem, saveWorkoutHistory])

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    } catch (error) {
      console.error("Error signing out:", error)
      Alert.alert("Error", "Failed to sign out. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "Are you sure you want to delete your account? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true)
          try {
            const { error } = await supabase.auth.admin.deleteUser((await supabase.auth.getUser()).data.user.id)

            if (error) throw error

            Alert.alert("Account Deleted", "Your account has been successfully deleted.")
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          } catch (error) {
            console.error("Error deleting account:", error)
            Alert.alert("Error", "Failed to delete account. Please try again.")
          } finally {
            setIsLoading(false)
          }
        },
      },
    ])
  }

  const handleClearData = () => {
    Alert.alert(
      "Clear App Data",
      "Are you sure you want to clear all app data? This will reset all settings and delete local data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true)
            try {
              // Clear AsyncStorage
              await AsyncStorage.clear()

              // Reset settings to defaults
              setNotificationsEnabled(true)
              setDarkMode(true)
              setUseBiometrics(false)
              setAutoSyncData(true)
              setShowCalories(true)
              setUseMetricSystem(false)
              setSaveWorkoutHistory(true)

              Alert.alert("Data Cleared", "All app data has been cleared successfully.")
            } catch (error) {
              console.error("Error clearing data:", error)
              Alert.alert("Error", "Failed to clear app data. Please try again.")
            } finally {
              setIsLoading(false)
            }
          },
        },
      ],
    )
  }

  const renderSettingSwitch = (title, value, onValueChange, description = null) => (
    <View style={styles.settingItem}>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#333", true: "rgba(0, 255, 255, 0.5)" }}
        thumbColor={value ? "cyan" : "#f4f3f4"}
        ios_backgroundColor="#333"
      />
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* App Preferences */}
        <GlassmorphicCard style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>

          {renderSettingSwitch("Dark Mode", darkMode, setDarkMode, "Enable dark mode for the app")}

          {renderSettingSwitch(
            "Use Metric System",
            useMetricSystem,
            setUseMetricSystem,
            "Display measurements in metric units (kg, cm)",
          )}

          {renderSettingSwitch("Show Calories", showCalories, setShowCalories, "Show calorie information for workouts")}
        </GlassmorphicCard>

        {/* Notifications */}
        <GlassmorphicCard style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          {renderSettingSwitch(
            "Enable Notifications",
            notificationsEnabled,
            setNotificationsEnabled,
            "Receive workout reminders and updates",
          )}
        </GlassmorphicCard>

        {/* Privacy & Security */}
        <GlassmorphicCard style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>

          {renderSettingSwitch(
            "Auto-sync Data",
            autoSyncData,
            setAutoSyncData,
            "Automatically sync data with the cloud",
          )}

          {renderSettingSwitch(
            "Save Workout History",
            saveWorkoutHistory,
            setSaveWorkoutHistory,
            "Store your workout history on this device",
          )}

          <TouchableOpacity
            style={styles.settingButton}
            onPress={() =>
              Alert.alert(
                "Privacy Policy",
                "Our privacy policy details how we collect, use, and protect your data. Visit our website for more information.",
              )
            }
          >
            <Text style={styles.settingButtonText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#aaa" />
          </TouchableOpacity>
        </GlassmorphicCard>

        {/* Account */}
        <GlassmorphicCard style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.settingButton} onPress={() => navigation.navigate("ProfileTab")}>
            <Text style={styles.settingButtonText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#aaa" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
            <Text style={styles.dangerButtonText}>Clear App Data</Text>
            <Ionicons name="trash-outline" size={20} color="#ff3b5c" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Text style={styles.dangerButtonText}>Delete Account</Text>
            <Ionicons name="warning-outline" size={20} color="#ff3b5c" />
          </TouchableOpacity>
        </GlassmorphicCard>

        {/* About */}
        <GlassmorphicCard style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>2023.11.01</Text>
          </View>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={() =>
              Alert.alert(
                "Terms of Service",
                "By using BetterU, you agree to our terms of service. Visit our website for more information.",
              )
            }
          >
            <Text style={styles.settingButtonText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#aaa" />
          </TouchableOpacity>
        </GlassmorphicCard>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} disabled={isLoading}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
          <Ionicons name="log-out-outline" size={20} color="white" />
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    paddingBottom: 10,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    color: "white",
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    color: "#aaa",
    fontSize: 12,
  },
  settingButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  settingButtonText: {
    color: "white",
    fontSize: 16,
  },
  dangerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  dangerButtonText: {
    color: "#ff3b5c",
    fontSize: 16,
  },
  aboutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  aboutLabel: {
    color: "#aaa",
    fontSize: 16,
  },
  aboutValue: {
    color: "white",
    fontSize: 16,
  },
  signOutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.8)",
    borderRadius: 10,
    paddingVertical: 15,
    marginBottom: 20,
  },
  signOutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
  bottomPadding: {
    height: 80,
  },
})

export default SettingsScreen

