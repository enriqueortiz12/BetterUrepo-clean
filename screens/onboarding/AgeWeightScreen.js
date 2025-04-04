"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"

const AgeWeightScreen = ({ profileData, updateProfileData, onNext }) => {
  const [age, setAge] = useState(profileData.age ? String(profileData.age) : "")
  const [weight, setWeight] = useState(profileData.weight ? String(profileData.weight) : "")
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!age.trim()) {
      newErrors.age = "Age is required"
    } else if (isNaN(Number.parseInt(age)) || Number.parseInt(age) <= 0 || Number.parseInt(age) > 120) {
      newErrors.age = "Please enter a valid age (1-120)"
    }

    if (!weight.trim()) {
      newErrors.weight = "Weight is required"
    } else if (isNaN(Number.parseFloat(weight)) || Number.parseFloat(weight) <= 0 || Number.parseFloat(weight) > 500) {
      newErrors.weight = "Please enter a valid weight (1-500)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      updateProfileData({ age: Number.parseInt(age), weight: Number.parseFloat(weight) })
      onNext()
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Basic Information</Text>
          <Text style={styles.subtitle}>This helps us create a personalized fitness plan for you</Text>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Age</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={22} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your age"
                placeholderTextColor="#888"
                keyboardType="number-pad"
                value={age}
                onChangeText={setAge}
              />
            </View>
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}

            <Text style={styles.label}>Weight (lbs)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="fitness-outline" size={22} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your weight in pounds"
                placeholderTextColor="#888"
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
            {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="black" style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  label: {
    fontSize: 16,
    color: "white",
    marginBottom: 8,
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  inputIcon: {
    marginHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 50,
    color: "white",
    paddingRight: 15,
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

export default AgeWeightScreen

