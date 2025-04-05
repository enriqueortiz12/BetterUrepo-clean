"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Image, Modal } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import RestTimer from "../components/RestTimer"
import GlassmorphicCard from "../components/GlassmorphicCard"
import HoverButton from "../components/HoverButton"
import AsyncStorage from "@react-native-async-storage/async-storage"

const ActiveWorkoutScreen = ({ navigation, route }) => {
  const { workout, trainingStyle } = route.params || {}
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSetIndex, setCurrentSetIndex] = useState(0)
  const [workoutData, setWorkoutData] = useState([])
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [workoutComplete, setWorkoutComplete] = useState(false)
  const [workoutStartTime, setWorkoutStartTime] = useState(null)
  const [workoutEndTime, setWorkoutEndTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showHowTo, setShowHowTo] = useState(false)

  const timerRef = useRef(null)

  // Initialize workout data
  useEffect(() => {
    if (workout && workout.exercises) {
      const initialData = workout.exercises.map((exercise) => ({
        ...exercise,
        sets: Array(exercise.sets || 3)
          .fill()
          .map(() => ({
            reps: exercise.reps || "10",
            weight: exercise.calculatedWeight || exercise.defaultWeight || 0,
            completed: false,
          })),
      }))
      setWorkoutData(initialData)
      setWorkoutStartTime(new Date())

      // Start elapsed time counter
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [workout])

  const currentExercise = workoutData[currentExerciseIndex]

  const handleSetComplete = () => {
    const updatedWorkoutData = [...workoutData]
    updatedWorkoutData[currentExerciseIndex].sets[currentSetIndex].completed = true
    setWorkoutData(updatedWorkoutData)

    // Move to next set or exercise
    if (currentSetIndex < currentExercise.sets.length - 1) {
      setCurrentSetIndex(currentSetIndex + 1)
      setShowRestTimer(true)
    } else {
      // Check if this was the last exercise
      if (currentExerciseIndex < workoutData.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1)
        setCurrentSetIndex(0)
        setShowRestTimer(true)
      } else {
        // Workout complete
        setWorkoutComplete(true)
        setWorkoutEndTime(new Date())
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }
  }

  const handleUpdateSet = (field, value) => {
    const updatedWorkoutData = [...workoutData]
    updatedWorkoutData[currentExerciseIndex].sets[currentSetIndex][field] = value
    setWorkoutData(updatedWorkoutData)
  }

  // Add this function after the handleUpdateSet function
  const syncWeightsWithWorkoutScreen = useCallback(
    (newCalculatedWeight, exerciseIndex) => {
      if (exerciseIndex === currentExerciseIndex) {
        // Update all sets of the current exercise with the new calculated weight
        const updatedWorkoutData = [...workoutData]

        // Only update sets that haven't been modified by the user
        updatedWorkoutData[exerciseIndex].sets = updatedWorkoutData[exerciseIndex].sets.map((set) => {
          // If the set is using the default calculated weight (not manually changed)
          if (set.weight === updatedWorkoutData[exerciseIndex].calculatedWeight) {
            return { ...set, weight: newCalculatedWeight }
          }
          return set
        })

        // Update the exercise's calculated weight
        updatedWorkoutData[exerciseIndex].calculatedWeight = newCalculatedWeight

        setWorkoutData(updatedWorkoutData)
      }
    },
    [currentExerciseIndex, workoutData],
  )

  // Add this useEffect after the existing useEffect
  useEffect(() => {
    // Check if there are updated weights in the route params
    if (route.params?.updatedWeights) {
      const { exerciseIndex, newCalculatedWeight } = route.params.updatedWeights
      syncWeightsWithWorkoutScreen(newCalculatedWeight, exerciseIndex)

      // Clear the params to prevent repeated updates
      navigation.setParams({ updatedWeights: undefined })
    }
  }, [route.params?.updatedWeights, syncWeightsWithWorkoutScreen, navigation])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const hrs = Math.floor(mins / 60)
    const remainingMins = mins % 60
    const remainingSecs = seconds % 60

    if (hrs > 0) {
      return `${hrs}:${remainingMins < 10 ? "0" : ""}${remainingMins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`
    }

    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`
  }

  const handleFinishWorkout = async () => {
    try {
      // Create workout log entry with more detailed information
      const workoutLog = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        trainingStyle: trainingStyle?.title || "Custom Workout",
        duration: formatTime(elapsedTime),
        exercises: workoutData.length,
        sets: workoutData.reduce((total, exercise) => total + exercise.sets.length, 0),
        exerciseNames: workoutData.map((exercise) => exercise.name),
        // Add more detailed stats
        completedSets: workoutData.reduce(
          (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
          0,
        ),
        totalWeight: workoutData.reduce(
          (total, exercise) =>
            total +
            exercise.sets.reduce(
              (setTotal, set) =>
                setTotal + (set.completed ? Number(set.weight) * Number(set.reps.toString().split("-")[0]) : 0),
              0,
            ),
          0,
        ),
      }

      console.log("Saving workout log:", workoutLog)

      // Get existing logs
      const existingLogsJson = await AsyncStorage.getItem("workoutLogs")
      let existingLogs = []

      if (existingLogsJson) {
        try {
          existingLogs = JSON.parse(existingLogsJson)
          if (!Array.isArray(existingLogs)) {
            console.error("Existing logs is not an array:", existingLogs)
            existingLogs = []
          }
        } catch (parseError) {
          console.error("Error parsing existing logs:", parseError)
        }
      }

      // Add new log
      const updatedLogs = [workoutLog, ...existingLogs]

      // Save to storage
      await AsyncStorage.setItem("workoutLogs", JSON.stringify(updatedLogs))
      console.log("Workout log saved successfully. Total logs:", updatedLogs.length)

      // Navigate back
      Alert.alert("Workout Complete", "Great job! Your workout has been saved to your log.", [
        { text: "View Log", onPress: () => navigation.navigate("LogTab") },
        { text: "Close", onPress: () => navigation.navigate("WorkoutTab") },
      ])
    } catch (error) {
      console.error("Error saving workout log:", error)
      Alert.alert("Error", "Failed to save workout log. Please try again.")
    }
  }

  const handleAddSet = () => {
    if (!currentExercise) return

    const updatedWorkoutData = [...workoutData]
    const lastSet = currentExercise.sets[currentExercise.sets.length - 1]

    updatedWorkoutData[currentExerciseIndex].sets.push({
      reps: lastSet.reps,
      weight: lastSet.weight,
      completed: false,
    })

    setWorkoutData(updatedWorkoutData)
  }

  if (!currentExercise) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {workoutComplete ? (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Workout Complete!</Text>

          <GlassmorphicCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{formatTime(elapsedTime)}</Text>

            <Text style={styles.summaryLabel}>Exercises</Text>
            <Text style={styles.summaryValue}>{workoutData.length}</Text>

            <Text style={styles.summaryLabel}>Total Sets</Text>
            <Text style={styles.summaryValue}>
              {workoutData.reduce((total, exercise) => total + exercise.sets.length, 0)}
            </Text>

            <Text style={styles.summaryLabel}>Training Style</Text>
            <Text style={styles.summaryValue}>{trainingStyle?.title || "Custom"}</Text>
          </GlassmorphicCard>

          <HoverButton
            style={styles.finishButton}
            onPress={handleFinishWorkout}
            activeOpacity={0.8}
            hoverColor="#00b3ff"
            pressColor="#0077ff"
          >
            <Text style={styles.finishButtonText}>Save Workout</Text>
          </HoverButton>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <HoverButton
              style={styles.backButton}
              onPress={() => {
                Alert.alert("End Workout", "Are you sure you want to end this workout?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "End", style: "destructive", onPress: () => navigation.goBack() },
                ])
              }}
              activeOpacity={0.7}
              hoverColor="rgba(255, 255, 255, 0.2)"
            >
              <Ionicons name="close" size={24} color="white" />
            </HoverButton>

            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>
                {trainingStyle?.title || "Workout"} • {formatTime(elapsedTime)}
              </Text>
              <Text style={styles.headerSubtitle}>
                {currentExercise?.name ? `${currentExercise.name} - ` : ""}
                {currentExerciseIndex + 1} of {workoutData.length} exercises
              </Text>
            </View>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseImageContainer}>
                <Image
                  source={{ uri: `/placeholder.svg?height=200&width=200&text=${currentExercise.name}` }}
                  style={styles.exerciseImage}
                />
                <View style={styles.muscleIconContainer}>
                  {currentExercise.targetMuscles && currentExercise.targetMuscles[0] === "Chest" && (
                    <View style={styles.muscleIcon}>
                      <Ionicons name="body" size={24} color="white" />
                    </View>
                  )}
                  {currentExercise.targetMuscles && currentExercise.targetMuscles[0] === "Quadriceps" && (
                    <View style={styles.muscleIcon}>
                      <Ionicons name="body" size={24} color="white" />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{currentExercise.name}</Text>
                <Text style={styles.exerciseTarget}>
                  {currentExercise.targetMuscles ? currentExercise.targetMuscles.join(", ") : ""}
                </Text>

                <View style={styles.exerciseActions}>
                  <HoverButton
                    style={styles.actionButton}
                    onPress={() => setShowHowTo(true)}
                    activeOpacity={0.7}
                    hoverColor="rgba(255, 255, 255, 0.2)"
                  >
                    <Ionicons name="play" size={16} color="white" />
                    <Text style={styles.actionButtonText}>How-To</Text>
                  </HoverButton>

                  <RestTimer
                    defaultTime={trainingStyle?.restTime || 60}
                    onTimerComplete={() => setShowRestTimer(false)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.setsContainer}>
              {currentExercise.sets.map((set, index) => (
                <View
                  key={index}
                  style={[
                    styles.setRow,
                    index === currentSetIndex && styles.currentSetRow,
                    set.completed && styles.completedSetRow,
                  ]}
                >
                  <View style={styles.setNumberContainer}>
                    <Text style={styles.setNumber}>{index + 1}</Text>
                  </View>

                  <View style={styles.setInputContainer}>
                    <Text style={styles.setInputLabel}>Reps</Text>
                    <TextInput
                      style={[styles.setInput, index === currentSetIndex ? styles.activeInput : null]}
                      value={set.reps.toString()}
                      onChangeText={(value) => index === currentSetIndex && handleUpdateSet("reps", value)}
                      keyboardType="numeric"
                      editable={index === currentSetIndex && !set.completed}
                    />
                  </View>

                  <View style={styles.setInputContainer}>
                    <Text style={styles.setInputLabel}>Weight (lb)</Text>
                    <TextInput
                      style={[styles.setInput, index === currentSetIndex ? styles.activeInput : null]}
                      value={set.weight.toString()}
                      onChangeText={(value) => index === currentSetIndex && handleUpdateSet("weight", value)}
                      keyboardType="numeric"
                      editable={index === currentSetIndex && !set.completed}
                    />
                    {index === 0 && currentExercise.calculatedWeight && (
                      <Text style={styles.calculatedWeightNote}>Based on your 1RM</Text>
                    )}
                  </View>

                  {index === currentSetIndex && !set.completed ? (
                    <HoverButton
                      style={styles.completeButton}
                      onPress={handleSetComplete}
                      activeOpacity={0.8}
                      hoverColor="#00b3ff"
                      pressColor="#0077ff"
                    >
                      <Ionicons name="checkmark" size={24} color="black" />
                    </HoverButton>
                  ) : set.completed ? (
                    <View style={styles.completedIndicator}>
                      <Ionicons name="checkmark" size={20} color="cyan" />
                    </View>
                  ) : (
                    <View style={styles.pendingIndicator} />
                  )}
                </View>
              ))}

              <HoverButton
                style={styles.addSetButton}
                onPress={handleAddSet}
                activeOpacity={0.7}
                hoverColor="rgba(255, 59, 92, 0.2)"
              >
                <Ionicons name="add" size={24} color="#ff3b5c" />
                <Text style={styles.addSetText}>Add Set</Text>
              </HoverButton>
            </View>
          </ScrollView>

          <Modal
            visible={showHowTo}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowHowTo(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>How to do {currentExercise.name}</Text>
                  <HoverButton
                    onPress={() => setShowHowTo(false)}
                    style={styles.closeModalButton}
                    activeOpacity={0.7}
                    hoverColor="rgba(255, 255, 255, 0.2)"
                  >
                    <Ionicons name="close" size={24} color="white" />
                  </HoverButton>
                </View>

                <Image
                  source={{ uri: `/placeholder.svg?height=200&width=300&text=${currentExercise.name}+Demonstration` }}
                  style={styles.howToImage}
                />

                <ScrollView style={styles.instructionsContainer}>
                  <Text style={styles.instructionsTitle}>Instructions:</Text>
                  <Text style={styles.instructionStep}>1. Set up with proper form and position</Text>
                  <Text style={styles.instructionStep}>2. Maintain core tension throughout the movement</Text>
                  <Text style={styles.instructionStep}>3. Focus on controlled movement and proper breathing</Text>
                  <Text style={styles.instructionStep}>4. Complete the full range of motion</Text>
                  <Text style={styles.instructionStep}>5. Return to starting position with control</Text>
                </ScrollView>

                <HoverButton
                  style={styles.closeModalButtonStyle}
                  onPress={() => setShowHowTo(false)}
                  activeOpacity={0.8}
                  hoverColor="#00b3ff"
                  pressColor="#0077ff"
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </HoverButton>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginTop: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  headerSubtitle: {
    color: "#aaa",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: "row",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  exerciseImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 15,
    position: "relative",
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  muscleIconContainer: {
    position: "absolute",
    bottom: 5,
    right: 5,
  },
  muscleIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  exerciseTarget: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 15,
  },
  exerciseActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    marginLeft: 5,
  },
  setsContainer: {
    padding: 20,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 10,
  },
  currentSetRow: {
    backgroundColor: "rgba(0, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
  },
  completedSetRow: {
    opacity: 0.7,
  },
  setNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  setNumber: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  setInputContainer: {
    flex: 1,
    marginRight: 10,
    position: "relative",
  },
  setInputLabel: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 5,
  },
  setInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  activeInput: {
    borderColor: "cyan",
  },
  completeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "cyan",
    justifyContent: "center",
    alignItems: "center",
  },
  completedIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  pendingIndicator: {
    width: 40,
    height: 40,
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 59, 92, 0.3)",
    borderRadius: 10,
    borderStyle: "dashed",
    marginTop: 10,
  },
  addSetText: {
    color: "#ff3b5c",
    fontSize: 16,
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#121212",
    borderRadius: 15,
    width: "100%",
    maxHeight: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeModalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  howToImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionsTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  instructionStep: {
    color: "white",
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 22,
  },
  closeModalButtonStyle: {
    backgroundColor: "cyan",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  summaryContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  summaryTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },
  summaryCard: {
    width: "100%",
    padding: 20,
    marginBottom: 30,
  },
  summaryLabel: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 5,
  },
  summaryValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  finishButton: {
    backgroundColor: "cyan",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: "100%",
    alignItems: "center",
  },
  finishButtonText: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
  },
  calculatedWeightNote: {
    color: "rgba(0, 255, 255, 0.7)",
    fontSize: 10,
    position: "absolute",
    bottom: -16,
    left: 0,
  },
})

export default ActiveWorkoutScreen

