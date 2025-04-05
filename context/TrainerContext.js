"use client"

import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getOpenAIApiKey } from "../utils/apiConfig"

// Create trainer context with default values
const TrainerContext = createContext({
  conversations: [],
  sendMessage: () => Promise.resolve({ success: false }),
  clearConversations: () => Promise.resolve({ success: false }),
  isLoading: true,
  apiKeySet: false,
})

export const TrainerProvider = ({ children }) => {
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
        const key = await getOpenAIApiKey()
        if (key) {
          setApiKey(key)
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
          message: "Hello! I'm your AI trainer. How can I help you today?",
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

  // Function to generate AI response using direct fetch to OpenAI API
  const generateAIResponse = async (userMessage) => {
    console.log("Generating AI response for:", userMessage)

    try {
      // Get the API key
      const key = await getOpenAIApiKey()

      if (!key) {
        console.warn("No OpenAI API key available")
        return "I'm sorry, I can't connect to my AI brain right now. Please check your API key configuration."
      }

      // Create the request to OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are an AI fitness trainer assistant. You provide helpful, encouraging, and accurate advice about workouts, nutrition, and fitness goals. Keep your responses concise (under 150 words) and focused on fitness advice.",
            },
            {
              role: "user",
              content: userMessage,
            },
          ],
          max_tokens: 500,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("OpenAI API error:", errorData)
        throw new Error(`API error: ${errorData.error?.message || "Unknown error"}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error("Error generating AI response:", error)
      return "I'm having trouble connecting to my AI brain right now. Let's try again in a moment."
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
      let aiResponseText
      try {
        aiResponseText = await generateAIResponse(message)
      } catch (error) {
        console.error("Error generating AI response:", error)
        aiResponseText = "I'm sorry, I encountered an error processing your request. Please try again."
      }

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

      // Add a fallback response even if there's an error
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        sender: "trainer",
        message: "I'm sorry, I encountered an error. Please try again later.",
        timestamp: new Date().toISOString(),
      }

      setConversations((prev) => [...prev, errorResponse])

      return { success: false, error: error.message }
    }
  }

  // Clear conversation history
  const clearConversations = async () => {
    try {
      const initialMessage = {
        id: Date.now().toString(),
        sender: "trainer",
        message: "Hello! I'm your AI trainer. How can I help you today?",
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

  // Create the context value object
  const contextValue = {
    conversations,
    sendMessage,
    clearConversations,
    isLoading,
    apiKeySet,
  }

  return <TrainerContext.Provider value={contextValue}>{children}</TrainerContext.Provider>
}

export const useTrainer = () => useContext(TrainerContext)

export default { TrainerProvider, useTrainer }

