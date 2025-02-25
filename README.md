# WhatsApp Message Encoder and Encoder Bot

A WhatsApp bot that allows users to encode and decode hidden messages using emojis. Users can send messages to the bot, and it will encode them into emoji patterns or decode existing emoji messages.

## Features

- Encode text messages into emoji patterns
- Decode emoji patterns back to text
- Interactive WhatsApp interface
- Support for multiple emoji choices
- Simple "1" or "2" command system

## How It Works

### Message Encoding & Decoding

The bot uses a unique encoding system that can hide messages of any length within emojis or characters:

- **Single Emoji Encoding**: An entire message, regardless of length, can be encoded into a single emoji. This makes it perfect for hiding long messages in seemingly innocent emojis.
  ```
  "Hello, this is a secret message!" → "😀" (encoded)
  "😀" → "Hello, this is a secret message!" (decoded)
  ```

- **Character-Based Encoding**: Messages can also be encoded into regular alphabet letters, making them appear as normal text.
  ```
  "Top secret information" → "a" (encoded)
  "a" → "Top secret information" (decoded)
  ```

- **Multiple Character Support**: The encoding system supports:
  - All standard text characters
  - Special characters
  - Numbers
  - Emojis
  - Unicode characters

- **Stealth Communication**: Perfect for sending hidden messages that look like regular emojis or text in any chat platform.