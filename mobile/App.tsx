import React, { useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

// Change this to your computer's IP address when running locally
// For production, change to your deployed URL
// Change this to your computer's IP address when running locally
// For production, change to your deployed URL
const WEB_APP_URL = 'http://100.102.107.196:3000';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHelp}>
            {'\n'}Make sure:{'\n'}
            1. Your frontend is running (npm run dev in frontend folder){'\n'}
            2. Your phone is on the same WiFi as your computer{'\n'}
            3. The URL is correct: {WEB_APP_URL}{'\n'}
            {'\n'}Try running this on your computer:{'\n'}
            curl {WEB_APP_URL}
          </Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: WEB_APP_URL }}
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Loading Gym Scroller...</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setError(`Failed to load: ${nativeEvent.description || 'Unknown error'}`);
            console.warn('WebView error:', nativeEvent);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setError(`HTTP Error ${nativeEvent.statusCode}: Cannot reach ${WEB_APP_URL}`);
          }}
          // Allow videos to play inline
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // Enable JavaScript
          javaScriptEnabled={true}
          // Allow file access for camera/uploads if needed
          allowFileAccess={true}
          // Improve performance
          cacheEnabled={true}
          // Handle navigation
          onShouldStartLoadWithRequest={(request) => {
            // Allow all navigation within your app
            return true;
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHelp: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'left',
    lineHeight: 20,
  },
});
