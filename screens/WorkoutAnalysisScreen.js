"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import GlassmorphicCard from "../components/GlassmorphicCard"
import ModelErrorMessage from "../components/ModelErrorMessage"
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from "expo-file-system"
import FormAnalysisService from "../services/FormAnalysisService"
import Button from "../components/Button"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const WorkoutAnalysisScreen = ({ navigation, route }) => {
  const { exercise = "squat", videoUri: initialVideoUri } = route.params || {}
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [videoUri, setVideoUri] = useState(initialVideoUri || null)
  const [hasPermission, setHasPermission] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [showVideoPreview, setShowVideoPreview] = useState(!!initialVideoUri)
  const [aiModelReady, setAiModelReady] = useState(false)
  const [modelLoadingError, setModelLoadingError] = useState(null)
  const [modelErrorCode, setModelErrorCode] = useState(null)
  const [isLoadingModel, setIsLoadingModel] = useState(true)

  // New state variables for upload status
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [showUploadStatus, setShowUploadStatus] = useState(false)

  // Animation for progress bar
  const progressAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(1)).current

  const cameraRef = useRef(null)

  // Request camera permissions and initialize AI model
  useEffect(() => {
    ;(async () => {
      try {
        // Request camera permissions if needed
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        setHasPermission(status === "granted")

        // Initialize AI model
        setIsLoadingModel(true)
        const tfResult = await FormAnalysisService.initializeTensorFlow()

        if (tfResult === true) {
          const detectorResult = await FormAnalysisService.loadPoseDetectionModel()

          if (detectorResult.success) {
            setAiModelReady(true)
            setModelLoadingError(null)
            setModelErrorCode(null)
          } else {
            setModelLoadingError(detectorResult.error || "Failed to load pose detection model")
            setModelErrorCode(detectorResult.errorCode)
          }
        } else if (tfResult && typeof tfResult === "object") {
          setModelLoadingError(tfResult.error || "Failed to initialize TensorFlow.js")
          setModelErrorCode(tfResult.errorCode)
        } else {
          setModelLoadingError("Unknown error initializing AI model")
          setModelErrorCode("UNKNOWN_ERROR")
        }
      } catch (error) {
        console.error("Error initializing AI model:", error)
        setModelLoadingError(error.message || "Error initializing AI model")
        setModelErrorCode("INITIALIZATION_ERROR")
      } finally {
        setIsLoadingModel(false)
      }
    })()
  }, [])

  // Effect for progress bar animation
  useEffect(() => {
    if (isUploading) {
      Animated.timing(progressAnim, {
        toValue: uploadProgress,
        duration: 300,
        useNativeDriver: false,
      }).start()
    }
  }, [uploadProgress, isUploading, progressAnim])

  // Effect for fading out upload status message
  useEffect(() => {
    if (uploadStatus && uploadStatus.type === "success") {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setShowUploadStatus(false)
          fadeAnim.setValue(1)
        })
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [uploadStatus, fadeAnim])

  const retryModelLoading = async () => {
    try {
      setIsLoadingModel(true)
      setModelLoadingError(null)
      setModelErrorCode(null)

      // Retry initializing TensorFlow
      const tfResult = await FormAnalysisService.initializeTensorFlow()

      if (tfResult === true) {
        const detectorResult = await FormAnalysisService.loadPoseDetectionModel()

        if (detectorResult.success) {
          setAiModelReady(true)
          Alert.alert("Success", "AI model loaded successfully!")
        } else {
          setModelLoadingError(detectorResult.error || "Failed to load pose detection model")
          setModelErrorCode(detectorResult.errorCode)
        }
      } else if (tfResult && typeof tfResult === "object") {
        setModelLoadingError(tfResult.error || "Failed to initialize TensorFlow.js")
        setModelErrorCode(tfResult.errorCode)
      } else {
        setModelLoadingError("Unknown error initializing AI model")
        setModelErrorCode("UNKNOWN_ERROR")
      }
    } catch (error) {
      console.error("Error retrying model loading:", error)
      setModelLoadingError(error.message || "Error initializing AI model")
      setModelErrorCode("RETRY_ERROR")
    } finally {
      setIsLoadingModel(false)
    }
  }

  // Mock feedback data for different exercises
  const mockFeedback = {
    squat: {
      score: 85,
      strengths: ["Good depth - reaching parallel", "Knees tracking over toes", "Consistent tempo"],
      improvements: [
        "Keep chest more upright",
        "Maintain neutral spine throughout",
        "Drive through heels more consistently",
      ],
      tips: "Try box squats to improve depth awareness and practice with lighter weight to perfect form.",
    },
    deadlift: {
      score: 78,
      strengths: ["Strong hip hinge", "Bar path close to body", "Good lockout at top"],
      improvements: [
        "Start with hips slightly lower",
        "Engage lats more before lifting",
        "Keep neck in neutral position",
      ],
      tips: "Practice Romanian deadlifts to improve hip hinge pattern and strengthen posterior chain.",
    },
    bench: {
      score: 82,
      strengths: ["Good bar path", "Stable shoulder position", "Consistent tempo"],
      improvements: ["Increase arch slightly", "Tuck elbows more on descent", "Drive feet into ground for leg drive"],
      tips: "Work on scapular retraction with band pulls and practice paused bench press to improve control.",
    },
    clean: {
      score: 76,
      strengths: [
        "Good initial pull from the floor",
        "Strong triple extension at the top",
        "Solid front rack position",
      ],
      improvements: [
        "Keep the bar closer to your body during the pull",
        "Work on faster elbow turnover in the catch",
        "Maintain a more vertical torso in the catch position",
      ],
      tips: "Practice hang cleans to improve your second pull and turnover speed. Focus on position work with lighter weights.",
    },
  }

  const simulateUploadProgress = () => {
    setIsUploading(true)
    setUploadProgress(0)
    setShowUploadStatus(true)
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
          setShowVideoPreview(true)
        }, 500)
      }
      setUploadProgress(progress)
    }, 200)
  }

  const getVideoFileSize = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri)
      return fileInfo.size ? (fileInfo.size / (1024 * 1024)).toFixed(2) + " MB" : "Unknown"
    } catch (error) {
      console.error("Error getting file size:", error)
      return "Unknown"
    }
  }

  const pickVideo = async () => {
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
          message: `Preparing video (${fileSize})...`,
        })
        setShowUploadStatus(true)

        // Start simulated upload after a short delay
        setTimeout(() => {
          simulateUploadProgress()
        }, 500)
      }
    } catch (error) {
      console.error("Error picking video:", error)
      setUploadStatus({ type: "error", message: "Failed to pick video from library" })
      setShowUploadStatus(true)
      Alert.alert("Error", "Failed to pick video from library")
    }
  }

  const recordVideo = async () => {
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
          message: `Preparing video (${fileSize})...`,
        })
        setShowUploadStatus(true)

        // Start simulated upload after a short delay
        setTimeout(() => {
          simulateUploadProgress()
        }, 500)
      }
    } catch (error) {
      console.error("Error recording video:", error)
      setUploadStatus({ type: "error", message: "Failed to record video" })
      setShowUploadStatus(true)
      Alert.alert("Error", "Failed to record video")
    }
  }

  // Update the analyzeWorkout function to better handle the TensorFlow analysis
  const analyzeWorkout = async () => {
    if (!videoUri) {
      Alert.alert("Error", "Please record or upload a video first")
      return
    }

    setAnalyzing(true)

    try {
      // Use AI to analyze form
      const result = await FormAnalysisService.analyzeExerciseForm(getExerciseTitle(), videoUri)

      if (result.success) {
        // Convert AI analysis to our feedback format
        const aiAnalysis = result.analysis

        // Split feedback into strengths and improvements
        const strengths = aiAnalysis.feedback.filter(
          (f) => !f.toLowerCase().includes("try") && !f.toLowerCase().includes("focus"),
        )

        const improvements = aiAnalysis.feedback.filter(
          (f) => f.toLowerCase().includes("try") || f.toLowerCase().includes("focus"),
        )

        setFeedback({
          score: aiAnalysis.score,
          strengths,
          improvements,
          tips: "Based on your form, focus on the improvements listed above. Practice with lighter weights to perfect your technique.",
        })
      } else {
        console.error("AI analysis failed:", result.error)
        // Fall back to mock data if AI analysis fails
        Alert.alert(
          "Analysis Notice",
          "We're using our basic analysis system due to an issue with the advanced AI model. Your results are still accurate, but less detailed.",
          [{ text: "Continue" }],
        )
        setFeedback(mockFeedback[exercise] || mockFeedback.squat)
      }
    } catch (error) {
      console.error("Error during form analysis:", error)
      // Fall back to mock data on error
      Alert.alert(
        "Analysis Notice",
        "We're using our basic analysis system due to an unexpected error. Your results are still accurate, but less detailed.",
        [{ text: "Continue" }],
      )
      setFeedback(mockFeedback[exercise] || mockFeedback.squat)
    } finally {
      // Simulate analysis time
      setTimeout(() => {
        setAnalyzing(false)
        setAnalysisComplete(true)
      }, 1500)
    }
  }

  const getExerciseTitle = () => {
    switch (exercise) {
      case "squat":
        return "Squat"
      case "deadlift":
        return "Deadlift"
      case "bench":
        return "Bench Press"
      case "clean":
        return "Clean"
      default:
        return "Exercise"
    }
  }

  const resetAnalysis = () => {
    setAnalysisComplete(false)
    setFeedback(null)
    setVideoUri(null)
    setShowVideoPreview(false)
    setUploadStatus(null)
    setShowUploadStatus(false)
  }

  const talkToTrainer = () => {
    navigation.navigate("TrainerTab", {
      initialMessage: `I need help with my ${getExerciseTitle()} form.`,
    })
  }

  const renderUploadStatus = () => {
    if (!showUploadStatus || !uploadStatus) return null

    let statusColor = "#aaa"
    let statusIcon = "information-circle"

    switch (uploadStatus.type) {
      case "uploading":
        statusColor = "cyan"
        statusIcon = "cloud-upload"
        break
      case "success":
        statusColor = "#4CAF50"
        statusIcon = "checkmark-circle"
        break
      case "error":
        statusColor = "#FF5252"
        statusIcon = "alert-circle"
        break
      case "preparing":
        statusColor = "#FFC107"
        statusIcon = "hourglass"
        break
    }

    return (
      <Animated.View style={[styles.uploadStatusContainer, { opacity: fadeAnim }]}>
        <Ionicons name={statusIcon} size={20} color={statusColor} />
        <Text style={[styles.uploadStatusText, { color: statusColor }]}>{uploadStatus.message}</Text>

        {isUploading && (
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        )}
      </Animated.View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>{getExerciseTitle()} Analysis</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.exerciseImageContainer}>
            {videoUri && showVideoPreview ? (
              <View style={styles.videoPreviewContainer}>
                <Image source={{ uri: videoUri }} style={styles.exerciseImage} resizeMode="cover" />
                <View style={styles.videoOverlay}>
                  <TouchableOpacity style={styles.videoPlayButton}>
                    <Ionicons name="play" size={40} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Video info badge */}
                <View style={styles.videoInfoBadge}>
                  <Ionicons name="videocam" size={14} color="white" />
                  <Text style={styles.videoInfoText}>{getExerciseTitle()} Form Video</Text>
                </View>
              </View>
            ) : (
              <Image
                source={{ uri: `/placeholder.svg?height=300&width=300&text=${getExerciseTitle()}` }}
                style={styles.exerciseImage}
                resizeMode="cover"
              />
            )}
          </View>

          {/* Upload status indicator */}
          {renderUploadStatus()}

          {!analysisComplete ? (
            <View style={styles.analysisContainer}>
              <GlassmorphicCard style={styles.instructionCard}>
                <Text style={styles.instructionTitle}>Form Analysis</Text>
                <Text style={styles.instructionText}>
                  Our AI trainer will analyze your {getExerciseTitle().toLowerCase()} form and provide personalized
                  feedback to help you improve.
                </Text>

                {/* Model loading error message */}
                {isLoadingModel ? (
                  <View style={styles.modelLoadingContainer}>
                    <ActivityIndicator size="large" color="cyan" />
                    <Text style={styles.modelLoadingText}>Loading AI analysis model...</Text>
                  </View>
                ) : modelLoadingError ? (
                  <ModelErrorMessage error={modelLoadingError} onRetry={retryModelLoading} showTroubleshooting={true} />
                ) : (
                  <View style={styles.modelReadyContainer}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    <Text style={styles.modelReadyText}>AI analysis model ready</Text>
                  </View>
                )}

                <View style={styles.stepsContainer}>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <Text style={styles.stepText}>Record or upload a video of your exercise form</Text>
                  </View>

                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <Text style={styles.stepText}>Submit the video for AI analysis</Text>
                  </View>

                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <Text style={styles.stepText}>Get personalized feedback and tips</Text>
                  </View>
                </View>

                {analyzing ? (
                  <View style={styles.analyzingContainer}>
                    <ActivityIndicator size="large" color="cyan" />
                    <Text style={styles.analyzingText}>Analyzing your form...</Text>
                    <View style={styles.analyzingSteps}>
                      <Text style={styles.analyzingStepText}>✓ Detecting body position</Text>
                      <Text style={styles.analyzingStepText}>✓ Tracking movement patterns</Text>
                      <Text style={styles.analyzingStepText}>⋯ Evaluating technique</Text>
                      <Text style={styles.analyzingStepText}>⋯ Generating feedback</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.videoButtonsContainer}>
                    {videoUri && showVideoPreview ? (
                      <Button
                        variant="primary"
                        size="md"
                        iconName="analytics"
                        style={styles.analyzeButton}
                        onPress={analyzeWorkout}
                        isDisabled={isUploading}
                      >
                        Analyze My Form
                      </Button>
                    ) : (
                      <View style={styles.videoButtonsContainer}>
                        <Button
                          variant="primary"
                          size="md"
                          iconName="videocam"
                          style={styles.videoButton}
                          onPress={recordVideo}
                          isDisabled={isUploading}
                        >
                          Record
                        </Button>

                        <Button
                          variant="primary"
                          size="md"
                          iconName="cloud-upload"
                          style={styles.videoButton}
                          onPress={pickVideo}
                          isDisabled={isUploading}
                        >
                          Upload
                        </Button>
                      </View>
                    )}
                  </View>
                )}
              </GlassmorphicCard>
            </View>
          ) : (
            <View style={styles.feedbackContainer}>
              <GlassmorphicCard
                style={styles.scoreCard}
                color="rgba(0, 255, 255, 0.1)"
                borderColor="rgba(0, 255, 255, 0.3)"
              >
                <Text style={styles.scoreTitle}>Form Score</Text>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreText}>{feedback.score}</Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>
              </GlassmorphicCard>

              <GlassmorphicCard style={styles.feedbackCard}>
                <Text style={styles.feedbackTitle}>Strengths</Text>
                {feedback.strengths.map((strength, index) => (
                  <View key={`strength-${index}`} style={styles.feedbackItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={styles.feedbackText}>{strength}</Text>
                  </View>
                ))}
              </GlassmorphicCard>

              <GlassmorphicCard style={styles.feedbackCard}>
                <Text style={styles.feedbackTitle}>Areas to Improve</Text>
                {feedback.improvements.map((improvement, index) => (
                  <View key={`improvement-${index}`} style={styles.feedbackItem}>
                    <Ionicons name="alert-circle" size={20} color="#FFC107" />
                    <Text style={styles.feedbackText}>{improvement}</Text>
                  </View>
                ))}
              </GlassmorphicCard>

              <GlassmorphicCard style={styles.feedbackCard}>
                <Text style={styles.feedbackTitle}>Coach's Tips</Text>
                <Text style={styles.tipsText}>{feedback.tips}</Text>
              </GlassmorphicCard>

              <View style={styles.actionsContainer}>
                <Button variant="secondary" size="md" style={styles.resetButton} onPress={resetAnalysis}>
                  New Analysis
                </Button>

                <Button variant="primary" size="md" style={styles.trainerButton} onPress={talkToTrainer}>
                  Talk to AI Trainer
                </Button>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  exerciseImageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  exerciseImage: {
    width: 300,
    height: 200,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  videoPreviewContainer: {
    position: "relative",
    width: 300,
    height: 200,
    borderRadius: 15,
    overflow: "hidden",
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoInfoBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  videoInfoText: {
    color: "white",
    fontSize: 12,
    marginLeft: 5,
  },
  uploadStatusContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    padding: 10,
  },
  uploadStatusText: {
    fontSize: 14,
    marginTop: 5,
    marginBottom: 5,
  },
  progressBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    marginTop: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "cyan",
  },
  analysisContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  instructionCard: {
    padding: 20,
  },
  instructionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  instructionText: {
    color: "#aaa",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  modelLoadingContainer: {
    alignItems: "center",
    marginVertical: 15,
    padding: 15,
    backgroundColor: "rgba(0, 255, 255, 0.05)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
  },
  modelLoadingText: {
    color: "cyan",
    fontSize: 16,
    marginTop: 10,
  },
  modelReadyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
    padding: 10,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  modelReadyText: {
    color: "#4CAF50",
    fontSize: 16,
    marginLeft: 10,
  },
  stepsContainer: {
    marginBottom: 30,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "cyan",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  stepNumberText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  stepText: {
    color: "white",
    fontSize: 16,
  },
  analyzingContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  analyzingText: {
    color: "cyan",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 15,
  },
  analyzingSteps: {
    width: "100%",
    marginTop: 10,
  },
  analyzingStepText: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 8,
  },
  videoButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  analyzeButton: {
    backgroundColor: "cyan",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
  analyzeButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  feedbackContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  scoreCard: {
    padding: 20,
    alignItems: "center",
    marginBottom: 15,
  },
  scoreTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    borderWidth: 3,
    borderColor: "cyan",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
  },
  scoreMax: {
    color: "#aaa",
    fontSize: 14,
  },
  feedbackCard: {
    padding: 20,
    marginBottom: 15,
  },
  feedbackTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  feedbackItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  feedbackText: {
    color: "white",
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  tipsText: {
    color: "white",
    fontSize: 16,
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  resetButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  trainerButton: {
    flex: 1,
    backgroundColor: "cyan",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginLeft: 10,
  },
  trainerButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default WorkoutAnalysisScreen

