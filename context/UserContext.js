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
        // Load profile
        const profileData = await AsyncStorage.getItem("userProfile")
        if (profileData) {
          setUserProfile(JSON.parse(profileData))
        }

        // Load PRs
        const prData = await AsyncStorage.getItem("personalRecords")
        if (prData) {
          setPersonalRecords(JSON.parse(prData))
        } else {
          // Initialize with default PRs if none exist
          setPersonalRecords(initialPRs)
          await AsyncStorage.setItem("personalRecords", JSON.stringify(initialPRs))
        }
      } catch (error) {
        console.error("Error loading user data:", error)
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

  return (
    <UserContext.Provider
      value={{
        userProfile,
        updateProfile,
        personalRecords,
        addPersonalRecord,
        updatePersonalRecord,
        deletePersonalRecord,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)

export default { UserProvider, useUser }

