"use client"

import { useState, useEffect, useMemo } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext"
import GlassmorphicCard from "../components/GlassmorphicCard"

const WorkoutRecommendationScreen = ({ navigation }) => {
  const { userProfile } = useUser()
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState([])

  // Use useMemo to prevent recreation on every render
  const mockRecommendations = useMemo(
    () => ({
      strength: [
        {
          id: "1",
          title: "5x5 Strength Program",
          description: "Build raw strength with compound movements",
          duration: "45-60 min",
          frequency: "3-4x per week",
          exercises: [
            { name: "Barbell Squat", sets: 5, reps: 5 },
            { name: "Bench Press", sets: 5, reps: 5 },
            { name: "Barbell Row", sets: 5, reps: 5 },
            { name: "Overhead Press", sets: 5, reps: 5 },
            { name: "Deadlift", sets: 1, reps: 5 },
          ],
        },
        {
          id: "2",
          title: "Powerlifting Focus",
          description: "Maximize your strength in the big three lifts",
          duration: "60-75 min",
          frequency: "4x per week",
          exercises: [
            { name: "Squat", sets: 4, reps: "3-5" },
            { name: "Bench Press", sets: 4, reps: "3-5" },
            { name: "Deadlift", sets: 3, reps: "3-5" },
            { name: "Accessory Work", sets: 3, reps: "8-12" },
          ],
        },
      ],
      muscle: [
        {
          id: "1",
          title: "Hypertrophy Split",
          description: "Maximize muscle growth with targeted volume",
          duration: "45-60 min",
          frequency: "5-6x per week",
          exercises: [
            { name: "Push Day (Chest/Shoulders/Triceps)", sets: "12-16 total", reps: "8-12" },
            { name: "Pull Day (Back/Biceps)", sets: "12-16 total", reps: "8-12" },
            { name: "Leg Day", sets: "12-16 total", reps: "8-12" },
          ],
        },
        {
          id: "2",
          title: "German Volume Training",
          description: "High volume approach for muscle growth",
          duration: "60 min",
          frequency: "4x per week",
          exercises: [
            { name: "Main Compound Exercise", sets: 10, reps: 10 },
            { name: "Secondary Compound Exercise", sets: 10, reps: 10 },
            { name: "Accessory Exercises", sets: 3, reps: "10-15" },
          ],
        },
      ],
      health: [
        {
          id: "1",
          title: "Balanced Fitness Plan",
          description: "Improve overall health and fitness",
          duration: "30-45 min",
          frequency: "3-4x per week",
          exercises: [
            { name: "Full Body Strength Training", sets: 3, reps: "10-12", frequency: "2x per week" },
            { name: "Cardio (moderate intensity)", duration: "30 min", frequency: "2x per week" },
            { name: "Flexibility/Mobility Work", duration: "15-20 min", frequency: "Daily" },
          ],
        },
        {
          id: "2",
          title: "Functional Fitness",
          description: "Improve everyday movement patterns",
          duration: "45 min",
          frequency: "3x per week",
          exercises: [
            { name: "Compound Movements", sets: 3, reps: "8-12" },
            { name: "Core Stability Work", sets: 3, reps: "10-15" },
            { name: "Balance & Coordination", sets: 2, reps: "10-12" },
          ],
        },
      ],
      athleticism: [
        {
          id: "1",
          title: "Athletic Performance",
          description: "Enhance speed, power, and agility",
          duration: "60 min",
          frequency: "4-5x per week",
          exercises: [
            { name: "Plyometric Training", sets: 3, reps: "5-8" },
            { name: "Strength Training", sets: 4, reps: "4-6" },
            { name: "Speed & Agility Drills", sets: 3, reps: "20-30 sec" },
            { name: "Sport-Specific Training", duration: "20 min" },
          ],
        },
        {
          id: "2",
          title: "Explosive Power",
          description: "Build power and athletic ability",
          duration: "45-60 min",
          frequency: "3-4x per week",
          exercises: [
            { name: "Olympic Lift Variations", sets: 5, reps: "3-5" },
            { name: "Medicine Ball Throws", sets: 4, reps: "6-8" },
            { name: "Jump Training", sets: 4, reps: "5-8" },
            { name: "Sprint Work", sets: 6, reps: "20-40m" },
          ],
        },
      ],
    }),
    [],
  ) // Empty dependency array means it's created only once

  useEffect(() => {
    // Simulate loading time
    setTimeout(() => {
      const goal = userProfile.goal || "health"
      setRecommendations(mockRecommendations[goal] || mockRecommendations.health)
      setLoading(false)
    }, 1500)
  }, [userProfile.goal, mockRecommendations])

  const getGoalName = () => {
    switch (userProfile.goal) {
      case "strength":
        return "Strength"
      case "muscle":
        return "Muscle Growth"
      case "health":
        return "Health & Fitness"
      case "athleticism":
        return "Athletic Performance"
      default:
        return "Health & Fitness"
    }
  }

  const talkToTrainer = () => {
    navigation.navigate("TrainerTab", {
      initialMessage: "Can you suggest a workout routine for me?",
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Workout Plans</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="cyan" />
          <Text style={styles.loadingText}>Generating recommendations...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.goalContainer}>
            <Text style={styles.goalLabel}>Recommended for your goal:</Text>
            <View style={styles.goalBadge}>
              <Text style={styles.goalText}>{getGoalName()}</Text>
            </View>
          </View>

          <View style={styles.recommendationsContainer}>
            {recommendations.map((workout) => (
              <GlassmorphicCard
                key={workout.id}
                style={styles.workoutCard}
                color="rgba(0, 255, 255, 0.05)"
                borderColor="rgba(0, 255, 255, 0.2)"
              >
                <Text style={styles.workoutTitle}>{workout.title}</Text>
                <Text style={styles.workoutDescription}>{workout.description}</Text>

                <View style={styles.workoutMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={18} color="#aaa" />
                    <Text style={styles.metaText}>{workout.duration}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={18} color="#aaa" />
                    <Text style={styles.metaText}>{workout.frequency}</Text>
                  </View>
                </View>

                <Text style={styles.exercisesTitle}>Workout Structure:</Text>
                {workout.exercises.map((exercise, index) => (
                  <View key={index} style={styles.exerciseItem}>
                    <Ionicons name="fitness-outline" size={18} color="cyan" />
                    <View style={styles.exerciseDetails}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseParams}>
                        {exercise.sets && exercise.reps
                          ? `${exercise.sets} sets × ${exercise.reps} reps`
                          : exercise.duration
                            ? `${exercise.duration}`
                            : ""}
                        {exercise.frequency ? `, ${exercise.frequency}` : ""}
                      </Text>
                    </View>
                  </View>
                ))}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => navigation.navigate("WorkoutDetail", { workout })}
                  >
                    <Text style={styles.startButtonText}>Start Plan</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => {
                      // Save workout logic would go here
                    }}
                  >
                    <Ionicons name="bookmark-outline" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </GlassmorphicCard>
            ))}
          </View>

          <TouchableOpacity style={styles.trainerButton} onPress={talkToTrainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="black" />
            <Text style={styles.trainerButtonText}>Ask AI Trainer for Custom Plan</Text>
          </TouchableOpacity>
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },
  goalContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  goalLabel: {
    color: "white",
    fontSize: 16,
    marginRight: 10,
  },
  goalBadge: {
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  goalText: {
    color: "cyan",
    fontSize: 14,
    fontWeight: "bold",
  },
  recommendationsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  workoutCard: {
    marginBottom: 20,
    padding: 20,
  },
  workoutTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  workoutDescription: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 15,
  },
  workoutMeta: {
    flexDirection: "row",
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  metaText: {
    color: "#aaa",
    fontSize: 14,
    marginLeft: 5,
  },
  exercisesTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  exerciseDetails: {
    marginLeft: 10,
    flex: 1,
  },
  exerciseName: {
    color: "white",
    fontSize: 16,
    marginBottom: 3,
  },
  exerciseParams: {
    color: "#aaa",
    fontSize: 14,
  },
  cardActions: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "cyan",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  startButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  trainerButton: {
    flexDirection: "row",
    backgroundColor: "cyan",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
})

export default WorkoutRecommendationScreen

