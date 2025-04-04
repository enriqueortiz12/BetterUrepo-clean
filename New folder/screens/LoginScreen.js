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
import { supabase } from "../lib/supabase"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const { signIn, loading } = useAuth()

  const handleLogin = async () => {
    if (email === "" || password === "") {
      setError("Please fill in all fields")
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        Alert.alert("Login Failed", error.message)
      } else {
        // Check if user has completed profile setup
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", data.user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error fetching profile:", profileError)
        }

        // Show success message
        Alert.alert("Success", "Logged in successfully")

        // If profile is incomplete, navigate to onboarding
        if (
          !profileData ||
          !profileData.full_name ||
          !profileData.age ||
          !profileData.weight ||
          !profileData.fitness_goal ||
          !profileData.gender ||
          !profileData.height
        ) {
          navigation.replace("Onboarding")
        } else {
          // Navigate to home screen on successful login with complete profile
          navigation.replace("Main")
        }
      }
    } catch (error) {
      setError("An unexpected error occurred")
      Alert.alert("Error", "An unexpected error occurred")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

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
                <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={styles.appName}>BetterU</Text>
            </View>

            <Text style={styles.subtitle}>Sign in to your account</Text>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={22} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter Email"
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
                  placeholder="Enter Password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity style={styles.forgotPasswordBtn} onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading || loading}>
                {isLoading || loading ? (
                  <ActivityIndicator color="black" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.signupText}>
                Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
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
    width: 150,
    height: 150,
    borderRadius: 75,
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
    width: 140,
    height: 140,
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
  forgotPasswordBtn: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "cyan",
    fontSize: 14,
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
  signupText: {
    color: "white",
    marginTop: 20,
    fontSize: 14,
    textAlign: "center",
  },
  signupLink: {
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

export default LoginScreen

