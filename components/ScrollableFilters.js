import { Text, StyleSheet, ScrollView, Platform, Dimensions, View, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

const ScrollableFilters = (props) => {
  // Ensure all props have default values
  const { options = [], selectedValue = "", onSelect = () => {}, icon } = props || {}

  // Ensure options is an array
  const safeOptions = Array.isArray(options) ? options : []

  // Render nothing if no options
  if (safeOptions.length === 0) {
    return <View style={styles.container} />
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {safeOptions.map((option, index) => {
        // Skip rendering if option is invalid
        if (!option || typeof option !== "object") return null

        // Extract values with defaults
        const label = option.label || `Option ${index}`
        const value = option.value !== undefined ? option.value : ""
        const isSelected = selectedValue === value

        // Create a unique key
        const key = `filter-${index}-${String(value).replace(/\s+/g, "-")}`

        return (
          <TouchableOpacity
            key={key}
            style={[styles.filterButton, isSelected && styles.selectedFilterButton]}
            onPress={() => onSelect(value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, isSelected && styles.selectedFilterText]}>{label}</Text>
            {icon && (
              <Ionicons
                name={typeof icon === "string" ? icon : "chevron-down"}
                size={16}
                color={isSelected ? "black" : "white"}
              />
            )}
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingRight: 20,
    paddingVertical: Platform.OS === "ios" ? 5 : 0,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 25,
    paddingVertical: Platform.OS === "ios" ? 6 : 8,
    paddingHorizontal: Platform.OS === "ios" ? 10 : 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    minHeight: Platform.OS === "ios" ? 32 : 36,
    minWidth: Platform.OS === "ios" ? 70 : 80,
  },
  selectedFilterButton: {
    backgroundColor: "cyan",
    borderColor: "cyan",
    shadowColor: "cyan",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  filterText: {
    color: "white",
    fontSize: Platform.OS === "ios" ? 12 : 13,
    marginRight: 5,
    textAlign: "center",
  },
  selectedFilterText: {
    color: "black",
    fontWeight: "600",
  },
})

export default ScrollableFilters

