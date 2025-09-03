# AI English Learning App

A mobile application designed to help users improve their English language skills through AI-powered conversations and speech analysis.

## Features

### 1. AI Conversation Mode
- Real-time chat with AI using voice
- Speech-to-text conversion
- Instant AI responses
- Pronunciation feedback
- Grammar and fluency analysis

### 2. Descriptive Speech Mode
- Topic-based speaking exercises
- Detailed pronunciation feedback
- Vocabulary suggestions
- Performance benchmarking

## Technical Stack

- **Frontend**: React Native with Expo
- **AI Services**: 
  - Deepgram API (Speech-to-Text)
  - Google Gemini API (Language Processing)
- **Storage**: AsyncStorage for temporary conversation data

## Getting Started

### Prerequisites
- Node.js
- npm or yarn
- Expo Go app on your mobile device
- Deepgram API key
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <url>
```

2. Install dependencies:
```bash
npm install
```



3. Configure API keys:
Create a `config/api.ts` file:
```typescript
export const DEEPGRAM_API_KEY = 'your_deepgram_api_key';    // One should always initialize the secrets in .env file and must not commit to staging for that use .gitignore file
export const GEMINI_API_KEY = 'your_gemini_api_key';
```

4. Start the development server:
```bash
npm run dev
```

5. Scan the QR code with Expo Go app on your mobile device

## Usage

### AI Conversation Mode
1. Open the app and select "AI Conversation"
2. Tap the microphone button to start speaking
3. Release to stop recording
4. Wait for AI feedback and response
5. Review pronunciation and grammar feedback

### Descriptive Speech Mode
1. Select "Descriptive Speech"
2. Choose a topic or prompt
3. Record your response
4. Receive detailed feedback on:
   - Pronunciation
   - Grammar
   - Vocabulary
   - Overall fluency

## Proficiency Levels

The app provides feedback based on four proficiency levels:
- Poor English
- Beginner
- Conversational
- Native

Each level is determined by analyzing:
- Grammatical accuracy
- Pronunciation clarity
- Vocabulary usage
- Overall fluency

## Data Privacy

- All conversation data is stored temporarily
- Data is cleared when the app is closed
- No permanent storage of user conversations
- No data is shared with third parties

## Development Roadmap

### Phase 1 (Current)
- ✅ Basic conversation interface
- ✅ Speech-to-text integration
- ✅ AI response generation
- ✅ Basic feedback system

### Phase 2 (Planned)
- 🔄 Enhanced error analysis
- 🔄 Progress tracking
- 🔄 Offline mode
- 🔄 Custom exercise creation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

- Deepgram for speech-to-text capabilities
- Google Gemini for AI language processing
- Expo team for the development framework
- React Native community for the mobile framework 
