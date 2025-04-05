"use client"

import { useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { fitnessGoals } from "../data/goalsData"
import { useUser } from "../context/UserContext"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../lib/supabase"

// Add the user from useAuth in the component
const GoalsScreen = ({ navigation }) => {
  const { userProfile, updateProfile } = useUser()
  const { user } = useAuth()
  const [selectedGoal, setSelectedGoal] = useState(userProfile.goal || null)

  const handleSelectGoal = async (goalId) => {
    setSelectedGoal(goalId)

    try {
      // First update the local user profile
      const result = await updateProfile({ goal: goalId })

      if (!result.success) {
        Alert.alert("Error", "Failed to update goal in local storage. Please try again.")
        setSelectedGoal(userProfile.goal)
        return
      }

      // Then update the Supabase profile if user is logged in
      if (user && user.id) {
        const { error } = await supabase.from("profiles").update({ fitness_goal: goalId }).eq("user_id", user.id)

        if (error) {
          console.error("Error updating goal in Supabase:", error)
          Alert.alert("Warning", "Goal updated locally but failed to sync with cloud.")
        }
      }
    } catch (error) {
      console.error("Error in handleSelectGoal:", error)
      Alert.alert("Error", "Failed to update goal. Please try again.")
      setSelectedGoal(userProfile.goal)
    }
  }

  const renderGoalItem = ({ item }) => {
    const isSelected = selectedGoal === item.id

    return (
      <TouchableOpacity
        style={[styles.goalCard, isSelected && styles.goalCardSelected]}
        onPress={() => handleSelectGoal(item.id)}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalIconContainer}>
            <Ionicons name={item.icon} size={24} color={isSelected ? "black" : "cyan"} />
          </View>
          <Text style={[styles.goalTitle, isSelected && styles.goalTitleSelected]}>{item.title}</Text>
        </View>

        <Text style={[styles.goalDescription, isSelected && styles.goalDescriptionSelected]}>{item.description}</Text>

        <View style={styles.benefitsContainer}>
          <Text style={[styles.benefitsTitle, isSelected && styles.benefitsTitleSelected]}>Benefits:</Text>
          {item.benefits.map((benefit, index) => (
            <Text key={index} style={[styles.benefitItem, isSelected && styles.benefitItemSelected]}>
              • {benefit}
            </Text>
          ))}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="black" />
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fitness Goals</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>What's your main goal?</Text>
          <Text style={styles.introText}>
            Selecting a goal helps us customize your experience and recommend the most effective workouts for you.
          </Text>
        </View>

        <FlatList
          data={fitnessGoals}
          renderItem={renderGoalItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.goalsList}
          scrollEnabled={false}
        />
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
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  introContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  introTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  introText: {
    color: "#aaa",
    fontSize: 16,
    lineHeight: 24,
  },
  goalsList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  goalCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  goalCardSelected: {
    backgroundColor: "cyan",
    borderColor: "cyan",
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  goalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  goalTitleSelected: {
    color: "black",
  },
  goalDescription: {
    color: "white",
    fontSize: 16,
    marginBottom: 15,
  },
  goalDescriptionSelected: {
    color: "black",
  },
  benefitsContainer: {
    marginBottom: 10,
  },
  benefitsTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  benefitsTitleSelected: {
    color: "black",
  },
  benefitItem: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 5,
  },
  benefitItemSelected: {
    color: "rgba(0, 0, 0, 0.7)",
  },
  selectedIndicator: {
    position: "absolute",
    top: 15,
    right: 15,
  },
})

export default GoalsScreen

