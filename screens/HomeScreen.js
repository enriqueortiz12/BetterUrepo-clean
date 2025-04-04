"use client"
import { View, Text, StyleSheet, ScrollView, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext"
import { workoutCategories } from "../data/workoutData"
import { trainingStyles } from "../data/trainingStylesData"
import GlassmorphicCard from "../components/GlassmorphicCard"
import ScrollableFilters from "../components/ScrollableFilters"
import HoverButton from "../components/HoverButton"

const HomeScreen = ({ navigation }) => {
  const { userProfile } = useUser()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  const getFirstName = () => {
    if (!userProfile || !userProfile.name || typeof userProfile.name !== "string") return ""
    return userProfile.name.split(" ")[0]
  }

  // Training style options for dropdown
  const trainingStyleOptions = [
    { label: "Strength Training", value: "strength" },
    { label: "Hypertrophy", value: "hypertrophy" },
    { label: "General Fitness", value: "general" },
    { label: "Powerlifting", value: "powerlifting" },
    { label: "Olympic Weightlifting", value: "olympic" },
    { label: "Athleticism", value: "athleticism" },
  ]

  // Safely access workout categories and ensure they exist
  const safeWorkoutCategories = workoutCategories || []
  const safeTrainingStyles = trainingStyles || []

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoSmallContainer}>
            <Image source={require("../assets/logo.png")} style={styles.logoSmall} resizeMode="contain" />
          </View>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>{getFirstName() || "Fitness Enthusiast"}</Text>
          </View>
        </View>
        <HoverButton
          style={styles.notificationButton}
          onPress={() => {}}
          activeOpacity={0.7}
          hoverColor="rgba(255, 255, 255, 0.2)"
        >
          <Ionicons name="notifications-outline" size={24} color="white" />
        </HoverButton>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        alwaysBounceVertical={true}
        overScrollMode="always"
      >
        {!userProfile.goal && (
          <HoverButton
            style={styles.goalPrompt}
            onPress={() => navigation.navigate("Goals")}
            activeOpacity={0.8}
            hoverColor="rgba(0, 255, 255, 0.15)"
          >
            <View style={styles.goalPromptContent}>
              <Text style={styles.goalPromptTitle}>Set Your Fitness Goal</Text>
              <Text style={styles.goalPromptText}>
                Tell us what you want to achieve so we can personalize your experience
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </HoverButton>
        )}

        <GlassmorphicCard
          style={styles.aiTrainerCard}
          color="rgba(0, 255, 255, 0.1)"
          borderColor="rgba(0, 255, 255, 0.3)"
        >
          <View style={styles.aiTrainerHeader}>
            <View style={styles.aiTrainerIconContainer}>
              <Image source={require("../assets/logo.png")} style={styles.aiTrainerIcon} resizeMode="contain" />
            </View>
            <View style={styles.aiTrainerTitleContainer}>
              <Text style={styles.aiTrainerTitle}>AI Personal Trainer</Text>
              <Text style={styles.aiTrainerSubtitle}>Your fitness companion</Text>
            </View>
          </View>

          <Text style={styles.aiTrainerDescription}>
            Get personalized workouts, form feedback, and motivation from your AI trainer.
          </Text>

          <View style={styles.aiTrainerActions}>
            <HoverButton
              style={styles.aiTrainerButton}
              onPress={() => navigation.navigate("TrainerTab")}
              activeOpacity={0.8}
              hoverColor="#00b3ff"
              pressColor="#0077ff"
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="black" />
              <Text style={styles.aiTrainerButtonText}>Chat</Text>
            </HoverButton>

            <HoverButton
              style={styles.aiTrainerButton}
              onPress={() => navigation.navigate("WorkoutRecommendation")}
              activeOpacity={0.8}
              hoverColor="#00b3ff"
              pressColor="#0077ff"
            >
              <Ionicons name="barbell-outline" size={20} color="black" />
              <Text style={styles.aiTrainerButtonText}>Workouts</Text>
            </HoverButton>

            <HoverButton
              style={styles.aiTrainerButton}
              onPress={() => navigation.navigate("FormAnalysisSelection")}
              activeOpacity={0.8}
              hoverColor="#00b3ff"
              pressColor="#0077ff"
            >
              <Ionicons name="analytics-outline" size={20} color="black" />
              <Text style={styles.aiTrainerButtonText}>Form Check</Text>
            </HoverButton>
          </View>
        </GlassmorphicCard>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={24} color="#FF5733" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#33A1FF" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>PRs</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Training Styles</Text>
            <HoverButton
              onPress={() => navigation.navigate("WorkoutTab")}
              style={styles.seeAllButton}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </HoverButton>
          </View>

          <View style={styles.trainingStylesContainer}>
            <ScrollableFilters
              options={trainingStyleOptions}
              selectedValue=""
              onSelect={(value) => navigation.navigate("WorkoutTab", { selectedStyle: value })}
            />
          </View>
        </View>

        <HoverButton
          style={styles.prTrackingCard}
          onPress={() => navigation.navigate("PRTab")}
          activeOpacity={0.8}
          hoverColor="rgba(255, 215, 0, 0.15)"
        >
          <View style={styles.prTrackingContent}>
            <Ionicons name="trophy" size={32} color="#FFD700" />
            <View style={styles.prTrackingTextContainer}>
              <Text style={styles.prTrackingTitle}>Track Your Progress</Text>
              <Text style={styles.prTrackingText}>Record and monitor your personal records</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </HoverButton>

        <HoverButton
          style={styles.logWorkoutCard}
          onPress={() => navigation.navigate("LogTab")}
          activeOpacity={0.8}
          hoverColor="rgba(0, 255, 255, 0.15)"
        >
          <View style={styles.logWorkoutContent}>
            <Ionicons name="list" size={32} color="cyan" />
            <View style={styles.logWorkoutTextContainer}>
              <Text style={styles.logWorkoutTitle}>Workout Log</Text>
              <Text style={styles.logWorkoutText}>View your workout history and progress</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </HoverButton>

        {/* Add extra padding at the bottom to ensure all content is accessible */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  scrollContent: {
    paddingBottom: 120, // Increase bottom padding for better scrolling
    flexGrow: 1, // Ensure content takes up full space
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 255, 255, 0.1)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoSmallContainer: {
    marginRight: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "transparent", // Changed from black to transparent
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.5)",
    shadowColor: "cyan",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  logoSmall: {
    width: 40,
    height: 40,
  },
  greeting: {
    color: "#aaa",
    fontSize: 16,
  },
  name: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  goalPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  goalPromptContent: {
    flex: 1,
    marginRight: 10,
  },
  goalPromptTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  goalPromptText: {
    color: "#aaa",
    fontSize: 14,
  },
  aiTrainerCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  aiTrainerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  aiTrainerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "transparent", // Changed from black to transparent
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(0, 255, 255, 0.5)",
    shadowColor: "cyan",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  aiTrainerIcon: {
    width: 56,
    height: 56,
  },
  aiTrainerTitleContainer: {
    flex: 1,
  },
  aiTrainerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  aiTrainerSubtitle: {
    color: "#aaa",
    fontSize: 14,
  },
  aiTrainerDescription: {
    color: "white",
    fontSize: 16,
    marginBottom: 20,
  },
  aiTrainerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  aiTrainerButton: {
    backgroundColor: "cyan",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  aiTrainerButtonText: {
    color: "black",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 5,
  },
  statLabel: {
    color: "#aaa",
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  seeAllText: {
    color: "cyan",
    fontSize: 14,
  },
  seeAllButton: {
    padding: 8,
    borderRadius: 8,
  },
  trainingStylesContainer: {
    paddingLeft: 20,
    marginBottom: 20,
  },
  prTrackingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    borderRadius: 15,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  prTrackingContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  prTrackingTextContainer: {
    marginLeft: 15,
    flex: 1, // Allow text container to take remaining space
  },
  prTrackingTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  prTrackingText: {
    color: "#aaa",
    fontSize: 14,
  },
  logWorkoutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 255, 255, 0.15)",
    borderRadius: 15,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.4)",
    shadowColor: "cyan",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logWorkoutContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logWorkoutTextContainer: {
    marginLeft: 15,
    flex: 1, // Allow text container to take remaining space
  },
  logWorkoutTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  logWorkoutText: {
    color: "#aaa",
    fontSize: 14,
  },
  bottomPadding: {
    height: 80, // Increase bottom padding
  },
})

export default HomeScreen

