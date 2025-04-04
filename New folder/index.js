import { AppRegistry } from "react-native"
import App from "./App"
import { name as appName } from "./app.json"

// Register the app
AppRegistry.registerComponent(appName, () => App)

// Default export for Expo
export default App

