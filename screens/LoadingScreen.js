"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from "react-native"
import Icon from "react-native-vector-icons/FontAwesome"

const { width, height } = Dimensions.get("window")

const LoadingScreen = ({ route, navigation, directNavigation }) => {
  // Extract params from route or from direct props
  const { nextScreen, nextScreenParams } = route?.params || {}

  const [loadingDots, setLoadingDots] = useState("")
  const [motivationalText, setMotivationalText] = useState("")
  const logoAnim = useState(new Animated.Value(1))[0]
  const glowAnim = useState(new Animated.Value(0.3))[0]
  const rotateAnim = useState(new Animated.Value(0))[0]
  const fadeAnim = useState(new Animated.Value(0))[0]
  const scaleAnim = useState(new Animated.Value(0.5))[0]
  const progressAnim = useState(new Animated.Value(0))[0]

  // Define the logo source directly
  const logoSource = require("../assets/fitnessLogo.png")

  // Fitness icons data
  const fitnessIcons = [
    { name: "heartbeat", color: "#E91E63" },
    { name: "bicycle", color: "#9C27B0" },
    { name: "running", color: "#673AB7" },
    { name: "dumbbell", color: "#3F51B5" },
    { name: "swimmer", color: "#2196F3" },
    { name: "walking", color: "#03A9F4" },
  ]

  // Animated values for icons
  const iconAnims = fitnessIcons.map(() => ({
    position: new Animated.ValueXY({ x: 0, y: 0 }),
    scale: new Animated.Value(0),
    opacity: new Animated.Value(0),
    rotation: new Animated.Value(0),
  }))

  // Navigate function that works with both direct and route navigation
  const navigateToNext = () => {
    if (directNavigation) {
      // Use the direct navigation function if provided
      directNavigation(nextScreen || "Main", nextScreenParams || {})
    } else if (navigation) {
      // Use the navigation prop if available
      if (nextScreen) {
        navigation.replace(nextScreen, nextScreenParams || {})
      } else {
        if (navigation.canGoBack()) {
          navigation.goBack()
        } else {
          navigation.replace("Main")
        }
      }
    } else {
      console.warn("No navigation method available")
    }
  }

  useEffect(() => {
    // Define motivationalPhrases inside the effect to avoid dependency issues
    const motivationalPhrases = [
      "Push yourself, because no one else is going to do it for you.",
      "Sometimes later becomes never. Do it now.",
      "Great things never come from comfort zones.",
      "Dream it. Wish it. Do it.",
      "Success doesn't just find you. You have to go out and get it.",
      "The harder you work for something, the greater you'll feel when you achieve it.",
      "Don't stop when you're tired. Stop when you're done.",
      "Wake up with determination. Go to bed with satisfaction.",
      "Do something today that your future self will thank you for.",
    ]

    // Randomly select a motivational phrase
    const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)]
    setMotivationalText(randomPhrase)

    // Logo animation - pulse with glow
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoAnim, {
            toValue: 1.05,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(logoAnim, {
            toValue: 0.95,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ]),
    ).start()

    // Rotate animation for logo elements
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start()

    // Fade in and scale up animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()

    // Progress bar animation - using layout animation instead of direct width manipulation
    // This avoids the issue with useNativeDriver and layout properties
    const progressAnimation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    })
    progressAnimation.start()

    // Animate fitness icons
    iconAnims.forEach((anim, index) => {
      // Random position within the screen
      const randomX = Math.random() * width * 0.8 - width * 0.4
      const randomY = Math.random() * height * 0.5 - height * 0.25

      // Animate each icon with delay
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(anim.position, {
            toValue: { x: randomX, y: randomY },
            useNativeDriver: true,
            friction: 6,
            tension: 40,
          }),
          Animated.timing(anim.scale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.out(Easing.back()),
          }),
          Animated.timing(anim.opacity, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(anim.rotation, {
              toValue: 1,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
              easing: Easing.linear,
            }),
          ),
        ]).start()
      }, index * 150)
    })

    // Loading text animation
    const dotsInterval = setInterval(() => {
      setLoadingDots((prev) => {
        if (prev.length >= 3) return ""
        return prev + "."
      })
    }, 500)

    // Navigate to the next screen after a delay
    const timer = setTimeout(() => {
      navigateToNext()
    }, 4000)

    return () => {
      clearTimeout(timer)
      clearInterval(dotsInterval)
    }
  }, [fadeAnim, glowAnim, iconAnims, logoAnim, progressAnim, rotateAnim, scaleAnim])

  return (
    <View style={styles.container}>
      <Animated.Image
        source={logoSource}
        style={[
          styles.logo,
          {
            transform: [
              { scale: scaleAnim },
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
            opacity: fadeAnim,
          },
        ]}
      />
      <Animated.View style={[styles.glow, { opacity: glowAnim }]} />
      <Text style={styles.motivationalText}>{motivationalText}</Text>
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
      <Text style={styles.loadingText}>
        Loading
        <Text style={styles.dots}>{loadingDots}</Text>
      </Text>

      {/* Render animated fitness icons */}
      {fitnessIcons.map((icon, index) => (
        <Animated.View
          key={index}
          style={[
            styles.iconContainer,
            {
              transform: [
                { translateX: iconAnims[index].position.x },
                { translateY: iconAnims[index].position.y },
                { scale: iconAnims[index].scale },
                {
                  rotate: iconAnims[index].rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
              opacity: iconAnims[index].opacity,
            },
          ]}
        >
          <Icon name={icon.name} size={24} color={icon.color} />
        </Animated.View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 20,
  },
  glow: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#BB86FC",
    opacity: 0.3,
    zIndex: -1,
  },
  motivationalText: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 30,
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  progressBarContainer: {
    width: "80%",
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#BB86FC",
    width: "0%",
  },
  loadingText: {
    fontSize: 20,
    color: "#fff",
  },
  dots: {
    fontWeight: "bold",
  },
  iconContainer: {
    position: "absolute",
    top: 0,
    left: 0,
  },
})

export default LoadingScreen

