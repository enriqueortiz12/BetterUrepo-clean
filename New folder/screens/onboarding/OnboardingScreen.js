"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native"
import { useAuth } from "../../context/AuthContext"
import { Ionicons } from "@expo/vector-icons"
import NameEmailScreen from "./NameEmailScreen"
import AgeWeightScreen from "./AgeWeightScreen"
import GoalGenderScreen from "./GoalGenderScreen"
import HeightScreen from "./HeightScreen"
import SummaryScreen from "./SummaryScreen"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const OnboardingScreen = ({ navigation }) => {
  const { user, updateProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: user?.email || "",
    age: null,
    weight: null,
    fitness_goal: "",
    gender: "",
    height: null,
  })

  const totalSteps = 5

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateProfileData = (data) => {
    setProfileData({ ...profileData, ...data })
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const { error } = await updateProfile(profileData)
      if (error) {
        console.error("Error updating profile:", error)
        alert("Failed to save profile data. Please try again.")
      } else {
        navigation.replace("Main")
      }
    } catch (error) {
      console.error("Error in handleComplete:", error)
      alert("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderScreen = () => {
    switch (currentStep) {
      case 1:
        return <NameEmailScreen profileData={profileData} updateProfileData={updateProfileData} onNext={handleNext} />
      case 2:
        return <AgeWeightScreen profileData={profileData} updateProfileData={updateProfileData} onNext={handleNext} />
      case 3:
        return <GoalGenderScreen profileData={profileData} updateProfileData={updateProfileData} onNext={handleNext} />
      case 4:
        return <HeightScreen profileData={profileData} updateProfileData={updateProfileData} onNext={handleNext} />
      case 5:
        return <SummaryScreen profileData={profileData} onComplete={handleComplete} />
      default:
        return null
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="cyan" />
            </TouchableOpacity>
          )}
          <View style={styles.progressContainer}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  { backgroundColor: index < currentStep ? "cyan" : "rgba(255, 255, 255, 0.3)" },
                ]}
              />
            ))}
          </View>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>{renderScreen()}</View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="cyan" />
            <Text style={styles.loadingText}>Saving your profile...</Text>
          </View>
        )}
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 15,
    fontSize: 16,
  },
})

export default OnboardingScreen

