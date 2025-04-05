"use client"

import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { initialPRs } from "../data/prData"

// Create user context
const UserContext = createContext({})

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    goal: "",
    trainingLevel: "intermediate", // Add default training level
  })

  const [personalRecords, setPersonalRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Load user data from storage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true)

        // Load profile
        const profileData = await AsyncStorage.getItem("userProfile")
        if (profileData) {
          setUserProfile(JSON.parse(profileData))
        }

        // Load PRs
        const prData = await AsyncStorage.getItem("personalRecords")
        console.log("Raw PR data from storage:", prData)

        if (prData) {
          try {
            const parsedData = JSON.parse(prData)
            console.log("Parsed PR data:", parsedData)

            if (Array.isArray(parsedData) && parsedData.length > 0) {
              setPersonalRecords(parsedData)
            } else {
              console.log("PR data is empty or not an array, initializing with defaults")
              setPersonalRecords(initialPRs)
              await AsyncStorage.setItem("personalRecords", JSON.stringify(initialPRs))
            }
          } catch (parseError) {
            console.error("Error parsing PR data:", parseError)
            setPersonalRecords(initialPRs)
            await AsyncStorage.setItem("personalRecords", JSON.stringify(initialPRs))
          }
        } else {
          // Initialize with default PRs if none exist
          console.log("No PR data found, initializing with defaults:", initialPRs)
          setPersonalRecords(initialPRs)
          await AsyncStorage.setItem("personalRecords", JSON.stringify(initialPRs))
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        // Initialize with default PRs on error
        console.log("Error loading data, initializing with defaults")
        setPersonalRecords(initialPRs)
        try {
          await AsyncStorage.setItem("personalRecords", JSON.stringify(initialPRs))
        } catch (storageError) {
          console.error("Error saving initial PRs:", storageError)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

  // Save profile changes
  const updateProfile = async (newProfile) => {
    try {
      const updatedProfile = { ...userProfile, ...newProfile }
      setUserProfile(updatedProfile)
      await AsyncStorage.setItem("userProfile", JSON.stringify(updatedProfile))
      return { success: true }
    } catch (error) {
      console.error("Error updating profile:", error)
      return { success: false, error: error.message }
    }
  }

  // Add a new PR
  const addPersonalRecord = async (newPR) => {
    try {
      const prWithId = {
        ...newPR,
        id: Date.now().toString(),
        date: new Date().toISOString().split("T")[0],
      }

      const updatedPRs = [...personalRecords, prWithId]
      console.log("Adding new PR:", prWithId)
      console.log("Updated PRs:", updatedPRs)

      setPersonalRecords(updatedPRs)
      await AsyncStorage.setItem("personalRecords", JSON.stringify(updatedPRs))
      return { success: true }
    } catch (error) {
      console.error("Error adding PR:", error)
      return { success: false, error: error.message }
    }
  }

  // Update an existing PR
  const updatePersonalRecord = async (prId, updatedData) => {
    try {
      const updatedPRs = personalRecords.map((pr) => (pr.id === prId ? { ...pr, ...updatedData } : pr))

      setPersonalRecords(updatedPRs)
      await AsyncStorage.setItem("personalRecords", JSON.stringify(updatedPRs))
      return { success: true }
    } catch (error) {
      console.error("Error updating PR:", error)
      return { success: false, error: error.message }
    }
  }

  // Delete a PR
  const deletePersonalRecord = async (prId) => {
    try {
      const updatedPRs = personalRecords.filter((pr) => pr.id !== prId)
      setPersonalRecords(updatedPRs)
      await AsyncStorage.setItem("personalRecords", JSON.stringify(updatedPRs))
      return { success: true }
    } catch (error) {
      console.error("Error deleting PR:", error)
      return { success: false, error: error.message }
    }
  }

  // Reset PRs to initial data (for debugging)
  const resetPersonalRecords = async () => {
    try {
      setPersonalRecords(initialPRs)
      await AsyncStorage.setItem("personalRecords", JSON.stringify(initialPRs))
      return { success: true }
    } catch (error) {
      console.error("Error resetting PRs:", error)
      return { success: false, error: error.message }
    }
  }

  const contextValue = {
    userProfile,
    updateProfile,
    personalRecords,
    addPersonalRecord,
    updatePersonalRecord,
    deletePersonalRecord,
    resetPersonalRecords,
    isLoading,
  }

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
}

export const useUser = () => useContext(UserContext)

export default { UserProvider, useUser }

