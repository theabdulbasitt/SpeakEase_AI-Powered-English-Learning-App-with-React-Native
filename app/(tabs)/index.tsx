import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import SpeakingExercise from '../../components/SpeakingExercise';

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>AI English Learning</Text>
          <Text style={styles.subtitle}>
            Your Personal English Learning Assistant
          </Text>
        </View>

        <View style={styles.exerciseContainer}>
          <Text style={styles.sectionTitle}>Speaking Exercise</Text>
          <SpeakingExercise />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  exerciseContainer: {
    flex: 1,
  },
});
