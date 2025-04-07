"use client"

import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getOpenAIApiKey } from "../utils/apiConfig"
import { generateAIResponse } from "../utils/aiUtils"
import { supabase } from "../lib/supabase"

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
  const [user, setUser] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Initialize API key from config and load conversations
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

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
        await loadConversations(user)
      } catch (error) {
        console.error("Error initializing:", error)
        setApiKeySet(false)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session?.user || null)
        if (session?.user) {
          await loadConversations(session.user)
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Load conversations from Supabase and fall back to AsyncStorage
  const loadConversations = async (currentUser) => {
    try {
      let loadedConversations = []

      // If user is logged in, try to load from Supabase first
      if (currentUser) {
        const { data, error } = await supabase
          .from("trainer_messages")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("timestamp", { ascending: true })

        if (!error && data && data.length > 0) {
          // Transform data from Supabase format to app format
          loadedConversations = data.map((item) => ({
            id: item.message_id,
            sender: item.sender,
            message: item.message,
            timestamp: item.timestamp,
          }))

          console.log(`Loaded ${loadedConversations.length} messages from Supabase`)

          // Save to AsyncStorage as backup
          await AsyncStorage.setItem("trainerConversations", JSON.stringify(loadedConversations))
        } else {
          // If no data in Supabase or error, try AsyncStorage
          const savedConversations = await AsyncStorage.getItem("trainerConversations")
          if (savedConversations) {
            loadedConversations = JSON.parse(savedConversations)
            console.log(`Loaded ${loadedConversations.length} messages from AsyncStorage`)

            // Sync AsyncStorage data to Supabase
            await syncLocalMessagesToSupabase(loadedConversations, currentUser.id)
          }
        }
      } else {
        // No user, just use AsyncStorage
        const savedConversations = await AsyncStorage.getItem("trainerConversations")
        if (savedConversations) {
          loadedConversations = JSON.parse(savedConversations)
          console.log(`Loaded ${loadedConversations.length} messages from AsyncStorage (no user)`)
        }
      }

      // If no conversations found anywhere, initialize with a greeting
      if (!loadedConversations || loadedConversations.length === 0) {
        const initialMessage = {
          id: Date.now().toString(),
          sender: "trainer",
          message: "Hello! I'm your AI trainer. How can I help you today?",
          timestamp: new Date().toISOString(),
        }
        loadedConversations = [initialMessage]

        // Save initial message
        await AsyncStorage.setItem("trainerConversations", JSON.stringify(loadedConversations))

        // Save to Supabase if user is logged in
        if (currentUser) {
          await saveMessageToSupabase(initialMessage, currentUser.id)
        }
      }

      setConversations(loadedConversations)
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

  // Sync local messages to Supabase
  const syncLocalMessagesToSupabase = async (messages, userId) => {
    if (!userId || messages.length === 0 || isSyncing) return

    try {
      setIsSyncing(true)
      console.log(`Syncing ${messages.length} messages to Supabase`)

      // Get existing message IDs from Supabase to avoid duplicates
      const { data: existingMessages, error: fetchError } = await supabase
        .from("trainer_messages")
        .select("message_id")
        .eq("user_id", userId)

      if (fetchError) {
        console.error("Error fetching existing messages:", fetchError)
        return
      }

      // Create a set of existing message IDs for faster lookup
      const existingIds = new Set(existingMessages?.map((msg) => msg.message_id) || [])

      // Filter out messages that already exist in Supabase
      const messagesToSync = messages.filter((msg) => !existingIds.has(msg.id))

      if (messagesToSync.length === 0) {
        console.log("No new messages to sync")
        return
      }

      console.log(`Syncing ${messagesToSync.length} new messages to Supabase`)

      // Prepare messages for Supabase insert
      const supabaseMessages = messagesToSync.map((msg) => ({
        user_id: userId,
        message_id: msg.id,
        sender: msg.sender,
        message: msg.message,
        timestamp: msg.timestamp,
      }))

      // Insert messages in batches to avoid payload size limits
      const batchSize = 100
      for (let i = 0; i < supabaseMessages.length; i += batchSize) {
        const batch = supabaseMessages.slice(i, i + batchSize)
        const { error } = await supabase.from("trainer_messages").insert(batch)

        if (error) {
          console.error(`Error syncing batch ${i / batchSize + 1}:`, error)
        }
      }

      console.log("Sync completed successfully")
    } catch (error) {
      console.error("Error in syncLocalMessagesToSupabase:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Save a single message to Supabase
  const saveMessageToSupabase = async (message, userId) => {
    if (!userId) return

    try {
      const { error } = await supabase.from("trainer_messages").insert([
        {
          user_id: userId,
          message_id: message.id,
          sender: message.sender,
          message: message.message,
          timestamp: message.timestamp,
        },
      ])

      if (error) {
        console.error("Error saving message to Supabase:", error)
      }
    } catch (error) {
      console.error("Error in saveMessageToSupabase:", error)
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

      // Save to AsyncStorage
      const updatedConversations = [...conversations, userMessage]
      await AsyncStorage.setItem("trainerConversations", JSON.stringify(updatedConversations))

      // Save to Supabase if user is logged in
      if (user) {
        await saveMessageToSupabase(userMessage, user.id)
      }

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

      // Save to AsyncStorage
      const finalConversations = [...updatedConversations, aiResponse]
      await AsyncStorage.setItem("trainerConversations", JSON.stringify(finalConversations))

      // Save to Supabase if user is logged in
      if (user) {
        await saveMessageToSupabase(aiResponse, user.id)
      }

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

      // Save to AsyncStorage
      await AsyncStorage.setItem("trainerConversations", JSON.stringify([...conversations, errorResponse]))

      // Save to Supabase if user is logged in
      if (user) {
        await saveMessageToSupabase(errorResponse, user.id)
      }

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

      // Delete all messages from Supabase if user is logged in
      if (user) {
        const { error } = await supabase.from("trainer_messages").delete().eq("user_id", user.id)

        if (error) {
          console.error("Error clearing messages from Supabase:", error)
        } else {
          // Save the initial message to Supabase
          await saveMessageToSupabase(initialMessage, user.id)
        }
      }

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

