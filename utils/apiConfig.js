import AsyncStorage from "@react-native-async-storage/async-storage"
import { ENV } from "../config"

// Function to securely get the OpenAI API key
export const getOpenAIApiKey = async () => {
  try {
    // First check if we have a stored key
    const storedKey = await AsyncStorage.getItem("openai_api_key")

    // If we have a stored key, return it
    if (storedKey) {
      return storedKey
    }

    // If no stored key, use the default key from config
    if (ENV && ENV.OPENAI_API_KEY) {
      await AsyncStorage.setItem("openai_api_key", ENV.OPENAI_API_KEY)
      return ENV.OPENAI_API_KEY
    }

    return null
  } catch (error) {
    console.error("Error retrieving API key:", error)

    // Fallback to ENV directly if AsyncStorage fails
    if (ENV && ENV.OPENAI_API_KEY) {
      return ENV.OPENAI_API_KEY
    }

    return null
  }
}

// Function to securely set the OpenAI API key
export const setOpenAIApiKey = async (apiKey) => {
  try {
    await AsyncStorage.setItem("openai_api_key", apiKey)
    return true
  } catch (error) {
    console.error("Error storing API key:", error)
    return false
  }
}

