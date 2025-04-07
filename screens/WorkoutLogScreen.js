"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import GlassmorphicCard from "../components/GlassmorphicCard"
import { supabase } from "../lib/supabase"
import Button from "../components/Button"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const WorkoutLogScreen = ({ navigation }) => {
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    loadWorkoutLogs()
  }, [])

  const loadWorkoutLogs = async () => {
    try {
      setLoading(true)
      console.log("Loading workout logs...")

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("No authenticated user found, loading from local storage only")
        await loadLogsFromLocalStorage()
        return
      }

      // Try to fetch logs from Supabase first
      const { data: supabaseLogs, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })

      if (error) {
        console.error("Error fetching workout logs from Supabase:", error)
        // Fall back to local storage if Supabase fails
        await loadLogsFromLocalStorage()
      } else {
        console.log(`Found ${supabaseLogs.length} workout logs in Supabase`)

        // Transform Supabase logs to match the expected format
        const formattedLogs = supabaseLogs.map((log) => ({
          id: log.id,
          date: log.date,
          trainingStyle: log.training_style,
          duration: log.duration,
          exercises: log.exercise_count,
          sets: log.set_count,
          exerciseNames: log.exercise_names || [],
          completedSets: log.completed_sets,
          totalWeight: log.total_weight,
          notes: log.notes,
        }))

        setWorkoutLogs(formattedLogs)

        // Also update local storage as a backup
        await AsyncStorage.setItem("workoutLogs", JSON.stringify(formattedLogs))
      }

      setLoading(false)
      setRefreshing(false)
    } catch (error) {
      console.error("Error loading workout logs:", error)
      Alert.alert("Error", "Failed to load workout logs")
      setWorkoutLogs([])
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadLogsFromLocalStorage = async () => {
    try {
      const logs = await AsyncStorage.getItem("workoutLogs")
      if (logs) {
        try {
          const parsedLogs = JSON.parse(logs)
          console.log(`Found ${parsedLogs.length} workout logs in local storage`)

          if (Array.isArray(parsedLogs)) {
            // Sort logs by date (newest first)
            const sortedLogs = parsedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            setWorkoutLogs(sortedLogs)
          } else {
            console.error("Parsed logs is not an array:", parsedLogs)
            setWorkoutLogs([])
          }
        } catch (parseError) {
          console.error("Error parsing workout logs:", parseError)
          setWorkoutLogs([])
        }
      } else {
        console.log("No workout logs found in local storage")
        setWorkoutLogs([])
      }

      setLoading(false)
      setRefreshing(false)
    } catch (error) {
      console.error("Error loading logs from local storage:", error)
      setWorkoutLogs([])
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Sync local logs to Supabase
  const syncLogsToSupabase = async () => {
    try {
      setIsSyncing(true)
      setSyncStatus("Syncing logs to cloud...")

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setSyncStatus("Error: Not logged in")
        setTimeout(() => setSyncStatus(null), 3000)
        setIsSyncing(false)
        return
      }

      // Get local logs
      const localLogsJson = await AsyncStorage.getItem("workoutLogs")
      if (!localLogsJson) {
        setSyncStatus("No local logs to sync")
        setTimeout(() => setSyncStatus(null), 3000)
        setIsSyncing(false)
        return
      }

      const localLogs = JSON.parse(localLogsJson)
      if (!Array.isArray(localLogs) || localLogs.length === 0) {
        setSyncStatus("No local logs to sync")
        setTimeout(() => setSyncStatus(null), 3000)
        setIsSyncing(false)
        return
      }

      // Get existing Supabase logs to avoid duplicates
      const { data: existingLogs, error: fetchError } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("user_id", user.id)

      if (fetchError) {
        console.error("Error fetching existing logs:", fetchError)
        setSyncStatus("Error: Couldn't fetch existing logs")
        setTimeout(() => setSyncStatus(null), 3000)
        setIsSyncing(false)
        return
      }

      // Create a set of existing IDs for faster lookup
      const existingIds = new Set(existingLogs.map((log) => log.id))

      // Filter out logs that already exist in Supabase
      const logsToSync = localLogs.filter((log) => !existingIds.has(log.id))

      if (logsToSync.length === 0) {
        setSyncStatus("All logs already synced")
        setTimeout(() => setSyncStatus(null), 3000)
        setIsSyncing(false)
        return
      }

      setSyncStatus(`Syncing ${logsToSync.length} logs...`)

      // Transform logs to match Supabase schema
      const formattedLogs = logsToSync.map((log) => ({
        id: log.id,
        user_id: user.id,
        date: log.date,
        training_style: log.trainingStyle,
        duration: log.duration,
        exercise_count: log.exercises,
        set_count: log.sets,
        completed_sets: log.completedSets || 0,
        total_weight: log.totalWeight || 0,
        exercise_names: log.exerciseNames || [],
        notes: log.notes || "",
      }))

      // Insert logs into Supabase
      const { error: insertError } = await supabase.from("workout_logs").insert(formattedLogs)

      if (insertError) {
        console.error("Error syncing logs to Supabase:", insertError)
        setSyncStatus("Error: Failed to sync logs")
        setTimeout(() => setSyncStatus(null), 3000)
        setIsSyncing(false)
        return
      }

      setSyncStatus(`Successfully synced ${logsToSync.length} logs`)
      setTimeout(() => setSyncStatus(null), 3000)

      // Reload logs to show the updated data
      loadWorkoutLogs()
    } catch (error) {
      console.error("Error in syncLogsToSupabase:", error)
      setSyncStatus("Error: Sync failed")
      setTimeout(() => setSyncStatus(null), 3000)
    } finally {
      setIsSyncing(false)
    }
  }

  // Refresh logs when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadWorkoutLogs()
    })

    return unsubscribe
  }, [navigation])

  const onRefresh = () => {
    setRefreshing(true)
    loadWorkoutLogs()
  }

  const deleteWorkoutLog = async (id) => {
    try {
      // First update local state
      const updatedLogs = workoutLogs.filter((log) => log.id !== id)
      setWorkoutLogs(updatedLogs)

      // Update local storage
      await AsyncStorage.setItem("workoutLogs", JSON.stringify(updatedLogs))

      // Try to delete from Supabase if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase.from("workout_logs").delete().eq("id", id).eq("user_id", user.id)

        if (error) {
          console.error("Error deleting workout log from Supabase:", error)
          // We don't revert the local deletion even if Supabase fails
        }
      }
    } catch (error) {
      console.error("Error deleting workout log:", error)
      Alert.alert("Error", "Failed to delete workout log")
    }
  }

  const confirmDelete = (id) => {
    Alert.alert("Delete Workout", "Are you sure you want to delete this workout log?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteWorkoutLog(id) },
    ])
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const renderWorkoutLog = ({ item }) => (
    <GlassmorphicCard style={styles.logCard} color="rgba(0, 20, 20, 0.5)" borderColor="rgba(0, 153, 255, 0.3)">
      <View style={styles.logHeader}>
        <View>
          <Text style={styles.logTitle}>{item.trainingStyle || "Workout"}</Text>
          <Text style={styles.logDate}>{formatDate(item.date)}</Text>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#ff3b5c" />
        </TouchableOpacity>
      </View>

      <View style={styles.logStats}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={18} color="cyan" />
          <Text style={styles.statText}>{item.duration}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="barbell-outline" size={18} color="cyan" />
          <Text style={styles.statText}>{item.exercises} exercises</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="repeat-outline" size={18} color="cyan" />
          <Text style={styles.statText}>{item.sets} sets</Text>
        </View>
      </View>

      {item.exerciseNames && item.exerciseNames.length > 0 && (
        <View style={styles.exercisesList}>
          <Text style={styles.exercisesTitle}>Exercises:</Text>
          <View style={styles.exercisesContainer}>
            {item.exerciseNames.slice(0, 3).map((exercise, index) => (
              <View key={index} style={styles.exerciseItemContainer}>
                <Ionicons name="fitness-outline" size={14} color="#0099ff" style={styles.exerciseIcon} />
                <Text style={styles.exerciseItem}>{exercise}</Text>
              </View>
            ))}
            {item.exerciseNames.length > 3 && (
              <Text style={styles.moreExercises}>+{item.exerciseNames.length - 3} more</Text>
            )}
          </View>
        </View>
      )}
    </GlassmorphicCard>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Log</Text>
        <View style={styles.headerButtons}>
          <Button
            variant="outline"
            size="sm"
            iconName="sync"
            style={styles.syncButton}
            onPress={syncLogsToSupabase}
            isLoading={isSyncing}
            disabled={isSyncing}
          >
            Sync
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="refresh"
            style={styles.refreshButton}
            onPress={onRefresh}
            isLoading={refreshing}
            disabled={refreshing}
          />
        </View>
      </View>

      {syncStatus && (
        <View style={styles.syncStatusContainer}>
          <Text style={styles.syncStatusText}>{syncStatus}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="cyan" />
          <Text style={styles.loadingText}>Loading workout logs...</Text>
        </View>
      ) : workoutLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="fitness" size={80} color="rgba(0, 255, 255, 0.3)" />
          <Text style={styles.emptyText}>No workout logs yet</Text>
          <Text style={styles.emptySubtext}>Complete a workout to see it here</Text>
        </View>
      ) : (
        <FlatList
          data={workoutLogs}
          renderItem={renderWorkoutLog}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.logsList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  syncButton: {
    marginRight: 10,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 0,
  },
  syncStatusContainer: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  syncStatusText: {
    color: "cyan",
    textAlign: "center",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    marginTop: 15,
  },
  emptyText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
  },
  logsList: {
    padding: 20,
    paddingBottom: 80, // Increased padding for floating tab bar
  },
  logCard: {
    marginBottom: 30, // Increased spacing between cards
    padding: 20, // Increased padding inside cards
    borderRadius: 15,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20, // Increased spacing
  },
  logTitle: {
    color: "white",
    fontSize: 20, // Larger font
    fontWeight: "bold",
    marginBottom: 8, // More spacing
  },
  logDate: {
    color: "#aaa",
    fontSize: 14,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 59, 92, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 92, 0.2)",
  },
  logStats: {
    flexDirection: "row",
    marginBottom: 20, // Increased spacing
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    color: "white",
    fontSize: 14,
    marginLeft: 5,
    fontWeight: "500",
  },
  exercisesList: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 15,
  },
  exercisesTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  exercisesContainer: {
    marginLeft: 5,
  },
  exerciseItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  exerciseIcon: {
    marginRight: 8,
  },
  exerciseItem: {
    color: "white",
    fontSize: 15,
  },
  moreExercises: {
    color: "cyan",
    fontSize: 14,
    marginTop: 5,
    marginLeft: 22, // Align with other items
  },
})

export default WorkoutLogScreen

