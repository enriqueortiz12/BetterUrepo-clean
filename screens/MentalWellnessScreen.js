"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { mentalWellnessCategories } from "../data/mentalWellnessData"
import AsyncStorage from "@react-native-async-storage/async-storage"
import MoodHistoryChart from "../components/MoodHistoryChart"
import { supabase } from "../lib/supabase" // Import supabase

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const MentalWellnessScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [currentMood, setCurrentMood] = useState(null)
  const [showMoodTracker, setShowMoodTracker] = useState(false)
  const [moodHistory, setMoodHistory] = useState([])
  const [sessionHistory, setSessionHistory] = useState([])
  const [moodLoggedToday, setMoodLoggedToday] = useState(false)
  const [subscription, setSubscription] = useState(null)

  const moods = [
    { id: "great", label: "Great", icon: "sunny-outline", color: "#FFD700" },
    { id: "good", label: "Good", icon: "partly-sunny-outline", color: "#4CAF50" },
    { id: "okay", label: "Okay", icon: "cloudy-outline", color: "#2196F3" },
    { id: "bad", label: "Bad", icon: "rainy-outline", color: "#9C27B0" },
    { id: "awful", label: "Awful", icon: "thunderstorm-outline", color: "#F44336" },
  ]

  const resources = [
    {
      id: "articles",
      title: "Mental Health Articles",
      icon: "document-text-outline",
      color: "#2196F3",
      description: "Read expert articles on mental wellness topics",
    },
    {
      id: "crisis",
      title: "Crisis Support",
      icon: "call-outline",
      color: "#F44336",
      description: "Access emergency mental health resources",
    },
    {
      id: "therapy",
      title: "Find a Therapist",
      icon: "people-outline",
      color: "#4CAF50",
      description: "Connect with mental health professionals",
    },
    {
      id: "community",
      title: "Community Support",
      icon: "chatbubbles-outline",
      color: "#FF9800",
      description: "Join supportive communities and forums",
    },
  ]

  // Check if mood was logged today
  const checkIfMoodLoggedToday = (moodData) => {
    if (!moodData || moodData.length === 0) return false

    const today = new Date().toISOString().split("T")[0]

    // Find if there's a mood entry for today
    const todayMood = moodData.find((entry) => {
      // Convert entry date to YYYY-MM-DD format for comparison
      const entryDate = new Date(entry.date).toISOString().split("T")[0]
      return entryDate === today
    })

    return !!todayMood
  }

  // Add a console log to debug the mood history data when it's loaded or updated
  useEffect(() => {
    console.log("Mood history updated:", moodHistory)
  }, [moodHistory])

  // Load mood data on component mount
  // Update the loadMoodData function to ensure consistent date handling
  const loadMoodData = async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // If user is logged in, try to load data from Supabase first
      if (user) {
        // Load current mood from Supabase
        const { data: moodData, error: moodError } = await supabase
          .from("mood_tracking")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(1)

        if (!moodError && moodData && moodData.length > 0) {
          // Convert Supabase mood data to app format
          const latestMood = moodData[0]

          // Check if the latest mood is from today
          const moodDate = new Date(latestMood.date).toISOString().split("T")[0]
          const today = new Date().toISOString().split("T")[0]
          const isTodaysMood = moodDate === today

          if (isTodaysMood) {
            const formattedMood = {
              id: latestMood.mood_id,
              label: latestMood.mood_label,
              icon: latestMood.mood_icon,
              color: latestMood.mood_color,
            }
            setCurrentMood(formattedMood)
            setMoodLoggedToday(true)
          } else {
            // If the latest mood is not from today, don't set it as current
            setCurrentMood(null)
            setMoodLoggedToday(false)
          }

          // Also save to AsyncStorage for offline access
          await AsyncStorage.setItem(
            "currentMood",
            JSON.stringify(
              isTodaysMood
                ? {
                    id: latestMood.mood_id,
                    label: latestMood.mood_label,
                    icon: latestMood.mood_icon,
                    color: latestMood.mood_color,
                    date: latestMood.date,
                  }
                : null,
            ),
          )
        } else {
          // Fall back to AsyncStorage if Supabase fails
          const savedMoodJson = await AsyncStorage.getItem("currentMood")
          if (savedMoodJson) {
            const savedMood = JSON.parse(savedMoodJson)

            // Check if the saved mood is from today
            if (savedMood && savedMood.date) {
              const moodDate = new Date(savedMood.date).toISOString().split("T")[0]
              const today = new Date().toISOString().split("T")[0]

              if (moodDate === today) {
                setCurrentMood(savedMood)
                setMoodLoggedToday(true)
              } else {
                setCurrentMood(null)
                setMoodLoggedToday(false)
              }
            } else {
              setCurrentMood(null)
              setMoodLoggedToday(false)
            }
          }
        }

        // Load mood history from Supabase
        const { data: historyData, error: historyError } = await supabase
          .from("mood_tracking")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(30)

        if (!historyError && historyData && historyData.length > 0) {
          // Convert Supabase mood history to app format
          const formattedHistory = historyData.map((item) => ({
            id: item.id,
            mood: item.mood_label,
            icon: item.mood_icon,
            color: item.mood_color,
            date: item.date,
          }))

          console.log("Formatted mood history from Supabase:", formattedHistory)
          setMoodHistory(formattedHistory)

          // Check if mood was logged today
          setMoodLoggedToday(checkIfMoodLoggedToday(formattedHistory))

          // Also save to AsyncStorage for offline access
          await AsyncStorage.setItem("moodHistory", JSON.stringify(formattedHistory))
        } else {
          // Fall back to AsyncStorage if Supabase fails
          const savedMoodHistory = await AsyncStorage.getItem("moodHistory")
          if (savedMoodHistory) {
            const parsedHistory = JSON.parse(savedMoodHistory)
            console.log("Loaded mood history from AsyncStorage:", parsedHistory)
            setMoodHistory(parsedHistory)

            // Check if mood was logged today
            setMoodLoggedToday(checkIfMoodLoggedToday(parsedHistory))
          } else {
            // Only generate sample data if no history exists at all
            generateSampleMoodData()
          }
        }

        // Load session history from Supabase
        const { data: sessionData, error: sessionError } = await supabase
          .from("mental_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })

        if (!sessionError && sessionData && sessionData.length > 0) {
          // Convert Supabase session data to app format
          const formattedSessions = sessionData.map((item) => ({
            id: item.id,
            session: item.session_title,
            duration: item.duration,
            date: new Date(item.date).toLocaleDateString(),
            mood: item.mood,
          }))
          setSessionHistory(formattedSessions)

          // Also save to AsyncStorage for offline access
          await AsyncStorage.setItem("sessionHistory", JSON.stringify(formattedSessions))
        } else {
          // Fall back to AsyncStorage if Supabase fails
          const savedSessionHistory = await AsyncStorage.getItem("sessionHistory")
          if (savedSessionHistory) {
            setSessionHistory(JSON.parse(savedSessionHistory))
          }
        }
      } else {
        // User not logged in, use AsyncStorage only
        const savedMoodJson = await AsyncStorage.getItem("currentMood")
        const savedMoodHistory = await AsyncStorage.getItem("moodHistory")
        const savedSessionHistory = await AsyncStorage.getItem("sessionHistory")

        if (savedMoodJson) {
          const savedMood = JSON.parse(savedMoodJson)

          // Check if the saved mood is from today
          if (savedMood && savedMood.date) {
            const moodDate = new Date(savedMood.date).toDateString()
            const today = new Date().toDateString()

            if (moodDate === today) {
              setCurrentMood(savedMood)
              setMoodLoggedToday(true)
            } else {
              setCurrentMood(null)
              setMoodLoggedToday(false)
            }
          } else {
            setCurrentMood(savedMood)
            // Can't determine if it's today's mood without a date
          }
        }

        if (savedMoodHistory) {
          const parsedHistory = JSON.parse(savedMoodHistory)
          setMoodHistory(parsedHistory)

          // Check if mood was logged today
          setMoodLoggedToday(checkIfMoodLoggedToday(parsedHistory))
        } else {
          // Only generate sample data if no history exists at all
          generateSampleMoodData()
        }

        if (savedSessionHistory) {
          setSessionHistory(JSON.parse(savedSessionHistory))
        }
      }
    } catch (error) {
      console.error("Error loading mood data:", error)
      // Try to load from AsyncStorage as fallback
      try {
        const savedMoodJson = await AsyncStorage.getItem("currentMood")
        const savedMoodHistory = await AsyncStorage.getItem("moodHistory")
        const savedSessionHistory = await AsyncStorage.getItem("sessionHistory")

        if (savedMoodJson) {
          const savedMood = JSON.parse(savedMoodJson)

          // Check if the saved mood is from today
          if (savedMood && savedMood.date) {
            const moodDate = new Date(savedMood.date).toDateString()
            const today = new Date().toDateString()

            if (moodDate === today) {
              setCurrentMood(savedMood)
              setMoodLoggedToday(true)
            } else {
              setCurrentMood(null)
              setMoodLoggedToday(false)
            }
          } else {
            setCurrentMood(savedMood)
          }
        }

        if (savedMoodHistory) {
          const parsedHistory = JSON.parse(savedMoodHistory)
          setMoodHistory(parsedHistory)
          setMoodLoggedToday(checkIfMoodLoggedToday(parsedHistory))
        }

        if (savedSessionHistory) setSessionHistory(JSON.parse(savedSessionHistory))
      } catch (fallbackError) {
        console.error("Error loading fallback mood data:", fallbackError)
      }
    }
  }

  // Generate sample mood data for demonstration purposes
  const generateSampleMoodData = () => {
    const sampleMoods = []
    const today = new Date()

    // Generate mood entries for the past 30 days
    for (let i = 29; i >= 0; i--) {
      // Skip some days to make it look realistic
      if (i % 3 === 0) continue

      const date = new Date()
      date.setDate(today.getDate() - i)

      // Randomly select a mood
      const randomMood = moods[Math.floor(Math.random() * moods.length)]

      sampleMoods.push({
        id: `sample-${i}`,
        mood: randomMood.label,
        icon: randomMood.icon,
        color: randomMood.color,
        date: date.toISOString(),
      })
    }

    // Add today's mood if we have one
    if (currentMood) {
      sampleMoods.push({
        id: "today",
        mood: currentMood.label,
        icon: currentMood.icon,
        color: currentMood.color,
        date: today.toISOString(),
      })
    }

    setMoodHistory(sampleMoods)

    // Save to AsyncStorage
    AsyncStorage.setItem("moodHistory", JSON.stringify(sampleMoods))
  }

  // Add this function to the MentalWellnessScreen component
  const saveMoodToSupabase = async (moodEntry) => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("No authenticated user found, saving to local storage only")
        return false
      }

      // Get today's date in YYYY-MM-DD format for comparison
      const today = new Date().toISOString().split("T")[0]

      // Check if there's already a mood entry for today
      const { data: existingMood, error: checkError } = await supabase
        .from("mood_tracking")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", today) // Use exact date match instead of range

      if (checkError) {
        console.error("Error checking existing mood:", checkError)
        return false
      }

      // Prepare mood data
      const moodData = {
        user_id: user.id,
        date: today, // Use today's date in YYYY-MM-DD format
        mood_id: moodEntry.mood.toLowerCase(),
        mood_label: moodEntry.mood,
        mood_icon: moodEntry.icon,
        mood_color: moodEntry.color,
        notes: "",
      }

      let result

      if (existingMood && existingMood.length > 0) {
        // Update existing mood entry for today
        console.log("Updating existing mood for today")
        const { data, error } = await supabase
          .from("mood_tracking")
          .update(moodData)
          .eq("id", existingMood[0].id)
          .eq("user_id", user.id)
          .select()

        if (error) {
          console.error("Error updating mood in Supabase:", error)
          return false
        }

        result = data
      } else {
        // Insert new mood entry
        console.log("Creating new mood entry for today")
        const { data, error } = await supabase.from("mood_tracking").insert([moodData]).select()

        if (error) {
          console.error("Error saving mood to Supabase:", error)
          return false
        }

        result = data
      }

      console.log("Mood saved to Supabase successfully:", result)
      return true
    } catch (error) {
      console.error("Error in saveMoodToSupabase:", error)
      return false
    }
  }

  // Modify the handleMoodSelect function to call saveMoodToSupabase
  // Update the handleMoodSelect function to ensure proper date formatting for the mood history
  const handleMoodSelect = async (mood) => {
    // Check if mood was already logged today using calendar day comparison
    const today = new Date().toISOString().split("T")[0] // Format as YYYY-MM-DD

    if (moodLoggedToday) {
      Alert.alert("Update Today's Mood", "You've already logged your mood for today. Would you like to update it?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async () => {
            setCurrentMood(mood)
            setShowMoodTracker(false)

            // Create a new mood entry with today's date
            const moodEntry = {
              id: Date.now().toString(),
              mood: mood.label,
              icon: mood.icon,
              color: mood.color,
              date: today,
            }

            // Save to AsyncStorage
            try {
              // Save current mood with date
              const moodWithDate = {
                ...mood,
                date: today,
              }
              await AsyncStorage.setItem("currentMood", JSON.stringify(moodWithDate))

              // Update mood history - filter out any existing entries from today before adding new one
              const updatedHistory = [
                moodEntry,
                ...moodHistory.filter((entry) => {
                  const entryDate = new Date(entry.date).toISOString().split("T")[0]
                  return entryDate !== today
                }),
              ].slice(0, 30) // Keep only last 30 entries

              setMoodHistory(updatedHistory)
              await AsyncStorage.setItem("moodHistory", JSON.stringify(updatedHistory))

              // Also save to Supabase
              await saveMoodToSupabase(moodEntry)

              Alert.alert("Mood Updated", `You're now feeling ${mood.label} today.`)
            } catch (error) {
              console.error("Error saving mood data:", error)
            }
          },
        },
      ])
      return
    }

    setCurrentMood(mood)
    setShowMoodTracker(false)
    setMoodLoggedToday(true)

    // Create a new mood entry with today's date
    const moodEntry = {
      id: Date.now().toString(),
      mood: mood.label,
      icon: mood.icon,
      color: mood.color,
      date: today,
    }

    // Save to AsyncStorage
    try {
      // Save current mood with date
      const moodWithDate = {
        ...mood,
        date: today,
      }
      await AsyncStorage.setItem("currentMood", JSON.stringify(moodWithDate))

      // Update mood history - filter out any existing entries from today before adding new one
      const updatedHistory = [
        moodEntry,
        ...moodHistory.filter((entry) => {
          const entryDate = new Date(entry.date).toISOString().split("T")[0]
          return entryDate !== today
        }),
      ].slice(0, 30) // Keep only last 30 entries

      setMoodHistory(updatedHistory)
      await AsyncStorage.setItem("moodHistory", JSON.stringify(updatedHistory))

      // Also save to Supabase
      await saveMoodToSupabase(moodEntry)

      Alert.alert("Mood Logged", `You're feeling ${mood.label} today. Taking care of your mental health is important!`)
    } catch (error) {
      console.error("Error saving mood data:", error)
    }
  }

  const handleCompleteSession = async (session) => {
    // Create a new session entry
    const sessionEntry = {
      id: Date.now().toString(),
      session: session.title,
      duration: session.duration,
      date: new Date().toLocaleDateString(),
      mood: currentMood ? currentMood.label : "Not recorded",
    }

    // Update session history
    const updatedHistory = [sessionEntry, ...sessionHistory]
    setSessionHistory(updatedHistory)

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem("sessionHistory", JSON.stringify(updatedHistory))

      Alert.alert("Session Completed", `Great job completing your ${session.title} session!`, [{ text: "OK" }])
    } catch (error) {
      console.error("Error saving session data:", error)
    }
  }

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { borderColor: item.color }]}
      onPress={() => setSelectedCategory(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={24} color="white" />
      </View>
      <Text style={styles.categoryTitle}>{item.title}</Text>
      <Text style={styles.categoryDescription} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  )

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyLeft}>
        <Text style={styles.historyDate}>{item.date}</Text>
        <Text style={styles.historySession}>{item.session}</Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={styles.historyDetail}>{item.duration}</Text>
        <Text style={styles.historyDetail}>{item.mood}</Text>
      </View>
    </View>
  )

  const renderSessionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() =>
        navigation.navigate("SessionDetail", {
          session: item,
          onComplete: () => handleCompleteSession(item),
        })
      }
    >
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTitle}>{item.title}</Text>
        <Text style={styles.sessionDuration}>{item.duration}</Text>
      </View>
      <Text style={styles.sessionDescription}>
        {item.description}
        {item.category === "meditation" && " Focus on clearing your mind and achieving inner peace."}
        {item.category === "breathing" && " Control your breath to regulate your nervous system."}
        {item.category === "mindfulness" && " Practice being fully present in the current moment."}
      </Text>
      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Benefits:</Text>
        {item.benefits.map((benefit, index) => (
          <Text key={index} style={styles.benefitItem}>
            • {benefit}
          </Text>
        ))}
      </View>
      <View style={styles.startButtonContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() =>
            navigation.navigate("SessionDetail", {
              session: item,
              onComplete: () => handleCompleteSession(item),
            })
          }
        >
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  // Subscribe to changes in the mood_tracking table
  useEffect(() => {
    const loadMoodData = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        // If user is logged in, try to load data from Supabase first
        if (user) {
          // Load current mood from Supabase
          const { data: moodData, error: moodError } = await supabase
            .from("mood_tracking")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(1)

          if (!moodError && moodData && moodData.length > 0) {
            // Convert Supabase mood data to app format
            const latestMood = moodData[0]

            // Check if the latest mood is from today
            const moodDate = new Date(latestMood.date).toISOString().split("T")[0]
            const today = new Date().toISOString().split("T")[0]
            const isTodaysMood = moodDate === today

            if (isTodaysMood) {
              const formattedMood = {
                id: latestMood.mood_id,
                label: latestMood.mood_label,
                icon: latestMood.mood_icon,
                color: latestMood.mood_color,
              }
              setCurrentMood(formattedMood)
              setMoodLoggedToday(true)
            } else {
              // If the latest mood is not from today, don't set it as current
              setCurrentMood(null)
              setMoodLoggedToday(false)
            }

            // Also save to AsyncStorage for offline access
            await AsyncStorage.setItem(
              "currentMood",
              JSON.stringify(
                isTodaysMood
                  ? {
                      id: latestMood.mood_id,
                      label: latestMood.mood_label,
                      icon: latestMood.mood_icon,
                      color: latestMood.mood_color,
                      date: latestMood.date,
                    }
                  : null,
              ),
            )
          } else {
            // Fall back to AsyncStorage if Supabase fails
            const savedMoodJson = await AsyncStorage.getItem("currentMood")
            if (savedMoodJson) {
              const savedMood = JSON.parse(savedMoodJson)

              // Check if the saved mood is from today
              if (savedMood && savedMood.date) {
                const moodDate = new Date(savedMood.date).toISOString().split("T")[0]
                const today = new Date().toISOString().split("T")[0]

                if (moodDate === today) {
                  setCurrentMood(savedMood)
                  setMoodLoggedToday(true)
                } else {
                  setCurrentMood(null)
                  setMoodLoggedToday(false)
                }
              } else {
                setCurrentMood(null)
                setMoodLoggedToday(false)
              }
            }
          }

          // Load mood history from Supabase
          const { data: historyData, error: historyError } = await supabase
            .from("mood_tracking")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(30)

          if (!historyError && historyData && historyData.length > 0) {
            // Convert Supabase mood history to app format
            const formattedHistory = historyData.map((item) => ({
              id: item.id,
              mood: item.mood_label,
              icon: item.mood_icon,
              color: item.mood_color,
              date: item.date,
            }))

            console.log("Formatted mood history from Supabase:", formattedHistory)
            setMoodHistory(formattedHistory)

            // Check if mood was logged today
            setMoodLoggedToday(checkIfMoodLoggedToday(formattedHistory))

            // Also save to AsyncStorage for offline access
            await AsyncStorage.setItem("moodHistory", JSON.stringify(formattedHistory))
          } else {
            // Fall back to AsyncStorage if Supabase fails
            const savedMoodHistory = await AsyncStorage.getItem("moodHistory")
            if (savedMoodHistory) {
              const parsedHistory = JSON.parse(savedMoodHistory)
              console.log("Loaded mood history from AsyncStorage:", parsedHistory)
              setMoodHistory(parsedHistory)

              // Check if mood was logged today
              setMoodLoggedToday(checkIfMoodLoggedToday(parsedHistory))
            } else {
              // Only generate sample data if no history exists at all
              generateSampleMoodData()
            }
          }

          // Load session history from Supabase
          const { data: sessionData, error: sessionError } = await supabase
            .from("mental_sessions")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false })

          if (!sessionError && sessionData && sessionData.length > 0) {
            // Convert Supabase session data to app format
            const formattedSessions = sessionData.map((item) => ({
              id: item.id,
              session: item.session_title,
              duration: item.duration,
              date: new Date(item.date).toLocaleDateString(),
              mood: item.mood,
            }))
            setSessionHistory(formattedSessions)

            // Also save to AsyncStorage for offline access
            await AsyncStorage.setItem("sessionHistory", JSON.stringify(formattedSessions))
          } else {
            // Fall back to AsyncStorage if Supabase fails
            const savedSessionHistory = await AsyncStorage.getItem("sessionHistory")
            if (savedSessionHistory) {
              setSessionHistory(JSON.parse(savedSessionHistory))
            }
          }
        } else {
          // User not logged in, use AsyncStorage only
          const savedMoodJson = await AsyncStorage.getItem("currentMood")
          const savedMoodHistory = await AsyncStorage.getItem("moodHistory")
          const savedSessionHistory = await AsyncStorage.getItem("sessionHistory")

          if (savedMoodJson) {
            const savedMood = JSON.parse(savedMoodJson)

            // Check if the saved mood is from today
            if (savedMood && savedMood.date) {
              const moodDate = new Date(savedMood.date).toDateString()
              const today = new Date().toDateString()

              if (moodDate === today) {
                setCurrentMood(savedMood)
                setMoodLoggedToday(true)
              } else {
                setCurrentMood(null)
                setMoodLoggedToday(false)
              }
            } else {
              setCurrentMood(savedMood)
              // Can't determine if it's today's mood without a date
            }
          }

          if (savedMoodHistory) {
            const parsedHistory = JSON.parse(savedMoodHistory)
            setMoodHistory(parsedHistory)

            // Check if mood was logged today
            setMoodLoggedToday(checkIfMoodLoggedToday(parsedHistory))
          } else {
            // Only generate sample data if no history exists at all
            generateSampleMoodData()
          }

          if (savedSessionHistory) {
            setSessionHistory(JSON.parse(savedSessionHistory))
          }
        }
      } catch (error) {
        console.error("Error loading mood data:", error)
        // Try to load from AsyncStorage as fallback
        try {
          const savedMoodJson = await AsyncStorage.getItem("currentMood")
          const savedMoodHistory = await AsyncStorage.getItem("moodHistory")
          const savedSessionHistory = await AsyncStorage.getItem("sessionHistory")

          if (savedMoodJson) {
            const savedMood = JSON.parse(savedMoodJson)

            // Check if the saved mood is from today
            if (savedMood && savedMood.date) {
              const moodDate = new Date(savedMood.date).toDateString()
              const today = new Date().toDateString()

              if (moodDate === today) {
                setCurrentMood(savedMood)
                setMoodLoggedToday(true)
              } else {
                setCurrentMood(null)
                setMoodLoggedToday(false)
              }
            } else {
              setCurrentMood(savedMood)
            }
          }

          if (savedMoodHistory) {
            const parsedHistory = JSON.parse(savedMoodHistory)
            setMoodHistory(parsedHistory)
            setMoodLoggedToday(checkIfMoodLoggedToday(parsedHistory))
          }

          if (savedSessionHistory) setSessionHistory(JSON.parse(savedSessionHistory))
        } catch (fallbackError) {
          console.error("Error loading fallback mood data:", fallbackError)
        }
      }
    }

    loadMoodData()

    // Subscribe to changes in the mood_tracking table
    const subscribeToMoodChanges = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("No user, not subscribing to mood changes")
        return
      }

      const channel = supabase
        .channel("public:mood_tracking")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "mood_tracking", filter: `user_id=eq.${user.id}` },
          (payload) => {
            console.log("Supabase mood_tracking change:", payload)
            // Refresh mood history when changes occur
            loadMoodData()
          },
        )
        .subscribe()

      setSubscription(channel)
    }

    subscribeToMoodChanges()

    // Unsubscribe on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mental Wellness</Text>
      </View>

      {/* Rest of the screen content remains the same */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.featuredContainer}>
          <Text style={styles.sectionTitle}>Featured Session</Text>
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() =>
              navigation.navigate("SessionDetail", {
                session: mentalWellnessCategories[0].sessions[0],
                onComplete: () => handleCompleteSession(mentalWellnessCategories[0].sessions[0]),
              })
            }
          >
            <View style={styles.featuredContent}>
              <Text style={styles.featuredTitle}>{mentalWellnessCategories[0].sessions[0].title}</Text>
              <Text style={styles.featuredMeta}>{mentalWellnessCategories[0].sessions[0].duration}</Text>
              <TouchableOpacity
                style={styles.featuredButton}
                onPress={() =>
                  navigation.navigate("SessionDetail", {
                    session: mentalWellnessCategories[0].sessions[0],
                    onComplete: () => handleCompleteSession(mentalWellnessCategories[0].sessions[0]),
                  })
                }
              >
                <Text style={styles.featuredButtonText}>Start Now</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.moodTrackerContainer}>
          <Text style={styles.sectionTitle}>How are you feeling today?</Text>

          {currentMood ? (
            <TouchableOpacity style={styles.currentMoodCard} onPress={() => setShowMoodTracker(true)}>
              <View style={[styles.moodIconContainer, { backgroundColor: currentMood.color }]}>
                <Ionicons name={currentMood.icon} size={24} color="white" />
              </View>
              <Text style={styles.currentMoodText}>
                You're feeling <Text style={styles.moodLabel}>{currentMood.label}</Text>
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.trackMoodButton} onPress={() => setShowMoodTracker(true)}>
              <Text style={styles.trackMoodText}>Track Your Mood</Text>
              <Ionicons name="add-circle-outline" size={20} color="cyan" />
            </TouchableOpacity>
          )}

          {showMoodTracker && (
            <View style={styles.moodOptions}>
              {moods.map((mood) => (
                <TouchableOpacity key={mood.id} style={styles.moodOption} onPress={() => handleMoodSelect(mood)}>
                  <View style={[styles.moodIconContainer, { backgroundColor: mood.color }]}>
                    <Ionicons name={mood.icon} size={24} color="white" />
                  </View>
                  <Text style={styles.moodOptionText}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Add the Mood History Chart here */}
        <View style={styles.moodChartContainer}>
          <MoodHistoryChart moodHistory={moodHistory} />
        </View>

        <Text style={styles.sectionTitle}>Categories</Text>
        <FlatList
          data={mentalWellnessCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />

        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {sessionHistory.length > 0 ? (
            sessionHistory.map((item) => renderHistoryItem({ item }))
          ) : (
            <Text style={styles.emptyHistoryText}>No sessions completed yet</Text>
          )}
        </View>

        <View style={styles.resourcesContainer}>
          <Text style={styles.sectionTitle}>Mental Health Resources</Text>
          {resources.map((resource) => (
            <TouchableOpacity
              key={resource.id}
              style={styles.resourceCard}
              onPress={() => {
                Alert.alert(
                  resource.title,
                  `This would open ${resource.title.toLowerCase()} in a real app. This feature would connect to external mental health resources.`,
                  [{ text: "OK" }],
                )
              }}
            >
              <View style={[styles.resourceIconContainer, { backgroundColor: resource.color }]}>
                <Ionicons name={resource.icon} size={24} color="white" />
              </View>
              <View style={styles.resourceContent}>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <Text style={styles.resourceDescription}>{resource.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>
          ))}
        </View>
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
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  featuredContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  featuredCard: {
    height: 180,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "rgba(156, 124, 244, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(156, 124, 244, 0.3)",
  },
  featuredContent: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  featuredTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  featuredMeta: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 20,
  },
  featuredButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  featuredButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  moodChartContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoriesList: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  categoryCard: {
    width: 150,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  categoryTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  categoryDescription: {
    color: "#aaa",
    fontSize: 12,
  },
  historyContainer: {
    marginTop: 30,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  historyLeft: {},
  historyDate: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 5,
  },
  historySession: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  historyRight: {
    alignItems: "flex-end",
  },
  historyDetail: {
    color: "#aaa",
    fontSize: 14,
  },
  emptyHistoryText: {
    color: "#aaa",
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  categoryDetailContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    marginLeft: 10,
  },
  categoryDetailTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  categoryDetailDescription: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 20,
  },
  sessionList: {
    paddingBottom: 20,
  },
  sessionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sessionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  sessionDuration: {
    color: "#aaa",
    fontSize: 14,
  },
  sessionDescription: {
    color: "white",
    fontSize: 14,
    marginBottom: 15,
  },
  benefitsContainer: {
    marginBottom: 15,
  },
  benefitsTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  benefitItem: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 3,
  },
  startButtonContainer: {
    alignItems: "flex-end",
  },
  startButton: {
    backgroundColor: "cyan",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  startButtonText: {
    color: "black",
    fontWeight: "bold",
  },
  moodTrackerContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  trackMoodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  trackMoodText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  moodOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 15,
  },
  moodOption: {
    width: "18%",
    alignItems: "center",
    marginBottom: 15,
  },
  moodIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  moodOptionText: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
  },
  currentMoodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  currentMoodText: {
    color: "white",
    fontSize: 16,
    flex: 1,
    marginLeft: 15,
  },
  moodLabel: {
    fontWeight: "bold",
  },
  resourcesContainer: {
    marginTop: 30,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  resourceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  resourceDescription: {
    color: "#aaa",
    fontSize: 14,
  },
})

export default MentalWellnessScreen

