import { encode, decode } from "../encoding"
import { EMOJI_LIST } from "../emoji"

type MessageType = "encode" | "decode"

interface BotResponse {
  text: string
  options?: string[]
}

export class WhatsAppBotService {
  private static WELCOME_MESSAGE = "Welcome! Would you like to:\n1. Encode a message\n2. Decode a message"
  private static ENCODE_PROMPT = "Please enter the text you'd like to encode:"
  private static DECODE_PROMPT = "Please paste the emoji message you'd like to decode:"
  private static INVALID_OPTION = "Please select a valid option (1 or 2)"
  
  private userStates: Map<string, {
    step: "initial" | "awaiting_input"
    type?: MessageType
  }> = new Map()

  handleMessage(userId: string, message: string): BotResponse {
    const userState = this.userStates.get(userId) || { step: "initial" }

    if (userState.step === "initial") {
      return this.handleInitialStep(userId, message)
    } else if (userState.step === "awaiting_input") {
      return this.handleInput(userId, message, userState.type!)
    }

    return { text: WhatsAppBotService.WELCOME_MESSAGE }
  }

  private handleInitialStep(userId: string, message: string): BotResponse {
    if (message === "1") {
      this.userStates.set(userId, { step: "awaiting_input", type: "encode" })
      return { text: WhatsAppBotService.ENCODE_PROMPT }
    } else if (message === "2") {
      this.userStates.set(userId, { step: "awaiting_input", type: "decode" })
      return { text: WhatsAppBotService.DECODE_PROMPT }
    } else {
      return { 
        text: WhatsAppBotService.INVALID_OPTION,
        options: ["1", "2"]
      }
    }
  }

  private handleInput(userId: string, message: string, type: MessageType): BotResponse {
    try {
      let result: string
      if (type === "encode") {
        // Use the first emoji from the list as default
        result = encode(EMOJI_LIST[0], message)
      } else {
        result = decode(message)
      }

      // Reset user state
      this.userStates.set(userId, { step: "initial" })

      return {
        text: `${type === "encode" ? "Encoded" : "Decoded"} message:\n${result}\n\n${WhatsAppBotService.WELCOME_MESSAGE}`,
        options: ["1", "2"]
      }
    } catch (error) {
      return {
        text: `Error: Invalid input for ${type}. ${WhatsAppBotService.WELCOME_MESSAGE}`,
        options: ["1", "2"]
      }
    }
  }
} 