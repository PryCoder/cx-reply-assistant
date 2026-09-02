// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateReplyRequest {
  conversation_id: string;
}

interface GenerateReplyResponse {
  reply: string;
  retrieved_context: string;
  error?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: GenerateReplyRequest = await req.json();
    const { conversation_id } = body;

    if (!conversation_id) {
      return new Response(
        JSON.stringify({ error: "conversation_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");

    if (!supabaseUrl) {
      console.error("Missing SUPABASE_URL");
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_URL env var" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!supabaseServiceKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_SERVICE_ROLE_KEY env var" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!openrouterKey) {
      console.error("Missing OPENROUTER_API_KEY");
      return new Response(
        JSON.stringify({ error: "Missing OPENROUTER_API_KEY secret - please set it in Supabase Edge Functions settings" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch conversation, customer, brand, and order info
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, customer_id, brand_id, customers(id, name, email), brands(id, name, tone_guidelines)")
      .eq("id", conversation_id)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: `Conversation not found: ${convError?.message}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const customerId = conversation.customer_id;
    const brandId = conversation.brand_id;
    const customer = conversation.customers;
    const brand = conversation.brands;

    // Fetch latest order for the customer
    const { data: orders, error: orderError } = await supabase
      .from("orders")
      .select("id, product_name, order_date, delivery_date, status")
      .eq("customer_id", customerId)
      .eq("brand_id", brandId)
      .order("delivery_date", { ascending: false })
      .limit(1);

    if (orderError) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch order: ${orderError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const order = orders && orders.length > 0 ? orders[0] : null;

    // Fetch latest customer message
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("id, content, created_at, sender")
      .eq("conversation_id", conversation_id)
      .eq("sender", "customer")
      .order("created_at", { ascending: false })
      .limit(1);

    if (msgError || !messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No customer message found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const customerMessage = messages[0].content;

    // Fetch relevant KB articles - attempt to infer category from message
    const kbCategories = detectCategories(customerMessage);
    let { data: kbArticles, error: kbError } = await supabase
      .from("kb_articles")
      .select("id, category, content")
      .eq("brand_id", brandId)
      .in("category", kbCategories.length > 0 ? kbCategories : ["return", "refund", "shipping", "cancellation"]);

    if (kbError) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch KB articles: ${kbError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build retrieved context string
    const retrievedContext = buildContext(brand, customer, order, kbArticles);

    // Build system prompt with guardrails
    const systemPrompt = buildSystemPrompt(brand, retrievedContext);

    // Build conversation history for the API call
    const { data: allMessages, error: allMsgError } = await supabase
      .from("messages")
      .select("id, sender, content, created_at")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true });

    if (allMsgError) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch message history: ${allMsgError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Format messages for API call
    const apiMessages = allMessages.map((msg: any) => ({
      role: msg.sender === "customer" ? "user" : msg.sender === "agent" ? "assistant" : "user",
      content: msg.content,
    }));

    // Call OpenRouter API
    const aiResponse = await callOpenRouter(systemPrompt, apiMessages, openrouterKey);

    if (!aiResponse) {
      return new Response(
        JSON.stringify({ error: "Failed to get response from OpenRouter API" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log the AI interaction
    const { error: logError } = await supabase.from("ai_logs").insert({
      conversation_id: conversation_id,
      customer_message: customerMessage,
      retrieved_context: retrievedContext,
      ai_response: aiResponse,
      agent_edited_response: null,
      final_response: null,
      status: "generated",
    });

    if (logError) {
      console.error("Failed to log AI interaction:", logError);
      // Don't fail the response, just log the error
    }

    return new Response(
      JSON.stringify({
        reply: aiResponse,
        retrieved_context: retrievedContext,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in generate-reply:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${errorMessage}` }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

/**
 * Detect KB categories relevant to the customer message
 */
function detectCategories(message: string): string[] {
  const lower = message.toLowerCase();
  const categories: string[] = [];

  if (lower.includes("return") || lower.includes("send back")) {
    categories.push("return");
  }
  if (lower.includes("refund") || lower.includes("money back") || lower.includes("reimburse")) {
    categories.push("refund");
  }
  if (lower.includes("shipping") || lower.includes("delivery") || lower.includes("shipped")) {
    categories.push("shipping");
  }
  if (lower.includes("cancel") || lower.includes("cancelled")) {
    categories.push("cancellation");
  }

  return [...new Set(categories)]; // Remove duplicates
}

/**
 * Build context string from brand, customer, order, and KB articles
 */
function buildContext(brand: any, customer: any, order: any, kbArticles: any[]): string {
  let context = `
=== CUSTOMER CONTEXT ===
Name: ${customer.name}
Email: ${customer.email}

=== BRAND CONTEXT ===
Brand: ${brand.name}
Tone Guidelines: ${brand.tone_guidelines || "Not specified"}

=== ORDER CONTEXT ===
${order ? `Product: ${order.product_name}
Order Date: ${order.order_date}
Delivery Date: ${order.delivery_date}
Status: ${order.status}
` : "No recent order found"}

=== RELEVANT POLICIES ===
`;

  if (kbArticles && kbArticles.length > 0) {
    for (const article of kbArticles) {
      context += `\n${article.category.toUpperCase()}: ${article.content}\n`;
    }
  } else {
    context += "No specific policies found for this inquiry.\n";
  }

  return context;
}

/**
 * Build the system prompt with guardrails
 */
function buildSystemPrompt(brand: any, context: string): string {
  return `You are a customer support specialist for ${brand.name}. Your role is to generate professional, empathetic customer support responses based strictly on the provided context and policies.

CRITICAL GUARDRAILS:
1. Answer ONLY using the information provided in the context below. Do NOT invent or assume policy details.
2. If the customer's situation is not clearly covered by the provided policies (e.g., outside stated timeframes, ambiguous edge cases, or missing information), do NOT confidently promise an outcome.
3. Instead, when uncertain:
   - Acknowledge and empathize with the customer's issue
   - Explain what you can confirm from the policy
   - Ask clarifying questions OR indicate that a specialist will review their case
   - Offer next steps (e.g., "A specialist will confirm your eligibility within 24 hours")
4. Always maintain the tone and voice guidelines for the brand.
5. Be professional, friendly, and solution-oriented.
6. If a policy explicitly excludes the customer's situation (e.g., refund requested outside the 30-day window), gently explain the policy limit and offer alternative solutions if available.

CONTEXT (Brand policies and customer information):
${context}

Generate a professional, policy-grounded customer response now.`;
}

/**
 * Call OpenRouter API with the system prompt and conversation history
 */
async function callOpenRouter(systemPrompt: string, messages: any[], apiKey: string): Promise<string> {
  try {
    const model = "openai/gpt-4o-mini"; // Changed from anthropic/claude-3-5-haiku for better compatibility
    
    const requestBody = {
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    };

    console.log(`Calling OpenRouter API with model: ${model}`);
    console.log(`API Key present: ${apiKey ? "yes (length: " + apiKey.length + ")" : "no"}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://cx-reply-assistant.vercel.app",
        "X-Title": "CX Reply Assistant",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`OpenRouter response status: ${response.status}`);

    const responseText = await response.text();
    console.log(`OpenRouter response: ${responseText.substring(0, 500)}`);

    if (!response.ok) {
      console.error(`OpenRouter API error: ${response.status} - ${responseText}`);
      throw new Error(`OpenRouter API error: ${response.status} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse OpenRouter response as JSON:", responseText);
      throw new Error(`Invalid JSON response from OpenRouter: ${responseText}`);
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid OpenRouter response format:", JSON.stringify(data));
      throw new Error("Invalid response format from OpenRouter API");
    }

    return data.choices[0].message.content;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`OpenRouter API call failed: ${errorMessage}`);
    throw error;
  }
}
