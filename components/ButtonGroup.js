"use client"

import React from "react"
import { View, StyleSheet } from "react-native"

/**
 * ButtonGroup component for grouping related buttons
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button components to group
 * @param {string} props.direction - Direction of the button group: 'horizontal', 'vertical'
 * @param {Object} props.style - Additional styles to apply to the button group
 */
const ButtonGroup = ({ children, direction = "horizontal", style, ...props }) => {
  return (
    <View style={[styles.container, direction === "vertical" ? styles.vertical : styles.horizontal, style]} {...props}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return null

        // Add specific styles based on position in group
        const childStyle = { ...child.props.style }

        if (direction === "horizontal") {
          // Remove border radius between buttons
          if (index > 0) {
            childStyle.borderTopLeftRadius = 0
            childStyle.borderBottomLeftRadius = 0
          }
          if (index < React.Children.count(children) - 1) {
            childStyle.borderTopRightRadius = 0
            childStyle.borderBottomRightRadius = 0
            childStyle.marginRight = 0
          }
        } else {
          // Vertical direction
          if (index > 0) {
            childStyle.borderTopLeftRadius = 0
            childStyle.borderTopRightRadius = 0
          }
          if (index < React.Children.count(children) - 1) {
            childStyle.borderBottomLeftRadius = 0
            childStyle.borderBottomRightRadius = 0
            childStyle.marginBottom = 0
          }
        }

        return React.cloneElement(child, {
          style: childStyle,
        })
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  horizontal: {
    flexDirection: "row",
  },
  vertical: {
    flexDirection: "column",
  },
})

export default ButtonGroup

