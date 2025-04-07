"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { workoutCategories } from "../data/workoutData"
import { trainingStyles } from "../data/trainingStylesData"
import GlassmorphicCard from "../components/GlassmorphicCard"
import ScrollableFilters from "../components/ScrollableFilters"
import HoverButton from "../components/HoverButton"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase } from "../lib/supabase"
import { LogoFallback } from "../assets/logo"
// Add this import at the top
import Button from "../components/Button"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const HomeScreen = ({ navigation }) => {
  // Local state management
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState({})
  const [stats, setStats] = useState({
    workouts: 0,
    minutes: 0,
    prs: 0,
    mentalSessions: 0,
    isLoading: true,
  })
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [currentMood, setCurrentMood] = useState(null)
  const [logoLoaded, setLogoLoaded] = useState(true)

  // Load user data directly
  useEffect(() => {
    let isMounted = true
    let timeoutId

    const loadUserData = async () => {
      try {
        console.log("HomeScreen: Loading user data")

        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.log("HomeScreen: Loading timeout reached, showing fallback data")
            setLoadingTimeout(true)
            setStats((prev) => ({ ...prev, isLoading: false }))
          }
        }, 3000) // 3 second timeout

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!isMounted) return

        if (user) {
          setUser(user)
          console.log("HomeScreen: User found:", user.id)

          // Try to get profile data
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (!isMounted) return

          if (error) {
            console.error("HomeScreen: Error fetching profile:", error)
            // Use fallback profile
            setUserProfile({
              name: user.email ? user.email.split("@")[0] : "User",
              goal: "health",
            })
          } else {
            console.log("HomeScreen: Profile loaded successfully")
            setUserProfile({
              name: profileData.full_name,
              goal: profileData.fitness_goal,
              email: profileData.email,
              age: profileData.age,
              weight: profileData.weight,
              height: profileData.height,
              trainingLevel: profileData.training_level || "intermediate",
            })
          }
        } else {
          console.log("HomeScreen: No user found")
          setUserProfile({
            name: "User",
            goal: "health",
          })
        }

        // Load current mood
        const savedMood = await AsyncStorage.getItem("currentMood")
        if (savedMood) {
          setCurrentMood(JSON.parse(savedMood))
        }

        // Calculate stats regardless of user state
        await fetchUserStats(user?.id)
      } catch (error) {
        console.error("HomeScreen: Error loading user data:", error)
        // Use fallback data
        if (isMounted) {
          setUserProfile({
            name: "User",
            goal: "health",
          })
          setStats({
            workouts: 0,
            minutes: 0,
            prs: 0,
            mentalSessions: 0,
            isLoading: false,
          })
        }
      } finally {
        // Clear timeout
        if (timeoutId) clearTimeout(timeoutId)
      }
    }

    loadUserData()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Function to fetch user stats from the new user_stats table
  const fetchUserStats = async (userId) => {
    try {
      console.log("HomeScreen: Fetching user stats")
      setStats((prev) => ({ ...prev, isLoading: true }))

      // Default stats in case of errors
      let workoutCount = 0
      let totalMinutes = 0
      let prsThisMonth = 0
      let mentalSessionsCount = 0

      if (!userId) {
        console.log("HomeScreen: No user ID, using default stats")
        setStats({
          workouts: 0,
          minutes: 0,
          prs: 0,
          mentalSessions: 0,
          isLoading: false,
        })
        return
      }

      // Get current month and year
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1 // JavaScript months are 0-indexed
      const currentYear = currentDate.getFullYear()

      // Try to get stats from user_stats table
      const { data: userStats, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .eq("current_month", currentMonth)
        .eq("current_year", currentYear)
        .single()

      if (statsError && statsError.code !== "PGRST116") {
        // Error other than "not found"
        console.error("HomeScreen: Error fetching user stats:", statsError)
      }

      if (userStats) {
        console.log("HomeScreen: Found user stats in database:", userStats)
        // Use stats from database
        workoutCount = userStats.total_workouts || 0
        totalMinutes = userStats.total_minutes || 0
        prsThisMonth = userStats.prs_this_month || 0
        mentalSessionsCount = userStats.mental_sessions || 0
      } else {
        console.log("HomeScreen: No user stats found in database, calculating from raw data")

        // Calculate stats from raw data
        const calculatedStats = await calculateStatsFromRawData(userId, currentMonth, currentYear)
        workoutCount = calculatedStats.workouts
        totalMinutes = calculatedStats.minutes
        prsThisMonth = calculatedStats.prs
        mentalSessionsCount = calculatedStats.mentalSessions

        // Save the calculated stats to the user_stats table
        await saveUserStats(
          userId,
          workoutCount,
          totalMinutes,
          prsThisMonth,
          mentalSessionsCount,
          currentMonth,
          currentYear,
        )
      }

      // Update stats state
      setStats({
        workouts: workoutCount,
        minutes: totalMinutes,
        prs: prsThisMonth,
        mentalSessions: mentalSessionsCount,
        isLoading: false,
      })
    } catch (error) {
      console.error("HomeScreen: Error fetching user stats:", error)
      // Set default stats on error
      setStats({
        workouts: 0,
        minutes: 0,
        prs: 0,
        mentalSessions: 0,
        isLoading: false,
      })
    }
  }

  // Function to calculate stats from raw data (workout_logs and personal_records tables)
  const calculateStatsFromRawData = async (userId, currentMonth, currentYear) => {
    let workoutCount = 0
    let totalMinutes = 0
    let prsThisMonth = 0
    let mentalSessionsCount = 0

    try {
      // Get workout logs from Supabase
      const { data: workoutLogs, error: workoutError } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", userId)

      if (!workoutError && workoutLogs && workoutLogs.length > 0) {
        console.log(`HomeScreen: Found ${workoutLogs.length} workout logs in Supabase`)

        // Filter workouts for current month/year
        const thisMonthWorkouts = workoutLogs.filter((log) => {
          if (!log.date) return false
          const logDate = new Date(log.date)
          return logDate.getMonth() + 1 === currentMonth && logDate.getFullYear() === currentYear
        })

        workoutCount = thisMonthWorkouts.length

        // Calculate total minutes
        thisMonthWorkouts.forEach((log) => {
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
      } else {
        console.log("HomeScreen: No workout logs found in Supabase or error:", workoutError)

        // Fall back to AsyncStorage if Supabase fails
        try {
          const workoutLogsJson = await AsyncStorage.getItem("workoutLogs")
          if (workoutLogsJson) {
            const localWorkoutLogs = JSON.parse(workoutLogsJson)
            if (Array.isArray(localWorkoutLogs)) {
              console.log(`HomeScreen: Found ${localWorkoutLogs.length} workout logs in AsyncStorage`)

              // Filter workouts for current month/year
              const thisMonthWorkouts = localWorkoutLogs.filter((log) => {
                if (!log.date) return false
                const logDate = new Date(log.date)
                return logDate.getMonth() + 1 === currentMonth && logDate.getFullYear() === currentYear
              })

              workoutCount = thisMonthWorkouts.length

              // Calculate total minutes
              thisMonthWorkouts.forEach((log) => {
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
            }
          }
        } catch (localError) {
          console.error("HomeScreen: Error reading local workout logs:", localError)
        }
      }

      // Get personal records from Supabase
      const { data: personalRecords, error: prError } = await supabase
        .from("personal_records")
        .select("*")
        .eq("user_id", userId)

      if (!prError && personalRecords && personalRecords.length > 0) {
        console.log(`HomeScreen: Found ${personalRecords.length} PRs in Supabase`)

        // Calculate PRs this month
        prsThisMonth = personalRecords.filter((pr) => {
          if (!pr.date) return false
          const prDate = new Date(pr.date)
          return prDate.getMonth() + 1 === currentMonth && prDate.getFullYear() === currentYear
        }).length
      } else {
        console.log("HomeScreen: No PRs found in Supabase or error:", prError)

        // Fall back to AsyncStorage if Supabase fails
        try {
          const personalRecordsJson = await AsyncStorage.getItem("personalRecords")
          if (personalRecordsJson) {
            const localPRs = JSON.parse(personalRecordsJson)
            if (Array.isArray(localPRs)) {
              console.log(`HomeScreen: Found ${localPRs.length} PRs in AsyncStorage`)

              // Calculate PRs this month
              prsThisMonth = localPRs.filter((pr) => {
                if (!pr.date) return false
                const prDate = new Date(pr.date)
                return prDate.getMonth() + 1 === currentMonth && prDate.getFullYear() === currentYear
              }).length
            }
          }
        } catch (localError) {
          console.error("HomeScreen: Error reading local PRs:", localError)
        }
      }

      // Get mental sessions from Supabase
      const { data: mentalSessions, error: mentalError } = await supabase
        .from("mental_sessions")
        .select("*")
        .eq("user_id", userId)

      if (!mentalError && mentalSessions && mentalSessions.length > 0) {
        console.log(`HomeScreen: Found ${mentalSessions.length} mental sessions in Supabase`)

        // Calculate mental sessions this month
        mentalSessionsCount = mentalSessions.filter((session) => {
          if (!session.date) return false
          const sessionDate = new Date(session.date)
          return sessionDate.getMonth() + 1 === currentMonth && sessionDate.getFullYear() === currentYear
        }).length
      } else {
        console.log("HomeScreen: No mental sessions found in Supabase or error:", mentalError)

        // Fall back to AsyncStorage if Supabase fails
        try {
          const sessionHistoryJson = await AsyncStorage.getItem("sessionHistory")
          if (sessionHistoryJson) {
            const localSessions = JSON.parse(sessionHistoryJson)
            if (Array.isArray(localSessions)) {
              console.log(`HomeScreen: Found ${localSessions.length} mental sessions in AsyncStorage`)

              // Calculate mental sessions this month
              mentalSessionsCount = localSessions.filter((session) => {
                if (!session.date) return false
                const sessionDate = new Date(session.date)
                return sessionDate.getMonth() + 1 === currentMonth && sessionDate.getFullYear() === currentYear
              }).length
            }
          }
        } catch (localError) {
          console.error("HomeScreen: Error reading local mental sessions:", localError)
        }
      }
    } catch (error) {
      console.error("HomeScreen: Error calculating stats from raw data:", error)
    }

    return { workouts: workoutCount, minutes: totalMinutes, prs: prsThisMonth, mentalSessions: mentalSessionsCount }
  }

  // Function to save user stats to the user_stats table
  const saveUserStats = async (userId, workouts, minutes, prs, mentalSessions, month, year) => {
    try {
      console.log("HomeScreen: Saving user stats to database")

      // Check if a record already exists
      const { data: existingStats, error: checkError } = await supabase
        .from("user_stats")
        .select("id")
        .eq("user_id", userId)
        .eq("current_month", month)
        .eq("current_year", year)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("HomeScreen: Error checking existing stats:", checkError)
        return
      }

      if (existingStats) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("user_stats")
          .update({
            total_workouts: workouts,
            total_minutes: minutes,
            prs_this_month: prs,
            mental_sessions: mentalSessions,
            last_updated: new Date().toISOString(),
          })
          .eq("id", existingStats.id)

        if (updateError) {
          console.error("HomeScreen: Error updating user stats:", updateError)
        } else {
          console.log("HomeScreen: User stats updated successfully")
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase.from("user_stats").insert([
          {
            user_id: userId,
            total_workouts: workouts,
            total_minutes: minutes,
            prs_this_month: prs,
            mental_sessions: mentalSessions,
            current_month: month,
            current_year: year,
          },
        ])

        if (insertError) {
          console.error("HomeScreen: Error inserting user stats:", insertError)
        } else {
          console.log("HomeScreen: User stats inserted successfully")
        }
      }
    } catch (error) {
      console.error("HomeScreen: Error saving user stats:", error)
    }
  }

  // Function to update stats when a new workout is completed
  const updateStatsAfterWorkout = async (workoutDuration) => {
    try {
      if (!user || !user.id) return

      // Get current month and year
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()

      // Parse duration to minutes
      let durationMinutes = 0
      if (typeof workoutDuration === "string") {
        const parts = workoutDuration.split(":").map(Number)
        if (parts.length === 2) {
          // MM:SS format
          durationMinutes = parts[0]
        } else if (parts.length === 3) {
          // HH:MM:SS format
          durationMinutes = parts[0] * 60 + parts[1]
        }
      }

      // Get current stats
      const { data: currentStats, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("current_month", currentMonth)
        .eq("current_year", currentYear)
        .single()

      if (statsError && statsError.code !== "PGRST116") {
        console.error("HomeScreen: Error fetching current stats:", statsError)
        return
      }

      if (currentStats) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("user_stats")
          .update({
            total_workouts: currentStats.total_workouts + 1,
            total_minutes: currentStats.total_minutes + durationMinutes,
            last_updated: new Date().toISOString(),
          })
          .eq("id", currentStats.id)

        if (updateError) {
          console.error("HomeScreen: Error updating stats after workout:", updateError)
        } else {
          console.log("HomeScreen: Stats updated after workout")
          // Update local state
          setStats((prev) => ({
            ...prev,
            workouts: prev.workouts + 1,
            minutes: prev.minutes + durationMinutes,
          }))
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase.from("user_stats").insert([
          {
            user_id: user.id,
            total_workouts: 1,
            total_minutes: durationMinutes,
            prs_this_month: 0,
            mental_sessions: 0,
            current_month: currentMonth,
            current_year: currentYear,
          },
        ])

        if (insertError) {
          console.error("HomeScreen: Error inserting stats after workout:", insertError)
        } else {
          console.log("HomeScreen: New stats record created after workout")
          // Update local state
          setStats((prev) => ({
            ...prev,
            workouts: 1,
            minutes: durationMinutes,
          }))
        }
      }
    } catch (error) {
      console.error("HomeScreen: Error updating stats after workout:", error)
    }
  }

  // Function to update stats when a new PR is achieved
  const updateStatsAfterPR = async () => {
    try {
      if (!user || !user.id) return

      // Get current month and year
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()

      // Get current stats
      const { data: currentStats, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("current_month", currentMonth)
        .eq("current_year", currentYear)
        .single()

      if (statsError && statsError.code !== "PGRST116") {
        console.error("HomeScreen: Error fetching current stats:", statsError)
        return
      }

      if (currentStats) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("user_stats")
          .update({
            prs_this_month: currentStats.prs_this_month + 1,
            last_updated: new Date().toISOString(),
          })
          .eq("id", currentStats.id)

        if (updateError) {
          console.error("HomeScreen: Error updating stats after PR:", updateError)
        } else {
          console.log("HomeScreen: Stats updated after PR")
          // Update local state
          setStats((prev) => ({
            ...prev,
            prs: prev.prs + 1,
          }))
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase.from("user_stats").insert([
          {
            user_id: user.id,
            total_workouts: 0,
            total_minutes: 0,
            prs_this_month: 1,
            mental_sessions: 0,
            current_month: currentMonth,
            current_year: currentYear,
          },
        ])

        if (insertError) {
          console.error("HomeScreen: Error inserting stats after PR:", insertError)
        } else {
          console.log("HomeScreen: New stats record created after PR")
          // Update local state
          setStats((prev) => ({
            ...prev,
            prs: 1,
          }))
        }
      }
    } catch (error) {
      console.error("HomeScreen: Error updating stats after PR:", error)
    }
  }

  // Function to update stats when a mental session is completed
  const updateStatsAfterMentalSession = async () => {
    try {
      if (!user || !user.id) return

      // Get current month and year
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()

      // Get current stats
      const { data: currentStats, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("current_month", currentMonth)
        .eq("current_year", currentYear)
        .single()

      if (statsError && statsError.code !== "PGRST116") {
        console.error("HomeScreen: Error fetching current stats:", statsError)
        return
      }

      if (currentStats) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("user_stats")
          .update({
            mental_sessions: (currentStats.mental_sessions || 0) + 1,
            last_updated: new Date().toISOString(),
          })
          .eq("id", currentStats.id)

        if (updateError) {
          console.error("HomeScreen: Error updating stats after mental session:", updateError)
        } else {
          console.log("HomeScreen: Stats updated after mental session")
          // Update local state
          setStats((prev) => ({
            ...prev,
            mentalSessions: (prev.mentalSessions || 0) + 1,
          }))
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase.from("user_stats").insert([
          {
            user_id: user.id,
            total_workouts: 0,
            total_minutes: 0,
            prs_this_month: 0,
            mental_sessions: 1,
            current_month: currentMonth,
            current_year: currentYear,
          },
        ])

        if (insertError) {
          console.error("HomeScreen: Error inserting stats after mental session:", insertError)
        } else {
          console.log("HomeScreen: New stats record created after mental session")
          // Update local state
          setStats((prev) => ({
            ...prev,
            mentalSessions: 1,
          }))
        }
      }
    } catch (error) {
      console.error("HomeScreen: Error updating stats after mental session:", error)
    }
  }

  // Recalculate stats when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (user) {
        fetchUserStats(user.id)
      }
    })
    return unsubscribe
  }, [navigation, user])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  // Get first name safely
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

  // Get mood emoji and color
  const getMoodEmoji = () => {
    if (!currentMood) return "😊"

    switch (currentMood.id) {
      case "great":
        return "😄"
      case "good":
        return "🙂"
      case "okay":
        return "😐"
      case "bad":
        return "😔"
      case "awful":
        return "😢"
      default:
        return "😊"
    }
  }

  const getMoodColor = () => {
    if (!currentMood) return "#9C7CF4"
    return currentMood.color || "#9C7CF4"
  }

  // Custom logo component for AI Trainer card
  const renderAITrainerLogo = (size = 50) => {
    return (
      <View style={[styles.aiTrainerIconContainer, { width: size, height: size, borderRadius: size / 2 }]}>
        {logoLoaded ? (
          <Image
            source={require("../assets/fitnessLogo.jpg")}
            style={{ width: size * 0.9, height: size * 0.9, borderRadius: (size * 0.9) / 2, resizeMode: "contain" }}
            onError={() => setLogoLoaded(false)}
          />
        ) : (
          <LogoFallback size={size * 0.9} />
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Compact Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoSmallContainer}>
              {logoLoaded ? (
                <Image
                  source={require("../assets/fitnessLogo.jpg")}
                  style={{ width: 40, height: 40, borderRadius: 20, resizeMode: "contain" }}
                  onError={() => setLogoLoaded(false)}
                />
              ) : (
                <LogoFallback size={40} />
              )}
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
              {renderAITrainerLogo(50)}
              <View style={styles.aiTrainerTitleContainer}>
                <Text style={styles.aiTrainerTitle}>AI Personal Trainer</Text>
                <Text style={styles.aiTrainerSubtitle}>Your fitness companion</Text>
              </View>
            </View>

            <Text style={styles.aiTrainerDescription}>
              Get personalized workouts, form feedback, and motivation from your AI trainer.
            </Text>

            {/* AI Trainer Actions */}
            <View style={styles.aiTrainerActions}>
              <Button
                variant="primary"
                size="sm"
                iconName="chatbubble-ellipses-outline"
                style={styles.aiTrainerButton}
                onPress={() => navigation.navigate("TrainerTab")}
              >
                Chat
              </Button>

              <Button
                variant="primary"
                size="sm"
                iconName="barbell-outline"
                style={styles.aiTrainerButton}
                onPress={() => navigation.navigate("WorkoutRecommendation")}
              >
                Workouts
              </Button>

              <Button
                variant="primary"
                size="sm"
                iconName="analytics-outline"
                style={styles.aiTrainerButton}
                onPress={() => navigation.navigate("FormAnalysisSelection")}
              >
                Form Check
              </Button>
            </View>
          </GlassmorphicCard>

          {/* Mood Tracking Card - Now styled like AI Trainer Card */}
          <GlassmorphicCard
            style={styles.aiTrainerCard}
            color={`${getMoodColor()}20`}
            borderColor={`${getMoodColor()}40`}
          >
            <View style={styles.aiTrainerHeader}>
              <View style={styles.moodIconContainer}>
                <Text style={styles.moodEmoji}>{getMoodEmoji()}</Text>
              </View>
              <View style={styles.aiTrainerTitleContainer}>
                <Text style={styles.aiTrainerTitle}>Mental Wellness Check</Text>
                <Text style={styles.aiTrainerSubtitle}>
                  {currentMood ? `You're feeling ${currentMood.label} today` : "How are you feeling today?"}
                </Text>
              </View>
            </View>

            <Text style={styles.aiTrainerDescription}>
              Track your daily mood to monitor your mental wellness and identify patterns over time.
            </Text>

            {/* Mood Actions */}
            <View style={styles.aiTrainerActions}>
              <Button
                variant="primary"
                size="sm"
                iconName="happy-outline"
                style={[styles.aiTrainerButton, { backgroundColor: getMoodColor() }]}
                onPress={() => navigation.navigate("MentalTab")}
              >
                {currentMood ? "Update Mood" : "Log Mood"}
              </Button>

              <Button
                variant="primary"
                size="sm"
                iconName="analytics-outline"
                style={[styles.aiTrainerButton, { backgroundColor: getMoodColor() }]}
                onPress={() => navigation.navigate("MentalTab")}
              >
                View History
              </Button>
            </View>
          </GlassmorphicCard>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            {stats.isLoading && !loadingTimeout ? (
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
                  color="rgba(156, 124, 244, 0.1)"
                  borderColor="rgba(156, 124, 244, 0.3)"
                >
                  <Ionicons name="leaf" size={24} color="#9C7CF4" />
                  <Text style={styles.statValue}>{stats.mentalSessions || 0}</Text>
                  <Text style={styles.statLabel}>Mental Sessions</Text>
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
          <TouchableOpacity
            style={styles.prTrackingCard}
            onPress={() => navigation.navigate("PRTab")}
            activeOpacity={0.7}
          >
            <View style={styles.prTrackingContent}>
              <Ionicons name="trophy" size={32} color="#FFD700" />
              <View style={styles.prTrackingTextContainer}>
                <Text style={styles.prTrackingTitle}>Track Your Progress</Text>
                <Text style={styles.prTrackingText}>Record and monitor your personal records</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </TouchableOpacity>

          {/* Workout Log Card */}
          <TouchableOpacity
            style={styles.logWorkoutCard}
            onPress={() => navigation.navigate("WorkoutLog")}
            activeOpacity={0.7}
          >
            <View style={styles.logWorkoutContent}>
              <Ionicons name="list" size={32} color="cyan" />
              <View style={styles.logWorkoutTextContainer}>
                <Text style={styles.logWorkoutTitle}>Workout Log</Text>
                <Text style={styles.logWorkoutText}>View your workout history and progress</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </TouchableOpacity>

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
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.5)",
  },
  logoSmall: {
    // No additional styling needed as LogoImage component handles the circular shape
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
  // AI Trainer Card Styles - Now used for both AI Trainer and Mood cards
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.5)",
  },
  aiTrainerIcon: {
    width: 46,
    height: 46,
    transform: [{ scale: 0.9 }], // Scale down slightly to ensure full visibility
  },
  moodIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(156, 124, 244, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(156, 124, 244, 0.5)",
  },
  moodEmoji: {
    fontSize: 28,
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
    marginHorizontal: 2,
    minWidth: 80, // Ensure minimum width but smaller than before
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    width: "48%",
    padding: 10,
    alignItems: "center",
    justifyContent: "center", // Add this to center content vertically
    borderRadius: 15,
    height: 100, // Set a fixed height for all cards
    marginBottom: 10,
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
  statIcon: {
    width: 36,
    height: 36,
  },
})

export default HomeScreen

