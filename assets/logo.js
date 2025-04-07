import { View, Text, StyleSheet } from "react-native"

export const LogoFallback = ({ size = 100, color = "#00FFFF", style = {} }) => {
  // Scale text size based on container size
  const betterTextSize = size * 0.14 // Smaller to ensure it fits
  const uTextSize = size * 0.14
  const strokeWidth = size * 0.04

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Circle border */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderColor: color,
            borderWidth: strokeWidth,
          },
        ]}
      />

      {/* Heartbeat line */}
      <View
        style={[
          styles.heartbeatLine,
          {
            height: strokeWidth,
            width: size * 0.6,
            backgroundColor: color,
            top: size * 0.5 - strokeWidth / 2,
          },
        ]}
      >
        {/* Middle peak of heartbeat */}
        <View
          style={[
            styles.heartbeatPeak,
            {
              borderColor: color,
              borderWidth: strokeWidth,
              height: size * 0.3,
              width: size * 0.2,
              left: size * 0.2,
            },
          ]}
        />
      </View>

      {/* Text */}
      <View style={styles.textContainer}>
        <Text style={[styles.text, { color, fontSize: betterTextSize, marginBottom: -2 }]}>Better</Text>
        <Text style={[styles.text, { color, fontSize: uTextSize }]}>U</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  circle: {
    borderRadius: 1000, // Large value to ensure circle
    position: "absolute",
  },
  heartbeatLine: {
    position: "absolute",
  },
  heartbeatPeak: {
    position: "absolute",
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    height: 30,
    transform: [{ translateY: -15 }],
  },
  textContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 5, // Add slight padding to center text better
  },
  text: {
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
})

