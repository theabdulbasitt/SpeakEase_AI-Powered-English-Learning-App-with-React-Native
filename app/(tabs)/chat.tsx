import React from 'react';
import { View, StyleSheet } from 'react-native';
import AIChat from '../../components/AIChat';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <AIChat />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
});
