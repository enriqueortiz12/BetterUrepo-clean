"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions,
  SafeAreaView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext"
import { workoutCategories } from "../data/workoutData"
import { trainingStyles } from "../data/trainingStylesData"
import GlassmorphicCard from "../components/GlassmorphicCard"
import ScrollableFilters from "../components/ScrollableFilters"
import HoverButton from "../components/HoverButton"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const HomeScreen = ({ navigation }) => {
  // Update the destructuring of userProfile with a default empty object
  const { userProfile = {} } = useUser() || { userProfile: {} }
  const [stats, setStats] = useState({
    workouts: 0,
    minutes: 0,
    prs: 0,
    isLoading: true,
  })

  // Function to calculate stats
  const calculateStats = async () => {
    try {
      setStats((prev) => ({ ...prev, isLoading: true }))

      // Get workout logs
      const workoutLogsJson = await AsyncStorage.getItem("workoutLogs")
      let workoutLogs = []
      if (workoutLogsJson) {
        try {
          workoutLogs = JSON.parse(workoutLogsJson)
          if (!Array.isArray(workoutLogs)) workoutLogs = []
        } catch (e) {
          console.error("Error parsing workout logs:", e)
          workoutLogs = []
        }
      }

      // Get personal records
      const personalRecordsJson = await AsyncStorage.getItem("personalRecords")
      let personalRecords = []
      if (personalRecordsJson) {
        try {
          personalRecords = JSON.parse(personalRecordsJson)
          if (!Array.isArray(personalRecords)) personalRecords = []
        } catch (e) {
          console.error("Error parsing personal records:", e)
          personalRecords = []
        }
      }

      // Calculate total workouts
      const totalWorkouts = workoutLogs.length

      // Calculate total minutes
      let totalMinutes = 0
      workoutLogs.forEach((log) => {
        if (log.duration) {
          // Parse duration in format "MM:SS" or "HH:MM:SS"
          const parts = log.duration.split(":").map(Number)
          if (parts.length === 2) {
            // MM:SS format
            totalMinutes += parts[0]
          } else if (parts.length === 3) {
            // HH:MM:SS format
            totalMinutes += parts[0] * 60 + parts[1]
          }
        }
      })

      // Calculate PRs this month
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()

      const prsThisMonth = personalRecords.filter((pr) => {
        if (!pr.date) return false
        const prDate = new Date(pr.date)
        return prDate.getMonth() === currentMonth && prDate.getFullYear() === currentYear
      }).length

      setStats({
        workouts: totalWorkouts,
        minutes: totalMinutes,
        prs: prsThisMonth,
        isLoading: false,
      })
    } catch (error) {
      console.error("Error calculating stats:", error)
      setStats({
        workouts: 0,
        minutes: 0,
        prs: 0,
        isLoading: false,
      })
    }
  }

  // Calculate stats on initial load
  useEffect(() => {
    calculateStats()
  }, [])

  // Recalculate stats when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      calculateStats()
    })
    return unsubscribe
  }, [navigation])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  // Update the getFirstName function to be more robust
  const getFirstName = () => {
    if (!userProfile) return ""
    if (typeof userProfile.name !== "string") return ""
    return userProfile.name.split(" ")[0] || ""
  }

  // Make sure trainingStyleOptions is properly defined
  const trainingStyleOptions = [
    { label: "Strength Training", value: "strength" },
    { label: "Hypertrophy", value: "hypertrophy" },
    { label: "General Fitness", value: "general" },
    { label: "Powerlifting", value: "powerlifting" },
    { label: "Olympic Weightlifting", value: "olympic" },
    { label: "Athleticism", value: "athleticism" },
  ]

  // Safely access workout categories and ensure they exist
  const safeWorkoutCategories = workoutCategories || []
  const safeTrainingStyles = trainingStyles || []

  const handleTrainingStyleSelect = (value) => {
    if (value && navigation && navigation.navigate) {
      navigation.navigate("WorkoutTab", { selectedStyle: value })
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Compact Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoSmallContainer}>
              <Image source={require("../assets/logo.png")} style={styles.logoSmall} resizeMode="contain" />
            </View>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.name}>{getFirstName() || "Fitness Enthusiast"}</Text>
            </View>
          </View>
          <HoverButton
            style={styles.notificationButton}
            onPress={() => {}}
            activeOpacity={0.7}
            hoverColor="rgba(255, 255, 255, 0.2)"
          >
            <Ionicons name="notifications-outline" size={24} color="white" />
          </HoverButton>
        </View>

        {/* Main Content ScrollView */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={true}
          alwaysBounceVertical={true}
        >
          {/* Goal Prompt (if needed) */}
          {!userProfile.goal && (
            <HoverButton
              style={styles.goalPrompt}
              onPress={() => navigation.navigate("Goals")}
              activeOpacity={0.8}
              hoverColor="rgba(0, 255, 255, 0.15)"
            >
              <View style={styles.goalPromptContent}>
                <Text style={styles.goalPromptTitle}>Set Your Fitness Goal</Text>
                <Text style={styles.goalPromptText}>
                  Tell us what you want to achieve so we can personalize your experience
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </HoverButton>
          )}

          {/* AI Trainer Card */}
          <GlassmorphicCard
            style={styles.aiTrainerCard}
            color="rgba(0, 255, 255, 0.1)"
            borderColor="rgba(0, 255, 255, 0.3)"
          >
            <View style={styles.aiTrainerHeader}>
              <View style={styles.aiTrainerIconContainer}>
                <Image source={require("../assets/logo.png")} style={styles.aiTrainerIcon} resizeMode="contain" />
              </View>
              <View style={styles.aiTrainerTitleContainer}>
                <Text style={styles.aiTrainerTitle}>AI Personal Trainer</Text>
                <Text style={styles.aiTrainerSubtitle}>Your fitness companion</Text>
              </View>
            </View>

            <Text style={styles.aiTrainerDescription}>
              Get personalized workouts, form feedback, and motivation from your AI trainer.
            </Text>

            <View style={styles.aiTrainerActions}>
              <HoverButton
                style={styles.aiTrainerButton}
                onPress={() => navigation.navigate("TrainerTab")}
                activeOpacity={0.8}
                hoverColor="#00b3ff"
                pressColor="#0077ff"
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="black" />
                <Text style={styles.aiTrainerButtonText}>Chat</Text>
              </HoverButton>

              <HoverButton
                style={styles.aiTrainerButton}
                onPress={() => navigation.navigate("WorkoutRecommendation")}
                activeOpacity={0.8}
                hoverColor="#00b3ff"
                pressColor="#0077ff"
              >
                <Ionicons name="barbell-outline" size={20} color="black" />
                <Text style={styles.aiTrainerButtonText}>Workouts</Text>
              </HoverButton>

              <HoverButton
                style={styles.aiTrainerButton}
                onPress={() => navigation.navigate("FormAnalysisSelection")}
                activeOpacity={0.8}
                hoverColor="#00b3ff"
                pressColor="#0077ff"
              >
                <Ionicons name="analytics-outline" size={20} color="black" />
                <Text style={styles.aiTrainerButtonText}>Form Check</Text>
              </HoverButton>
            </View>
          </GlassmorphicCard>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            {stats.isLoading ? (
              <View style={styles.statsLoadingContainer}>
                <ActivityIndicator size="small" color="cyan" />
                <Text style={styles.statsLoadingText}>Loading stats...</Text>
              </View>
            ) : (
              <>
                <GlassmorphicCard
                  style={styles.statCard}
                  color="rgba(255, 87, 51, 0.1)"
                  borderColor="rgba(255, 87, 51, 0.3)"
                >
                  <Ionicons name="flame" size={24} color="#FF5733" />
                  <Text style={styles.statValue}>{stats.workouts || 0}</Text>
                  <Text style={styles.statLabel}>Workouts</Text>
                </GlassmorphicCard>

                <GlassmorphicCard
                  style={styles.statCard}
                  color="rgba(51, 161, 255, 0.1)"
                  borderColor="rgba(51, 161, 255, 0.3)"
                >
                  <Ionicons name="time" size={24} color="#33A1FF" />
                  <Text style={styles.statValue}>{stats.minutes || 0}</Text>
                  <Text style={styles.statLabel}>Minutes</Text>
                </GlassmorphicCard>

                <GlassmorphicCard
                  style={styles.statCard}
                  color="rgba(255, 215, 0, 0.1)"
                  borderColor="rgba(255, 215, 0, 0.3)"
                >
                  <Ionicons name="trophy" size={24} color="#FFD700" />
                  <Text style={styles.statValue}>{stats.prs || 0}</Text>
                  <Text style={styles.statLabel}>PRs This Month</Text>
                </GlassmorphicCard>
              </>
            )}
          </View>

          {/* Training Styles Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Training Styles</Text>
              <HoverButton
                onPress={() => navigation.navigate("WorkoutTab")}
                style={styles.seeAllButton}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </HoverButton>
            </View>

            <View style={styles.trainingStylesContainer}>
              {/* Update the ScrollableFilters component with safer props */}
              <ScrollableFilters
                options={trainingStyleOptions || []}
                selectedValue=""
                onSelect={handleTrainingStyleSelect}
              />
            </View>
          </View>

          {/* PR Tracking Card */}
          <HoverButton
            style={styles.prTrackingCard}
            onPress={() => navigation.navigate("PRTab")}
            activeOpacity={0.8}
            hoverColor="rgba(255, 215, 0, 0.15)"
          >
            <View style={styles.prTrackingContent}>
              <Ionicons name="trophy" size={32} color="#FFD700" />
              <View style={styles.prTrackingTextContainer}>
                <Text style={styles.prTrackingTitle}>Track Your Progress</Text>
                <Text style={styles.prTrackingText}>Record and monitor your personal records</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </HoverButton>

          {/* Workout Log Card */}
          <HoverButton
            style={styles.logWorkoutCard}
            onPress={() => navigation.navigate("LogTab")}
            activeOpacity={0.8}
            hoverColor="rgba(0, 255, 255, 0.15)"
          >
            <View style={styles.logWorkoutContent}>
              <Ionicons name="list" size={32} color="cyan" />
              <View style={styles.logWorkoutTextContainer}>
                <Text style={styles.logWorkoutTitle}>Workout Log</Text>
                <Text style={styles.logWorkoutText}>View your workout history and progress</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </HoverButton>

          {/* Bottom padding for tab bar */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "black",
  },
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 255, 255, 0.1)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoSmallContainer: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.5)",
  },
  logoSmall: {
    width: 36,
    height: 36,
  },
  greeting: {
    color: "#aaa",
    fontSize: 14,
  },
  name: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 80, // Space for tab bar
  },
  goalPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    borderRadius: 15,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  goalPromptContent: {
    flex: 1,
    marginRight: 10,
  },
  goalPromptTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  goalPromptText: {
    color: "#aaa",
    fontSize: 13,
  },
  aiTrainerCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    width: "auto", // Allow proper width calculation
    alignSelf: "center", // Center the card
  },
  aiTrainerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  aiTrainerIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.5)",
  },
  aiTrainerIcon: {
    width: 42,
    height: 42,
  },
  aiTrainerTitleContainer: {
    flex: 1,
  },
  aiTrainerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  aiTrainerSubtitle: {
    color: "#aaa",
    fontSize: 13,
  },
  aiTrainerDescription: {
    color: "white",
    fontSize: 14,
    marginBottom: 15,
  },
  aiTrainerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 0, // Remove horizontal padding
    marginHorizontal: -2, // Negative margin to offset button margins
    marginBottom: 5,
  },
  aiTrainerButton: {
    backgroundColor: "cyan",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8, // Reduce horizontal padding
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 2, // Reduce margin between buttons
    minWidth: 80, // Ensure minimum width but smaller than before
  },
  aiTrainerButtonText: {
    color: "black",
    fontSize: 12, // Slightly smaller font
    fontWeight: "bold",
    marginLeft: 4,
    textAlign: "center", // Ensure text is centered
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  statsLoadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  statsLoadingText: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 8,
  },
  statCard: {
    width: "31%",
    padding: 10,
    alignItems: "center",
    justifyContent: "center", // Add this to center content vertically
    borderRadius: 15,
    height: 100, // Set a fixed height for all cards
  },
  statValue: {
    color: "white",
    fontSize: 22, // Increase font size
    fontWeight: "bold",
    textAlign: "center", // Ensure text is centered
    marginVertical: 4,
  },
  statLabel: {
    color: "#aaa",
    fontSize: 12, // Slightly larger font
    textAlign: "center",
    width: "100%", // Ensure the text takes full width
  },
  sectionContainer: {
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  seeAllText: {
    color: "cyan",
    fontSize: 14,
  },
  seeAllButton: {
    padding: 8,
    borderRadius: 8,
  },
  trainingStylesContainer: {
    paddingLeft: 20,
    marginBottom: 15,
  },
  prTrackingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)",
  },
  prTrackingContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  prTrackingTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  prTrackingTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  prTrackingText: {
    color: "#aaa",
    fontSize: 13,
  },
  logWorkoutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 255, 255, 0.15)",
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.4)",
  },
  logWorkoutContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logWorkoutTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  logWorkoutTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  logWorkoutText: {
    color: "#aaa",
    fontSize: 13,
  },
  bottomPadding: {
    height: 80,
  },
})

export default HomeScreen

