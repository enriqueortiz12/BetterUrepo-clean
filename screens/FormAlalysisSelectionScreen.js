"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import GlassmorphicCard from "../components/GlassmorphicCard"
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from "expo-file-system"
import VideoPlayer from "../components/VideoPlayer"

const FormAnalysisSelectionScreen = ({ navigation }) => {
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [videoUri, setVideoUri] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState(null)

  const exercises = [
    {
      id: "squat",
      name: "Squat",
      icon: "barbell-outline",
      description: "Analyze your squat form for proper depth, knee tracking, and back position.",
    },
    {
      id: "deadlift",
      name: "Deadlift",
      icon: "barbell-outline",
      description: "Check your deadlift technique for hip hinge, back position, and bar path.",
    },
    {
      id: "bench",
      name: "Bench Press",
      icon: "barbell-outline",
      description: "Evaluate your bench press form for bar path, arch, and elbow position.",
    },
    {
      id: "clean",
      name: "Clean",
      icon: "barbell-outline",
      description: "Analyze your clean technique for pull, extension, and catch position.",
    },
  ]

  const getVideoFileSize = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri)
      return fileInfo.size ? (fileInfo.size / (1024 * 1024)).toFixed(2) + " MB" : "Unknown"
    } catch (error) {
      console.error("Error getting file size:", error)
      return "Unknown"
    }
  }

  const simulateUploadProgress = () => {
    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus({ type: "uploading", message: "Uploading video..." })

    // Simulate upload progress
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 0.1
      if (progress > 1) {
        progress = 1
        clearInterval(interval)

        // Simulate a small delay before completing
        setTimeout(() => {
          setIsUploading(false)
          setUploadStatus({ type: "success", message: "Video uploaded successfully!" })

          // Navigate to analysis screen after successful upload
          if (selectedExercise) {
            navigation.navigate("WorkoutAnalysis", {
              exercise: selectedExercise.id,
              videoUri: videoUri,
            })
          }
        }, 500)
      }
      setUploadProgress(progress)
    }, 200)
  }

  const pickVideo = async () => {
    if (!selectedExercise) {
      Alert.alert("Select Exercise", "Please select an exercise first")
      return
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      })

      if (!result.canceled) {
        const selectedUri = result.assets[0].uri
        setVideoUri(selectedUri)

        // Get file size for display
        const fileSize = await getVideoFileSize(selectedUri)

        // Show upload status and simulate upload
        setUploadStatus({
          type: "preparing",
          message: `Preparing ${selectedExercise.name} video (${fileSize})...`,
        })

        // Start simulated upload after a short delay
        setTimeout(() => {
          simulateUploadProgress()
        }, 500)
      }
    } catch (error) {
      console.error("Error picking video:", error)
      setUploadStatus({ type: "error", message: "Failed to pick video from library" })
      Alert.alert("Error", "Failed to pick video from library")
    }
  }

  const recordVideo = async () => {
    if (!selectedExercise) {
      Alert.alert("Select Exercise", "Please select an exercise first")
      return
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        videoMaxDuration: 30,
      })

      if (!result.canceled) {
        const selectedUri = result.assets[0].uri
        setVideoUri(selectedUri)

        // Get file size for display
        const fileSize = await getVideoFileSize(selectedUri)

        // Show upload status and simulate upload
        setUploadStatus({
          type: "preparing",
          message: `Preparing ${selectedExercise.name} video (${fileSize})...`,
        })

        // Start simulated upload after a short delay
        setTimeout(() => {
          simulateUploadProgress()
        }, 500)
      }
    } catch (error) {
      console.error("Error recording video:", error)
      setUploadStatus({ type: "error", message: "Failed to record video" })
      Alert.alert("Error", "Failed to record video")
    }
  }

  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise)
    // Reset video and upload status when changing exercises
    if (videoUri) {
      setVideoUri(null)
      setUploadStatus(null)
      setIsUploading(false)
    }
  }

  const handleContinue = () => {
    if (!selectedExercise) {
      Alert.alert("Select Exercise", "Please select an exercise first")
      return
    }

    if (!videoUri) {
      Alert.alert("Upload Video", "Please upload or record a video first")
      return
    }

    // If we're still uploading, wait
    if (isUploading) {
      Alert.alert("Please Wait", "Video is still uploading")
      return
    }

    navigation.navigate("WorkoutAnalysis", {
      exercise: selectedExercise.id,
      videoUri: videoUri,
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Form Analysis</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Select an exercise to analyze</Text>

        <View style={styles.exercisesContainer}>
          {exercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={[styles.exerciseCard, selectedExercise?.id === exercise.id && styles.selectedExerciseCard]}
              onPress={() => handleExerciseSelect(exercise)}
            >
              <View style={styles.exerciseIconContainer}>
                <Ionicons
                  name={exercise.icon}
                  size={24}
                  color={selectedExercise?.id === exercise.id ? "black" : "cyan"}
                />
              </View>
              <Text style={[styles.exerciseName, selectedExercise?.id === exercise.id && styles.selectedExerciseName]}>
                {exercise.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedExercise && (
          <GlassmorphicCard style={styles.selectedExerciseInfo}>
            <Text style={styles.selectedExerciseTitle}>{selectedExercise.name} Form Analysis</Text>
            <Text style={styles.selectedExerciseDescription}>{selectedExercise.description}</Text>

            <View style={styles.videoContainer}>
              <VideoPlayer
                uri={videoUri}
                style={styles.videoPlayer}
                uploadStatus={uploadStatus}
                uploadProgress={uploadProgress}
                isUploading={isUploading}
                onUploadStatusDismiss={() => setUploadStatus(null)}
              />
            </View>

            <View style={styles.videoButtonsContainer}>
              <TouchableOpacity style={styles.videoButton} onPress={recordVideo} disabled={isUploading}>
                <Ionicons name="videocam" size={20} color="black" />
                <Text style={styles.videoButtonText}>Record</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.videoButton} onPress={pickVideo} disabled={isUploading}>
                <Ionicons name="cloud-upload" size={20} color="black" />
                <Text style={styles.videoButtonText}>Upload</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.continueButton, (!videoUri || isUploading) && styles.disabledButton]}
              onPress={handleContinue}
              disabled={!videoUri || isUploading}
            >
              <Text style={styles.continueButtonText}>Continue to Analysis</Text>
              <Ionicons name="arrow-forward" size={20} color="black" />
            </TouchableOpacity>
          </GlassmorphicCard>
        )}

        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#aaa" />
          <Text style={styles.infoText}>
            Upload a video of your exercise form and our AI trainer will provide personalized feedback to help you
            improve.
          </Text>
        </View>
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    color: "white",
    fontSize: 18,
    marginBottom: 20,
  },
  exercisesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  exerciseCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedExerciseCard: {
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    borderColor: "cyan",
  },
  exerciseIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  exerciseName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  selectedExerciseName: {
    color: "black",
  },
  selectedExerciseInfo: {
    padding: 20,
    marginBottom: 20,
  },
  selectedExerciseTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  selectedExerciseDescription: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  videoContainer: {
    marginBottom: 15,
  },
  videoPlayer: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  videoButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  videoButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "cyan",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  videoButtonText: {
    color: "black",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: "cyan",
    borderRadius: 10,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: "rgba(0, 255, 255, 0.3)",
    opacity: 0.7,
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  infoText: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 10,
    flex: 1,
  },
})

export default FormAnalysisSelectionScreen

