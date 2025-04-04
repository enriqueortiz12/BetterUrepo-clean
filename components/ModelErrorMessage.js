import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const ModelErrorMessage = ({ error, onRetry = null, showTroubleshooting = true, style = {} }) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="alert-circle" size={40} color="#FF5252" />
      <Text style={styles.errorTitle}>AI Model Loading Error</Text>
      <Text style={styles.errorMessage}>{error || "Failed to load the AI analysis model"}</Text>

      {showTroubleshooting && (
        <View style={styles.troubleshootingContainer}>
          <Text style={styles.troubleshootingTitle}>Troubleshooting steps:</Text>
          <View style={styles.troubleshootingStep}>
            <Ionicons name="wifi" size={18} color="#aaa" />
            <Text style={styles.troubleshootingText}>Check your internet connection</Text>
          </View>
          <View style={styles.troubleshootingStep}>
            <Ionicons name="refresh-circle" size={18} color="#aaa" />
            <Text style={styles.troubleshootingText}>Restart the application</Text>
          </View>
          <View style={styles.troubleshootingStep}>
            <Ionicons name="phone-portrait" size={18} color="#aaa" />
            <Text style={styles.troubleshootingText}>Ensure your device has sufficient memory</Text>
          </View>
        </View>
      )}

      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.retryButtonText}>Retry Loading Model</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.fallbackMessage}>
        Don't worry! We'll still analyze your form using our basic analysis system.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 82, 82, 0.1)",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 82, 82, 0.3)",
    marginVertical: 15,
  },
  errorTitle: {
    color: "#FF5252",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  errorMessage: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 15,
  },
  troubleshootingContainer: {
    width: "100%",
    marginBottom: 15,
  },
  troubleshootingTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  troubleshootingStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  troubleshootingText: {
    color: "#aaa",
    fontSize: 14,
    marginLeft: 10,
  },
  retryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    marginLeft: 8,
  },
  fallbackMessage: {
    color: "#aaa",
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
})

export default ModelErrorMessage

