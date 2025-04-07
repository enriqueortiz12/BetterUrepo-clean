"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Easing,
  Platform,
  Dimensions,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import GlassmorphicCard from "../components/GlassmorphicCard"
import Button from "../components/Button"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Import Supabase client
import { supabase } from "../lib/supabase"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const SessionDetailScreen = ({ navigation, route }) => {
  const { session, onComplete } = route.params || {}
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentMood, setCurrentMood] = useState(null)

  // Animation values
  const breatheAnim = useRef(new Animated.Value(1)).current
  const progressAnim = useRef(new Animated.Value(0)).current
  const timerRef = useRef(null)

  // Check if session is in favorites
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const favorites = await AsyncStorage.getItem("favoriteSessions")
        if (favorites) {
          const favoritesArray = JSON.parse(favorites)
          setIsFavorite(favoritesArray.some((fav) => fav.id === session.id))
        }
      } catch (error) {
        console.error("Error checking favorites:", error)
      }
    }

    if (session) {
      checkFavorite()
    }
  }, [session])

  // Parse duration to seconds
  useEffect(() => {
    if (session && session.duration) {
      const durationMatch = session.duration.match(/(\d+)/)
      if (durationMatch) {
        const minutes = Number.parseInt(durationMatch[1], 10)
        setTotalDuration(minutes * 60)
      }
    }
  }, [session])

  // Handle play/pause
  const togglePlayback = () => {
    if (isPlaying) {
      // Pause
      clearInterval(timerRef.current)
      setIsPlaying(false)
      Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, {
            toValue: 1.2,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnim, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).stop()
    } else {
      // Play
      setIsPlaying(true)

      // Start breathing animation with timing specific to exercise type
      let inhaleTime = 4000
      let exhaleTime = 4000

      if (session.category === "breathing") {
        if (session.title.includes("Box")) {
          inhaleTime = 4000
          exhaleTime = 4000
        } else if (session.title.includes("4-7-8")) {
          inhaleTime = 4000
          exhaleTime = 8000
        }
      } else if (session.category === "meditation") {
        inhaleTime = 5000
        exhaleTime = 5000
      } else if (session.category === "mindfulness") {
        inhaleTime = 6000
        exhaleTime = 6000
      }

      Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, {
            toValue: 1.2,
            duration: inhaleTime,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnim, {
            toValue: 1,
            duration: exhaleTime,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start()

      // Start timer
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 1
          const newProgress = newTime / totalDuration
          setProgress(newProgress)

          // Update progress animation
          Animated.timing(progressAnim, {
            toValue: newProgress,
            duration: 100,
            useNativeDriver: false,
          }).start()

          // End session when complete
          if (newTime >= totalDuration) {
            clearInterval(timerRef.current)
            setIsPlaying(false)

            // Show completion alert
            Alert.alert("Session Complete", "Great job completing your meditation session!", [
              {
                text: "Save to History",
                onPress: () => {
                  handleCompleteSession()
                },
              },
            ])

            return totalDuration
          }

          return newTime
        })
      }, 1000)
    }
  }

  // Reset session
  const resetSession = () => {
    clearInterval(timerRef.current)
    setIsPlaying(false)
    setCurrentTime(0)
    setProgress(0)
    progressAnim.setValue(0)
  }

  // Toggle favorite status
  const toggleFavorite = async () => {
    try {
      const favorites = await AsyncStorage.getItem("favoriteSessions")
      let favoritesArray = favorites ? JSON.parse(favorites) : []

      if (isFavorite) {
        // Remove from favorites
        favoritesArray = favoritesArray.filter((fav) => fav.id !== session.id)
        Alert.alert("Removed", "Session removed from favorites")
      } else {
        // Add to favorites
        favoritesArray.push(session)
        Alert.alert("Added", "Session added to favorites")
      }

      await AsyncStorage.setItem("favoriteSessions", JSON.stringify(favoritesArray))
      setIsFavorite(!isFavorite)
    } catch (error) {
      console.error("Error updating favorites:", error)
    }
  }

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Handle back button - confirm if session is in progress
  const handleBackPress = () => {
    if (isPlaying) {
      Alert.alert("Session in Progress", "Are you sure you want to exit? Your progress will be lost.", [
        { text: "Stay", style: "cancel" },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
      ])
    } else {
      navigation.goBack()
    }
  }

  // Add this function to the SessionDetailScreen component
  const saveSessionToSupabase = async (session, currentMood) => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("No authenticated user found, saving to local storage only")
        return false
      }

      // Parse duration to minutes
      let durationMinutes = 0
      if (session.duration) {
        const durationMatch = session.duration.match(/(\d+)/)
        if (durationMatch) {
          durationMinutes = Number.parseInt(durationMatch[1], 10)
        }
      }

      // Prepare session data
      const sessionData = {
        user_id: user.id,
        date: new Date().toISOString(),
        session_id: session.id,
        session_title: session.title,
        session_category: session.category || "meditation", // Default to meditation if not specified
        duration: session.duration,
        duration_minutes: durationMinutes,
        mood: currentMood ? currentMood.label : "Not recorded",
        notes: "",
      }

      // Insert into Supabase
      const { data, error } = await supabase.from("mental_sessions").insert([sessionData]).select()

      if (error) {
        console.error("Error saving session to Supabase:", error)
        return false
      }

      console.log("Session saved to Supabase successfully:", data)

      // Update user stats
      try {
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
          console.error("Error fetching current stats:", statsError)
        } else if (currentStats) {
          // Update existing record
          await supabase
            .from("user_stats")
            .update({
              mental_sessions: (currentStats.mental_sessions || 0) + 1,
              last_updated: new Date().toISOString(),
            })
            .eq("id", currentStats.id)
        } else {
          // Insert new record
          await supabase.from("user_stats").insert([
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
        }
      } catch (statsError) {
        console.error("Error updating stats after mental session:", statsError)
      }

      return true
    } catch (error) {
      console.error("Error in saveSessionToSupabase:", error)
      return false
    }
  }

  // Modify the handleCompleteSession function to call saveSessionToSupabase
  const handleCompleteSession = async () => {
    if (onComplete) {
      // First try to save to Supabase
      const savedToSupabase = await saveSessionToSupabase(session, currentMood)

      // Call the original onComplete function (which saves to AsyncStorage)
      onComplete()
    }
    navigation.goBack()
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Session not found</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{session.title}</Text>
        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#FF6B6B" : "white"} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.sessionImageContainer}>
          <Image
            source={{ uri: `/placeholder.svg?height=200&width=300&text=${session.title}` }}
            style={styles.sessionImage}
            resizeMode="cover"
          />
        </View>

        <GlassmorphicCard style={styles.sessionInfoCard}>
          <Text style={styles.sessionTitle}>{session.title}</Text>
          <Text style={styles.sessionDuration}>{session.duration}</Text>
          <Text style={styles.sessionDescription}>{session.description}</Text>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Benefits:</Text>
            {session.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </GlassmorphicCard>

        <GlassmorphicCard
          style={styles.playerCard}
          color="rgba(156, 124, 244, 0.1)"
          borderColor="rgba(156, 124, 244, 0.3)"
        >
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>

          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
          </View>

          <View style={styles.breatheCircleContainer}>
            <Animated.View
              style={[
                styles.breatheCircle,
                {
                  transform: [{ scale: breatheAnim }],
                  backgroundColor:
                    session.category === "breathing"
                      ? session.title.includes("Box")
                        ? "rgba(93, 173, 226, 0.2)"
                        : session.title.includes("4-7-8")
                          ? "rgba(41, 128, 185, 0.2)"
                          : "rgba(93, 173, 226, 0.2)"
                      : session.category === "meditation"
                        ? session.title.includes("Beginner")
                          ? "rgba(156, 124, 244, 0.2)"
                          : session.title.includes("Deep")
                            ? "rgba(142, 68, 173, 0.2)"
                            : "rgba(156, 124, 244, 0.2)"
                        : session.category === "mindfulness"
                          ? session.title.includes("Body Scan")
                            ? "rgba(88, 214, 141, 0.2)"
                            : session.title.includes("Walking")
                              ? "rgba(39, 174, 96, 0.2)"
                              : "rgba(88, 214, 141, 0.2)"
                          : "rgba(156, 124, 244, 0.2)",
                  borderColor:
                    session.category === "breathing"
                      ? session.title.includes("Box")
                        ? "#5DADE2"
                        : session.title.includes("4-7-8")
                          ? "#2980B9"
                          : "#5DADE2"
                      : session.category === "meditation"
                        ? session.title.includes("Beginner")
                          ? "#9C7CF4"
                          : session.title.includes("Deep")
                            ? "#8E44AD"
                            : "#9C7CF4"
                        : session.category === "mindfulness"
                          ? session.title.includes("Body Scan")
                            ? "#58D68D"
                            : session.title.includes("Walking")
                              ? "#27AE60"
                              : "#58D68D"
                          : "#9C7CF4",
                },
              ]}
            >
              <Text style={styles.breatheText}>
                {isPlaying
                  ? session.category === "breathing"
                    ? session.title.includes("Box")
                      ? currentTime % 16 < 4
                        ? "Inhale"
                        : currentTime % 16 < 8
                          ? "Hold"
                          : currentTime % 16 < 12
                            ? "Exhale"
                            : "Hold"
                      : session.title.includes("4-7-8")
                        ? currentTime % 19 < 4
                          ? "Inhale"
                          : currentTime % 19 < 11
                            ? "Hold"
                            : "Exhale"
                        : "Breathe"
                    : session.category === "meditation"
                      ? "Focus"
                      : session.category === "mindfulness"
                        ? session.title.includes("Body Scan")
                          ? "Feel"
                          : "Observe"
                        : "Breathe"
                  : "Breathe"}
              </Text>
            </Animated.View>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.controlButton} onPress={resetSession}>
              <Ionicons name="refresh" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={toggleFavorite}>
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? "#FF6B6B" : "white"}
              />
            </TouchableOpacity>
          </View>
        </GlassmorphicCard>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips for {session.title}:</Text>

          {session.category === "meditation" && (
            <>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#9C7CF4" />
                <Text style={styles.tipText}>Find a quiet place where you won't be disturbed</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#9C7CF4" />
                <Text style={styles.tipText}>Sit with your back straight but relaxed, hands resting on your lap</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#9C7CF4" />
                <Text style={styles.tipText}>Focus on your breath - notice the sensation of breathing in and out</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#9C7CF4" />
                <Text style={styles.tipText}>
                  When your mind wanders, gently bring your attention back to your breath
                </Text>
              </View>
            </>
          )}

          {session.category === "breathing" && session.title.includes("Box") && (
            <>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#5DADE2" />
                <Text style={styles.tipText}>Inhale slowly through your nose for 4 counts</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#5DADE2" />
                <Text style={styles.tipText}>Hold your breath for 4 counts</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#5DADE2" />
                <Text style={styles.tipText}>Exhale slowly through your mouth for 4 counts</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#5DADE2" />
                <Text style={styles.tipText}>Hold your breath again for 4 counts, then repeat the cycle</Text>
              </View>
            </>
          )}

          {session.category === "breathing" && session.title.includes("4-7-8") && (
            <>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#5DADE2" />
                <Text style={styles.tipText}>Inhale quietly through your nose for 4 seconds</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#5DADE2" />
                <Text style={styles.tipText}>Hold your breath for 7 seconds</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#5DADE2" />
                <Text style={styles.tipText}>
                  Exhale completely through your mouth for 8 seconds, making a whoosh sound
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#5DADE2" />
                <Text style={styles.tipText}>This is one breath cycle. Repeat for 4 full breaths</Text>
              </View>
            </>
          )}

          {session.category === "mindfulness" && session.title.includes("Body Scan") && (
            <>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#58D68D" />
                <Text style={styles.tipText}>Lie down or sit in a comfortable position with your eyes closed</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#58D68D" />
                <Text style={styles.tipText}>
                  Start by bringing awareness to your toes, then slowly move up through each part of your body
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#58D68D" />
                <Text style={styles.tipText}>Notice any sensations, tension, or discomfort without judgment</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#58D68D" />
                <Text style={styles.tipText}>
                  Breathe into any areas of tension and imagine them softening with each exhale
                </Text>
              </View>
            </>
          )}

          {session.category === "mindfulness" && session.title.includes("Walking") && (
            <>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#58D68D" />
                <Text style={styles.tipText}>Walk at a slower pace than normal, focusing on each step</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#58D68D" />
                <Text style={styles.tipText}>
                  Notice the sensation of your feet touching and lifting from the ground
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#58D68D" />
                <Text style={styles.tipText}>Be aware of your surroundings - colors, sounds, smells, and textures</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#58D68D" />
                <Text style={styles.tipText}>
                  When your mind wanders, gently bring your attention back to your walking
                </Text>
              </View>
            </>
          )}

          {/* Default tips if none of the specific categories match */}
          {(!session.category ||
            (session.category !== "meditation" &&
              session.category !== "breathing" &&
              session.category !== "mindfulness") ||
            (session.category === "breathing" && !session.title.includes("Box") && !session.title.includes("4-7-8")) ||
            (session.category === "mindfulness" &&
              !session.title.includes("Body Scan") &&
              !session.title.includes("Walking"))) && (
            <>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#9C7CF4" />
                <Text style={styles.tipText}>Find a quiet, comfortable place to practice</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#9C7CF4" />
                <Text style={styles.tipText}>Set aside this time for yourself - silence notifications</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#9C7CF4" />
                <Text style={styles.tipText}>Approach the practice with curiosity and without judgment</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle-outline" size={20} color="#9C7CF4" />
                <Text style={styles.tipText}>Remember that consistency is more important than duration</Text>
              </View>
            </>
          )}
        </View>

        <Button
          variant="primary"
          size="md"
          style={styles.completeButton}
          onPress={() => {
            handleCompleteSession()
          }}
        >
          Complete Session
        </Button>
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
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  errorText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginTop: 100,
  },
  sessionImageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 20,
  },
  sessionImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(156, 124, 244, 0.2)",
  },
  sessionInfoCard: {
    padding: 20,
    marginBottom: 20,
  },
  sessionTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  sessionDuration: {
    color: "#9C7CF4",
    fontSize: 16,
    marginBottom: 15,
  },
  sessionDescription: {
    color: "white",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  benefitsContainer: {
    marginBottom: 10,
  },
  benefitsTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  benefitText: {
    color: "white",
    fontSize: 16,
    marginLeft: 10,
  },
  playerCard: {
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  progressContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#9C7CF4",
    borderRadius: 3,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  timeText: {
    color: "#aaa",
    fontSize: 14,
  },
  breatheCircleContainer: {
    marginVertical: 20,
  },
  breatheCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(156, 124, 244, 0.2)",
    borderWidth: 2,
    borderColor: "#9C7CF4",
    justifyContent: "center",
    alignItems: "center",
  },
  breatheText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(156, 124, 244, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#9C7CF4",
  },
  tipsContainer: {
    marginBottom: 30,
  },
  tipsTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  tipText: {
    color: "#aaa",
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  completeButton: {
    backgroundColor: "#9C7CF4",
    marginBottom: 20,
  },
})

export default SessionDetailScreen

