import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import {
  getExercise,
  transcribeAudio,
  evaluatePronunciation,
} from '../utils/ai';

interface ExerciseContent {
  paragraph: string;
  vocabulary: string;
  pronunciation: string;
}

export default function SpeakingExercise() {
  const [exerciseContent, setExerciseContent] = useState<ExerciseContent>({
    paragraph: '',
    vocabulary: '',
    pronunciation: '',
  });
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExercise();
  }, []);

  const loadExercise = async () => {
    try {
      setLoading(true);
      const content = await getExercise('intermediate');
      setExerciseContent(content);
    } catch (error) {
      console.error('Error loading exercise:', error);
    } finally {
      setLoading(false);
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
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return;

      const response = await fetch(uri);
      const audioBuffer = await response.arrayBuffer();
      const transcript = await transcribeAudio(audioBuffer);
      const aiFeedback = await evaluatePronunciation(
        exerciseContent.paragraph,
        transcript
      );
      const cleanedFeedback = aiFeedback.replace(/[\*\_\#]/g, '').trim();
      setFeedback(cleanedFeedback);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }

    setRecording(null);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loading}>Loading exercise...</Text>
      ) : (
        <View style={styles.mainContainer}>
          <View style={styles.exerciseContent}>
            <View style={[styles.bubble, styles.paragraphBubble]}>
              <Text style={styles.bubbleTitle}>Paragraph</Text>
              <Text style={styles.contentText}>
                {exerciseContent.paragraph}
              </Text>
            </View>

            <View style={[styles.bubble, styles.vocabularyBubble]}>
              <Text style={styles.bubbleTitle}>Key Vocabulary</Text>
              <Text style={styles.contentText}>
                {exerciseContent.vocabulary}
              </Text>
            </View>

            <View style={[styles.bubble, styles.pronunciationBubble]}>
              <Text style={styles.bubbleTitle}>Pronunciation Tips</Text>
              <Text style={styles.contentText}>
                {exerciseContent.pronunciation}
              </Text>
            </View>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recording]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.buttonText}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </TouchableOpacity>

            {feedback && (
              <View style={styles.feedbackBubble}>
                <Text style={styles.bubbleTitle}>AI Feedback</Text>
                <Text style={styles.feedbackText}>{feedback}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mainContainer: {
    flex: 1,
    padding: 12,
  },
  exerciseContent: {
    flex: 1,
    gap: 16,
  },
  bubble: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  bubbleTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  paragraphBubble: {
    backgroundColor: '#f7f7f8',
  },
  vocabularyBubble: {
    backgroundColor: '#f0f7ff',
  },
  pronunciationBubble: {
    backgroundColor: '#f0fff4',
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1a1a1a',
  },
  controlsContainer: {
    gap: 16,
    paddingTop: 8,
  },
  recordButton: {
    backgroundColor: '#ffffff',
    padding: 14,
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
  feedbackBubble: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  feedbackText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1a1a1a',
  },
  loading: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    padding: 20,
  },
});
