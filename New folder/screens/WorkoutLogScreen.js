"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import GlassmorphicCard from "../components/GlassmorphicCard"

const WorkoutLogScreen = ({ navigation }) => {
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkoutLogs()
  }, [])

  const loadWorkoutLogs = async () => {
    try {
      const logs = await AsyncStorage.getItem("workoutLogs")
      if (logs) {
        setWorkoutLogs(JSON.parse(logs))
      }
      setLoading(false)
    } catch (error) {
      console.error("Error loading workout logs:", error)
      setLoading(false)
    }
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
    <GlassmorphicCard style={styles.logCard}>
      <View style={styles.logHeader}>
        <View>
          <Text style={styles.logTitle}>{item.trainingStyle || "Workout"}</Text>
          <Text style={styles.logDate}>{formatDate(item.date)}</Text>
        </View>
        <TouchableOpacity onPress={() => confirmDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#ff3b5c" />
        </TouchableOpacity>
      </View>

      <View style={styles.logStats}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={18} color="#aaa" />
          <Text style={styles.statText}>{item.duration}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="barbell-outline" size={18} color="#aaa" />
          <Text style={styles.statText}>{item.exercises} exercises</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="repeat-outline" size={18} color="#aaa" />
          <Text style={styles.statText}>{item.sets} sets</Text>
        </View>
      </View>

      {item.exercises && (
        <View style={styles.exercisesList}>
          <Text style={styles.exercisesTitle}>Exercises:</Text>
          {item.exerciseNames.slice(0, 3).map((exercise, index) => (
            <Text key={index} style={styles.exerciseItem}>
              • {exercise}
            </Text>
          ))}
          {item.exerciseNames.length > 3 && (
            <Text style={styles.moreExercises}>+{item.exerciseNames.length - 3} more</Text>
          )}
        </View>
      )}
    </GlassmorphicCard>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Log</Text>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
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
  },
  logCard: {
    marginBottom: 15,
    padding: 15,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  logTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  logDate: {
    color: "#aaa",
    fontSize: 14,
  },
  logStats: {
    flexDirection: "row",
    marginBottom: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  statText: {
    color: "white",
    fontSize: 14,
    marginLeft: 5,
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
    marginBottom: 10,
  },
  exerciseItem: {
    color: "white",
    fontSize: 14,
    marginBottom: 5,
  },
  moreExercises: {
    color: "cyan",
    fontSize: 14,
    marginTop: 5,
  },
})

export default WorkoutLogScreen

