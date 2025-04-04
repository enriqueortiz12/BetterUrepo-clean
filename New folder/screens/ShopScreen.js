import { View, Text, StyleSheet } from "react-native"

const ShopScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shop</Text>
      <Text style={styles.description}>Welcome to the shop! More features coming soon.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
})

export default ShopScreen

