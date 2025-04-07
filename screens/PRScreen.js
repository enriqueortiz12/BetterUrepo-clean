"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Animated,
  Easing,
  SafeAreaView,
  Platform,
  Dimensions,
  useWindowDimensions,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext"
import { commonExercises } from "../data/prData"
import GlassmorphicCard from "../components/GlassmorphicCard"
// Add the import for our new chart components at the top of the file
import ProgressChart from "../components/ProgressChart"
import PredictionChart from "../components/PredictionChart"
import { supabase } from "../lib/supabase"

// Add this import at the top
import Button from "../components/Button"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const PRScreen = () => {
  const {
    userProfile,
    personalRecords,
    addPersonalRecord,
    updatePersonalRecord,
    deletePersonalRecord,
    resetPersonalRecords,
    isLoading: userLoading,
    debugPRData, // Add this line
  } = useUser()
  const [modalVisible, setModalVisible] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentPR, setCurrentPR] = useState(null)
  const [exercise, setExercise] = useState("")
  const [value, setValue] = useState("")
  const [target, setTarget] = useState("")
  const [unit, setUnit] = useState("lbs")
  const [showExerciseList, setShowExerciseList] = useState(false)
  const [filteredExercises, setFilteredExercises] = useState(commonExercises || [])
  const [predictionDetails, setPredictionDetails] = useState(null)
  const [showPredictionModal, setShowPredictionModal] = useState(false)
  const { width: windowWidth } = useWindowDimensions()
  const [isLoading, setIsLoading] = useState(true)
  const [prGoals, setPrGoals] = useState([])

  // Animation for progress bars
  const progressValues = useRef([]).current

  // Define trainingLevels here
  const trainingLevels = [
    { id: "beginner", title: "Beginner" },
    { id: "intermediate", title: "Intermediate" },
    { id: "advanced", title: "Advanced" },
  ]

  useEffect(() => {
    // Add a small delay to ensure data is loaded
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    console.log("Personal Records in PRScreen:", personalRecords)

    // Initialize progress animation values if needed
    if (personalRecords.length > progressValues.length) {
      const newValues = Array(personalRecords.length - progressValues.length)
        .fill(0)
        .map(() => new Animated.Value(0))
      progressValues.push(...newValues)
    }

    // Transform personal records to include targets
    const goals = personalRecords.map((pr) => ({
      ...pr,
      target: pr.target || Math.round(pr.value * 1.2), // Default target is 20% higher than current PR
    }))

    console.log("PR Goals:", goals)
    setPrGoals(goals)

    // Animate progress bars
    goals.forEach((pr, index) => {
      if (progressValues[index]) {
        const progress = calculateProgress(pr.value, pr.target) / 100
        Animated.timing(progressValues[index], {
          toValue: progress,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false, // Can't use native driver for layout properties
        }).start()
      }
    })
  }, [personalRecords, progressValues])

  const resetForm = () => {
    setExercise("")
    setValue("")
    setTarget("")
    setUnit("lbs")
    setCurrentPR(null)
    setEditMode(false)
  }

  const handleOpenModal = (pr = null) => {
    if (pr) {
      setExercise(pr.exercise)
      setValue(pr.value.toString())
      setTarget(pr.target ? pr.target.toString() : Math.round(pr.value * 1.2).toString())
      setUnit(pr.unit)
      setCurrentPR(pr)
      setEditMode(true)
    } else {
      resetForm()
    }
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!exercise || !value) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    const prData = {
      exercise,
      value: Number.parseFloat(value),
      target: Number.parseFloat(target || (value * 1.2).toFixed(0)),
      unit,
    }

    let result

    if (editMode && currentPR) {
      result = await updatePersonalRecord(currentPR.id, prData)
    } else {
      result = await addPersonalRecord(prData)
    }

    // Add this function to the handleSave function in PRScreen.js
    // Insert this code right after updating the PR in Supabase

    // Update user stats if this is a new PR for the current month
    if (!editMode) {
      try {
        // Get the current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
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
                prs_this_month: currentStats.prs_this_month + 1,
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
                prs_this_month: 1,
                current_month: currentMonth,
                current_year: currentYear,
              },
            ])
          }
        }
      } catch (statsError) {
        console.error("Error updating user stats:", statsError)
        // Continue with modal closing even if stats update fails
      }
    }

    if (result.success) {
      setModalVisible(false)
      resetForm()
    } else {
      Alert.alert("Error", result.error || "Something went wrong")
    }
  }

  const handleDelete = async () => {
    if (!currentPR) return

    Alert.alert("Confirm Delete", `Are you sure you want to delete this PR for ${currentPR.exercise}?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await deletePersonalRecord(currentPR.id)
          if (result.success) {
            setModalVisible(false)
            resetForm()
          } else {
            Alert.alert("Error", result.error || "Something went wrong")
          }
        },
      },
    ])
  }

  const handleExerciseChange = (text) => {
    setExercise(text)
    if (text.length > 0) {
      const filtered = commonExercises.filter((ex) => ex.toLowerCase().includes(text.toLowerCase()))
      setFilteredExercises(filtered)
      setShowExerciseList(true)
    } else {
      setFilteredExercises(commonExercises)
      setShowExerciseList(false)
    }
  }

  const selectExercise = (ex) => {
    setExercise(ex)
    setShowExerciseList(false)
  }

  const calculateProgress = (current, target) => {
    if (!current || !target || isNaN(current) || isNaN(target) || target === 0) return 0
    const progress = (current / target) * 100
    return Math.min(progress, 100) // Cap at 100%
  }

  // Calculate time to goal based on user's profile and progress history
  const calculateTimeToGoal = (current, target, prHistory = [], exerciseName) => {
    // If already reached or exceeded the goal
    if (current >= target) return "Goal reached!"

    // Filter history for this specific exercise
    const exerciseHistory = prHistory.filter((record) => record.exercise === exerciseName)

    // If no history or only one data point, use a default rate based on experience level
    if (exerciseHistory.length < 2) {
      // Determine experience level from profile
      const trainingLevel = userProfile.trainingLevel || "intermediate"

      // Different improvement rates based on training level
      let improvementRate
      switch (trainingLevel) {
        case "beginner":
          improvementRate = 0.1 // 10% improvement per month for beginners
          break
        case "advanced":
          improvementRate = 0.02 // 2% improvement per month for advanced
          break
        default: // intermediate
          improvementRate = 0.05 // 5% improvement per month
      }

      // Adjust for weight if available
      if (userProfile.weight) {
        // Heavier users might progress slower on some lifts
        const weightFactor = userProfile.weight > 200 ? 0.9 : userProfile.weight > 150 ? 1.0 : 1.1
        improvementRate *= weightFactor
      }

      const improvement = current * improvementRate
      const monthsToGoal = Math.ceil((target - current) / improvement)

      if (monthsToGoal <= 1) return "~1 month"
      else if (monthsToGoal <= 12) return `~${monthsToGoal} months`
      else return `~${Math.round(monthsToGoal / 12)} years`
    }

    // Sort history by date (newest first)
    const sortedHistory = [...exerciseHistory].sort((a, b) => new Date(b.date) - new Date(a.date))

    // Calculate rate of improvement
    const newest = sortedHistory[0].value
    const oldest = sortedHistory[sortedHistory.length - 1].value
    const daysDiff =
      (new Date(sortedHistory[0].date) - new Date(sortedHistory[sortedHistory.length - 1].date)) / (1000 * 60 * 60 * 24)

    // If no improvement or negative improvement, use default
    if (daysDiff <= 0 || newest <= oldest) {
      const trainingLevel = userProfile.trainingLevel || "intermediate"
      const improvementRate = trainingLevel === "beginner" ? 0.1 : trainingLevel === "advanced" ? 0.02 : 0.05

      const improvement = current * improvementRate
      const monthsToGoal = Math.ceil((target - current) / improvement)

      if (monthsToGoal <= 1) return "~1 month"
      else if (monthsToGoal <= 12) return `~${monthsToGoal} months`
      else return `~${Math.round(monthsToGoal / 12)} years`
    }

    // Calculate daily improvement rate
    let dailyImprovement = (newest - oldest) / daysDiff

    // Apply training level adjustment factor to the daily improvement rate
    const trainingLevel = userProfile.trainingLevel || "intermediate"
    const adjustmentFactor = trainingLevel === "beginner" ? 1.2 : trainingLevel === "advanced" ? 0.8 : 1.0
    dailyImprovement *= adjustmentFactor

    // Calculate days to goal
    const daysToGoal = Math.ceil((target - current) / dailyImprovement)

    if (daysToGoal <= 7) return `~${daysToGoal} days`
    else if (daysToGoal <= 30) return `~${Math.ceil(daysToGoal / 7)} weeks`
    else if (daysToGoal <= 365) return `~${Math.ceil(daysToGoal / 30)} months`
    else return `~${Math.round(daysToGoal / 365)} years`
  }

  // Show detailed prediction information
  const showPredictionInfo = (pr) => {
    try {
      console.log("Showing prediction info for:", pr)

      // Get exercise history
      const exerciseHistory = personalRecords.filter((record) => record.exercise === pr.exercise)
      console.log("Exercise history:", exerciseHistory)

      // Calculate prediction details
      const timeToGoal = calculateTimeToGoal(pr.value, pr.target, exerciseHistory, pr.exercise)
      const progress = calculateProgress(pr.value, pr.target)

      // Calculate average improvement rate
      let improvementRate = "Unknown"
      if (exerciseHistory.length >= 2) {
        const sortedHistory = [...exerciseHistory].sort((a, b) => new Date(b.date) - new Date(a.date))
        const newest = sortedHistory[0].value
        const oldest = sortedHistory[sortedHistory.length - 1].value
        const daysDiff =
          (new Date(sortedHistory[0].date) - new Date(sortedHistory[sortedHistory.length - 1].date)) /
          (1000 * 60 * 60 * 24)

        if (daysDiff > 0 && newest > oldest) {
          const dailyRate = (newest - oldest) / oldest / daysDiff
          improvementRate = `${(dailyRate * 30 * 100).toFixed(2)}% per month`
        }
      }

      // Get training level impact description
      let trainingLevelImpact = ""
      switch (userProfile.trainingLevel) {
        case "beginner":
          trainingLevelImpact = "As a beginner, your progress predictions are accelerated (20% faster)"
          break
        case "advanced":
          trainingLevelImpact = "As an advanced lifter, your progress predictions are more conservative (20% slower)"
          break
        default:
          trainingLevelImpact = "As an intermediate lifter, your progress predictions are balanced"
      }

      // Set prediction details
      const details = {
        exercise: pr.exercise,
        current: pr.value,
        target: pr.target,
        unit: pr.unit,
        timeToGoal,
        progress,
        improvementRate,
        historyCount: exerciseHistory.length,
        trainingLevel: userProfile.trainingLevel,
        trainingLevelImpact,
      }

      console.log("Setting prediction details:", details)
      setPredictionDetails(details)
      setShowPredictionModal(true)
    } catch (error) {
      console.error("Error showing prediction info:", error)
      Alert.alert("Error", "Failed to show progress information. Please try again.")
    }
  }

  // Get the title of the selected training level
  const getTrainingLevelTitle = () => {
    const level = trainingLevels.find((level) => level.id === userProfile.trainingLevel)
    return level ? level.title : "Not set"
  }

  // Add a function to create sample PR data for testing

  // Reset PRs to initial data
  const handleResetPRs = () => {
    Alert.alert("Reset PRs", "Are you sure you want to reset all PRs to default values? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          const result = await resetPersonalRecords()
          if (result.success) {
            Alert.alert("Success", "Personal records have been reset to default values.")
          } else {
            Alert.alert("Error", result.error || "Failed to reset personal records.")
          }
        },
      },
    ])
  }

  // Add a debug function

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>PR Goals</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton} onPress={handleResetPRs}>
              <Ionicons name="refresh-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading || userLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="cyan" />
            <Text style={styles.loadingText}>Loading PR data...</Text>
          </View>
        ) : prGoals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy" size={80} color="rgba(0, 153, 255, 0.3)" />
            <Text style={styles.emptyText}>No personal records yet</Text>
            <Text style={styles.emptySubtext}>Tap the button below to add your first PR</Text>

            {/* Replace the sample button with an Add PR button */}
            <Button
              variant="primary"
              size="md"
              iconName="add"
              style={styles.addPrButton}
              onPress={() => handleOpenModal()}
            >
              Add PR Goal
            </Button>
          </View>
        ) : (
          <>
            <View style={styles.scrollViewWrapper}>
              <ScrollView
                showsVerticalScrollIndicator={true}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
              >
                {prGoals.map((pr, index) => (
                  <GlassmorphicCard
                    key={pr.id}
                    style={styles.prCard}
                    color="rgba(0, 20, 20, 0.5)"
                    borderColor="rgba(0, 153, 255, 0.3)"
                  >
                    <View style={styles.prCardContent}>
                      <Text style={styles.prExercise} numberOfLines={1} ellipsizeMode="tail">
                        {pr.exercise}
                      </Text>
                      <Text style={styles.prValue}>
                        {pr.value} <Text style={styles.prUnit}>{pr.unit}</Text>
                      </Text>
                    </View>
                    <View style={styles.prDetails}>
                      <View style={styles.targetRow}>
                        <Text style={styles.prTarget}>
                          Target: {pr.target} {pr.unit}
                        </Text>
                        <TouchableOpacity
                          style={styles.predictionBadge}
                          onPress={() => showPredictionInfo(pr)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.predictionText}>
                            {calculateTimeToGoal(
                              pr.value,
                              pr.target,
                              personalRecords.filter((record) => record.exercise === pr.exercise),
                              pr.exercise,
                            )}
                          </Text>
                          <Ionicons name="information-circle-outline" size={14} color="#0099ff" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <Animated.View
                          style={[
                            styles.progressBar,
                            {
                              width:
                                progressValues[index]?.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ["0%", "100%"],
                                }) || "0%",
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => handleOpenModal(pr)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="create-outline" size={14} color="white" />
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.historyButton}
                          onPress={() => showPredictionInfo(pr)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="analytics-outline" size={14} color="white" />
                          <Text style={styles.historyButtonText}>Progress</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </GlassmorphicCard>
                ))}
                {/* Add extra padding at the bottom to ensure scrolling works */}
                <View style={{ height: 100 }} />
              </ScrollView>
            </View>

            {/* Replace the add button with this: */}
            <Button
              variant="primary"
              size="md"
              iconName="add"
              style={styles.addButton}
              onPress={() => handleOpenModal()}
            >
              Add New PR Goal
            </Button>
          </>
        )}

        {/* Rest of the modal code remains the same */}

        {/* PR Edit Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{editMode ? "Edit PR Goal" : "Add PR Goal"}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Exercise</Text>
                  <TextInput
                    style={styles.input}
                    value={exercise}
                    onChangeText={handleExerciseChange}
                    placeholder="e.g. Bench Press"
                    placeholderTextColor="#666"
                  />
                  {showExerciseList && (
                    <View style={styles.exerciseList}>
                      {filteredExercises.map((ex, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.exerciseItem}
                          onPress={() => selectExercise(ex)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.exerciseItemText}>{ex}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 2, marginRight: 10 }]}>
                    <Text style={styles.label}>Current Value</Text>
                    <TextInput
                      style={styles.input}
                      value={value}
                      onChangeText={setValue}
                      keyboardType="numeric"
                      placeholder="e.g. 225"
                      placeholderTextColor="#666"
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Unit</Text>
                    <View style={styles.unitSelector}>
                      <TouchableOpacity
                        style={[styles.unitOption, unit === "lbs" && styles.unitOptionSelected]}
                        onPress={() => setUnit("lbs")}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.unitText, unit === "lbs" && styles.unitTextSelected]}>lbs</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.unitOption, unit === "kg" && styles.unitOptionSelected]}
                        onPress={() => setUnit("kg")}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.unitText, unit === "kg" && styles.unitTextSelected]}>kg</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Target Value</Text>
                  <TextInput
                    style={styles.input}
                    value={target}
                    onChangeText={setTarget}
                    keyboardType="numeric"
                    placeholder="e.g. 275"
                    placeholderTextColor="#666"
                  />
                  {editMode && currentPR && (
                    <Text style={styles.predictionNote}>
                      Estimated time to goal:{" "}
                      {calculateTimeToGoal(
                        Number.parseFloat(value),
                        Number.parseFloat(target),
                        personalRecords.filter((record) => record.exercise === exercise),
                        exercise,
                      )}
                    </Text>
                  )}
                </View>

                <View style={styles.modalActions}>
                  {/* Replace the save button with this: */}
                  <Button variant="primary" size="md" style={styles.saveButton} onPress={handleSave}>
                    {editMode ? "Update" : "Save"}
                  </Button>

                  {editMode && (
                    /* Replace the delete button with this: */
                    <Button variant="danger" size="md" style={styles.deleteButton} onPress={handleDelete}>
                      Delete
                    </Button>
                  )}
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Prediction Details Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showPredictionModal}
          onRequestClose={() => setShowPredictionModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Progress Prediction</Text>
                <TouchableOpacity onPress={() => setShowPredictionModal(false)} style={styles.closeModalButton}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              {predictionDetails && (
                <ScrollView style={styles.predictionContainer} showsVerticalScrollIndicator={false}>
                  <Text style={styles.predictionTitle}>{predictionDetails.exercise}</Text>

                  <View style={styles.predictionSummary}>
                    <View style={styles.predictionSummaryItem}>
                      <Text style={styles.predictionSummaryLabel}>Current</Text>
                      <Text style={styles.predictionSummaryValue}>
                        {predictionDetails.current} {predictionDetails.unit}
                      </Text>
                    </View>

                    <View style={styles.predictionSummaryItem}>
                      <Text style={styles.predictionSummaryLabel}>Target</Text>
                      <Text style={styles.predictionSummaryValue}>
                        {predictionDetails.target} {predictionDetails.unit}
                      </Text>
                    </View>

                    <View style={styles.predictionSummaryItem}>
                      <Text style={styles.predictionSummaryLabel}>ETA</Text>
                      <Text style={styles.predictionSummaryValue}>{predictionDetails.timeToGoal}</Text>
                    </View>
                  </View>

                  <View style={styles.predictionProgressBar}>
                    <View style={[styles.predictionProgressFill, { width: `${predictionDetails.progress}%` }]} />
                    <Text style={styles.predictionProgressText}>{predictionDetails.progress.toFixed(1)}%</Text>
                  </View>

                  <View style={styles.chartSection}>
                    <Text style={styles.chartSectionTitle}>Historical Progress</Text>
                    <ProgressChart
                      current={predictionDetails.current}
                      target={predictionDetails.target}
                      unit={predictionDetails.unit}
                      history={personalRecords.filter((record) => record.exercise === predictionDetails.exercise)}
                      color="#0099ff"
                    />
                  </View>

                  <View style={styles.chartSection}>
                    <Text style={styles.chartSectionTitle}>Projected Progress</Text>
                    <PredictionChart
                      current={predictionDetails.current}
                      target={predictionDetails.target}
                      timeToGoal={predictionDetails.timeToGoal}
                      unit={predictionDetails.unit}
                    />
                  </View>

                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Additional Details</Text>

                    <View style={styles.predictionRow}>
                      <Text style={styles.predictionLabel}>Improvement rate:</Text>
                      <Text style={styles.predictionValue}>{predictionDetails.improvementRate}</Text>
                    </View>

                    <View style={styles.predictionRow}>
                      <Text style={styles.predictionLabel}>Data points:</Text>
                      <Text style={styles.predictionValue}>{predictionDetails.historyCount}</Text>
                    </View>

                    <View style={styles.predictionRow}>
                      <Text style={styles.predictionLabel}>Training Level:</Text>
                      <Text style={styles.predictionValue}>
                        {predictionDetails.trainingLevel
                          ? predictionDetails.trainingLevel.charAt(0).toUpperCase() +
                            predictionDetails.trainingLevel.slice(1)
                          : "Not set"}
                      </Text>
                    </View>

                    <View style={styles.trainingLevelImpactContainer}>
                      <Text style={styles.trainingLevelImpactText}>{predictionDetails.trainingLevelImpact}</Text>
                    </View>

                    <Text style={styles.predictionNote}>
                      This prediction is based on your current progress and may vary based on training consistency,
                      nutrition, recovery, and other factors.
                    </Text>
                  </View>
                </ScrollView>
              )}

              {/* Replace the close button with this: */}
              <Button
                variant="secondary"
                size="sm"
                style={styles.compactCloseButton}
                onPress={() => setShowPredictionModal(false)}
              >
                Close
              </Button>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "black",
    paddingTop: Platform.OS === "ios" ? (isIphoneX ? 50 : 20) : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "black",
    paddingBottom: 80, // Increased to ensure space for the add button
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 15, // Reduced from 20
    width: "100%",
  },
  title: {
    color: "white",
    fontSize: 22, // Reduced from 24
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: "row",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  scrollViewWrapper: {
    flex: 1,
    position: "relative",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    width: "100%",
  },
  scrollViewContent: {
    paddingBottom: 120, // Increased padding for floating tab bar and button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    marginTop: 15,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 100,
    justifyContent: "center",
  },
  sampleButton: {
    backgroundColor: "#0099ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  sampleButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  prCard: {
    marginBottom: 10, // Reduced from 12
    padding: 12, // Kept the same
    width: "100%",
  },
  prCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12, // Reduced from 15
    width: "100%",
    flexWrap: "wrap",
  },
  prExercise: {
    color: "white",
    fontSize: Platform.OS === "ios" ? 15 : 16, // Reduced from 16/18
    fontWeight: "bold",
    flexShrink: 1,
    maxWidth: "60%",
  },
  prValue: {
    color: "#0099ff",
    fontSize: Platform.OS === "ios" ? 20 : 24, // Reduced from 22/26
    fontWeight: "bold",
  },
  prUnit: {
    fontSize: Platform.OS === "ios" ? 16 : 18, // Reduced from 20/24
  },
  prDetails: {
    marginTop: 5,
  },
  targetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6, // Reduced from 8
  },
  prTarget: {
    color: "#aaa",
    fontSize: 13, // Reduced from 14
  },
  predictionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 153, 255, 0.1)",
    paddingHorizontal: 8, // Kept the same
    paddingVertical: 3, // Kept the same
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 153, 255, 0.3)",
  },
  predictionText: {
    color: "#0099ff",
    fontSize: 12, // Kept the same
    fontWeight: "500",
    marginRight: 4, // Kept the same
  },
  progressBarContainer: {
    height: 6, // Reduced from 8
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3, // Reduced from 4
    overflow: "hidden",
    marginBottom: 8, // Reduced from 10
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#0099ff",
    borderRadius: 3, // Reduced from 4
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 0, // Removed bottom margin
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 4, // Reduced from 5
    paddingHorizontal: 8, // Reduced from 10
    borderRadius: 12, // Reduced from 15
    marginLeft: 8, // Kept the same
  },
  editButtonText: {
    color: "white",
    fontSize: 12, // Kept the same
    marginLeft: 4, // Kept the same
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 153, 255, 0.2)",
    paddingVertical: 4, // Reduced from 5
    paddingHorizontal: 8, // Reduced from 10
    borderRadius: 12, // Reduced from 15
    marginLeft: 8, // Kept the same
  },
  historyButtonText: {
    color: "white",
    fontSize: 12, // Kept the same
    marginLeft: 4, // Kept the same
  },
  addButton: {
    backgroundColor: "#0099ff",
    borderRadius: 25,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0077ff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    position: "absolute",
    bottom: 100, // Increased from 20 to 100 to move it up above the tab bar
    left: "50%",
    marginLeft: -100, // Half of the width
    width: 200,
    zIndex: 100,
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: "black",
    fontSize: 15,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#121212",
    borderRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? (isIphoneX ? 30 : 20) : 20,
    maxHeight: Platform.OS === "ios" ? "85%" : "90%", // Increased slightly to show more content
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "white",
    fontSize: 18, // Reduced from 20
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  closeModalButton: {
    padding: 8,
    borderRadius: 20,
  },
  formGroup: {
    marginBottom: 15, // Reduced from 20
  },
  formRow: {
    flexDirection: "row",
  },
  label: {
    color: "white",
    fontSize: 14, // Reduced from 16
    marginBottom: 6, // Reduced from 8
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 12, // Reduced from 15
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  exerciseList: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 150,
  },
  exerciseItem: {
    padding: 10, // Reduced from 12
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  exerciseItemText: {
    color: "white",
    fontSize: 14, // Reduced from 16
  },
  unitSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  unitOption: {
    flex: 1,
    padding: 12, // Reduced from 15
    alignItems: "center",
  },
  unitOptionSelected: {
    backgroundColor: "#0099ff",
  },
  unitText: {
    color: "white",
    fontSize: 14, // Reduced from 16
  },
  unitTextSelected: {
    color: "black",
    fontWeight: "bold",
  },
  modalActions: {
    marginTop: 15, // Reduced from 20
  },
  saveButton: {
    backgroundColor: "#0099ff",
    padding: 12, // Reduced from 15
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  saveButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "rgba(255, 59, 48, 0.2)",
    padding: 12, // Reduced from 15
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.5)",
  },
  deleteButtonText: {
    color: "#ff3b30",
    fontSize: 16,
    fontWeight: "bold",
  },
  predictionNote: {
    color: "#0099ff",
    fontSize: 12,
    marginTop: 5,
    fontStyle: "italic",
  },
  predictionContainer: {
    marginBottom: 20,
    maxHeight: Platform.OS === "ios" ? "65%" : "75%", // Increased to show more content
  },
  predictionTitle: {
    color: "#0099ff",
    fontSize: 18, // Reduced from 20
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  predictionSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  predictionSummaryItem: {
    alignItems: "center",
  },
  predictionSummaryLabel: {
    color: "#aaa",
    fontSize: 12, // Reduced from 14
  },
  predictionSummaryValue: {
    color: "white",
    fontSize: 16, // Reduced from 18
    fontWeight: "bold",
  },
  predictionProgressBar: {
    height: 10, // Reduced from 12
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 5, // Reduced from 6
    overflow: "hidden",
    marginBottom: 20,
  },
  predictionProgressFill: {
    height: "100%",
    backgroundColor: "#0099ff",
    borderRadius: 5, // Reduced from 6
  },
  predictionProgressText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: "center",
    color: "white",
    fontSize: 10, // Reduced from 12
    fontWeight: "bold",
    lineHeight: 10, // Reduced from 12
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  chartSection: {
    marginBottom: 15, // Reduced from 20
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
    padding: 8, // Reduced from 10
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  chartSectionTitle: {
    color: "#0099ff",
    fontSize: 15, // Reduced from 16
    fontWeight: "bold",
    marginBottom: 8, // Kept the same
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  detailsSection: {
    marginTop: 15, // Reduced from 20
  },
  detailsSectionTitle: {
    color: "white",
    fontSize: 16, // Reduced from 18
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  predictionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8, // Reduced from 10
  },
  predictionLabel: {
    color: "#aaa",
    fontSize: 14, // Reduced from 16
  },
  predictionValue: {
    color: "white",
    fontSize: 14, // Reduced from 16
    fontWeight: "500",
  },
  trainingLevelImpactContainer: {
    backgroundColor: "rgba(0, 153, 255, 0.1)",
    borderRadius: 8,
    padding: 8, // Reduced from 10
    marginTop: 8, // Reduced from 10
    marginBottom: 8, // Reduced from 10
    borderWidth: 1,
    borderColor: "rgba(0, 153, 255, 0.3)",
  },
  trainingLevelImpactText: {
    color: "#0099ff",
    fontSize: 12, // Reduced from 14
    fontStyle: "italic",
    textAlign: "center",
  },
  compactCloseButton: {
    backgroundColor: "rgba(0, 153, 255, 0.2)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "rgba(0, 153, 255, 0.3)",
  },
  compactCloseButtonText: {
    color: "#0099ff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
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
  addPrButton: {
    backgroundColor: "#0099ff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addPrButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
})

export default PRScreen

