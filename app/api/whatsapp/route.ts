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
    
    // Extract the message data from the WhatsApp webhook payload
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    if (!message) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    const userId = message.from
    const messageText = message.text?.body

    // Process the message and get the response
    const response = whatsappBot.handleMessage(userId, messageText)

    // Send the response back to WhatsApp
    await sendWhatsAppMessage(userId, response)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("WhatsApp webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function sendWhatsAppMessage(to: string, response: { text: string, options?: string[] }) {
  const whatsappToken = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!whatsappToken || !phoneNumberId) {
    throw new Error("Missing WhatsApp configuration")
  }

  const message: WhatsAppMessage = {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: { body: response.text }
  }

  // If there are options, add them as quick reply buttons
  if (response.options?.length) {
    message.text.preview_url = false
    message.text.quick_replies = response.options.map(option => ({
      type: "text",
      title: option,
      payload: option
    }))
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

  if (!res.ok) {
    throw new Error(`Failed to send WhatsApp message: ${res.statusText}`)
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Get the verification token from query parameters
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Verify that the mode and token are correct
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
} 