import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface AboutUsScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function AboutUsScreen({ onNavigate }: AboutUsScreenProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('landing')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>About Us</Text>
        <Text style={styles.subtitle}>Connecting Ireland's farms with nature lovers</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.sectionText}>
          WildFarmStays was born from a passion for Ireland's rural heritage and a desire to support 
          local farmers while providing unique, authentic experiences for travelers. We connect farmers 
          who want to share their land with campers seeking genuine countryside adventures.
        </Text>

        <Text style={styles.sectionTitle}>What We Do</Text>
        <Text style={styles.sectionText}>
          We provide a platform where farmers can list their available land for campers, and travelers 
          can discover and book authentic farm stays across Ireland. Our mission is to support sustainable 
          tourism and help local farmers generate additional income from their land.
        </Text>

        <Text style={styles.sectionTitle}>Why Choose Us?</Text>
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Verified farm listings across Ireland</Text>
          </View>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Direct communication with farmers</Text>
          </View>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Supporting local farming communities</Text>
          </View>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Fair pricing for campers and farmers</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Our Story</Text>
        <Text style={styles.sectionText}>
          WildFarmStays started with a simple idea: connect people who love the countryside with farmers 
          who want to share their beautiful land. What began as a local project has grown into a 
          nationwide platform helping hundreds of campers discover Ireland's rural beauty while 
          supporting farmers across the country.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.sectionText}>
          Have questions? We'd love to hear from you! Visit our Contact page or reach out through 
          any of the methods listed below.
        </Text>

        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Email</Text>
          <Text style={styles.contactValue}>support@wildfarmstays.com</Text>

          <Text style={styles.contactLabel}>Phone</Text>
          <Text style={styles.contactValue}>+353 1 234 5678</Text>

          <Text style={styles.contactLabel}>Hours</Text>
          <Text style={styles.contactValue}>Monday - Friday: 9am - 5pm</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 12,
  },
  benefitsContainer: {
    marginBottom: 16,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 24,
  },
  contactInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 12,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
});

