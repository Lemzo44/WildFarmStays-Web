import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface TermsScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function TermsScreen({ onNavigate }: TermsScreenProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => onNavigate?.('landing')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate?.('landing')} style={styles.homeButton}>
            <Text style={styles.homeButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.subtitle}>Last updated: December 2024</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.sectionText}>
          By accessing and using WildFarmStays, you accept and agree to be bound by the terms and provision of this agreement.
        </Text>

        <Text style={styles.sectionTitle}>2. Use License</Text>
        <Text style={styles.sectionText}>
          Permission is granted to temporarily access the materials on WildFarmStays for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
        </Text>
        <Text style={styles.bulletPoint}>• Modify or copy the materials</Text>
        <Text style={styles.bulletPoint}>• Use the materials for any commercial purpose</Text>
        <Text style={styles.bulletPoint}>• Attempt to decompile or reverse engineer any software</Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.sectionText}>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.
        </Text>

        <Text style={styles.sectionTitle}>4. Booking and Payments</Text>
        <Text style={styles.sectionText}>
          When you book a farm stay, you enter into a contract directly with the host. WildFarmStays is not a party to this contract. We facilitate the booking but are not responsible for the accommodation or services provided.
        </Text>

        <Text style={styles.sectionTitle}>5. Cancellation Policy</Text>
        <Text style={styles.sectionText}>
          Cancellation policies are set by individual hosts. Please review the cancellation policy before booking. Refunds are subject to the host's cancellation policy.
        </Text>

        <Text style={styles.sectionTitle}>6. Disclaimer</Text>
        <Text style={styles.sectionText}>
          The materials on WildFarmStays are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties.
        </Text>

        <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
        <Text style={styles.sectionText}>
          In no event shall WildFarmStays or its suppliers be liable for any damages arising out of the use or inability to use the materials on WildFarmStays.
        </Text>

        <Text style={styles.sectionTitle}>8. Modifications</Text>
        <Text style={styles.sectionText}>
          WildFarmStays may revise these terms of service at any time without notice. By using this service you are agreeing to be bound by the then current version of these terms of service.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact Information</Text>
        <Text style={styles.sectionText}>
          If you have any questions about these Terms of Service, please contact us through our Contact Us page.
        </Text>
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
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flex: 1,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  homeButtonText: {
    color: '#2E7D32',
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
    fontSize: 14,
    color: '#E8F5E8',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
  },
});

