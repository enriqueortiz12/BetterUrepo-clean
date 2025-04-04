"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { useUser } from "../context/UserContext"

const fitnessGoals = [
  { id: "lose_weight", title: "Lose Weight" },
  { id: "gain_muscle", title: "Gain Muscle" },
  { id: "improve_fitness", title: "Improve Fitness" },
  { id: "maintain_weight", title: "Maintain Weight" },
]

// Add training levels array
const trainingLevels = [
  { id: "beginner", title: "Beginner", description: "New to fitness or returning after a long break" },
  { id: "intermediate", title: "Intermediate", description: "Consistent training for 6+ months" },
  { id: "advanced", title: "Advanced", description: "Dedicated training for 2+ years" },
]

const ProfileScreen = ({ navigation }) => {
  const { signOut, user } = useAuth()
  const { userProfile, updateProfile } = useUser()
  const [modalVisible, setModalVisible] = useState(false)
  const [editField, setEditField] = useState("")
  const [inputValue, setInputValue] = useState("")
  const [inputUnit, setInputUnit] = useState("")
  const [showTrainingLevelModal, setShowTrainingLevelModal] = useState(false) // Add state for training level modal

  // Add function to handle training level selection
  const handleTrainingLevelSelect = async (level) => {
    const result = await updateProfile({ trainingLevel: level })

    if (result.success) {
      setShowTrainingLevelModal(false)
    } else {
      Alert.alert("Error", "Failed to update training level. Please try again.")
    }
  }

  // Get the title of the selected training level
  const getTrainingLevelTitle = () => {
    const level = trainingLevels.find((level) => level.id === userProfile.trainingLevel)
    return level ? level.title : "Not set"
  }

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

    let updateData = {}

    switch (editField) {
      case "name":
        updateData = { name: inputValue }
        break
      case "age":
        updateData = { age: inputValue }
        break
      case "weight":
        updateData = { weight: inputValue }
        break
      case "height":
        updateData = { height: inputValue }
        break
    }

    const result = await updateProfile(updateData)

    if (result.success) {
      setModalVisible(false)
    } else {
      Alert.alert("Error", "Failed to update profile. Please try again.")
    }
  }

  const getGoalName = () => {
    if (!userProfile.goal) return "Not set"

    const goal = fitnessGoals.find((g) => g.id === userProfile.goal)
    return goal ? goal.title : "Not set"
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
          <TouchableOpacity style={styles.infoRow} onPress={() => handleEditField("name", userProfile.name)}>
            <Text style={styles.infoLabel}>Name</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{userProfile.name || "Not set"}</Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoRow} onPress={() => handleEditField("age", userProfile.age)}>
            <Text style={styles.infoLabel}>Age</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{userProfile.age || "Not set"}</Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoRow} onPress={() => handleEditField("weight", userProfile.weight, "lbs")}>
            <Text style={styles.infoLabel}>Weight</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{userProfile.weight ? `${userProfile.weight} lbs` : "Not set"}</Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoRow} onPress={() => handleEditField("height", userProfile.height, "in")}>
            <Text style={styles.infoLabel}>Height</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{userProfile.height ? `${userProfile.height} in` : "Not set"}</Text>
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
            <Text style={styles.infoValue}>{user?.email || "Not available"}</Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={signOut}>
            <Ionicons name="log-out-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
                    userProfile.trainingLevel === level.id && styles.trainingLevelItemSelected,
                  ]}
                  onPress={() => handleTrainingLevelSelect(level.id)}
                >
                  <View style={styles.trainingLevelHeader}>
                    <Text
                      style={[
                        styles.trainingLevelTitleText,
                        userProfile.trainingLevel === level.id && styles.trainingLevelTitleSelected,
                      ]}
                    >
                      {level.title}
                    </Text>
                    {userProfile.trainingLevel === level.id && (
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

