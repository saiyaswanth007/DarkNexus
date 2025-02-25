import { NextResponse } from "next/server"
import { WhatsAppBotService } from "@/app/whatsapp-bot/whatsapp-service"

const whatsappBot = new WhatsAppBotService()

interface WhatsAppMessage {
  messaging_product: string
  to: string
  type: string
  text: {
    body: string
    preview_url?: boolean
    quick_replies?: Array<{
      type: string
      title: string
      payload: string
    }>
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("Incoming webhook payload:", JSON.stringify(body, null, 2))
    
    // Extract the message data from the WhatsApp webhook payload
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    if (!message) {
      console.log("No message found in payload:", body)
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    const userId = message.from
    const messageText = message.text?.body
    
    console.log("Processing message:", {
      userId,
      messageText,
      messageType: message.type,
      timestamp: new Date().toISOString()
    })

    // Process the message and get the response
    const response = whatsappBot.handleMessage(userId, messageText)
    console.log("Bot response:", response)

    // Send the response back to WhatsApp
    const result = await sendWhatsAppMessage(userId, response)
    console.log("Send result:", result)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Webhook handler error:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    })
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}

async function sendWhatsAppMessage(to: string, response: { text: string, options?: string[] }) {
  const whatsappToken = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!whatsappToken || !phoneNumberId) {
    throw new Error("Missing WhatsApp configuration")
  }

  const message = {
    messaging_product: "whatsapp",
    to: to,  // Don't format the number - use it as received from WhatsApp
    type: "text",
    text: { body: response.text }
  }

  const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${whatsappToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(message)
  })

  const responseData = await res.json()
  
  if (!res.ok) {
    console.error("WhatsApp API Response:", {
      status: res.status,
      data: responseData,
      request: {
        to,
        phoneNumberId,
        message
      }
    })
    throw new Error(`WhatsApp API error: ${JSON.stringify(responseData)}`)
  }

  return responseData
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Log the incoming verification request
    console.log("Webhook verification request:", {
      mode: searchParams.get('hub.mode'),
      token: searchParams.get('hub.verify_token'),
      challenge: searchParams.get('hub.challenge')
    })
    
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    // Verify that the mode and token are correct
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log("Webhook verified successfully")
      return new Response(challenge, { 
        status: 200,
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }

    console.log("Webhook verification failed")
    return new Response('Forbidden', { status: 403 })
  } catch (error) {
    console.error("Webhook verification error:", error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 