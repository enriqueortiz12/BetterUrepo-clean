"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../lib/supabase"

const fitnessGoals = [
  { id: "strength", title: "Strength" },
  { id: "muscle_growth", title: "Muscle Growth" },
  { id: "weight_loss", title: "Weight Loss" },
  { id: "endurance", title: "Endurance" },
  { id: "health", title: "General Health" },
  { id: "athleticism", title: "Athleticism" },
]

const trainingLevels = [
  { id: "beginner", title: "Beginner", description: "New to fitness or returning after a long break" },
  { id: "intermediate", title: "Intermediate", description: "Consistent training for 6+ months" },
  { id: "advanced", title: "Advanced", description: "Dedicated training for 2+ years" },
]

const ProfileScreen = ({ navigation }) => {
  // Local state management - no dependencies on context
  const [user, setUser] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editField, setEditField] = useState("")
  const [inputValue, setInputValue] = useState("")
  const [inputUnit, setInputUnit] = useState("")
  const [showTrainingLevelModal, setShowTrainingLevelModal] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Load user and profile data directly
  useEffect(() => {
    let isMounted = true
    let timeoutId

    // Update the loadUserAndProfile function to properly handle RLS
    const loadUserAndProfile = async () => {
      try {
        console.log("ProfileScreen: Loading user and profile data")

        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.log("ProfileScreen: Loading timeout reached, showing fallback data")
            setLoadingTimeout(true)
            setIsLoading(false)
          }
        }, 5000) // 5 second timeout

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!isMounted) return

        if (user) {
          setUser(user)
          console.log("ProfileScreen: User found:", user.id)

          // Try to get profile data - make sure we're using the authenticated client
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (!isMounted) return

          if (error) {
            console.error("ProfileScreen: Error fetching profile:", error)

            // Create fallback profile data
            const fallbackProfile = {
              user_id: user.id,
              full_name: user.email ? user.email.split("@")[0] : "User",
              email: user.email,
              training_level: "intermediate",
            }

            setProfileData(fallbackProfile)

            // Try to create a profile if it doesn't exist
            if (error.code === "PGRST116") {
              console.log("ProfileScreen: No profile found, creating one")

              try {
                const { data: newProfile, error: createError } = await supabase
                  .from("profiles")
                  .insert([fallbackProfile])
                  .select()

                if (!isMounted) return

                if (createError) {
                  console.error("ProfileScreen: Failed to create profile:", createError)
                } else if (newProfile && newProfile.length > 0) {
                  console.log("ProfileScreen: Created new profile:", newProfile[0])
                  setProfileData(newProfile[0])
                }
              } catch (createError) {
                console.error("ProfileScreen: Error creating profile:", createError)
              }
            }
          } else {
            console.log("ProfileScreen: Profile loaded successfully:", profileData)
            setProfileData(profileData)
          }
        } else {
          console.log("ProfileScreen: No user found")
          // Handle no user case - should not happen if auth is working
          navigation.navigate("Login")
        }
      } catch (error) {
        console.error("ProfileScreen: Error loading user/profile:", error)
        // Use fallback data on error
        if (isMounted) {
          setProfileData({
            full_name: "User",
            email: "user@example.com",
            training_level: "intermediate",
          })
        }
      } finally {
        // Clear timeout and set loading to false
        if (timeoutId) clearTimeout(timeoutId)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadUserAndProfile()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [navigation])

  const handleEditField = (field, value, unit = "") => {
    setEditField(field)
    setInputValue(value || "")
    setInputUnit(unit)
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!inputValue && editField !== "height") {
      Alert.alert("Error", "Please enter a value")
      return
    }

    try {
      setIsLoading(true)

      let updateData = {}

      switch (editField) {
        case "name":
          updateData = { full_name: inputValue }
          break
        case "age":
          updateData = { age: Number.parseInt(inputValue) }
          break
        case "weight":
          updateData = { weight: Number.parseFloat(inputValue) }
          break
        case "height":
          updateData = { height: Number.parseFloat(inputValue) }
          break
        case "goal":
          updateData = { fitness_goal: inputValue }
          break
      }

      if (user) {
        // Update in Supabase
        const { error } = await supabase.from("profiles").update(updateData).eq("user_id", user.id)

        if (error) {
          console.error("Error updating profile:", error)
          Alert.alert("Error", "Failed to update profile. Please try again.")
        } else {
          // Update local state
          setProfileData((prev) => (prev ? { ...prev, ...updateData } : prev))
        }
      } else {
        // Just update local state if no user
        setProfileData((prev) => (prev ? { ...prev, ...updateData } : prev))
      }

      // Close modal
      setModalVisible(false)
    } catch (error) {
      console.error("Error in handleSave:", error)
      Alert.alert("Error", "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTrainingLevelSelect = async (level) => {
    try {
      setIsLoading(true)

      if (user) {
        // Update in Supabase
        const { error } = await supabase.from("profiles").update({ training_level: level }).eq("user_id", user.id)

        if (error) {
          console.error("Error updating training level:", error)
          Alert.alert("Error", "Failed to update training level. Please try again.")
        } else {
          // Update local state
          setProfileData((prev) => (prev ? { ...prev, training_level: level } : prev))
        }
      } else {
        // Just update local state if no user
        setProfileData((prev) => (prev ? { ...prev, training_level: level } : prev))
      }

      // Close modal
      setShowTrainingLevelModal(false)
    } catch (error) {
      console.error("Error in handleTrainingLevelSelect:", error)
      Alert.alert("Error", "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const getGoalName = () => {
    if (!profileData?.fitness_goal) return "Not set"

    const goal = fitnessGoals.find((g) => g.id === profileData.fitness_goal)
    return goal ? goal.title : "Not set"
  }

  const getTrainingLevelTitle = () => {
    const level = trainingLevels.find((level) => level.id === (profileData?.training_level || "intermediate"))
    return level ? level.title : "Not set"
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      navigation.navigate("Login")
    } catch (error) {
      console.error("Error signing out:", error)
      Alert.alert("Error", "Failed to sign out. Please try again.")
    }
  }

  // Show loading state for a maximum of 2 seconds
  if (isLoading && !loadingTimeout) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="cyan" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  // If we have a timeout or error, but no profile data, create a fallback profile
  if (!profileData) {
    console.log("ProfileScreen: Using fallback profile data")
    setProfileData({
      full_name: user?.email ? user.email.split("@")[0] : "User",
      email: user?.email || "user@example.com",
      training_level: "intermediate",
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Ionicons name="person" size={80} color="cyan" />
          </View>
          <TouchableOpacity style={styles.editImageButton}>
            <Text style={styles.editImageText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <TouchableOpacity style={styles.infoRow} onPress={() => handleEditField("name", profileData?.full_name)}>
            <Text style={styles.infoLabel}>Name</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{profileData?.full_name || "Not set"}</Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoRow} onPress={() => handleEditField("age", profileData?.age?.toString())}>
            <Text style={styles.infoLabel}>Age</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{profileData?.age || "Not set"}</Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleEditField("weight", profileData?.weight?.toString(), "lbs")}
          >
            <Text style={styles.infoLabel}>Weight</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{profileData?.weight ? `${profileData.weight} lbs` : "Not set"}</Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleEditField("height", profileData?.height?.toString(), "in")}
          >
            <Text style={styles.infoLabel}>Height</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{profileData?.height ? `${profileData.height} in` : "Not set"}</Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoRow} onPress={() => navigation.navigate("Goals")}>
            <Text style={styles.infoLabel}>Fitness Goal</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{getGoalName()}</Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoRow} onPress={() => setShowTrainingLevelModal(true)}>
            <Text style={styles.infoLabel}>Training Level</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{getTrainingLevelTitle()}</Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </View>
          </TouchableOpacity>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profileData?.email || user?.email || "Not available"}</Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Settings")}>
            <Ionicons name="settings-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit{" "}
                {editField && editField.length > 0 ? editField.charAt(0).toUpperCase() + editField.slice(1) : "Field"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder={`Enter your ${editField}`}
                placeholderTextColor="#666"
                keyboardType={
                  editField === "age" || editField === "weight" || editField === "height" ? "numeric" : "default"
                }
              />
              {inputUnit ? <Text style={styles.inputUnit}>{inputUnit}</Text> : null}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Training Level Modal */}
      <Modal
        visible={showTrainingLevelModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTrainingLevelModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Training Level</Text>
              <TouchableOpacity onPress={() => setShowTrainingLevelModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.trainingLevelList}>
              {trainingLevels.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.trainingLevelItem,
                    profileData?.training_level === level.id && styles.trainingLevelItemSelected,
                  ]}
                  onPress={() => handleTrainingLevelSelect(level.id)}
                >
                  <View style={styles.trainingLevelHeader}>
                    <Text
                      style={[
                        styles.trainingLevelTitleText,
                        profileData?.training_level === level.id && styles.trainingLevelTitleSelected,
                      ]}
                    >
                      {level.title}
                    </Text>
                    {profileData?.training_level === level.id && (
                      <Ionicons name="checkmark-circle" size={22} color="cyan" />
                    )}
                  </View>
                  <Text style={styles.trainingLevelDescriptionText}>{level.description}</Text>

                  {level.id === "beginner" && (
                    <Text style={styles.trainingLevelImpact}>Faster progress predictions</Text>
                  )}
                  {level.id === "intermediate" && (
                    <Text style={styles.trainingLevelImpact}>Balanced progress predictions</Text>
                  )}
                  {level.id === "advanced" && (
                    <Text style={styles.trainingLevelImpact}>Slower, more realistic progress predictions</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowTrainingLevelModal(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  profileImageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  editImageButton: {
    marginTop: 10,
  },
  editImageText: {
    color: "cyan",
    fontSize: 16,
  },
  infoSection: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  infoLabel: {
    color: "#aaa",
    fontSize: 16,
  },
  infoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginRight: 5,
  },
  actionsSection: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    marginLeft: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  formGroup: {
    marginBottom: 20,
    position: "relative",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 15,
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingRight: 40,
  },
  inputUnit: {
    position: "absolute",
    right: 15,
    top: 15,
    color: "#aaa",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "cyan",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  trainingLevelList: {
    maxHeight: 400,
  },
  trainingLevelItem: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  trainingLevelItemSelected: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  trainingLevelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  trainingLevelTitleText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  trainingLevelTitleSelected: {
    color: "cyan",
  },
  trainingLevelDescriptionText: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 8,
  },
  trainingLevelImpact: {
    color: "#0099ff",
    fontSize: 14,
    fontStyle: "italic",
  },
  closeModalButton: {
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default ProfileScreen

