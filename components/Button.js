import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const Button = ({
  children,
  onPress,
  variant = "primary",
  size = "md",
  style,
  textStyle,
  disabled = false,
  isLoading = false,
  iconName,
  iconPosition = "left",
  iconColor,
  ...props
}) => {
  // Determine styles based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: disabled ? "rgba(0, 255, 255, 0.5)" : "cyan",
          borderColor: "cyan",
          textColor: "black",
        }
      case "secondary":
        return {
          backgroundColor: disabled ? "rgba(0, 153, 255, 0.3)" : "rgba(0, 153, 255, 0.8)",
          borderColor: "rgba(0, 153, 255, 0.8)",
          textColor: "white",
        }
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: disabled ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.5)",
          textColor: disabled ? "rgba(255, 255, 255, 0.5)" : "white",
        }
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderColor: "transparent",
          textColor: disabled ? "rgba(255, 255, 255, 0.5)" : "white",
        }
      case "danger":
        return {
          backgroundColor: disabled ? "rgba(255, 59, 48, 0.5)" : "rgba(255, 59, 48, 0.8)",
          borderColor: "rgba(255, 59, 48, 0.8)",
          textColor: "white",
        }
      default:
        return {
          backgroundColor: disabled ? "rgba(0, 255, 255, 0.5)" : "cyan",
          borderColor: "cyan",
          textColor: "black",
        }
    }
  }

  // Determine styles based on size
  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          paddingVertical: 6,
          paddingHorizontal: 12,
          fontSize: 14,
          iconSize: 16,
        }
      case "lg":
        return {
          paddingVertical: 14,
          paddingHorizontal: 20,
          fontSize: 18,
          iconSize: 22,
        }
      case "md":
      default:
        return {
          paddingVertical: 10,
          paddingHorizontal: 16,
          fontSize: 16,
          iconSize: 18,
        }
    }
  }

  const variantStyles = getVariantStyles()
  const sizeStyles = getSizeStyles()

  // Determine icon color
  const finalIconColor = iconColor || variantStyles.textColor

  // Render loading spinner if isLoading is true
  if (isLoading) {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: variantStyles.backgroundColor,
            borderColor: variantStyles.borderColor,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          style,
        ]}
        disabled={true}
        {...props}
      >
        <ActivityIndicator size="small" color={variantStyles.textColor} />
      </TouchableOpacity>
    )
  }

  // Render button with icon and text
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      <View style={styles.contentContainer}>
        {iconName && iconPosition === "left" && (
          <Ionicons name={iconName} size={sizeStyles.iconSize} color={finalIconColor} style={styles.leftIcon} />
        )}

        {children && (
          <Text
            style={[
              styles.text,
              {
                color: variantStyles.textColor,
                fontSize: sizeStyles.fontSize,
              },
              textStyle,
            ]}
          >
            {children}
          </Text>
        )}

        {iconName && iconPosition === "right" && (
          <Ionicons name={iconName} size={sizeStyles.iconSize} color={finalIconColor} style={styles.rightIcon} />
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
})

export default Button

