"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { trainingStyles } from "../data/trainingStylesData"
import GlassmorphicCard from "../components/GlassmorphicCard"

const { width, height } = Dimensions.get("window")
const isIphoneX = Platform && Platform.OS === "ios" && (height >= 812 || width >= 812)

const WorkoutScreen = ({ navigation, route }) => {
  // Check for selected style from navigation params
  useEffect(() => {
    if (route.params?.selectedStyle) {
      setSelectedTrainingStyle(route.params.selectedStyle)
      // Clear the param to prevent reuse on screen revisit
      navigation.setParams({ selectedStyle: undefined })
    }
  }, [route.params, navigation])

  // State for selected filters
  const [selectedExerciseType, setSelectedExerciseType] = useState("all")
  const [selectedWarmupType, setSelectedWarmupType] = useState("none")
  const [selectedDuration, setSelectedDuration] = useState("any")
  const [selectedEquipment, setSelectedEquipment] = useState("any")
  const [selectedTrainingStyle, setSelectedTrainingStyle] = useState("any")
  const [selectedSplit, setSelectedSplit] = useState("any")
  const [selectedRecovered, setSelectedRecovered] = useState("any")

  // State for dropdowns
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  // Refs for dropdown positioning
  const exerciseTypeButtonRef = useRef(null)
  const warmupTypeButtonRef = useRef(null)
  const durationButtonRef = useRef(null)
  const equipmentButtonRef = useRef(null)
  const trainingStyleButtonRef = useRef(null)
  const splitButtonRef = useRef(null)
  const recoveredButtonRef = useRef(null)

  // Create separate animated values for opacity and transform
  const dropdownOpacity = useRef(new Animated.Value(0)).current

  // Filter options
  const exerciseTypeOptions = [
    { label: "All Exercises", value: "all" },
    { label: "Strength", value: "strength" },
    { label: "Cardio", value: "cardio" },
    { label: "Flexibility", value: "flexibility" },
    { label: "Bodyweight Only", value: "bodyweight" },
  ]

  const warmupTypeOptions = [
    { label: "None", value: "none" },
    { label: "Dynamic Stretching", value: "dynamic" },
    { label: "Static Stretching", value: "static" },
    { label: "Foam Rolling", value: "foam" },
    { label: "Activation Exercises", value: "activation" },
    { label: "Light Cardio", value: "cardio" },
  ]

  const durationOptions = [
    { label: "Any Duration", value: "any" },
    { label: "< 30 min", value: "short" },
    { label: "30-60 min", value: "medium" },
    { label: "60+ min", value: "long" },
  ]

  const equipmentOptions = [
    { label: "Any Equipment", value: "any" },
    { label: "Barbell", value: "barbell" },
    { label: "Dumbbells", value: "dumbbells" },
    { label: "Kettlebells", value: "kettlebells" },
    { label: "Machines", value: "machines" },
    { label: "Bodyweight", value: "bodyweight" },
    { label: "Resistance Bands", value: "bands" },
  ]

  const trainingStyleOptions = [
    { label: "Any Style", value: "any" },
    { label: "Strength", value: "strength" },
    { label: "Hypertrophy", value: "hypertrophy" },
    { label: "Powerlifting", value: "powerlifting" },
    { label: "Olympic", value: "olympic" },
    { label: "General", value: "general" },
    { label: "Athleticism", value: "athleticism" },
  ]

  const splitOptions = [
    { label: "Any Split", value: "any" },
    { label: "Full Body", value: "fullbody" },
    { label: "Upper/Lower", value: "upperlower" },
    { label: "Push/Pull/Legs", value: "ppl" },
    { label: "Bro Split", value: "brosplit" },
  ]

  const recoveredOptions = [
    { label: "Any Muscles", value: "any" },
    { label: "Chest", value: "chest" },
    { label: "Back", value: "back" },
    { label: "Legs", value: "legs" },
    { label: "Shoulders", value: "shoulders" },
    { label: "Arms", value: "arms" },
    { label: "Core", value: "core" },
  ]

  // Helper functions for button labels
  const getExerciseTypeLabel = () => {
    const option = exerciseTypeOptions.find((option) => option.value === selectedExerciseType)
    return option ? option.label : "All Exercises"
  }

  const getWarmupTypeLabel = () => {
    const option = warmupTypeOptions.find((option) => option.value === selectedWarmupType)
    return option ? option.label : "Warm-Up"
  }

  const getDurationLabel = () => {
    const option = durationOptions.find((option) => option.value === selectedDuration)
    return option ? option.label : "Duration"
  }

  const getTrainingStyleLabel = () => {
    const option = trainingStyleOptions.find((option) => option.value === selectedTrainingStyle)
    return option ? option.label : "Training Style"
  }

  // Toggle dropdown visibility
  const toggleDropdown = (dropdownName, buttonRef) => {
    if (activeDropdown === dropdownName) {
      // Close dropdown if it's already open
      closeDropdown()
    } else {
      // Open the new dropdown
      if (buttonRef && buttonRef.current) {
        buttonRef.current.measure((x, y, width, height, pageX, pageY) => {
          // Calculate position for dropdown
          setDropdownPosition({
            top: pageY + height + 5,
            left: pageX,
            width: width,
          })

          // Set active dropdown and animate opening
          setActiveDropdown(dropdownName)

          // Simple fade-in animation with native driver
          Animated.timing(dropdownOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start()
        })
      }
    }
  }

  // Close dropdown
  const closeDropdown = () => {
    Animated.timing(dropdownOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setActiveDropdown(null)
    })
  }

  // Handle option selection
  const handleSelectOption = (option, dropdownName) => {
    switch (dropdownName) {
      case "exerciseType":
        setSelectedExerciseType(option)
        break
      case "warmupType":
        setSelectedWarmupType(option)
        break
      case "duration":
        setSelectedDuration(option)
        break
      case "equipment":
        setSelectedEquipment(option)
        break
      case "trainingStyle":
        setSelectedTrainingStyle(option)
        break
      case "split":
        setSelectedSplit(option)
        break
      case "recovered":
        setSelectedRecovered(option)
        break
      default:
        break
    }
    closeDropdown()
  }

  // Get options for current dropdown
  const getDropdownOptions = () => {
    switch (activeDropdown) {
      case "exerciseType":
        return exerciseTypeOptions
      case "warmupType":
        return warmupTypeOptions
      case "duration":
        return durationOptions
      case "equipment":
        return equipmentOptions
      case "trainingStyle":
        return trainingStyleOptions
      case "split":
        return splitOptions
      case "recovered":
        return recoveredOptions
      default:
        return []
    }
  }

  // Get current selected value for dropdown
  const getSelectedValue = () => {
    switch (activeDropdown) {
      case "exerciseType":
        return selectedExerciseType
      case "warmupType":
        return selectedWarmupType
      case "duration":
        return selectedDuration
      case "equipment":
        return selectedEquipment
      case "trainingStyle":
        return selectedTrainingStyle
      case "split":
        return selectedSplit
      case "recovered":
        return selectedRecovered
      default:
        return null
    }
  }

  // Filter workouts based on selected filters
  const getFilteredWorkouts = () => {
    let filteredStyles = trainingStyles

    // Filter by training style
    if (selectedTrainingStyle !== "any") {
      filteredStyles = filteredStyles.filter((style) => style.id === selectedTrainingStyle)
    }

    return filteredStyles
  }

  // Render workout card
  const renderWorkoutCard = ({ item }) => (
    <GlassmorphicCard style={styles.workoutCard} color="rgba(0, 20, 20, 0.5)" borderColor="rgba(0, 153, 255, 0.3)">
      <View style={styles.workoutCardHeader}>
        <Text style={styles.workoutTitle}>{item.title}</Text>
        <View style={styles.workoutBadge}>
          <Text style={styles.workoutBadgeText}>{item.targetReps} reps</Text>
        </View>
      </View>

      <Text style={styles.workoutDescription}>{item.description}</Text>

      <View style={styles.exercisesList}>
        <Text style={styles.exercisesTitle}>Key Exercises:</Text>
        {item.exercises.slice(0, 3).map((exercise, index) => (
          <Text key={index} style={styles.exerciseItem}>
            • {exercise.name}
          </Text>
        ))}
        {item.exercises.length > 3 && <Text style={styles.moreExercises}>+{item.exercises.length - 3} more</Text>}
      </View>

      {/* Fixed workout actions container */}
      <View style={styles.workoutActions}>
        {/* Fixed Start Workout button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate("ActiveWorkout", { workout: item, trainingStyle: item })}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>

        {/* Info button */}
        <TouchableOpacity style={styles.detailsButton} activeOpacity={0.7}>
          <Ionicons name="information-circle-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </GlassmorphicCard>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => {}} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* All filters in a single row */}
      <View style={styles.allFiltersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.allFiltersScrollContent}
        >
          {/* Exercise Type Button */}
          <TouchableOpacity
            ref={exerciseTypeButtonRef}
            style={styles.filterButton}
            onPress={() => toggleDropdown("exerciseType", exerciseTypeButtonRef)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterText} numberOfLines={1}>
              {getExerciseTypeLabel()}
            </Text>
            <Ionicons name="chevron-down" size={16} color="white" />
          </TouchableOpacity>

          {/* Warmup Type Button */}
          <TouchableOpacity
            ref={warmupTypeButtonRef}
            style={styles.filterButton}
            onPress={() => toggleDropdown("warmupType", warmupTypeButtonRef)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterText} numberOfLines={1}>
              {getWarmupTypeLabel()}
            </Text>
            <Ionicons name="chevron-down" size={16} color="white" />
          </TouchableOpacity>

          {/* Duration Button */}
          <TouchableOpacity
            ref={durationButtonRef}
            style={styles.filterButton}
            onPress={() => toggleDropdown("duration", durationButtonRef)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterText} numberOfLines={1}>
              {getDurationLabel()}
            </Text>
            <Ionicons name="chevron-down" size={16} color="white" />
          </TouchableOpacity>

          {/* Recovered Muscles Button */}
          <TouchableOpacity
            ref={recoveredButtonRef}
            style={styles.filterButton}
            onPress={() => toggleDropdown("recovered", recoveredButtonRef)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterText} numberOfLines={1}>
              Recovered
            </Text>
            <Ionicons name="chevron-down" size={16} color="white" />
          </TouchableOpacity>

          {/* Equipment Button */}
          <TouchableOpacity
            ref={equipmentButtonRef}
            style={styles.filterButton}
            onPress={() => toggleDropdown("equipment", equipmentButtonRef)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterText} numberOfLines={1}>
              Equipment
            </Text>
            <Ionicons name="chevron-down" size={16} color="white" />
          </TouchableOpacity>

          {/* Training Style Button */}
          <TouchableOpacity
            ref={trainingStyleButtonRef}
            style={styles.filterButton}
            onPress={() => toggleDropdown("trainingStyle", trainingStyleButtonRef)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterText} numberOfLines={1}>
              {getTrainingStyleLabel()}
            </Text>
            <Ionicons name="chevron-down" size={16} color="white" />
          </TouchableOpacity>

          {/* Split Button */}
          <TouchableOpacity
            ref={splitButtonRef}
            style={styles.filterButton}
            onPress={() => toggleDropdown("split", splitButtonRef)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterText} numberOfLines={1}>
              {splitOptions.find((option) => option.value === selectedSplit)?.label || "Split"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="white" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Dropdown menu */}
      {activeDropdown && (
        <Modal transparent visible={true} animationType="none" onRequestClose={closeDropdown}>
          <TouchableOpacity style={styles.dropdownBackdrop} activeOpacity={1} onPress={closeDropdown}>
            <Animated.View
              style={[
                styles.dropdownMenu,
                {
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                  opacity: dropdownOpacity,
                },
              ]}
            >
              {getDropdownOptions().map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.dropdownOption, getSelectedValue() === option.value && styles.dropdownOptionSelected]}
                  onPress={() => handleSelectOption(option.value, activeDropdown)}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      getSelectedValue() === option.value && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {getSelectedValue() === option.value && <Ionicons name="checkmark" size={18} color="cyan" />}
                </TouchableOpacity>
              ))}
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Workouts list */}
      <FlatList
        data={getFilteredWorkouts()}
        renderItem={renderWorkoutCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.workoutsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
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
    paddingTop: Platform && Platform.OS === "ios" ? (isIphoneX ? 10 : 10) : 60,
    paddingBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    minHeight: 36,
    minWidth: 80,
    maxWidth: 120,
  },
  filterText: {
    color: "white",
    fontSize: 12,
    marginRight: 5,
    textAlign: "center",
  },
  allFiltersContainer: {
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  allFiltersScrollContent: {
    paddingRight: 20,
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dropdownMenu: {
    position: "absolute",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  dropdownOptionSelected: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
  },
  dropdownOptionText: {
    color: "white",
    fontSize: 14,
  },
  dropdownOptionTextSelected: {
    color: "cyan",
    fontWeight: "bold",
  },
  workoutsList: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 20, // Reduced padding since tab bar now pushes content up
  },
  workoutCard: {
    marginBottom: 15,
    padding: 20,
  },
  workoutCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  workoutTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  workoutBadge: {
    backgroundColor: "rgba(0, 153, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 153, 255, 0.3)",
  },
  workoutBadgeText: {
    color: "#0099ff",
    fontSize: 12,
    fontWeight: "500",
  },
  workoutDescription: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 15,
  },
  exercisesList: {
    marginBottom: 15,
  },
  exercisesTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  exerciseItem: {
    color: "white",
    fontSize: 14,
    marginBottom: 4,
  },
  moreExercises: {
    color: "cyan",
    fontSize: 14,
    marginTop: 4,
  },
  workoutActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Ensure proper spacing
    marginTop: 10, // Add some space above the buttons
  },
  startButton: {
    backgroundColor: "cyan",
    borderRadius: 8,
    paddingVertical: 12, // Increased padding for better touch target
    paddingHorizontal: 15,
    flex: 1,
    marginRight: 10,
    // Fixed height to prevent stretching on iOS - with Platform check
    height: Platform && Platform.OS === "ios" ? 44 : "auto",
    // Ensure proper alignment
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  detailsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
})

export default WorkoutScreen

