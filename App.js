"use client"

import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { View, Text, StyleSheet, ActivityIndicator, Image, Platform, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "./lib/supabase"

// Import context providers and hooks
import { AuthProvider, useAuth } from "./context/AuthContext"
import { UserProvider } from "./context/UserContext"
import { TrainerProvider } from "./context/TrainerContext"

// Auth Screens
import LoginScreen from "./screens/LoginScreen"
import SignUpScreen from "./screens/SignUpScreen"
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen"
import ResetPasswordScreen from "./screens/ResetPasswordScreen"

// Onboarding Screens
import OnboardingScreen from "./screens/onboarding/OnboardingScreen"

// Main Screens
import HomeScreen from "./screens/HomeScreen"
import ProfileScreen from "./screens/ProfileScreen"
import WorkoutScreen from "./screens/WorkoutScreen"
import PRScreen from "./screens/PRScreen"
import GoalsScreen from "./screens/GoalsScreen"
import LoadingScreen from "./screens/LoadingScreen"

// Trainer Screens
import TrainerScreen from "./screens/TrainerScreen"
import WorkoutAnalysisScreen from "./screens/WorkoutAnalysisScreen"
import WorkoutRecommendationScreen from "./screens/WorkoutRecommendationScreen"

// New Screens
import ActiveWorkoutScreen from "./screens/ActiveWorkoutScreen"
import WorkoutLogScreen from "./screens/WorkoutLogScreen"
import FormAnalysisSelectionScreen from "./screens/FormAnalysisSelectionScreen"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

// Create the navigation stacks
const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Update the tab bar style to make it more compact and not push content up
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "help-circle-outline" // Default fallback

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "WorkoutTab") {
            iconName = focused ? "barbell" : "barbell-outline"
          } else if (route.name === "TrainerTab") {
            iconName = focused ? "fitness" : "fitness-outline"
          } else if (route.name === "PRTab") {
            iconName = focused ? "trophy" : "trophy-outline"
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "person" : "person-outline"
          } else if (route.name === "LogTab") {
            iconName = focused ? "list" : "list-outline"
          }

          // Always return a valid component
          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#0099ff",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "#121212",
          borderTopColor: "rgba(255, 255, 255, 0.1)",
          paddingTop: 5,
          paddingBottom: Platform.OS === "ios" ? (isIphoneX ? 25 : 5) : 5,
          height: Platform.OS === "ios" ? (isIphoneX ? 80 : 60) : 60,
          position: "absolute", // Make tab bar float over content
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: Platform.OS === "ios" ? (isIphoneX ? 10 : 5) : 5,
        },
        headerShown: false,
        tabBarShowLabel: true,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="WorkoutTab" component={WorkoutScreen} options={{ tabBarLabel: "Workouts" }} />
      <Tab.Screen name="TrainerTab" component={TrainerScreen} options={{ tabBarLabel: "AI Trainer" }} />
      <Tab.Screen name="PRTab" component={PRScreen} options={{ tabBarLabel: "PRs" }} />
      <Tab.Screen name="LogTab" component={WorkoutLogScreen} options={{ tabBarLabel: "Log" }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: "Profile" }} />
    </Tab.Navigator>
  )
}

// Initial loading component
const InitialLoading = () => {
  // Define the logo source directly
  const logoSource = require("./assets/logo.png")

  return (
    <View style={styles.loadingContainer}>
      <View style={styles.logoContainer}>
        <Image source={logoSource} style={styles.logo} resizeMode="contain" />
      </View>
      <ActivityIndicator size="large" color="#0099ff" />
      <Text style={styles.loadingText}>Loading BetterU...</Text>
    </View>
  )
}

// This component will be rendered inside NavigationContainer
const MainNavigator = () => {
  const { user, loading: authLoading } = useAuth()
  const [initialRoute, setInitialRoute] = React.useState(null)
  const [isChecking, setIsChecking] = React.useState(true)

  // Function to handle direct navigation without using hooks
  const handleDirectNavigation = (screen, params = {}) => {
    setInitialRoute(screen)
    setIsChecking(false)
  }

  // Check if we need to redirect to onboarding
  const checkProfileCompleteness = React.useCallback(async () => {
    if (user) {
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

        if (error && error.code !== "PGRST116") {
          console.error("Error checking profile:", error)
          return false
        }

        // Check if profile is incomplete
        const isProfileIncomplete =
          !data || !data.full_name || !data.age || !data.weight || !data.fitness_goal || !data.gender || !data.height

        return isProfileIncomplete
      } catch (error) {
        console.error("Error in profile check:", error)
        return false
      }
    }
    return false
  }, [user])

  React.useEffect(() => {
    const determineInitialRoute = async () => {
      if (!user) {
        console.log("No user, setting initial route to Login")
        setInitialRoute("Login")
        setIsChecking(false)
        return
      }

      try {
        const needsOnboarding = await checkProfileCompleteness()
        console.log("Profile completeness check result:", needsOnboarding)

        if (needsOnboarding) {
          console.log("Profile incomplete, setting initial route to Onboarding")
          setInitialRoute("Onboarding")
        } else {
          console.log("Profile complete, setting initial route to Main")
          setInitialRoute("Main")
        }
      } catch (error) {
        console.error("Error determining initial route:", error)
        // Default to Main on error
        setInitialRoute("Main")
      } finally {
        setIsChecking(false)
      }
    }

    if (!authLoading) {
      determineInitialRoute()
    }
  }, [user, authLoading, checkProfileCompleteness])

  if (authLoading || isChecking) {
    return (
      <LoadingScreen
        directNavigation={handleDirectNavigation}
        nextScreen={user ? "Main" : "Login"}
        nextScreenParams={{}}
      />
    )
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "black" },
        animation: "slide_from_right",
      }}
    >
      {user ? (
        // Authenticated routes
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Goals" component={GoalsScreen} />
          <Stack.Screen name="Loading" component={LoadingScreen} />
          <Stack.Screen name="FormAnalysisSelection" component={FormAnalysisSelectionScreen} />
          <Stack.Screen name="WorkoutAnalysis" component={WorkoutAnalysisScreen} />
          <Stack.Screen name="WorkoutRecommendation" component={WorkoutRecommendationScreen} />
          <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
        </>
      ) : (
        // Unauthenticated routes
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}

// Navigation component that handles auth state
const AppNavigator = () => {
  const [initialLoading, setInitialLoading] = React.useState(true)

  // Simulate initial app loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (initialLoading) {
    return <InitialLoading />
  }

  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  )
}

// Main App component
const App = () => {
  return (
    <AuthProvider>
      <UserProvider>
        <TrainerProvider>
          <AppNavigator />
        </TrainerProvider>
      </UserProvider>
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#fff",
  },
})

export default App

