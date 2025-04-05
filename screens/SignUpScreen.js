"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  SafeAreaView,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const SignUpScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const { signUp } = useAuth()

  const handleSignUp = async () => {
    if (fullName === "" || email === "" || password === "" || confirmPassword === "") {
      setError("Please fill in all fields")
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      Alert.alert("Error", "Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      Alert.alert("Error", "Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error, user } = await signUp(email, password, fullName)

      if (error) {
        setError(error.message)
        Alert.alert("Sign Up Failed", error.message)
      } else {
        // Don't use Alert with navigation - it can cause timing issues
        // Instead, navigate directly to Onboarding
        console.log("Account created successfully, navigating to Onboarding")

        // Add a small delay to ensure auth state is updated
        setTimeout(() => {
          // First show a success message
          Alert.alert("Account Created", "Your account has been created successfully!", [
            {
              text: "Continue",
              onPress: () => {
                console.log("Navigating to Onboarding screen")
                // Force navigation to Onboarding
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Onboarding" }],
                })
              },
            },
          ])
        }, 500)
      }
    } catch (error) {
      setError("An unexpected error occurred")
      Alert.alert("Error", "An unexpected error occurred")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Define the logo source directly
  const logoSource = require("../assets/logo.png")

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.contentContainer}>
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                {/* Use the directly defined source */}
                <Image source={logoSource} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={styles.appName}>BetterU</Text>
            </View>

            <Text style={styles.subtitle}>Create your account</Text>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={22} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#888"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={22} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#888"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="black" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLink}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    flexGrow: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  contentContainer: {
    width: "90%",
    maxWidth: 400,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(0, 255, 255, 0.5)",
    shadowColor: "cyan",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  logo: {
    width: 110,
    height: 110,
  },
  appName: {
    color: "#0099ff",
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 255, 255, 0.7)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: "cyan",
    fontSize: 14,
    marginBottom: 30,
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 25,
    width: "100%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
  button: {
    backgroundColor: "cyan",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginText: {
    color: "white",
    marginTop: 20,
    fontSize: 14,
    textAlign: "center",
  },
  loginLink: {
    color: "cyan",
    fontWeight: "bold",
  },
  errorContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 10,
    padding: 10,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.3)",
  },
  errorText: {
    color: "#ff6666",
    textAlign: "center",
  },
})

export default SignUpScreen

