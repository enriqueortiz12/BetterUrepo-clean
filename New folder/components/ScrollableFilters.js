"use client"
import { Text, StyleSheet, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import HoverButton from "./HoverButton"

const ScrollableFilters = ({ options, selectedValue, onSelect, icon = "chevron-down" }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {options.map((option) => (
        <HoverButton
          key={option.value}
          style={[styles.filterButton, selectedValue === option.value && styles.selectedFilterButton]}
          onPress={() => onSelect(option.value)}
          activeOpacity={0.7}
          hoverColor={selectedValue === option.value ? "cyan" : "rgba(255, 255, 255, 0.2)"}
        >
          <Text style={[styles.filterText, selectedValue === option.value && styles.selectedFilterText]}>
            {option.label}
          </Text>
          {icon && <Ionicons name={icon} size={16} color={selectedValue === option.value ? "black" : "white"} />}
        </HoverButton>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingRight: 20,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    minHeight: 36,
    minWidth: 80,
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
    fontSize: 13,
    marginRight: 5,
    textAlign: "center",
  },
  selectedFilterText: {
    color: "black",
    fontWeight: "600",
  },
})

export default ScrollableFilters

