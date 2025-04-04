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

const { width } = Dimensions.get("window")

const TrainerScreen = ({ navigation, route }) => {
  const { conversations, sendMessage, isLoading, apiKeySet } = useTrainer()
  const { userProfile } = useUser()
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const flatListRef = useRef(null)
  const inputRef = useRef(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current
  const glowAnim = useRef(new Animated.Value(0)).current

  // Check for initial message from navigation params
  useEffect(() => {
    if (route.params?.initialMessage) {
      setMessage(route.params.initialMessage)
      // Clear the param to prevent reuse on screen revisit
      navigation.setParams({ initialMessage: undefined })
    }
  }, [route.params, navigation])

  // Animate the trainer avatar when the screen loads
  useEffect(() => {
    // Create separate animated values for native-driven and JS-driven animations
    const fadeAnimValue = new Animated.Value(0)
    const scaleAnimValue = new Animated.Value(0.95)
    const glowAnimValue = new Animated.Value(0)

    // Set the refs to the new values
    fadeAnim.current = fadeAnimValue
    scaleAnim.current = scaleAnimValue
    glowAnim.current = glowAnimValue

    // Native-driven animations (opacity, transform)
    Animated.parallel([
      Animated.timing(fadeAnimValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()

    // JS-driven animations (colors, shadows)
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimValue, {
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
  }, [])

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

  // Interpolate shadow opacity only if not on iOS
  const shadowOpacity =
    Platform && Platform.OS === "ios"
      ? 0.5 // Fixed value for iOS
      : glowAnim.current.interpolate({
          inputRange: [0, 1],
          outputRange: [0.2, 0.8],
        })

  return (
    <SafeAreaView style={styles.container}>
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
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View style={styles.trainerInfoContainer}>
            <Animated.View
              style={[
                styles.trainerAvatarLarge,
                // Native-driven properties
                {
                  opacity: fadeAnim.current,
                  transform: [{ scale: scaleAnim.current }],
                },
                // JS-driven properties
                {
                  shadowOpacity: shadowOpacity,
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
              <Text style={styles.emptySubtext}>Ask me about workouts, form, nutrition, or motivation!</Text>
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
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "transparent", // Changed from black to transparent
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
    width: 66,
    height: 66,
  },
  trainerInfo: {
    flex: 1,
  },
  trainerName: {
    color: "white",
    fontSize: 20,
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
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 15,
    maxWidth: "80%",
  },
  trainerMessageContainer: {
    alignSelf: "flex-start",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  trainerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent", // Changed from black to transparent
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    alignSelf: "flex-end",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 153, 255, 0.3)",
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 16,
    marginBottom: 5,
  },
  trainerMessageText: {
    color: "white",
  },
  userMessageText: {
    color: "white",
  },
  timestamp: {
    fontSize: 12,
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
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
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
    backgroundColor: "rgba(20, 20, 20, 0.9)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "white",
    maxHeight: 100,
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

