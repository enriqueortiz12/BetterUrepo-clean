"use client"

import { useState, useRef, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from "react-native"
import { Video } from "expo-av"
import { Ionicons } from "@expo/vector-icons"
import UploadProgressIndicator from "./UploadProgressIndicator"

const VideoPlayer = ({
  uri,
  style,
  uploadStatus = null,
  uploadProgress = 0,
  isUploading = false,
  onUploadStatusDismiss = null,
}) => {
  const videoRef = useRef(null)
  const [status, setStatus] = useState({})
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    // Reset loading state when URI changes
    if (uri) {
      setIsLoading(true)
      setLoadError(null)
    }
  }, [uri])

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (status.isPlaying) {
        await videoRef.current.pauseAsync()
      } else {
        await videoRef.current.playAsync()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleReplay = async () => {
    if (videoRef.current) {
      await videoRef.current.replayAsync()
      setIsPlaying(true)
    }
  }

  const handleVideoLoad = (status) => {
    setIsLoading(false)
  }

  const handleVideoError = (error) => {
    setIsLoading(false)
    setLoadError(error)
  }

  return (
    <View style={[styles.container, style]}>
      {uri ? (
        <>
          <Video
            ref={videoRef}
            source={{ uri }}
            style={styles.video}
            useNativeControls={false}
            resizeMode="contain"
            isLooping={false}
            onPlaybackStatusUpdate={(status) => setStatus(() => status)}
            onLoad={handleVideoLoad}
            onError={handleVideoError}
          />

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="cyan" />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}

          {loadError && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={40} color="#FF5252" />
              <Text style={styles.errorText}>Failed to load video</Text>
            </View>
          )}

          {!isLoading && !loadError && (
            <>
              <View style={styles.controls}>
                <TouchableOpacity style={styles.controlButton} onPress={handleReplay}>
                  <Ionicons name="refresh" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
                  <Ionicons name={status.isPlaying ? "pause" : "play"} size={30} color="white" />
                </TouchableOpacity>

                <View style={styles.controlButton}>{/* Placeholder for symmetry */}</View>
              </View>

              {status.didJustFinish && (
                <View style={styles.finishedOverlay}>
                  <TouchableOpacity style={styles.replayButton} onPress={handleReplay}>
                    <Ionicons name="refresh" size={30} color="white" />
                    <Text style={styles.replayText}>Replay</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </>
      ) : (
        <View style={styles.placeholderContainer}>
          <Ionicons name="videocam" size={40} color="#555" />
          <Text style={styles.placeholderText}>No video selected</Text>
        </View>
      )}

      {/* Upload status indicator */}
      {(uploadStatus || isUploading) && (
        <UploadProgressIndicator
          status={uploadStatus}
          progress={uploadProgress}
          isUploading={isUploading}
          onDismiss={onUploadStatusDismiss}
          style={styles.uploadIndicator}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 200,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#000",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  finishedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  replayButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  replayText: {
    color: "white",
    marginTop: 5,
    fontSize: 16,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#FF5252",
    marginTop: 10,
    fontSize: 16,
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#555",
    marginTop: 10,
    fontSize: 16,
  },
  uploadIndicator: {
    position: "absolute",
    bottom: 60,
    left: 10,
    right: 10,
  },
})

export default VideoPlayer

