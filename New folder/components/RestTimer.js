"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const RestTimer = ({ defaultTime = 60, onTimerComplete }) => {
  const [time, setTime] = useState(defaultTime)
  const [isActive, setIsActive] = useState(false)
  const [isConfiguring, setIsConfiguring] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isActive && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current)
            setIsActive(false)
            if (onTimerComplete) onTimerComplete()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    } else if (time === 0) {
      setIsActive(false)
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, time, onTimerComplete])

  const toggleTimer = () => {
    if (time === 0) {
      setTime(defaultTime)
      setIsActive(true)
    } else {
      setIsActive(!isActive)
    }
  }

  const resetTimer = () => {
    setIsActive(false)
    setTime(defaultTime)
    clearInterval(intervalRef.current)
  }

  const adjustTime = (amount) => {
    setTime((prevTime) => Math.max(0, prevTime + amount))
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <View style={styles.container}>
      {isConfiguring ? (
        <View style={styles.configContainer}>
          <TouchableOpacity style={styles.adjustButton} onPress={() => adjustTime(10)}>
            <Ionicons name="chevron-up" size={24} color="white" />
          </TouchableOpacity>

          <Text style={styles.timeText}>{formatTime(time)}</Text>

          <TouchableOpacity style={styles.adjustButton} onPress={() => adjustTime(-10)}>
            <Ionicons name="chevron-down" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.configButton} onPress={() => setIsConfiguring(false)}>
            <Text style={styles.configButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.timerContainer}>
          <TouchableOpacity style={[styles.timerButton, isActive && styles.timerButtonActive]} onPress={toggleTimer}>
            <Text style={styles.timeText}>{formatTime(time)}</Text>
            <Text style={styles.timerLabel}>{isActive ? "Pause" : time === 0 ? "Start" : "Resume"}</Text>
          </TouchableOpacity>

          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.controlButton} onPress={() => setIsConfiguring(true)}>
              <Ionicons name="settings-outline" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
              <Ionicons name="refresh" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timerButton: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
    flexDirection: "row",
    alignItems: "center",
  },
  timerButtonActive: {
    backgroundColor: "rgba(0, 255, 255, 0.2)",
  },
  timeText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },
  timerLabel: {
    color: "cyan",
    fontSize: 14,
  },
  controlsContainer: {
    flexDirection: "row",
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  configContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    padding: 10,
  },
  adjustButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  configButton: {
    backgroundColor: "cyan",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginLeft: 10,
  },
  configButtonText: {
    color: "black",
    fontWeight: "bold",
  },
})

export default RestTimer

