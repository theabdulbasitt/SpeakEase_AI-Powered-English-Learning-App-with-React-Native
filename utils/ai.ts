import { Buffer } from 'buffer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DEEPGRAM_API_KEY, ASSEMBLY_AI_KEY, GEMINI_API_KEY } from '../config/api';
import { Audio } from 'expo-av';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Function to transcribe audio using Deepgram REST API
export async function transcribeAudio(audioBuffer: ArrayBuffer) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            console.log('Sending audio buffer for transcription, size:', audioBuffer.byteLength);

            const response = await fetch('https://api.deepgram.com/v1/listen?model=nova&language=en&smart_format=true&punctuate=true', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${DEEPGRAM_API_KEY}`,
                    'Content-Type': 'audio/wav',
                },
                body: audioBuffer
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Deepgram API error:', response.status, JSON.stringify(errorData));
                throw new Error(`Deepgram API error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            
            if (!data.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
                console.error('No transcription in response:', data);
                throw new Error('No transcription result');
            }

            const transcript = data.results.channels[0].alternatives[0].transcript;
            console.log('Transcription successful:', transcript);
            return transcript;
        } catch (error) {
            console.error('Transcription error details:', error);
            attempt++;
            if (attempt >= maxRetries) {
                throw error;
            }
            console.log(`Retrying transcription... (Attempt ${attempt + 1} of ${maxRetries})`);
        }
    }
}

// Function to convert text to speech using Assembly AI
export async function textToSpeech(text: string, shouldPlay: boolean = true) {
    try {
        // Create TTS request
        const createResponse = await fetch('https://api.assemblyai.com/v2/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': ASSEMBLY_AI_KEY
            },
            body: JSON.stringify({
                text: text,
                voice_id: "en_us_001", // Standard US English voice
                sample_rate: 44100
            })
        });

        if (!createResponse.ok) {
            throw new Error(`Assembly AI error: ${createResponse.status}`);
        }

        const responseText = await createResponse.text();
        console.log('Assembly AI response:', responseText); // Debug log
        
        const responseData = JSON.parse(responseText);
        const { audio_url } = responseData;
        
        if (!audio_url) {
            throw new Error('No audio URL in response');
        }

        // Download the audio file
        const audioResponse = await fetch(audio_url);
        if (!audioResponse.ok) {
            throw new Error(`Failed to download audio: ${audioResponse.status}`);
        }

        const audioData = await audioResponse.arrayBuffer();
        const base64data = Buffer.from(audioData).toString('base64');

        // Create and play the sound
        const { sound } = await Audio.Sound.createAsync(
            { uri: `data:audio/mp3;base64,${base64data}` },
            shouldPlay ? { shouldPlay: true } : {}
        );

        // Add methods to match the expected interface
        const enhancedSound = {
            ...sound,
            setOnPlaybackStatusUpdate: (callback: any) => {
                sound.setOnPlaybackStatusUpdate(callback);
                return sound;
            },
            unloadAsync: async () => {
                try {
                    await sound.unloadAsync();
                } catch (error) {
                    console.warn('Error unloading sound:', error);
                }
            }
        };

        return enhancedSound;
    } catch (error) {
        // console.error('Assembly AI TTS failed, using fallback:', error);
        
        try {
            // Use Google Translate TTS as fallback
            const { sound } = await Audio.Sound.createAsync(
                { uri: `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob` },
                shouldPlay ? { shouldPlay: true } : {}
            );

            // Add methods to match the expected interface
            const enhancedFallbackSound = {
                ...sound,
                setOnPlaybackStatusUpdate: (callback: any) => {
                    sound.setOnPlaybackStatusUpdate(callback);
                    return sound;
                },
                unloadAsync: async () => {
                    try {
                        await sound.unloadAsync();
                    } catch (error) {
                        console.warn('Error unloading fallback sound:', error);
                    }
                }
            };

            return enhancedFallbackSound;
        } catch (fallbackError) {
            // console.error('Fallback TTS also failed:', fallbackError);
            throw fallbackError;
        }
    }
}

// Function to get AI response
export async function getAIResponse(prompt: string) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('AI response error:', error);
        throw error;
    }
}

// Helper function to clean markdown formatting
function cleanMarkdown(text: string): string {
    return text.replace(/\*/g, '').replace(/\_/g, '').replace(/\#/g, '').trim();
}

// Function to evaluate English pronunciation
export async function evaluatePronunciation(
    originalText: string,
    spokenTranscript: string
) {
    try {
        const prompt = `As an English pronunciation expert, evaluate the following:
            Original text: "${originalText}"
            Spoken transcript: "${spokenTranscript}"
            
            Provide a clear evaluation with the following structure:
            1. Accuracy score (0-100)
            2. Specific pronunciation feedback
            3. Suggestions for improvement

            IMPORTANT FORMATTING RULES:
            - Do not use any special characters (* _ # -)
            - Do not use any markdown formatting
            - Use plain text only
            - Use numbers for listing (1. 2. 3.)
            - Use simple line breaks for separation`;

        const response = await getAIResponse(prompt);
        // Clean any possible markdown formatting
        return response.replace(/[\*\_\#\-\[\]]/g, '').trim();
    } catch (error) {
        console.error('Pronunciation evaluation error:', error);
        throw error;
    }
}

// Function to get speaking exercises
export async function getExercise(level: 'beginner' | 'intermediate' | 'advanced') {
    try {
        const prompt = `Generate an English speaking exercise for ${level} level students with the following format:

            [PARAGRAPH]
            Write a short paragraph (2-3 sentences) for the student to read.

            [VOCABULARY]
            List 3-4 key vocabulary words with their meanings.

            [PRONUNCIATION]
            Provide specific pronunciation tips for difficult words.

            IMPORTANT FORMATTING RULES:
            - Do not use any special characters (* _ # -)
            - Do not use any markdown formatting
            - Use plain text only
            - Use numbers for listing (1. 2. 3.)
            - Use simple line breaks for separation
            - Only use [PARAGRAPH], [VOCABULARY], and [PRONUNCIATION] as section markers`;

        const response = await getAIResponse(prompt);
        
        // Parse sections using markers
        const paragraphMatch = response.match(/\[PARAGRAPH\](.*?)\[VOCABULARY\]/s);
        const vocabularyMatch = response.match(/\[VOCABULARY\](.*?)\[PRONUNCIATION\]/s);
        const pronunciationMatch = response.match(/\[PRONUNCIATION\](.*?)$/s);

        // Clean any possible markdown formatting from each section
        return {
            paragraph: paragraphMatch ? paragraphMatch[1].replace(/[\*\_\#\-\[\]]/g, '').trim() : '',
            vocabulary: vocabularyMatch ? vocabularyMatch[1].replace(/[\*\_\#\-\[\]]/g, '').trim() : '',
            pronunciation: pronunciationMatch ? pronunciationMatch[1].replace(/[\*\_\#\-\[\]]/g, '').trim() : ''
        };
    } catch (error) {
        console.error('Exercise generation error:', error);
        throw error;
    }
} 