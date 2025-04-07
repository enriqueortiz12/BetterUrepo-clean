"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Animated,
  Dimensions,
  ScrollView,
  Easing,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTrainer } from "../context/TrainerContext"
import { useUser } from "../context/UserContext"
import Button from "../components/Button"
import { LogoImage } from "../utils/imageUtils"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const TrainerScreen = ({ navigation, route }) => {
  const { conversations, sendMessage, clearConversations, isLoading, apiKeySet } = useTrainer()
  const { userProfile } = useUser()
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const flatListRef = useRef(null)
  const inputRef = useRef(null)

  const [messagesSentToday, setMessagesSentToday] = useState(0)
  const [lastMessageDate, setLastMessageDate] = useState(null)
  const [isLimitReached, setIsLimitReached] = useState(false)
  const MESSAGE_LIMIT = 20

  // Use state for animated values instead of refs
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.95))
  const [glowAnim] = useState(new Animated.Value(0.3))
  const [typingDots] = useState([new Animated.Value(0.4), new Animated.Value(0.7), new Animated.Value(1)])

  const [syncStatus, setSyncStatus] = useState(null)

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

  // Load and check daily message count
  useEffect(() => {
    const loadMessageCount = async () => {
      try {
        const storedData = await AsyncStorage.getItem("trainerMessageCount")
        if (storedData) {
          const { count, date } = JSON.parse(storedData)
          const storedDate = new Date(date)
          const today = new Date()

          // Check if the stored date is from today
          if (storedDate.toDateString() === today.toDateString()) {
            setMessagesSentToday(count)
            setLastMessageDate(date)
            setIsLimitReached(count >= MESSAGE_LIMIT)
          } else {
            // Reset counter for a new day
            setMessagesSentToday(0)
            setLastMessageDate(today.toISOString())
            setIsLimitReached(false)
            await AsyncStorage.setItem(
              "trainerMessageCount",
              JSON.stringify({
                count: 0,
                date: today.toISOString(),
              }),
            )
          }
        } else {
          // Initialize counter if it doesn't exist
          const today = new Date()
          setLastMessageDate(today.toISOString())
          await AsyncStorage.setItem(
            "trainerMessageCount",
            JSON.stringify({
              count: 0,
              date: today.toISOString(),
            }),
          )
        }
      } catch (error) {
        console.error("Error loading message count:", error)
      }
    }

    loadMessageCount()
  }, [])

  const handleSendMessage = async () => {
    if (!message.trim()) return

    // Check if daily limit is reached
    if (messagesSentToday >= MESSAGE_LIMIT) {
      Alert.alert("Daily Limit Reached", "You've reached your limit of 20 messages for today. Try again tomorrow!")
      return
    }

    Keyboard.dismiss()
    const currentMessage = message
    setMessage("")
    setIsTyping(true)

    try {
      // Update message count
      const newCount = messagesSentToday + 1
      setMessagesSentToday(newCount)
      setIsLimitReached(newCount >= MESSAGE_LIMIT)

      // Save updated count to AsyncStorage
      const today = new Date()
      await AsyncStorage.setItem(
        "trainerMessageCount",
        JSON.stringify({
          count: newCount,
          date: today.toISOString(),
        }),
      )

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
    <Button variant="secondary" size="sm" style={styles.suggestionButton} onPress={() => handleSuggestionTap(text)}>
      {text}
    </Button>
  )

  const renderMessage = ({ item }) => {
    const isTrainer = item.sender === "trainer"

    return (
      <View style={[styles.messageContainer, isTrainer ? styles.trainerMessageContainer : styles.userMessageContainer]}>
        {isTrainer && (
          <View style={styles.trainerAvatar}>
            <LogoImage style={styles.avatarImage} size={36} />
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
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                Alert.alert(
                  "Clear Chat History",
                  "Are you sure you want to clear all chat history? This cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Clear",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          setSyncStatus("Clearing chat history...")
                          const result = await clearConversations()
                          if (result.success) {
                            setSyncStatus("Chat history cleared successfully")
                            setTimeout(() => setSyncStatus(null), 3000)
                          } else {
                            setSyncStatus("Error clearing chat history")
                            setTimeout(() => setSyncStatus(null), 3000)
                          }
                        } catch (error) {
                          console.error("Error clearing chat history:", error)
                          setSyncStatus("Error clearing chat history")
                          setTimeout(() => setSyncStatus(null), 3000)
                        }
                      },
                    },
                  ],
                )
              }}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
            </TouchableOpacity>
            <View style={styles.messageCounter}>
              <Text
                style={[styles.messageCountText, messagesSentToday >= MESSAGE_LIMIT ? styles.limitReachedText : null]}
              >
                {messagesSentToday}/{MESSAGE_LIMIT}
              </Text>
            </View>
          </View>
        </View>

        {syncStatus && (
          <View style={styles.syncStatusContainer}>
            <Text style={styles.syncStatusText}>{syncStatus}</Text>
          </View>
        )}

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
                    shadowOpacity: 0.5,
                  },
                ]}
              >
                <LogoImage style={styles.avatarLargeImage} size={60} />
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

            {messagesSentToday >= MESSAGE_LIMIT * 0.8 && messagesSentToday < MESSAGE_LIMIT && (
              <View style={styles.limitWarningContainer}>
                <Ionicons name="warning-outline" size={16} color="#FFC107" />
                <Text style={styles.limitWarningText}>
                  {MESSAGE_LIMIT - messagesSentToday} messages remaining today
                </Text>
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
                style={[styles.input, isLimitReached && styles.disabledInput]}
                placeholder={isLimitReached ? "Message limit reached for today" : "Ask your AI trainer..."}
                placeholderTextColor={isLimitReached ? "#555" : "#666"}
                value={message}
                onChangeText={setMessage}
                multiline
                editable={!isLimitReached}
              />
              <Button
                variant={message.trim() && !isLimitReached ? "primary" : "secondary"}
                size="sm"
                iconName="send"
                style={styles.sendButton}
                onPress={handleSendMessage}
                isDisabled={!message.trim() || isLimitReached}
              />
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "black",
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
    // No additional styling needed as LogoImage component handles the circular shape
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    alignSelf: "flex-end",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 153, 255, 0.3)",
  },
  avatarImage: {
    // No additional styling needed as LogoImage component handles the circular shape
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
  messageCounter: {
    backgroundColor: "rgba(0, 153, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 153, 255, 0.3)",
  },
  messageCountText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  limitReachedText: {
    color: "#FF5252",
  },
  limitWarningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 193, 7, 0.3)",
  },
  limitWarningText: {
    color: "#FFC107",
    fontSize: 13,
    marginLeft: 6,
  },
  disabledInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    color: "#555",
  },
  syncStatusContainer: {
    backgroundColor: "rgba(0, 153, 255, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 153, 255, 0.3)",
  },
  syncStatusText: {
    color: "#0099ff",
    textAlign: "center",
    fontSize: 14,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 59, 48, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.3)",
  },
})

export default TrainerScreen

