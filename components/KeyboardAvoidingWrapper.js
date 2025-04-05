import {
    KeyboardAvoidingView,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    StyleSheet,
    View,
  } from "react-native"
  
  /**
   * A wrapper component that handles keyboard avoiding behavior
   * Use this component to wrap any screen that has text inputs
   * that might be covered by the keyboard
   */
  const KeyboardAvoidingWrapper = ({
    children,
    style,
    contentContainerStyle,
    keyboardVerticalOffset = Platform.OS === "ios" ? 90 : 0,
    behavior = Platform.OS === "ios" ? "padding" : "height",
  }) => {
    return (
      <KeyboardAvoidingView
        style={[styles.container, style]}
        behavior={behavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>{children}</View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
    },
  })
  
  export default KeyboardAvoidingWrapper
  
  