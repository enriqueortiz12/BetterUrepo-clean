"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "../lib/supabase"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Update the fetchProfile function to properly handle RLS
  const fetchProfile = useCallback(async (userId) => {
    try {
      console.log("AuthContext: Starting profile fetch for user:", userId)

      if (!userId) {
        console.error("AuthContext: No user ID provided to fetchProfile")
        setProfile(null)
        setIsLoading(false)
        return
      }

      // Make sure we're using the authenticated client for this request
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).single()

      if (error) {
        console.error("AuthContext: Error fetching profile:", error)

        if (error.code === "PGRST116") {
          console.log("AuthContext: No profile found, creating one")

          // Get user email
          const { data: userData } = await supabase.auth.getUser()
          const email = userData?.user?.email

          // Create a simple profile
          const initialProfile = {
            user_id: userId,
            full_name: email ? email.split("@")[0] : "New User",
            email: email,
            training_level: "intermediate",
          }

          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert([initialProfile])
            .select()

          if (createError) {
            console.error("AuthContext: Failed to create profile:", createError)
            setProfile(initialProfile) // Use local data as fallback
          } else {
            console.log("AuthContext: Created new profile:", newProfile)
            setProfile(newProfile[0])
          }
        } else {
          // For other errors, use a fallback profile
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
      console.log("AuthContext: Finished profile fetch")
      setIsLoading(false)
    }
  }, [])

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

  // Update the auth state change handler to be more robust
  useEffect(() => {
    console.log("AuthContext: Setting up auth state listeners")

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthContext: Initial session check:", session?.user?.id)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("AuthContext: Auth state changed:", _event, session?.user?.id)

      // Always update session and user
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // Set loading to true before fetching profile
        setIsLoading(true)
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setIsLoading(false)
      }
    })

    return () => {
      console.log("AuthContext: Cleaning up auth state listeners")
      subscription.unsubscribe()
    }
  }, [fetchProfile]) // Add fetchProfile to dependencies

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

  // Improve error handling in the AuthContext
  // Add this function to the AuthContext:

  const handleAuthError = (error, operation) => {
    console.error(`Error during ${operation}:`, error)
    if (error.message) {
      console.error(`Error message: ${error.message}`)
    }
    if (error.stack) {
      console.error(`Error stack: ${error.stack}`)
    }
    return { error }
  }

  // Then update the signIn function to use it:
  const signIn = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      return { error }
    } catch (error) {
      return handleAuthError(error, "sign in")
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

  // Update the refetchProfile method to use the same function
  const refetchProfile = useCallback(
    (userId) => {
      if (!userId && user) userId = user.id
      if (userId) {
        fetchProfile(userId)
      }
    },
    [user, fetchProfile],
  )

  // Include refetchProfile in the value object
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
    refetchProfile,
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

