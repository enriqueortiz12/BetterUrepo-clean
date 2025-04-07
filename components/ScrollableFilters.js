"use client"

import { useState, useRef, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from "react-native"

const ScrollableFilters = ({ filters, selectedFilters, onSelectFilter }) => {
  const scrollViewRef = useRef()
  const [contentWidth, setContentWidth] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const [showScrollButtons, setShowScrollButtons] = useState(false)

  useEffect(() => {
    setShowScrollButtons(contentWidth > containerWidth)
  }, [contentWidth, containerWidth])

  const handleContentSizeChange = (width) => {
    setContentWidth(width)
  }

  const handleLayout = (event) => {
    const { width } = event.nativeEvent.layout
    setContainerWidth(width)
  }

  const scrollLeft = () => {
    scrollViewRef.current?.scrollTo({
      x: Math.max(0, scrollViewRef.current?.scrollValue - containerWidth / 2),
      animated: true,
    })
  }

  const scrollRight = () => {
    scrollViewRef.current?.scrollTo({
      x: Math.min(contentWidth - containerWidth, scrollViewRef.current?.scrollValue + containerWidth / 2),
      animated: true,
    })
  }

  return (
    <View style={styles.container}>
      {showScrollButtons && (
        <TouchableOpacity style={styles.scrollButton} onPress={scrollLeft}>
          <Text>&lt;</Text>
        </TouchableOpacity>
      )}
      <ScrollView
        ref={scrollViewRef}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={(width, height) => handleContentSizeChange(width)}
        onLayout={handleLayout}
        scrollEventThrottle={16}
        onScroll={(event) => {
          scrollViewRef.current.scrollValue = event.nativeEvent.contentOffset.x
        }}
      >
        {filters &&
          filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilters.includes(filter) && styles.selectedFilterButton]}
              onPress={() => onSelectFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilters.includes(filter) && styles.selectedFilterText]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
      {showScrollButtons && (
        <TouchableOpacity style={styles.scrollButton} onPress={scrollRight}>
          <Text>&gt;</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Platform.OS === "ios" ? 5 : 0,
    flexDirection: "row",
    alignItems: "center",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginHorizontal: 5,
  },
  selectedFilterButton: {
    backgroundColor: "#ddd",
  },
  filterText: {
    fontSize: 16,
    color: "#333",
  },
  selectedFilterText: {
    fontWeight: "bold",
  },
  scrollButton: {
    padding: 10,
  },
})

export default ScrollableFilters

