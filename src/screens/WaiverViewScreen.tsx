import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { detectWaiverType, getWaiverText, WaiverType } from '../utils/Waiver';

interface WaiverViewScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  listing?: any;
  waiverType?: WaiverType;
}

export default function WaiverViewScreen({ onNavigate, listing, waiverType }: WaiverViewScreenProps) {
  const resolvedWaiverType = useMemo(() => {
    if (waiverType) return waiverType;
    return detectWaiverType({ county: listing?.county, location: listing?.location });
  }, [listing, waiverType]);

  const waiverText = useMemo(() => getWaiverText(resolvedWaiverType), [resolvedWaiverType]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('booking', listing)} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Camper Waiver</Text>
        <Text style={styles.subtitle}>
          {resolvedWaiverType === 'northern-ireland' ? 'Northern Ireland' : 'Republic of Ireland'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.waiverText}>{waiverText}</Text>
      </View>

      <View style={styles.footerSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#E8F5E8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 20,
  },
  waiverText: {
    whiteSpace: 'pre-wrap' as unknown as undefined,
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  footerSpacing: {
    height: 40,
  },
});


