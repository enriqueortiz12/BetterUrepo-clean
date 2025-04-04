import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import GlassmorphicCard from "./GlassmorphicCard"

const FormAnalysisResults = ({ feedback, onReset, onTalkToTrainer }) => {
  if (!feedback) return null

  return (
    <View style={styles.container}>
      <GlassmorphicCard style={styles.scoreCard} color="rgba(0, 255, 255, 0.1)" borderColor="rgba(0, 255, 255, 0.3)">
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
        <TouchableOpacity style={styles.resetButton} onPress={onReset}>
          <Text style={styles.resetButtonText}>New Analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.trainerButton} onPress={onTalkToTrainer}>
          <Text style={styles.trainerButtonText}>Talk to AI Trainer</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
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

export default FormAnalysisResults

