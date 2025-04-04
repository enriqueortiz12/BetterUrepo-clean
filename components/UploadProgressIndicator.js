"use client"

import { useEffect, useRef } from "react"
import { View, Text, StyleSheet, Animated } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const UploadProgressIndicator = ({
  status,
  progress = 0,
  isUploading = false,
  onDismiss = null,
  autoHideDuration = 3000,
  style = {},
}) => {
  // Use separate animated values for different properties
  const progressWidth = useRef(new Animated.Value(0)).current
  const fadeOpacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (isUploading) {
      // Animate width with JS driver (not native)
      Animated.timing(progressWidth, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false, // Can't use native driver for width
      }).start()
    }
  }, [progress, isUploading, progressWidth])

  useEffect(() => {
    if (status?.type === "success" && onDismiss && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        // Animate opacity with native driver
        Animated.timing(fadeOpacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true, // Can use native driver for opacity
        }).start(() => {
          if (onDismiss) onDismiss()
        })
      }, autoHideDuration)

      return () => clearTimeout(timer)
    }
  }, [status, onDismiss, autoHideDuration, fadeOpacity])

  let statusColor = "#aaa"
  let statusIcon = "information-circle"

  switch (status?.type) {
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

  if (!status) return null

  return (
    <Animated.View style={[styles.container, { opacity: fadeOpacity }, style]}>
      <Ionicons name={statusIcon} size={20} color={statusColor} />
      <Text style={[styles.statusText, { color: statusColor }]}>{status.message}</Text>

      {isUploading && (
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth.interpolate({
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

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  statusText: {
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
})

export default UploadProgressIndicator

