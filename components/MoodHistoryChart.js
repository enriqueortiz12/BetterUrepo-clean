"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const MoodHistoryChart = ({ moodHistory = [] }) => {
  const [showFullMonth, setShowFullMonth] = useState(false)

  // Helper function to format dates
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Invalid date"
      }
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date:", error, dateString)
      return "Invalid date"
    }
  }

  // Helper function to get day name
  const getDayName = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { weekday: "short" })
  }

  // Get current date and calculate dates for past week and month
  const currentDate = new Date()
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(currentDate.getDate() - 7)

  const oneMonthAgo = new Date()
  oneMonthAgo.setDate(currentDate.getDate() - 30)

  // Filter mood history for past week and month
  const weekMoods = moodHistory
    .filter((entry) => new Date(entry.date) >= oneWeekAgo)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const monthMoods = moodHistory
    .filter((entry) => new Date(entry.date) >= oneMonthAgo)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  // Generate dates for the past week (for empty state)
  const pastWeekDates = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    pastWeekDates.push(date)
  }

  // Generate dates for the past month (for empty state)
  const pastMonthDates = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    pastMonthDates.push(date)
  }

  // Update the moodMap creation to ensure consistent date key format
  // Create a map of dates to mood entries for quick lookup
  const moodMap = {}
  moodHistory.forEach((entry) => {
    // Ensure we're using a consistent date format for the key
    const dateKey = new Date(entry.date).toISOString().split("T")[0]
    moodMap[dateKey] = entry
  })

  // Determine which data to display based on toggle
  const displayDates = showFullMonth ? pastMonthDates : pastWeekDates
  const displayMoods = showFullMonth ? monthMoods : weekMoods

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mood History</Text>
        <TouchableOpacity style={styles.toggleButton} onPress={() => setShowFullMonth(!showFullMonth)}>
          <Text style={styles.toggleButtonText}>{showFullMonth ? "Show Week" : "See More"}</Text>
        </TouchableOpacity>
      </View>

      {moodHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={40} color="#555" />
          <Text style={styles.emptyText}>No mood data yet</Text>
          <Text style={styles.emptySubtext}>Track your mood daily to see patterns</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContainer}
        >
          <View style={styles.chartContainer}>
            {displayDates.map((date, index) => {
              // Ensure we're using a consistent date format for the lookup
              const dateKey = date.toISOString().split("T")[0]
              const moodEntry = moodMap[dateKey]

              return (
                <View key={index} style={styles.dayColumn}>
                  <Text style={styles.dayName}>{getDayName(date)}</Text>
                  <View
                    style={[
                      styles.moodCircle,
                      moodEntry ? { backgroundColor: moodEntry.color } : styles.emptyMoodCircle,
                    ]}
                  >
                    {moodEntry && <Ionicons name={moodEntry.icon} size={16} color="white" />}
                  </View>
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                </View>
              )
            })}
          </View>
        </ScrollView>
      )}

      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Mood Legend:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FFD700" }]} />
            <Text style={styles.legendText}>Great</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
            <Text style={styles.legendText}>Good</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#2196F3" }]} />
            <Text style={styles.legendText}>Okay</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#9C27B0" }]} />
            <Text style={styles.legendText}>Bad</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#F44336" }]} />
            <Text style={styles.legendText}>Awful</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  toggleButton: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  toggleButtonText: {
    color: "cyan",
    fontSize: 12,
    fontWeight: "500",
  },
  chartScrollContainer: {
    paddingBottom: 10,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  dayColumn: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 40,
  },
  dayName: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 5,
  },
  moodCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 5,
  },
  emptyMoodCircle: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderStyle: "dashed",
  },
  dateText: {
    color: "#aaa",
    fontSize: 10,
    marginTop: 5,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyText: {
    color: "white",
    fontSize: 16,
    marginTop: 10,
  },
  emptySubtext: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 5,
  },
  legendContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  legendTitle: {
    color: "white",
    fontSize: 14,
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    color: "#aaa",
    fontSize: 12,
  },
})

export default MoodHistoryChart

