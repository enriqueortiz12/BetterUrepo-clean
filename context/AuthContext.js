"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Update the fetchProfile function to be more robust and add a refetchProfile method
  const fetchProfile = async (userId) => {
    try {
      setIsLoading(true)
      console.log("AuthContext: Fetching profile for user ID:", userId)

      if (!userId) {
        console.error("AuthContext: No user ID provided to fetchProfile")
        setProfile(null)
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).single()

      if (error) {
        console.error("AuthContext: Error fetching profile:", error)

        // If profile doesn't exist, try to create one
        if (error.code === "PGRST116") {
          console.log("AuthContext: No profile found, attempting to create one")
          await createInitialProfile(userId)
        } else {
          setProfile(null)
        }
      } else {
        console.log("AuthContext: Profile data fetched successfully:", data)
        setProfile(data)
      }
    } catch (error) {
      console.error("AuthContext: Exception in fetchProfile:", error)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Add a function to create an initial profile
  const createInitialProfile = async (userId) => {
    try {
      if (!userId) return

      const user = await supabase.auth.getUser()
      const email = user?.data?.user?.email

      const initialProfile = {
        user_id: userId,
        full_name: email ? email.split("@")[0] : "New User",
        email: email,
        training_level: "intermediate",
      }

      const { data, error } = await supabase.from("profiles").insert([initialProfile]).select()

      if (error) {
        console.error("AuthContext: Error creating initial profile:", error)
      } else {
        console.log("AuthContext: Initial profile created:", data)
        setProfile(data[0])
      }
    } catch (error) {
      console.error("AuthContext: Error in createInitialProfile:", error)
    }
  }

  // Update the signUp function to better handle the auth state:

  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        console.error("Supabase signup error:", error)
        return { error, user: null }
      }

      if (data?.user) {
        console.log("User created in Supabase:", data.user.id)

        // Set the user state immediately to trigger auth state change
        setUser(data.user)

        // Create a profile for the new user
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            user_id: data.user.id,
            full_name: fullName,
            email,
            // Add these fields to ensure they exist but are incomplete
            age: null,
            weight: null,
            height: null,
            fitness_goal: null,
            gender: null,
            training_level: "intermediate",
          },
        ])

        if (profileError) {
          console.error("Error creating initial profile:", profileError)
          return { error: profileError, user: data.user }
        }

        console.log("Initial profile created successfully, needs completion")

        // Fetch the profile to update the profile state
        fetchProfile(data.user.id)

        return { error: null, user: data.user }
      }

      return { error: new Error("No user data returned from signup"), user: null }
    } catch (error) {
      console.error("Signup error:", error)
      return { error, user: null }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const updateProfile = async (updates) => {
    if (!user) return { error: "No user logged in" }

    try {
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", user.id)

      if (!error) {
        // Update local profile state
        setProfile((prev) => (prev ? { ...prev, ...updates } : null))
      }

      return { error }
    } catch (error) {
      return { error }
    }
  }

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "betterufitness://reset-password",
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const updatePassword = async (password) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Add a refetchProfile method to the value object
  const value = {
    user,
    profile,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    refetchProfile: () => user && fetchProfile(user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

