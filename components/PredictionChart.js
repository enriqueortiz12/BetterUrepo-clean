"use client"

import React, { useState } from "react"
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native"
import GlassmorphicCard from "./GlassmorphicCard"

const { width } = Dimensions.get("window")

const PredictionChart = ({ current, target, timeToGoal, unit = "lbs" }) => {
  // Add a new state for tracking the selected data point
  const [selectedPoint, setSelectedPoint] = useState(null)

  // Parse the time to goal to generate prediction points
  const generatePredictionData = () => {
    const data = []
    const today = new Date()

    // Add current value as first point
    data.push({
      date: today,
      value: current,
      label: "Now",
    })

    // Parse the timeToGoal string to determine future points
    const endDate = new Date(today)
    let intervalMonths = 1

    if (timeToGoal.includes("day")) {
      const days = Number.parseInt(timeToGoal.match(/\d+/)[0])
      endDate.setDate(today.getDate() + days)
      intervalMonths = 0.25 // Show points every week
    } else if (timeToGoal.includes("week")) {
      const weeks = Number.parseInt(timeToGoal.match(/\d+/)[0])
      endDate.setDate(today.getDate() + weeks * 7)
      intervalMonths = 0.5 // Show points every 2 weeks
    } else if (timeToGoal.includes("month")) {
      const months = Number.parseInt(timeToGoal.match(/\d+/)[0])
      endDate.setMonth(today.getMonth() + months)
    } else if (timeToGoal.includes("year")) {
      const years = Number.parseInt(timeToGoal.match(/\d+/)[0])
      endDate.setFullYear(today.getFullYear() + years)
      intervalMonths = 3 // Show points quarterly
    } else if (timeToGoal === "Goal reached!") {
      // If goal is already reached, just show current value
      return data
    }

    // Calculate value increment per interval
    const totalIntervals = Math.max(Math.ceil((endDate - today) / (1000 * 60 * 60 * 24 * 30 * intervalMonths)), 1)
    const valueIncrement = (target - current) / totalIntervals

    // Generate intermediate points
    for (let i = 1; i < totalIntervals; i++) {
      const pointDate = new Date(today)
      pointDate.setMonth(today.getMonth() + i * intervalMonths)

      data.push({
        date: pointDate,
        value: current + valueIncrement * i,
        label: formatDate(pointDate),
      })
    }

    // Add target as final point
    data.push({
      date: endDate,
      value: target,
      label: "Goal",
    })

    return data
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const predictionData = generatePredictionData()

  // Calculate chart dimensions
  const chartWidth = width - 80
  const chartHeight = 180
  const barWidth = chartWidth / (predictionData.length - 1)

  // Calculate Y-axis scale
  const maxValue = Math.max(...predictionData.map((item) => item.value)) * 1.1 // Add 10% margin
  const yScale = chartHeight / maxValue

  // Calculate progress
  const progress = Math.min(((current - predictionData[0].value) / (target - predictionData[0].value)) * 100, 100)
  const predictionDetails = {
    progress: progress > 0 ? progress : 0,
  }

  return (
    <GlassmorphicCard style={styles.container}>
      <Text style={styles.title}>Projected Progress</Text>

      {/* Update the progress bar to simplify the percentage display */}
      <View style={styles.predictionProgressBar}>
        <View style={[styles.predictionProgressFill, { width: `${predictionDetails.progress}%` }]} />
        <Text style={styles.predictionProgressText}>{predictionDetails.progress.toFixed(1)}%</Text>
      </View>

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

          {/* Data points and connecting lines */}
          {predictionData.map((point, index) => {
            if (index === 0) return null // Skip first point for lines

            const prevPoint = predictionData[index - 1]
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
                      backgroundColor: index === predictionData.length - 1 ? "#FF5733" : "#0099ff",
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
                        borderColor: index === predictionData.length - 1 ? "#FF5733" : "#0099ff",
                        backgroundColor:
                          selectedPoint === index
                            ? index === predictionData.length - 1
                              ? "#FF5733"
                              : "#0099ff"
                            : "black",
                      },
                    ]}
                  />

                  {/* Show weight value when point is selected */}
                  {selectedPoint === index && (
                    <View style={styles.weightBubble}>
                      <Text style={styles.weightText}>
                        {Math.round(point.value)} {unit}
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
              top: chartHeight - predictionData[0].value * yScale - 15,
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
                  borderColor: "#0099ff",
                  backgroundColor: selectedPoint === -1 ? "#0099ff" : "black",
                },
              ]}
            />

            {/* Show weight value when first point is selected */}
            {selectedPoint === -1 && (
              <View style={styles.weightBubble}>
                <Text style={styles.weightText}>
                  {Math.round(predictionData[0].value)} {unit}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxis}>
        {predictionData.map((point, index) => (
          <Text
            key={index}
            style={[
              styles.xAxisLabel,
              {
                left: index * barWidth - 20,
                width: 40,
                textAlign: "center",
                color: index === predictionData.length - 1 ? "#FF5733" : index === 0 ? "#0099ff" : "#aaa",
              },
            ]}
          >
            {point.label}
          </Text>
        ))}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          This projection is based on your current training level and historical progress. Actual results may vary based
          on consistency, nutrition, and recovery.
        </Text>
      </View>
    </GlassmorphicCard>
  )
}

// Update the styles to remove unused styles
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
  chartContainer: {
    flexDirection: "row",
    height: 150,
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
  chartLine: {
    position: "absolute",
    height: 2,
  },
  dataPoint: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  valueLabel: {
    position: "absolute",
    fontSize: 9,
    fontWeight: "bold",
  },
  xAxis: {
    height: 20,
    position: "relative",
    marginBottom: 5,
  },
  xAxisLabel: {
    position: "absolute",
    fontSize: 9,
  },
  infoContainer: {
    marginTop: 5,
    padding: 8,
    backgroundColor: "rgba(0, 153, 255, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 153, 255, 0.3)",
  },
  infoText: {
    color: "#aaa",
    fontSize: 10,
    textAlign: "center",
    fontStyle: "italic",
  },
  predictionProgressBar: {
    height: 20,
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  predictionProgressFill: {
    height: "100%",
    backgroundColor: "#0099ff",
    width: "0%",
  },
  predictionProgressText: {
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

export default PredictionChart

