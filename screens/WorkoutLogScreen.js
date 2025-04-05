"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import GlassmorphicCard from "../components/GlassmorphicCard"

const WorkoutLogScreen = ({ navigation }) => {
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadWorkoutLogs()
  }, [])

  const loadWorkoutLogs = async () => {
    try {
      setLoading(true)
      console.log("Loading workout logs...")

      const logs = await AsyncStorage.getItem("workoutLogs")
      if (logs) {
        try {
          const parsedLogs = JSON.parse(logs)
          console.log(`Found ${parsedLogs.length} workout logs`)

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
        console.log("No workout logs found")
        setWorkoutLogs([])
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
      const updatedLogs = workoutLogs.filter((log) => log.id !== id)
      setWorkoutLogs(updatedLogs)
      await AsyncStorage.setItem("workoutLogs", JSON.stringify(updatedLogs))
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
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
})

export default WorkoutLogScreen

