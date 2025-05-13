import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { transcribeAudio, getAIResponse, textToSpeech } from '../utils/ai';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  isQuestion?: boolean;
}

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    startNewConversation();
    return () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, []);

  const startNewConversation = async () => {
    try {
      setIsProcessing(true);
      const initialPrompt = `You are an English conversation tutor. 
        Ask the user a simple question to start a conversation.
        
        IMPORTANT FORMATTING RULES:
        - Keep your question brief and natural
        - Use plain text only
        - Do not use any special characters (* _ # -)
        - Do not use any markdown formatting
        - Use simple line breaks for separation`;

      const question = await getAIResponse(initialPrompt);
      const cleanedQuestion = question.replace(/[\*\_\#\-\[\]]/g, '').trim();

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        text: cleanedQuestion,
        isUser: false,
        isQuestion: true,
      };

      setMessages([aiMessage]);
      await playResponseAudio(cleanedQuestion);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return;

      const response = await fetch(uri);
      const audioBuffer = await response.arrayBuffer();
      const transcript = await transcribeAudio(audioBuffer);

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: transcript,
        isUser: true,
      };
      setMessages((prev) => [...prev, userMessage]);

      const aiPrompt = `You are a helpful English tutor having a conversation.
        Respond to this message: "${transcript}"
        
        IMPORTANT FORMATTING RULES:
        - Respond naturally and ask a follow-up question
        - Use plain text only
        - Do not use any special characters (* _ # -)
        - Do not use any markdown formatting
        - Use simple line breaks for separation`;

      const aiResponse = await getAIResponse(aiPrompt);
      const cleanedResponse = aiResponse.replace(/[\*\_\#\-\[\]]/g, '').trim();

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: cleanedResponse,
        isUser: false,
        isQuestion: true,
      };
      setMessages((prev) => [...prev, aiMessage]);

      await playResponseAudio(cleanedResponse);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to process recording:', error);
    } finally {
      setIsProcessing(false);
      setRecording(null);
    }
  };

  const generateReport = async () => {
    try {
      setIsGeneratingReport(true);
      const transcript = messages
        .map((msg) => `${msg.isUser ? 'User' : 'AI'}: ${msg.text}`)
        .join('\n');

      const evaluationPrompt = `
        As an English language expert, evaluate this conversation:
        ${transcript}

        Provide a detailed report with the following structure:
        1. Response Relevance
        2. Grammar Analysis
        3. Pronunciation/Word Choice
        4. Overall Fluency
        5. Suggestions

        IMPORTANT FORMATTING RULES:
        - Use plain text only
        - Do not use any special characters (* _ # -)
        - Do not use any markdown formatting
        - Use numbers for listing (1. 2. 3.)
        - Use simple line breaks for separation
        - Keep formatting clean and simple`;

      const evaluation = await getAIResponse(evaluationPrompt);
      const cleanedEvaluation = evaluation
        .replace(/[\*\_\#\-\[\]]/g, '')
        .trim();
      setReport(cleanedEvaluation);
      await playResponseAudio(
        "Here's your conversation report: " + cleanedEvaluation
      );
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const playResponseAudio = async (text: string) => {
    try {
      if (currentSound?.unloadAsync) {
        try {
          await currentSound.unloadAsync();
        } catch (error) {
          console.warn('Error unloading previous sound:', error);
        }
      }
      setCurrentSound(null);

      const sound = await textToSpeech(text);
      if (!sound) {
        console.warn('No sound object returned from TTS');
        return;
      }

      const typedSound = sound as unknown as Audio.Sound;
      setCurrentSound(typedSound);

      if (sound.setOnPlaybackStatusUpdate) {
        sound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
          if (status?.isLoaded && status?.didJustFinish) {
            try {
              await sound.unloadAsync();
            } catch (error) {
              console.warn('Error unloading finished sound:', error);
            }
            setCurrentSound(null);
          }
        });
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      setCurrentSound(null);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.isUser ? styles.userText : styles.aiText,
              ]}
            >
              {message.text}
            </Text>
          </View>
        ))}

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}

        {report && (
          <View style={styles.reportContainer}>
            <Text style={styles.reportTitle}>Conversation Report</Text>
            <Text style={styles.reportText}>{report}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recording]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>
            {isRecording ? 'Stop' : 'Hold to Speak'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.reportButton,
            (isGeneratingReport || messages.length < 2) &&
              styles.disabledButton,
          ]}
          onPress={generateReport}
          disabled={isGeneratingReport || messages.length < 2}
        >
          <Text style={styles.reportButtonText}>
            {isGeneratingReport ? 'Generating Report...' : 'Generate Report'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  messagesContainer: {
    flex: 1,
    padding: 12,
  },
  messagesContent: {
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: '#1a1a1a',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#f7f7f8',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#1a1a1a',
  },
  controlsContainer: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recording: {
    backgroundColor: '#f7f7f8',
    borderColor: '#1a1a1a',
  },
  buttonText: {
    color: '#1a1a1a',
    fontSize: 15,
    fontWeight: '500',
  },
  reportButton: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  disabledButton: {
    backgroundColor: '#f7f7f8',
    borderColor: '#e0e0e0',
  },
  reportButtonText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '500',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  processingText: {
    marginLeft: 8,
    color: '#666666',
    fontSize: 14,
  },
  reportContainer: {
    backgroundColor: '#f7f7f8',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  reportText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1a1a1a',
  },
});
