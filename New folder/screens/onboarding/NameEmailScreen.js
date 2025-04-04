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

const NameEmailScreen = ({ profileData, updateProfileData, onNext }) => {
  const [fullName, setFullName] = useState(profileData.full_name || "")
  const [email, setEmail] = useState(profileData.email || "")
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      updateProfileData({ full_name: fullName, email })
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
          <Text style={styles.title}>Let's get to know you</Text>
          <Text style={styles.subtitle}>We'll use this information to personalize your experience</Text>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={22} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#888"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={22} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
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

export default NameEmailScreen

