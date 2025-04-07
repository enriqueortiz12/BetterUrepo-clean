"use client"

import { useState, useRef, useEffect } from "react"
import { Pressable, Animated, StyleSheet, Text, View, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const HoverButton = (props) => {
  // Destructure props with safe defaults
  const {
    onPress = () => {},
    style = {},
    textStyle = {},
    children = null,
    text = "",
    iconName = null,
    iconPosition = "left",
    iconSize = 20,
    iconColor = "white",
    disabled = false,
    activeOpacity = 0.7,
    hoverColor = undefined,
    pressColor = undefined,
    isLoading = false,
    loadingColor = "cyan",
    ...otherProps
  } = props || {}

  // Use React.useState instead of useState directly
  const [isPressed, setIsPressed] = useState(false)

  // Create animated value for opacity
  const animatedOpacity = useRef(new Animated.Value(1)).current
  const animatedScale = useRef(new Animated.Value(1)).current
  const isMounted = useRef(true)

  // Clean up animations when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const handlePressIn = () => {
    if (disabled) return

    setIsPressed(true)

    // Animate both opacity and scale
    Animated.parallel([
      Animated.timing(animatedOpacity, {
        toValue: activeOpacity,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedScale, {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const handlePressOut = () => {
    if (disabled) return

    setIsPressed(false)

    // Animate both opacity and scale back
    Animated.parallel([
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start()
  }

  // Handle press event with debounce to prevent double-clicks
  const handlePress = () => {
    if (disabled || !onPress || isLoading) return

    // Remove the delay on iOS for better responsiveness
    if (Platform.OS === "ios") {
      onPress()
    } else {
      // Keep a small delay on Android to prevent accidental double taps
      setTimeout(() => {
        if (isMounted.current) {
          onPress()
        }
      }, 10)
    }
  }

  // Determine background color based on state
  const getBackgroundStyle = () => {
    if (disabled) {
      return { opacity: 0.5 }
    }
    if (isPressed && pressColor) {
      return { backgroundColor: pressColor }
    }
    if (isPressed && hoverColor) {
      return { backgroundColor: hoverColor }
    }
    return {}
  }

  // Render content based on props
  const renderContent = () => {
    // If loading, show activity indicator
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingDot,
              {
                backgroundColor: loadingColor,
                opacity: animatedOpacity.interpolate({
                  inputRange: [0.7, 1],
                  outputRange: [0.4, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              {
                backgroundColor: loadingColor,
                opacity: animatedOpacity.interpolate({
                  inputRange: [0.7, 1],
                  outputRange: [0.7, 0.4],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              {
                backgroundColor: loadingColor,
                opacity: animatedOpacity.interpolate({
                  inputRange: [0.7, 1],
                  outputRange: [1, 0.7],
                }),
              },
            ]}
          />
        </View>
      )
    }

    // If children are provided, render them
    if (children) {
      return children
    }

    // Otherwise, render text and/or icon
    return (
      <View style={styles.content}>
        {iconName && iconPosition === "left" && (
          <Ionicons name={iconName} size={iconSize} color={iconColor} style={styles.leftIcon} />
        )}
        {text ? (
          <Text style={[styles.text, textStyle]} numberOfLines={1}>
            {text}
          </Text>
        ) : null}
        {iconName && iconPosition === "right" && (
          <Ionicons name={iconName} size={iconSize} color={iconColor} style={styles.rightIcon} />
        )}
      </View>
    )
  }

  // Fix for the CSS error: Create a new transform array instead of modifying an existing one
  const getAnimatedStyle = () => {
    return {
      opacity: animatedOpacity,
      transform: [{ scale: animatedScale }],
    }
  }

  // Return the Pressable component
  return (
    <Animated.View style={getAnimatedStyle()}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
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
        disabled={disabled || isLoading}
        {...otherProps}
      >
        {renderContent()}
      </Pressable>
    </Animated.View>
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
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  text: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
})

export default HoverButton

