"use client"

import { View, Text, StyleSheet, Image } from "react-native"
import { useState } from "react"

const BetterULogo = ({ size = 100, color = "#00FFFF", style = {} }) => {
  const [imageError, setImageError] = useState(false)

  // Calculate text size based on container size
  const textSize = size * 0.16

  // If using the fallback logo
  if (imageError) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        {/* Circle border */}
        <View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              backgroundColor: color,
            },
          ]}
        />

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={[styles.text, { fontSize: textSize, color: "#000" }]}>Better</Text>
          <Text style={[styles.text, { fontSize: textSize, color: "#000" }]}>U</Text>
        </View>
      </View>
    )
  }

  // Using the image logo
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={require("../assets/fitnessLogo.jpg")}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        onError={() => setImageError(true)}
        accessibilityLabel="BetterU Logo"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderRadius: 1000, // Large value to ensure circle
    overflow: "hidden",
  },
  circle: {
    borderRadius: 1000, // Large value to ensure circle
    position: "absolute",
  },
  textContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 22,
  },
})

export default BetterULogo

