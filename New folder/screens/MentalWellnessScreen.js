"use client"

import { useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { mentalWellnessCategories, wellnessHistory } from "../data/mentalWellnessData"

const MentalWellnessScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null)

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { borderColor: item.color }]}
      onPress={() => setSelectedCategory(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={24} color="white" />
      </View>
      <Text style={styles.categoryTitle}>{item.title}</Text>
      <Text style={styles.categoryDescription} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  )

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyLeft}>
        <Text style={styles.historyDate}>{item.date}</Text>
        <Text style={styles.historySession}>{item.session}</Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={styles.historyDetail}>{item.duration}</Text>
        <Text style={styles.historyDetail}>{item.mood}</Text>
      </View>
    </View>
  )

  const renderSessionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => navigation.navigate("SessionDetail", { session: item })}
    >
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTitle}>{item.title}</Text>
        <Text style={styles.sessionDuration}>{item.duration}</Text>
      </View>
      <Text style={styles.sessionDescription}>{item.description}</Text>
      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Benefits:</Text>
        {item.benefits.map((benefit, index) => (
          <Text key={index} style={styles.benefitItem}>
            • {benefit}
          </Text>
        ))}
      </View>
      <View style={styles.startButtonContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate("SessionDetail", { session: item })}
        >
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mental Wellness</Text>
      </View>

      {selectedCategory ? (
        <View style={styles.categoryDetailContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedCategory(null)}>
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text style={styles.backButtonText}>Categories</Text>
          </TouchableOpacity>

          <Text style={styles.categoryDetailTitle}>{selectedCategory.title}</Text>

          <Text style={styles.categoryDetailDescription}>{selectedCategory.description}</Text>

          <FlatList
            data={selectedCategory.sessions}
            renderItem={renderSessionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.sessionList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.featuredContainer}>
            <Text style={styles.sectionTitle}>Featured Session</Text>
            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() =>
                navigation.navigate("SessionDetail", {
                  session: mentalWellnessCategories[0].sessions[0],
                })
              }
            >
              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle}>{mentalWellnessCategories[0].sessions[0].title}</Text>
                <Text style={styles.featuredMeta}>{mentalWellnessCategories[0].sessions[0].duration}</Text>
                <TouchableOpacity style={styles.featuredButton}>
                  <Text style={styles.featuredButtonText}>Start Now</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Categories</Text>
          <FlatList
            data={mentalWellnessCategories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />

          <View style={styles.historyContainer}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {wellnessHistory.map((item) => renderHistoryItem({ item }))}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  featuredContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  featuredCard: {
    height: 180,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "rgba(156, 124, 244, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(156, 124, 244, 0.3)",
  },
  featuredContent: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  featuredTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  featuredMeta: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 20,
  },
  featuredButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  featuredButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  categoriesList: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  categoryCard: {
    width: 150,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  categoryTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  categoryDescription: {
    color: "#aaa",
    fontSize: 12,
  },
  historyContainer: {
    marginTop: 30,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  historyLeft: {},
  historyDate: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 5,
  },
  historySession: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  historyRight: {
    alignItems: "flex-end",
  },
  historyDetail: {
    color: "#aaa",
    fontSize: 14,
  },
  categoryDetailContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    marginLeft: 10,
  },
  categoryDetailTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  categoryDetailDescription: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 20,
  },
  sessionList: {
    paddingBottom: 20,
  },
  sessionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sessionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  sessionDuration: {
    color: "#aaa",
    fontSize: 14,
  },
  sessionDescription: {
    color: "white",
    fontSize: 14,
    marginBottom: 15,
  },
  benefitsContainer: {
    marginBottom: 15,
  },
  benefitsTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  benefitItem: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 3,
  },
  startButtonContainer: {
    alignItems: "flex-end",
  },
  startButton: {
    backgroundColor: "cyan",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  startButtonText: {
    color: "black",
    fontWeight: "bold",
  },
})

export default MentalWellnessScreen

