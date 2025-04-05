import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://kmpufblmilcvortrfilp.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcHVmYmxtaWxjdm9ydHJmaWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2Mjg2MzYsImV4cCI6MjA1OTIwNDYzNn0.JYJ5WSZWp04AGxfcX2GsiPrTn2QUStCfCHmdDNyxo04"

// Add error handling for client creation
let supabaseClient
try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })

  console.log("Supabase client initialized successfully")
} catch (error) {
  console.error("Failed to initialize Supabase client:", error)
  // Create a fallback client with minimal configuration
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
    },
  })
}

export const supabase = supabaseClient

// Define Profile type as a JavaScript object with JSDoc comments
/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} user_id
 * @property {string|null} full_name
 * @property {string|null} email
 * @property {number|null} age
 * @property {number|null} weight
 * @property {string|null} fitness_goal
 * @property {string|null} gender
 * @property {number|null} height
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

