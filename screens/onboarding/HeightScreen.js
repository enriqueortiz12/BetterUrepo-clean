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

const HeightScreen = ({ profileData, updateProfileData, onNext }) => {
  const [height, setHeight] = useState(profileData.height ? String(profileData.height) : "")
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!height.trim()) {
      newErrors.height = "Height is required"
    } else if (isNaN(Number.parseInt(height)) || Number.parseInt(height) <= 0 || Number.parseInt(height) > 300) {
      newErrors.height = "Please enter a valid height in cm (1-300)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      updateProfileData({ height: Number.parseInt(height) })
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
          <Text style={styles.title}>Almost Done!</Text>
          <Text style={styles.subtitle}>Just one more piece of information</Text>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Height (cm)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="resize-outline" size={22} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your height in centimeters"
                placeholderTextColor="#888"
                keyboardType="number-pad"
                value={height}
                onChangeText={setHeight}
              />
            </View>
            {errors.height && <Text style={styles.errorText}>{errors.height}</Text>}

            <View style={styles.heightGuide}>
              <Text style={styles.heightGuideTitle}>Height Reference:</Text>
              <Text style={styles.heightGuideText}>• 5'0" = 152 cm</Text>
              <Text style={styles.heightGuideText}>• 5'6" = 168 cm</Text>
              <Text style={styles.heightGuideText}>• 6'0" = 183 cm</Text>
              <Text style={styles.heightGuideText}>• 6'6" = 198 cm</Text>
            </View>
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
  heightGuide: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  heightGuideTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  heightGuideText: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 5,
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

export default HeightScreen

