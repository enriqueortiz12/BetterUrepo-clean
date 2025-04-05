"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  Easing,
  SafeAreaView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTrainer } from "../context/TrainerContext"
import { useUser } from "../context/UserContext"

const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const TrainerScreen = ({ navigation, route }) => {
  const { conversations, sendMessage, isLoading, apiKeySet } = useTrainer()
  const { userProfile } = useUser()
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const flatListRef = useRef(null)
  const inputRef = useRef(null)

  // Use state for animated values instead of refs
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.95))
  const [glowAnim] = useState(new Animated.Value(0.3))
  const [typingDots] = useState([new Animated.Value(0.4), new Animated.Value(0.7), new Animated.Value(1)])

  // Check if API key is properly set
  useEffect(() => {
    if (!apiKeySet) {
      console.log("API key not set or invalid. Using fallback responses.")
    }
  }, [apiKeySet])

  // Check for initial message from navigation params
  useEffect(() => {
    if (route.params?.initialMessage) {
      setMessage(route.params.initialMessage)
      // Focus the input after setting the message
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
      // Clear the param to prevent reuse on screen revisit
      navigation.setParams({ initialMessage: undefined })
    }
  }, [route.params, navigation])

  // Animate the trainer avatar when the screen loads
  useEffect(() => {
    // Native-driven animations (opacity, transform)
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

    // JS-driven animations (colors, shadows)
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    )

    glowAnimation.start()

    return () => {
      glowAnimation.stop()
    }
  }, [fadeAnim, scaleAnim, glowAnim])

  // Animate typing dots
  useEffect(() => {
    if (isTyping) {
      const animations = typingDots.map((dot, i) => {
        return Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            delay: i * 150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.4,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      })

      const dotsAnimation = Animated.loop(Animated.stagger(150, animations))
      dotsAnimation.start()

      return () => {
        dotsAnimation.stop()
      }
    }
  }, [isTyping, typingDots])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversations && conversations.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [conversations])

  const handleSendMessage = async () => {
    if (!message.trim()) return

    Keyboard.dismiss()
    const currentMessage = message
    setMessage("")
    setIsTyping(true)

    try {
      await sendMessage(currentMessage)
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleSuggestionTap = (text) => {
    if (text === "How's my form?") {
      navigation.navigate("FormAnalysisSelection")
    } else {
      setMessage(text)
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const renderSuggestion = (text) => (
    <TouchableOpacity style={styles.suggestionButton} onPress={() => handleSuggestionTap(text)}>
      <Text style={styles.suggestionText}>{text}</Text>
    </TouchableOpacity>
  )

  const renderMessage = ({ item }) => {
    const isTrainer = item.sender === "trainer"

    return (
      <View style={[styles.messageContainer, isTrainer ? styles.trainerMessageContainer : styles.userMessageContainer]}>
        {isTrainer && (
          <View style={styles.trainerAvatar}>
            <Image source={require("../assets/logo.png")} style={styles.avatarImage} resizeMode="contain" />
          </View>
        )}

        <View style={[styles.messageBubble, isTrainer ? styles.trainerBubble : styles.userBubble]}>
          <Text style={[styles.messageText, isTrainer ? styles.trainerMessageText : styles.userMessageText]}>
            {item.message}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>

        {!isTrainer && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color="black" />
          </View>
        )}
      </View>
    )
  }

  const getGreeting = () => {
    const firstName = userProfile?.name ? userProfile.name.split(" ")[0] : "there"
    return `Hey ${firstName}! I'm your AI personal trainer. How can I help you today?`
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Trainer</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="options-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0099ff" />
            <Text style={styles.loadingText}>Loading your trainer...</Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 20}
          >
            <View style={styles.trainerInfoContainer}>
              <Animated.View
                style={[
                  styles.trainerAvatarLarge,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                    shadowOpacity: 0.5, // Use a fixed value instead of interpolate
                  },
                ]}
              >
                <Image source={require("../assets/logo.png")} style={styles.avatarLargeImage} resizeMode="contain" />
              </Animated.View>
              <View style={styles.trainerInfo}>
                <Text style={styles.trainerName}>BetterU AI Trainer</Text>
                <Text style={styles.trainerStatus}>{apiKeySet ? "Online - GPT Powered" : "Online - Basic Mode"}</Text>
              </View>
            </View>

            {!conversations || conversations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{getGreeting()}</Text>
                <Text style={styles.emptySubtext}>
                  {apiKeySet
                    ? "Ask me about workouts, form, nutrition, or motivation!"
                    : "API key not configured. I'll provide basic responses until an API key is added."}
                </Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={conversations}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesContainer}
                showsVerticalScrollIndicator={false}
              />
            )}

            {isTyping && (
              <View style={styles.typingContainer}>
                <View style={styles.typingBubble}>
                  <Text style={styles.typingText}>AI Trainer is typing</Text>
                  <View style={styles.typingDots}>
                    {typingDots.map((dot, index) => (
                      <Animated.View
                        key={index}
                        style={[
                          styles.typingDot,
                          {
                            opacity: dot,
                            transform: [
                              {
                                scale: dot.interpolate({
                                  inputRange: [0.4, 1],
                                  outputRange: [0.8, 1.2],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>
            )}

            <View style={styles.suggestionsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsScrollView}
              >
                {renderSuggestion("Suggest a workout for me")}
                {renderSuggestion("How's my form?")}
                {renderSuggestion("Need some motivation")}
                {renderSuggestion("Nutrition tips")}
                {renderSuggestion("Track my progress")}
              </ScrollView>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Ask your AI trainer..."
                placeholderTextColor="#666"
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!message.trim()}
              >
                <Ionicons name="send" size={20} color={message.trim() ? "black" : "#666"} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "black",
    paddingTop: Platform.OS === "ios" ? (isIphoneX ? 0 : 0) : 0, // Adjusted for iOS
  },
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 153, 255, 0.1)",
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  trainerInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  trainerAvatarLarge: {
    width: 60, // Reduced from 70
    height: 60, // Reduced from 70
    borderRadius: 30,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(0, 153, 255, 0.5)",
    shadowColor: "#0099ff",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 10,
  },
  avatarLargeImage: {
    width: 56, // Reduced from 66
    height: 56, // Reduced from 66
  },
  trainerInfo: {
    flex: 1,
  },
  trainerName: {
    color: "white",
    fontSize: 18, // Reduced from 20
    fontWeight: "bold",
    marginBottom: 5,
  },
  trainerStatus: {
    color: "#4CAF50",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  emptySubtext: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
  },
  messagesContainer: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 15,
    paddingBottom: 30, // Added extra padding at bottom
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 15,
    maxWidth: Platform.OS === "ios" ? "85%" : "80%", // Wider on iOS
  },
  trainerMessageContainer: {
    alignSelf: "flex-start",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  trainerAvatar: {
    width: 36, // Reduced from 40
    height: 36, // Reduced from 40
    borderRadius: 18,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    alignSelf: "flex-end",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 153, 255, 0.3)",
  },
  avatarImage: {
    width: 36, // Reduced from 40
    height: 36, // Reduced from 40
  },
  userAvatar: {
    width: 32, // Reduced from 36
    height: 32, // Reduced from 36
    borderRadius: 16,
    backgroundColor: "#0099ff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    alignSelf: "flex-end",
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxWidth: "90%",
  },
  trainerBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  userBubble: {
    backgroundColor: "rgba(0, 153, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(0, 153, 255, 0.3)",
  },
  messageText: {
    fontSize: Platform.OS === "ios" ? 15 : 16, // Smaller on iOS
    marginBottom: 5,
  },
  trainerMessageText: {
    color: "white",
  },
  userMessageText: {
    color: "white",
  },
  timestamp: {
    fontSize: 10, // Reduced from 12
    color: "#aaa",
    alignSelf: "flex-end",
  },
  typingContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignSelf: "flex-start",
    maxWidth: "60%",
  },
  typingText: {
    color: "#aaa",
    fontSize: 14,
    marginRight: 10,
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#aaa",
    marginHorizontal: 2,
  },
  suggestionsContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  suggestionsScrollView: {
    paddingHorizontal: 15,
  },
  suggestionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  suggestionText: {
    color: "white",
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(20, 20, 20, 0.95)",
    paddingBottom: Platform.OS === "ios" ? (isIphoneX ? 40 : 20) : 15, // Increased padding for iOS
    position: "relative",
    zIndex: 1000, // Ensure it's above the tab bar
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 8 : 10, // Smaller on iOS
    color: "white",
    maxHeight: 100,
    minHeight: Platform.OS === "ios" ? 36 : 40, // Smaller on iOS
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0099ff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
})

export default TrainerScreen

