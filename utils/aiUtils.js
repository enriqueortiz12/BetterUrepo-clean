import { getOpenAIApiKey } from "./apiConfig"

/**
 * Generates an AI response using the OpenAI API
 * @param {string} userMessage - The user's message to generate a response for
 * @returns {Promise<string>} - The AI-generated response
 */
export const generateAIResponse = async (userMessage) => {
  console.log("Generating AI response for:", userMessage)

  try {
    // Get the API key
    const key = await getOpenAIApiKey()

    if (!key) {
      console.warn("No OpenAI API key available")
      return "I'm sorry, I can't connect to my AI brain right now. Please check your API key configuration."
    }

    // Create the request to OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an AI fitness trainer assistant. You provide helpful, encouraging, and accurate advice about workouts, nutrition, and fitness goals. Keep your responses concise (under 150 words) and focused on fitness advice.",
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenAI API error:", errorData)
      throw new Error(`API error: ${errorData.error?.message || "Unknown error"}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("Error generating AI response:", error)
    return "I'm having trouble connecting to my AI brain right now. Let's try again in a moment."
  }
}

