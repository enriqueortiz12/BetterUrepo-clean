"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const GoalGenderScreen = ({ profileData, updateProfileData, onNext }) => {
  const [fitnessGoal, setFitnessGoal] = useState(profileData.fitness_goal || "")
  const [gender, setGender] = useState(profileData.gender || "")
  const [errors, setErrors] = useState({})

  const fitnessGoals = [
    { id: "strength", label: "Strength", icon: "barbell-outline" },
    { id: "muscle_growth", label: "Muscle Growth", icon: "body-outline" },
    { id: "weight_loss", label: "Weight Loss", icon: "trending-down-outline" },
    { id: "endurance", label: "Endurance", icon: "pulse-outline" },
    { id: "health", label: "General Health", icon: "heart-outline" },
    { id: "athleticism", label: "Athleticism", icon: "trophy-outline" },
  ]

  const genders = [
    { id: "male", label: "Male", icon: "male-outline" },
    { id: "female", label: "Female", icon: "female-outline" },
    { id: "other", label: "Other", icon: "person-outline" },
    { id: "prefer_not_to_say", label: "Prefer not to say", icon: "shield-outline" },
  ]

  const validate = () => {
    const newErrors = {}
    if (!fitnessGoal) {
      newErrors.fitnessGoal = "Please select a fitness goal"
    }
    if (!gender) {
      newErrors.gender = "Please select a gender"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      updateProfileData({ fitness_goal: fitnessGoal, gender })
      onNext()
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your Fitness Journey</Text>
        <Text style={styles.subtitle}>Tell us about your goals and preferences</Text>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>What is your primary fitness goal?</Text>
          <View style={styles.optionsGrid}>
            {fitnessGoals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[styles.optionCard, fitnessGoal === goal.id && styles.selectedOptionCard]}
                onPress={() => setFitnessGoal(goal.id)}
              >
                <Ionicons
                  name={goal.icon}
                  size={28}
                  color={fitnessGoal === goal.id ? "black" : "cyan"}
                  style={styles.optionIcon}
                />
                <Text style={[styles.optionLabel, fitnessGoal === goal.id && styles.selectedOptionLabel]}>
                  {goal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.fitnessGoal && <Text style={styles.errorText}>{errors.fitnessGoal}</Text>}

          <Text style={styles.sectionTitle}>What is your gender?</Text>
          <View style={styles.optionsGrid}>
            {genders.map((genderOption) => (
              <TouchableOpacity
                key={genderOption.id}
                style={[styles.optionCard, gender === genderOption.id && styles.selectedOptionCard]}
                onPress={() => setGender(genderOption.id)}
              >
                <Ionicons
                  name={genderOption.icon}
                  size={28}
                  color={gender === genderOption.id ? "black" : "cyan"}
                  style={styles.optionIcon}
                />
                <Text style={[styles.optionLabel, gender === genderOption.id && styles.selectedOptionLabel]}>
                  {genderOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="black" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "black",
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 30,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 15,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  optionCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  selectedOptionCard: {
    backgroundColor: "cyan",
    borderColor: "cyan",
  },
  optionIcon: {
    marginBottom: 10,
  },
  optionLabel: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
  },
  selectedOptionLabel: {
    color: "black",
    fontWeight: "bold",
  },
  errorText: {
    color: "#ff6666",
    fontSize: 14,
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 5,
  },
  button: {
    backgroundColor: "cyan",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    width: "100%",
  },
  buttonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 5,
  },
  buttonIcon: {
    marginLeft: 5,
  },
})

export default GoalGenderScreen

