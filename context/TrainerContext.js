"use client"

import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useUser } from "./UserContext"
import { ENV } from "../config"

// Create trainer context
const TrainerContext = createContext({})

// Sample trainer responses as fallback
const trainerResponses = {
  greeting: [
    "Hey there! I'm your AI personal trainer. How can I help you today?",
    "Welcome back! Ready to crush your fitness goals today?",
    "Hi! I'm here to help you on your fitness journey. What would you like to work on?",
  ],
  motivation: [
    "You're doing great! Remember, consistency is key to achieving your fitness goals.",
    "Every rep counts! Keep pushing yourself, and you'll see results.",
    "Don't give up! The hardest part is showing up, and you've already done that.",
    "Progress takes time. Trust the process and stay committed to your goals.",
  ],
  workoutSuggestions: {
    strength: [
      "For strength training, I recommend focusing on compound movements like squats, deadlifts, and bench press. Start with 3 sets of 5 reps with a weight that challenges you.",
      "To build strength, try a 5x5 program: 5 sets of 5 reps of key exercises like barbell rows, overhead press, and squats.",
      "For your strength goal, incorporate progressive overload by increasing weight by 5-10% every 2 weeks.",
    ],
    muscle: [
      "For muscle growth, aim for 8-12 reps per set with moderate weight. Focus on time under tension and proper form.",
      "Try a push/pull/legs split for hypertrophy: chest/shoulders/triceps on day 1, back/biceps on day 2, and legs on day 3.",
      "For optimal muscle growth, ensure you're getting enough protein (about 1.6-2.2g per kg of bodyweight) and adequate recovery between workouts.",
    ],
    health: [
      "For overall health, combine cardio (30 min, 3x/week), strength training (2x/week), and flexibility work (daily stretching).",
      "Start with full-body workouts 3 times a week, focusing on proper form and gradually increasing intensity.",
      "For health improvements, consistency is more important than intensity. Aim for 150 minutes of moderate activity per week.",
    ],
    athleticism: [
      "To improve athleticism, incorporate plyometrics, agility drills, and compound movements into your routine.",
      "Try circuit training with minimal rest between exercises to build endurance and power simultaneously.",
      "For athletic performance, work on explosive movements like box jumps, medicine ball throws, and sprint intervals.",
    ],
  },
  formFeedback: {
    squat: [
      "For proper squat form: keep your chest up, knees tracking over toes, and weight in your heels. Descend until thighs are parallel to the ground.",
      "Common squat mistakes include rounding your back, letting knees cave inward, and not reaching proper depth. Focus on these areas.",
    ],
    deadlift: [
      "For deadlift form: maintain a neutral spine, engage your lats, and push through your heels. The bar should travel in a straight vertical path.",
      "When deadlifting, common errors include rounding the lower back and lifting with the arms instead of driving through the legs.",
    ],
    bench: [
      "For bench press form: keep your feet flat on the floor, shoulders retracted, and maintain a slight arch in your back. Lower the bar to mid-chest.",
      "To improve your bench press, focus on leg drive, proper bar path, and keeping your wrists straight throughout the movement.",
    ],
  },
  nutrition: [
    "Remember to stay hydrated and eat a balanced diet rich in protein, complex carbs, and healthy fats.",
    "For recovery, aim to get 7-9 hours of sleep and consider adding protein-rich foods or a shake within 30 minutes after your workout.",
    "Nutrition is just as important as training. Focus on whole foods and adequate protein intake to support your fitness goals.",
  ],
  progress: [
    "Looking at your progress, you're making steady improvements! Keep up the good work.",
    "I notice you've been consistent with your workouts. That's the key to long-term success!",
    "Your dedication is paying off. Remember to celebrate these wins along your fitness journey.",
  ],
}

export const TrainerProvider = ({ children }) => {
  const { userProfile } = useUser()
  const [conversations, setConversations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiKeySet, setApiKeySet] = useState(false)
  const [apiKey, setApiKey] = useState(null)

  // Initialize API key from config and load conversations
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)

        // Get API key from config
        if (ENV && ENV.OPENAI_API_KEY) {
          setApiKey(ENV.OPENAI_API_KEY)
          setApiKeySet(true)
          console.log("API key initialized from config")
        } else {
          console.warn("No API key found in config")
          setApiKeySet(false)
        }

        // Load conversations
        await loadConversations()
      } catch (error) {
        console.error("Error initializing:", error)
        setApiKeySet(false)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  // Load conversations from storage
  const loadConversations = async () => {
    try {
      const savedConversations = await AsyncStorage.getItem("trainerConversations")
      if (savedConversations) {
        setConversations(JSON.parse(savedConversations))
      } else {
        // Initialize with a greeting if no conversations exist
        const initialMessage = {
          id: Date.now().toString(),
          sender: "trainer",
          message: trainerResponses.greeting[Math.floor(Math.random() * trainerResponses.greeting.length)],
          timestamp: new Date().toISOString(),
        }
        setConversations([initialMessage])
        await AsyncStorage.setItem("trainerConversations", JSON.stringify([initialMessage]))
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
      // Initialize with a default message if there's an error
      const initialMessage = {
        id: Date.now().toString(),
        sender: "trainer",
        message: "Hello! I'm your AI trainer. How can I help you today?",
        timestamp: new Date().toISOString(),
      }
      setConversations([initialMessage])
    }
  }

  // Save conversations to storage whenever they change
  useEffect(() => {
    const saveConversations = async () => {
      if (conversations && conversations.length > 0) {
        try {
          await AsyncStorage.setItem("trainerConversations", JSON.stringify(conversations))
        } catch (error) {
          console.error("Error saving conversations:", error)
        }
      }
    }

    saveConversations()
  }, [conversations])

  // Function to call OpenAI API
  const callOpenAI = async (userMessage) => {
    try {
      if (!apiKey) {
        console.log("No API key found, using mock responses")
        return null
      }

      // Get the last few messages for context (up to 5)
      const recentMessages =
        conversations && conversations.length > 0
          ? conversations.slice(-5).map((msg) => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.message,
            }))
          : []

      // Add system message with context about the user
      const systemMessage = {
        role: "system",
        content: `You are an AI personal trainer named BetterU. 
        The user's name is ${userProfile?.name || "the user"}.
        Their fitness goal is ${userProfile?.goal || "general fitness"}.
        Their age is ${userProfile?.age || "unknown"}.
        Their weight is ${userProfile?.weight ? `${userProfile.weight} lbs` : "unknown"}.
        Their height is ${userProfile?.height ? `${userProfile.height} inches` : "unknown"}.
        Provide personalized fitness advice, workout suggestions, form tips, and motivation.
        Keep responses concise (under 150 words) and focused on fitness.
        Be specific and actionable in your advice.
        If asked about getting stronger, provide specific strength training protocols.
        If asked about form, provide detailed form cues.
        If asked about nutrition, provide specific nutritional advice.`,
      }

      // Add the new user message
      const messages = [systemMessage, ...recentMessages, { role: "user", content: userMessage }]

      console.log("Calling OpenAI API with messages:", JSON.stringify(messages))

      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages,
          max_tokens: 300,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        console.error("OpenAI API error:", await response.text())
        return null
      }

      const data = await response.json()
      return data.choices[0].message.content.trim()
    } catch (error) {
      console.error("Error calling OpenAI:", error)
      return null
    }
  }

  // Function to generate AI response based on user message
  const generateAIResponse = async (userMessage) => {
    console.log("Generating AI response for:", userMessage)

    // Always try to get a response from OpenAI first if API key is set
    if (apiKeySet) {
      try {
        const openAIResponse = await callOpenAI(userMessage)

        if (openAIResponse) {
          console.log("Got OpenAI response:", openAIResponse)
          return openAIResponse
        }
      } catch (error) {
        console.error("Error with OpenAI, falling back to canned responses:", error)
      }
    }

    console.log("Using fallback responses")

    // Fallback to mock responses if OpenAI fails or API key is not set
    // Convert message to lowercase for easier matching
    const message = userMessage.toLowerCase()

    // Check for different types of queries
    if (message.includes("stronger") || message.includes("strength")) {
      return "To get stronger, focus on compound movements (squats, deadlifts, bench press) with progressive overload. Start with a 5x5 program (5 sets of 5 reps) at 70-80% of your 1RM. Increase weight by 5-10 lbs each week. Ensure adequate protein intake (1.6-2g per kg bodyweight) and rest 48-72 hours between training the same muscle group. Sleep 7-9 hours for optimal recovery and strength gains."
    } else if (message.includes("workout") || message.includes("exercise") || message.includes("routine")) {
      // Provide workout suggestions based on user's goal
      const goal = userProfile?.goal || "health"
      const responses = trainerResponses.workoutSuggestions[goal] || trainerResponses.workoutSuggestions.health
      return responses[Math.floor(Math.random() * responses.length)]
    } else if (message.includes("form") || message.includes("technique")) {
      // Provide form feedback
      if (message.includes("squat")) {
        return trainerResponses.formFeedback.squat[
          Math.floor(Math.random() * trainerResponses.formFeedback.squat.length)
        ]
      } else if (message.includes("deadlift")) {
        return trainerResponses.formFeedback.deadlift[
          Math.floor(Math.random() * trainerResponses.formFeedback.deadlift.length)
        ]
      } else if (message.includes("bench")) {
        return trainerResponses.formFeedback.bench[
          Math.floor(Math.random() * trainerResponses.formFeedback.bench.length)
        ]
      } else {
        return "For proper form, focus on controlled movements, proper breathing, and maintaining good posture. If you have a specific exercise in mind, let me know and I can provide detailed form cues for that movement. Proper form is crucial for preventing injuries and maximizing results."
      }
    } else if (message.includes("motivat") || message.includes("inspire") || message.includes("encourage")) {
      // Provide motivation
      return trainerResponses.motivation[Math.floor(Math.random() * trainerResponses.motivation.length)]
    } else if (
      message.includes("food") ||
      message.includes("nutrition") ||
      message.includes("diet") ||
      message.includes("eat")
    ) {
      // Provide nutrition advice
      return trainerResponses.nutrition[Math.floor(Math.random() * trainerResponses.nutrition.length)]
    } else if (message.includes("progress") || message.includes("improve") || message.includes("better")) {
      // Provide progress feedback
      return trainerResponses.progress[Math.floor(Math.random() * trainerResponses.progress.length)]
    } else {
      // Default responses for other queries
      return "I'm here to help with your fitness journey! You can ask me about workout suggestions, exercise form, nutrition tips, or just some motivation to keep going."
    }
  }

  // Send a message and get AI response
  const sendMessage = async (message) => {
    try {
      // Add user message to conversations
      const userMessage = {
        id: Date.now().toString(),
        sender: "user",
        message,
        timestamp: new Date().toISOString(),
      }

      setConversations((prev) => [...prev, userMessage])

      // Simulate AI thinking time
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate and add AI response
      const aiResponseText = await generateAIResponse(message)

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        sender: "trainer",
        message: aiResponseText,
        timestamp: new Date().toISOString(),
      }

      setConversations((prev) => [...prev, aiResponse])

      return { success: true }
    } catch (error) {
      console.error("Error sending message:", error)
      return { success: false, error: error.message }
    }
  }

  // Clear conversation history
  const clearConversations = async () => {
    try {
      const initialMessage = {
        id: Date.now().toString(),
        sender: "trainer",
        message: trainerResponses.greeting[Math.floor(Math.random() * trainerResponses.greeting.length)],
        timestamp: new Date().toISOString(),
      }

      setConversations([initialMessage])
      await AsyncStorage.setItem("trainerConversations", JSON.stringify([initialMessage]))

      return { success: true }
    } catch (error) {
      console.error("Error clearing conversations:", error)
      return { success: false, error: error.message }
    }
  }

  return (
    <TrainerContext.Provider
      value={{
        conversations,
        sendMessage,
        clearConversations,
        isLoading,
        apiKeySet,
      }}
    >
      {children}
    </TrainerContext.Provider>
  )
}

export const useTrainer = () => useContext(TrainerContext)

export default { TrainerProvider, useTrainer }

