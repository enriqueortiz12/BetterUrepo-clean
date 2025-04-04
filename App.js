"use client"
import { useState, useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { View, Text, StyleSheet, ActivityIndicator, Image, Platform, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"

// Import context providers and hooks
import { AuthProvider, useAuth } from "./context/AuthContext"
import { UserProvider, useUser } from "./context/UserContext"
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

// Main tab navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

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

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#0099ff",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "#121212",
          borderTopColor: "rgba(255, 255, 255, 0.1)",
          paddingTop: 5,
          paddingBottom: Platform.OS === "ios" ? (isIphoneX ? 30 : 5) : 5,
          height: Platform.OS === "ios" ? (isIphoneX ? 90 : 60) : 60,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          zIndex: 999, // Ensure tab bar is above other elements
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
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.logoContainer}>
        <Image source={require("./assets/logo.png")} style={styles.logo} resizeMode="contain" />
      </View>
      <ActivityIndicator size="large" color="#0099ff" />
      <Text style={styles.loadingText}>Loading BetterU...</Text>
    </View>
  )
}

// Navigation component that handles auth state
const AppNavigator = () => {
  const { user, loading: authLoading } = useAuth()
  const { isLoading: userLoading } = useUser()
  const [initialLoading, setInitialLoading] = useState(true)

  // Simulate initial app loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (initialLoading) {
    return <InitialLoading />
  }

  if (authLoading || userLoading) {
    // Pass explicit params to LoadingScreen
    return <LoadingScreen nextScreen={user ? "Main" : "Login"} nextScreenParams={{}} />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
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

// Styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "transparent", // Changed from black to transparent
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 2,
    borderColor: "#0099ff",
    shadowColor: "#0099ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  logo: {
    width: 130,
    height: 130,
  },
  loadingText: {
    color: "#0099ff", // Changed to match logo color
    marginTop: 20,
    fontSize: 18,
    fontWeight: "bold",
  },
})

export default App

