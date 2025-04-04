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
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext"
import { commonExercises } from "../data/prData"
import GlassmorphicCard from "../components/GlassmorphicCard"
import HoverButton from "../components/HoverButton"
// Add the import for our new chart components at the top of the file
import ProgressChart from "../components/ProgressChart"
import PredictionChart from "../components/PredictionChart"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const PRScreen = () => {
  const { userProfile, personalRecords, addPersonalRecord, updatePersonalRecord, deletePersonalRecord } = useUser()
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

  // Animation for progress bars - using layout animation instead of direct width manipulation
  const progressValues = useRef(personalRecords.map(() => new Animated.Value(0))).current

  // Get PRs with targets
  const [prGoals, setPrGoals] = useState([])

  // Define trainingLevels here
  const trainingLevels = [
    { id: "beginner", title: "Beginner" },
    { id: "intermediate", title: "Intermediate" },
    { id: "advanced", title: "Advanced" },
  ]

  useEffect(() => {
    // Transform personal records to include targets
    const goals = personalRecords.map((pr) => ({
      ...pr,
      target: pr.target || Number.parseInt(pr.value * 1.2), // Default target is 20% higher than current PR
    }))
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
    // Get exercise history
    const exerciseHistory = personalRecords.filter((record) => record.exercise === pr.exercise)

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
    setPredictionDetails({
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
    })

    setShowPredictionModal(true)
  }

  // Get the title of the selected training level
  const getTrainingLevelTitle = () => {
    const level = trainingLevels.find((level) => level.id === userProfile.trainingLevel)
    return level ? level.title : "Not set"
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>PR Goals</Text>
          <HoverButton
            text="See All"
            textStyle={styles.seeAllText}
            style={styles.seeAllButton}
            activeOpacity={0.7}
            hoverColor="rgba(0, 153, 255, 0.1)"
          />
        </View>

        {prGoals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy" size={80} color="rgba(0, 153, 255, 0.3)" />
            <Text style={styles.emptyText}>No personal records yet</Text>
            <Text style={styles.emptySubtext}>Tap the button below to add your first PR</Text>
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
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
                  <Text style={styles.prExercise}>{pr.exercise}</Text>
                  <Text style={styles.prValue}>
                    {pr.value} <Text style={styles.prUnit}>{pr.unit}</Text>
                  </Text>
                </View>
                <View style={styles.prDetails}>
                  <View style={styles.targetRow}>
                    <Text style={styles.prTarget}>
                      Target: {pr.target} {pr.unit}
                    </Text>
                    <HoverButton
                      style={styles.predictionBadge}
                      onPress={() => showPredictionInfo(pr)}
                      activeOpacity={0.7}
                      hoverColor="rgba(0, 153, 255, 0.2)"
                    >
                      <Text style={styles.predictionText}>
                        {calculateTimeToGoal(
                          pr.value,
                          pr.target,
                          personalRecords.filter((record) => record.exercise === pr.exercise),
                          pr.exercise,
                        )}
                      </Text>
                      <Ionicons name="information-circle-outline" size={16} color="#0099ff" />
                    </HoverButton>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <Animated.View
                      style={[
                        styles.progressBar,
                        {
                          width: progressValues[index]?.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "100%"],
                          }),
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.actionRow}>
                    <HoverButton
                      style={styles.editButton}
                      onPress={() => handleOpenModal(pr)}
                      activeOpacity={0.7}
                      hoverColor="rgba(255, 255, 255, 0.2)"
                    >
                      <Ionicons name="create-outline" size={16} color="white" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </HoverButton>

                    <HoverButton
                      style={styles.historyButton}
                      onPress={() => showPredictionInfo(pr)}
                      activeOpacity={0.7}
                      hoverColor="rgba(0, 153, 255, 0.3)"
                    >
                      <Ionicons name="analytics-outline" size={16} color="white" />
                      <Text style={styles.historyButtonText}>Progress</Text>
                    </HoverButton>
                  </View>
                </View>
              </GlassmorphicCard>
            ))}
          </ScrollView>

        <HoverButton\
          style={styles.addButton}
          onPress={() => handleOpenModal()}
          activeOpacity={0.8}
          hoverColor="#00b3ff"
          pressColor="#0077ff"
        >
          <Text style={styles.addButtonText}>Add New PR Goal</Text>
        </HoverButton>

        {/* PR Edit Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editMode ? "Edit PR Goal" : "Add PR Goal"}</Text>
                <HoverButton onPress={() => setModalVisible(false)} style={styles.closeButton} activeOpacity={0.7}>
                  <Ionicons name="close" size={24} color="white" />
                </HoverButton>
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
                      <HoverButton
                        key={index}
                        style={styles.exerciseItem}
                        onPress={() => selectExercise(ex)}
                        activeOpacity={0.7}
                        hoverColor="rgba(255, 255, 255, 0.1)"
                      >
                        <Text style={styles.exerciseItemText}>{ex}</Text>
                      </HoverButton>
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
                    <HoverButton
                      style={[styles.unitOption, unit === "lbs" && styles.unitOptionSelected]}
                      onPress={() => setUnit("lbs")}
                      activeOpacity={0.7}
                      hoverColor={unit === "lbs" ? "#0088ff" : "rgba(255, 255, 255, 0.2)"}
                    >
                      <Text style={[styles.unitText, unit === "lbs" && styles.unitTextSelected]}>lbs</Text>
                    </HoverButton>

                    <HoverButton
                      style={[styles.unitOption, unit === "kg" && styles.unitOptionSelected]}
                      onPress={() => setUnit("kg")}
                      activeOpacity={0.7}
                      hoverColor={unit === "kg" ? "#0088ff" : "rgba(255, 255, 255, 0.2)"}
                    >
                      <Text style={[styles.unitText, unit === "kg" && styles.unitTextSelected]}>kg</Text>
                    </HoverButton>
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
                <HoverButton
                  style={styles.saveButton}
                  onPress={handleSave}
                  activeOpacity={0.8}
                  hoverColor="#00b3ff"
                  pressColor="#0077ff"
                >
                  <Text style={styles.saveButtonText}>{editMode ? "Update" : "Save"}</Text>
                </HoverButton>

                {editMode && (
                  <HoverButton
                    style={styles.deleteButton}
                    onPress={handleDelete}
                    activeOpacity={0.8}
                    hoverColor="rgba(255, 59, 48, 0.3)"
                    pressColor="rgba(255, 59, 48, 0.5)"
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </HoverButton>
                )}
              </View>
            </View>
          </View>
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
                <HoverButton
                  onPress={() => setShowPredictionModal(false)}
                  style={styles.closeModalButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color="white" />
                </HoverButton>
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

              <HoverButton
                style={styles.closeButton}
                onPress={() => setShowPredictionModal(false)}
                activeOpacity={0.7}
                hoverColor="rgba(255, 255, 255, 0.2)"
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </HoverButton>
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
    paddingTop: Platform && Platform.OS === "ios" ? (isIphoneX ? 50 : 20) : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "black",
    paddingBottom: Platform && Platform.OS === "ios" ? (isIphoneX ? 90 : 70) : 70, // Increased padding to prevent tab bar overlap
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
    width: "100%",
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  seeAllText: {
    color: "#0099ff",
    fontSize: 18,
  },
  seeAllButton: {
    padding: 8,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    width: "100%", // Ensure full width
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 100,
    justifyContent: "center",
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
  prCard: {
    marginBottom: 20,
    padding: 20,
    width: "100%",
  },
  prCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
    flexWrap: "wrap",
  },
  prExercise: {
    color: "white",
    fontSize: 22, // Slightly smaller for mobile
    fontWeight: "bold",
    flexShrink: 1, // Allow text to shrink if needed
    maxWidth: "60%", // Limit width to prevent overlap
  },
  prValue: {
    color: "#0099ff",
    fontSize: 32,
    fontWeight: "bold",
  },
  prUnit: {
    fontSize: 24,
  },
  prDetails: {
    marginTop: 5,
  },
  targetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  prTarget: {
    color: "#aaa",
    fontSize: 16,
  },
  predictionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 153, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 153, 255, 0.3)",
  },
  predictionText: {
    color: "#0099ff",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 5,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 15,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#0099ff",
    borderRadius: 5,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginLeft: 10,
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
    marginLeft: 5,
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 153, 255, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginLeft: 10,
  },
  historyButtonText: {
    color: "white",
    fontSize: 14,
    marginLeft: 5,
  },
  addButton: {
    backgroundColor: "#0099ff",
    borderRadius: 30,
    padding: 16,
    margin: 20,
    alignItems: "center",
    position: "absolute",
    bottom: Platform && Platform.OS === "ios" ? (isIphoneX ? 90 : 70) : 70,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  addButtonText: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? (isIphoneX ? 40 : 20) : 20,
    maxHeight: "90%",
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
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: "row",
  },
  label: {
    color: "white",
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 15,
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
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  exerciseItemText: {
    color: "white",
    fontSize: 16,
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
    padding: 15,
    alignItems: "center",
  },
  unitOptionSelected: {
    backgroundColor: "#0099ff",
  },
  unitText: {
    color: "white",
    fontSize: 16,
  },
  unitTextSelected: {
    color: "black",
    fontWeight: "bold",
  },
  modalActions: {
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: "#0099ff",
    padding: 15,
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
    padding: 15,
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
    maxHeight: "80%",
  },
  predictionTitle: {
    color: "#0099ff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  predictionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  predictionLabel: {
    color: "#aaa",
    fontSize: 16,
  },
  predictionValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  predictionProgressBar: {
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 20,
  },
  predictionProgressFill: {
    height: "100%",
    backgroundColor: "#0099ff",
    borderRadius: 6,
  },
  closeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeModalButton: {
    padding: 8,
    borderRadius: 20,
  },
  trainingLevelImpactContainer: {
    backgroundColor: "rgba(0, 153, 255, 0.1)",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 153, 255, 0.3)",
  },
  trainingLevelImpactText: {
    color: "#0099ff",
    fontSize: 14,
    fontStyle: "italic",
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
    fontSize: 14,
  },
  predictionSummaryValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  predictionProgressText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: "center",
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    lineHeight: 12,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  chartSection: {
    marginBottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  chartSectionTitle: {
    color: "#0099ff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  detailsSection: {
    marginTop: 20,
  },
  detailsSectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  scrollViewContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
})

export default PRScreen

