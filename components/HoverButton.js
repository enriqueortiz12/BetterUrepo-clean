"use client"

import { useState, useRef, useEffect } from "react"
import { Pressable, Animated, StyleSheet, Text, View, Platform } from "react-native"

const HoverButton = ({
  onPress,
  style,
  textStyle,
  children,
  text,
  icon,
  disabled = false,
  activeOpacity = 0.7,
  hoverColor,
  pressColor,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false)
  // We'll only use this for web, not for native platforms
  const animatedOpacity = useRef(new Animated.Value(1)).current
  const isMounted = useRef(true)

  // Clean up animations when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const handlePressIn = () => {
    setIsPressed(true)

    // Only animate on web to avoid native driver issues
    if (Platform.OS === "web") {
      Animated.timing(animatedOpacity, {
        toValue: activeOpacity,
        duration: 100,
        useNativeDriver: false, // Don't use native driver on web
      }).start()
    }
  }

  const handlePressOut = () => {
    setIsPressed(false)

    // Only animate on web to avoid native driver issues
    if (Platform.OS === "web") {
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false, // Don't use native driver on web
      }).start()
    }
  }

  // Handle press event with debounce to prevent double-clicks
  const handlePress = () => {
    if (disabled || !onPress) return

    // Add a small delay to prevent accidental double taps
    setTimeout(() => {
      if (isMounted.current) {
        onPress()
      }
    }, 10)
  }

  // Determine background color based on state
  const getBackgroundStyle = () => {
    if (disabled) {
      return { opacity: 0.5 }
    }
    if (isPressed && pressColor) {
      return { backgroundColor: pressColor }
    }
    if (isPressed && !pressColor) {
      return { opacity: activeOpacity }
    }
    return {}
  }

  return (
    <Pressable
      onPress={disabled ? null : handlePress}
      onPressIn={disabled ? null : handlePressIn}
      onPressOut={disabled ? null : handlePressOut}
      style={({ pressed }) => [
        styles.button,
        style,
        getBackgroundStyle(),
        Platform.OS === "ios" && {
          // Add slight shadow for better visibility on iOS
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 1,
        },
      ]}
      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }} // Increase touch target
      {...props}
    >
      <View style={styles.content}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        {text && (
          <Text style={[styles.text, textStyle]} numberOfLines={1}>
            {text}
          </Text>
        )}
        {children}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
})

export default HoverButton

