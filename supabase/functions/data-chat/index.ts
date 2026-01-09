import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, dataContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a comprehensive system prompt with the data context
    const systemPrompt = `You are a friendly, professional data analyst assistant. You answer questions about a dataset that has been analyzed.

Here is the context about the dataset:
${dataContext}

=== RESPONSE FORMATTING GUIDELINES ===

You MUST format your responses to be visually clear and easy to read:

1. **Use Headers** for main sections:
   ## Key Finding
   ## What This Means

2. **Use Bold** for important terms and numbers:
   - The average is **$45,000**
   - This represents a **23% increase**

3. **Use Bullet Points** for lists:
   • First point
   • Second point
   • Third point

4. **Use Numbered Lists** for steps or rankings:
   1. Most important
   2. Second most important
   3. Third most important

5. **Use Comparisons** that are easy to understand:
   📈 Up: Sales grew from $100K to $150K
   📉 Down: Returns decreased by 15%
   ➡️ Stable: No significant change

6. **Structure Longer Responses** like this:
   
   ## Quick Answer
   [1-2 sentence summary]
   
   ## Details
   [Expanded explanation with bullet points]
   
   ## What To Do
   [Actionable recommendations]

=== TONE GUIDELINES ===

- Use simple, everyday English
- Explain numbers in context (e.g., "23% higher than usual" not just "23%")
- Give specific examples from the data when possible
- If uncertain, say so clearly
- Focus on practical, actionable insights
- Relate findings to business impact
- Be conversational but professional

Remember: Make the data come alive! The user wants to understand what the numbers mean for their business, not just what the numbers are.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in data-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
