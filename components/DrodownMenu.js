"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const DropdownMenu = ({
  options,
  selectedValue,
  onSelect,
  placeholder = "Select an option",
  width = "100%",
  icon = "chevron-down",
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownTop, setDropdownTop] = useState(0)
  const buttonRef = useRef(null)
  const fadeAnim = useRef(new Animated.Value(0)).current

  // Use useCallback to memoize the closeDropdown function
  const closeDropdown = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false)
    })
  }, [fadeAnim])

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown()
    } else {
      openDropdown()
    }
  }

  const openDropdown = () => {
    buttonRef.current.measure((_fx, _fy, _w, h, _px, py) => {
      setDropdownTop(py + h)
    })
    setIsOpen(true)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }

  const handleSelect = (value) => {
    onSelect(value)
    closeDropdown()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleBackdropPress = () => {
      if (isOpen) {
        closeDropdown()
      }
    }

    return () => {
      // Cleanup
    }
  }, [isOpen, closeDropdown])

  // Find the selected option's label
  const selectedOption = options.find((option) => option.value === selectedValue)
  const displayText = selectedOption ? selectedOption.label : placeholder

  return (
    <View style={[styles.container, { width }]}>
      <TouchableOpacity ref={buttonRef} style={styles.button} onPress={toggleDropdown} activeOpacity={0.7}>
        <Text style={styles.buttonText} numberOfLines={1}>
          {displayText}
        </Text>
        <Ionicons name={icon} size={16} color="white" />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent={true} animationType="none" onRequestClose={closeDropdown}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeDropdown}>
          <Animated.View
            style={[
              styles.dropdown,
              {
                top: dropdownTop,
                opacity: fadeAnim,
                width,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.dropdownScrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, selectedValue === option.value && styles.selectedOption]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text style={[styles.optionText, selectedValue === option.value && styles.selectedOptionText]}>
                    {option.label}
                  </Text>
                  {selectedValue === option.value && <Ionicons name="checkmark" size={18} color="cyan" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dropdown: {
    position: "absolute",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
    maxHeight: 300,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollView: {
    width: "100%",
  },
  dropdownScrollContent: {
    paddingVertical: 5,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedOption: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
  },
  optionText: {
    color: "white",
    fontSize: 14,
  },
  selectedOptionText: {
    color: "cyan",
    fontWeight: "bold",
  },
})

export default DropdownMenu

