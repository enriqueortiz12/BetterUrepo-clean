"use client"

import React, { useState } from "react"
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native"
import GlassmorphicCard from "./GlassmorphicCard"

const { width } = Dimensions.get("window")

const ProgressChart = ({ current, target, history = [], unit = "lbs", color = "#0099ff" }) => {
  // Add a new state for tracking the selected data point
  const [selectedPoint, setSelectedPoint] = useState(null)

  // Calculate progress percentage
  const progressPercentage = Math.min((current / target) * 100, 100)
  const formattedPercentage = `${progressPercentage.toFixed(1)}%`

  // Format dates for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Get the last 5 history points or generate placeholder data if not enough history
  const getChartData = () => {
    if (history.length >= 2) {
      // Sort by date (oldest first)
      return [...history].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-5)
    } else {
      // Generate placeholder data based on current value
      const today = new Date()
      const placeholderData = []

      // Current value as the latest point
      placeholderData.push({
        date: today.toISOString().split("T")[0],
        value: current,
      })

      // Generate 4 previous points with decreasing values
      for (let i = 1; i <= 4; i++) {
        const prevDate = new Date(today)
        prevDate.setDate(today.getDate() - i * 15) // Every 15 days back

        // Calculate a value that's lower than current (simulating progress)
        const prevValue = Math.max(current * (1 - i * 0.05), current * 0.8)

        placeholderData.unshift({
          date: prevDate.toISOString().split("T")[0],
          value: Math.round(prevValue),
        })
      }

      return placeholderData
    }
  }

  const chartData = getChartData()

  // Calculate the highest value for the Y-axis scale
  const maxValue = Math.max(target, ...chartData.map((item) => item.value))

  // Calculate chart dimensions
  const chartWidth = width - 80 // Accounting for padding
  const chartHeight = 150
  const barWidth = chartWidth / (chartData.length - 1)

  // Calculate Y-axis scale
  const yScale = chartHeight / maxValue

  return (
    <GlassmorphicCard style={styles.container}>
      <Text style={styles.title}>Progress Visualization</Text>

      {/* Target indicator */}
      <View style={styles.targetContainer}>
        <Text style={styles.targetLabel}>
          Target: {target} {unit}
        </Text>
        <Text style={styles.currentLabel}>
          Current: {current} {unit}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progressPercentage}%`, backgroundColor: color }]} />
        <Text style={styles.progressPercentage}>{formattedPercentage}</Text>
      </View>

      {/* Line chart */}
      <View style={styles.chartContainer}>
        {/* Y-axis */}
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>{Math.round(maxValue)}</Text>
          <Text style={styles.axisLabel}>{Math.round(maxValue / 2)}</Text>
          <Text style={styles.axisLabel}>0</Text>
        </View>

        {/* Chart area */}
        <View style={styles.chart}>
          {/* Horizontal grid lines */}
          <View style={[styles.gridLine, { top: 0 }]} />
          <View style={[styles.gridLine, { top: chartHeight / 2 }]} />
          <View style={[styles.gridLine, { top: chartHeight }]} />

          {/* Target line */}
          <View style={[styles.targetLine, { top: chartHeight - target * yScale }]} />

          {/* Data points and connecting lines */}
          {chartData.map((point, index) => {
            if (index === 0) return null

            const prevPoint = chartData[index - 1]
            const x1 = (index - 1) * barWidth
            const y1 = chartHeight - prevPoint.value * yScale
            const x2 = index * barWidth
            const y2 = chartHeight - point.value * yScale

            // Calculate line angle
            const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

            return (
              <React.Fragment key={index}>
                {/* Line connecting points */}
                <View
                  style={[
                    styles.chartLine,
                    {
                      width: length,
                      left: x1,
                      top: y1,
                      transform: [{ rotate: `${angle}deg` }],
                      transformOrigin: "0 0",
                      backgroundColor: color,
                    },
                  ]}
                />

                {/* Data point - use simple TouchableOpacity without animations */}
                <TouchableOpacity
                  onPress={() => setSelectedPoint(index)}
                  style={{
                    position: "absolute",
                    left: x2 - 15,
                    top: y2 - 15,
                    width: 30,
                    height: 30,
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 10,
                  }}
                >
                  <View
                    style={[
                      styles.dataPoint,
                      {
                        borderColor: color,
                        backgroundColor: selectedPoint === index ? color : "black",
                      },
                    ]}
                  />

                  {/* Show weight value when point is selected */}
                  {selectedPoint === index && (
                    <View style={styles.weightBubble}>
                      <Text style={styles.weightText}>
                        {point.value} {unit}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </React.Fragment>
            )
          })}

          {/* First data point - also simplified */}
          <TouchableOpacity
            onPress={() => setSelectedPoint(-1)}
            style={{
              position: "absolute",
              left: -15,
              top: chartHeight - chartData[0].value * yScale - 15,
              width: 30,
              height: 30,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <View
              style={[
                styles.dataPoint,
                {
                  borderColor: color,
                  backgroundColor: selectedPoint === -1 ? color : "black",
                },
              ]}
            />

            {/* Show weight value when first point is selected */}
            {selectedPoint === -1 && (
              <View style={styles.weightBubble}>
                <Text style={styles.weightText}>
                  {chartData[0].value} {unit}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxis}>
        {chartData.map((point, index) => (
          <Text
            key={index}
            style={[
              styles.xAxisLabel,
              {
                left: index * barWidth - 20,
                width: 40,
                textAlign: "center",
              },
            ]}
          >
            {formatDate(point.date)}
          </Text>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: color }]} />
          <Text style={styles.legendText}>Progress</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#FF5733" }]} />
          <Text style={styles.legendText}>Target</Text>
        </View>
      </View>
    </GlassmorphicCard>
  )
}

// Update the styles to add new styles for interactive elements
const styles = StyleSheet.create({
  container: {
    padding: 15,
    marginBottom: 15,
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  targetContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  targetLabel: {
    color: "#FF5733",
    fontSize: 12,
  },
  currentLabel: {
    color: "#0099ff",
    fontSize: 12,
  },
  progressBarContainer: {
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    marginBottom: 20,
    position: "relative",
  },
  progressBar: {
    height: "100%",
    borderRadius: 8,
  },
  targetMarker: {
    position: "absolute",
    top: -20,
    width: 2,
    height: 36,
    backgroundColor: "#FF5733",
    transform: [{ translateX: -1 }],
  },
  targetMarkerText: {
    position: "absolute",
    top: -20,
    left: -10,
    color: "#FF5733",
    fontSize: 10,
  },
  currentMarker: {
    position: "absolute",
    top: -12,
    width: 2,
    height: 28,
    backgroundColor: "#0099ff",
    transform: [{ translateX: -1 }],
  },
  currentMarkerText: {
    position: "absolute",
    bottom: -18,
    left: -10,
    color: "#0099ff",
    fontSize: 10,
  },
  chartContainer: {
    flexDirection: "row",
    height: 120,
    marginBottom: 20,
  },
  yAxis: {
    width: 25,
    height: "100%",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 5,
  },
  axisLabel: {
    color: "#aaa",
    fontSize: 9,
  },
  chart: {
    flex: 1,
    height: "100%",
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  targetLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#FF5733",
    borderStyle: "dashed",
  },
  chartLine: {
    position: "absolute",
    height: 2,
  },
  dataPoint: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "black",
    borderWidth: 2,
  },
  xAxis: {
    height: 20,
    position: "relative",
  },
  xAxisLabel: {
    position: "absolute",
    color: "#aaa",
    fontSize: 8,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 5,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    color: "#aaa",
    fontSize: 10,
  },
  progressPercentage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: "center",
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  dataPointTouchable: {
    position: "absolute",
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  weightBubble: {
    position: "absolute",
    top: -25,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 153, 255, 0.5)",
  },
  weightText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
})

export default ProgressChart

