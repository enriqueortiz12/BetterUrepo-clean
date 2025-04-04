import { View, StyleSheet, Platform } from "react-native"

const GlassmorphicCard = ({
  children,
  style,
  color = "rgba(255, 255, 255, 0.05)",
  borderColor = "rgba(255, 255, 255, 0.1)",
  intensity = 0.05,
  radius = 15,
}) => {
  // Calculate the background color based on intensity
  const backgroundColor = color || `rgba(255, 255, 255, ${intensity})`
  const border = borderColor || `rgba(255, 255, 255, ${intensity * 2})`

  // Add a check for width in the style prop
  const containerStyle = {
    borderRadius: 15,
    overflow: "hidden",
    width: "100%", // Ensure cards take full width
    ...style,
  }

  // Update the inner content style
  const innerContentStyle = {
    backgroundColor: "transparent",
    padding: 15,
    width: "100%",
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: border,
          borderRadius: radius,
        },
        // Add iOS-specific styles
        Platform && Platform.OS === "ios" && styles.iosCard,
      ]}
    >
      <View style={innerContentStyle}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  // iOS-specific styles to ensure proper rendering
  iosCard: {
    // Ensure content is properly contained
    overflow: "hidden",
    // Improve shadow appearance on iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
})

export default GlassmorphicCard

