import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native';

interface WebMapProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  listings: any[];
  onMarkerPress?: (listing: any) => void;
  style?: any;
  children?: React.ReactNode;
}

export default function WebMap({ region, listings, onMarkerPress, style, children }: WebMapProps) {
  return (
    <View style={[styles.webMapContainer, style]}>
      <View style={styles.webMapPlaceholder}>
        <Text style={styles.webMapText}>🗺️ Interactive Map</Text>
        <Text style={styles.webMapSubtext}>
          {listings.length} listings found in this area
        </Text>
        <Text style={styles.webMapNote}>
          Map view available on mobile devices
        </Text>
        <View style={styles.mapControls}>
          <Text style={styles.mapControlText}>📍 Your Location</Text>
          <Text style={styles.mapControlText}>🔍 Zoom In/Out</Text>
          <Text style={styles.mapControlText}>🎯 Center Map</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  webMapContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderWidth: 2,
    borderColor: '#2E7D32',
    borderStyle: 'dashed',
    margin: 10,
    borderRadius: 10,
  },
  webMapText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  webMapSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  webMapNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  mapControls: {
    flexDirection: 'row',
    gap: 16,
  },
  mapControlText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
});



