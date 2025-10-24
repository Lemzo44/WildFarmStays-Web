import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';

interface WebMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
  onPress?: () => void;
  children?: React.ReactNode;
}

export default function WebMarker({ coordinate, title, description, onPress, children }: WebMarkerProps) {
  return (
    <TouchableOpacity style={styles.webMarkerContainer} onPress={onPress}>
      <View style={styles.webMarker}>
        <Text style={styles.markerIcon}>🍃</Text>
      </View>
      <View style={styles.webMarkerInfo}>
        <Text style={styles.webMarkerTitle}>{title}</Text>
        <Text style={styles.webMarkerDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  webMarkerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 8,
    margin: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  webMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  markerIcon: {
    fontSize: 16,
  },
  webMarkerInfo: {
    flex: 1,
  },
  webMarkerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  webMarkerDescription: {
    fontSize: 12,
    color: '#666',
  },
});



