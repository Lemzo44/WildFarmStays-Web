import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface JoinCamperScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function JoinCamperScreen({ onNavigate }: JoinCamperScreenProps) {
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
        <Text style={styles.title}>Join as a Camper</Text>
        <Text style={styles.subtitle}>Discover authentic farm experiences across Ireland</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Why Join as a Camper?</Text>
        <Text style={styles.description}>
          Experience the beauty of Ireland's countryside while staying at authentic working farms. Connect with local farmers, enjoy peaceful rural settings, and support sustainable agriculture.
        </Text>

        <View style={styles.benefitsContainer}>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>🏕️</Text>
            <Text style={styles.benefitTitle}>Unique Stays</Text>
            <Text style={styles.benefitText}>
              Access to verified farm listings across Ireland
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>💰</Text>
            <Text style={styles.benefitTitle}>Fair Prices</Text>
            <Text style={styles.benefitText}>
              Affordable stays starting from £15/night
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>💬</Text>
            <Text style={styles.benefitTitle}>Direct Communication</Text>
            <Text style={styles.benefitText}>
              Message farmers directly before and during your stay
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>⭐</Text>
            <Text style={styles.benefitTitle}>Verified Farms</Text>
            <Text style={styles.benefitText}>
              All listings reviewed and verified for quality
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>📅</Text>
            <Text style={styles.benefitTitle}>Easy Booking</Text>
            <Text style={styles.benefitText}>
              Simple booking process with availability checking
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>🔒</Text>
            <Text style={styles.benefitTitle}>Secure Platform</Text>
            <Text style={styles.benefitText}>
              Your information is protected and private
            </Text>
          </View>
        </View>

        <Text style={styles.howItWorksTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Sign up with your email</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Browse verified farm listings</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Book your farm stay experience</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>Connect with the farmer</Text>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => onNavigate?.('register', 'camper')}
          >
            <Text style={styles.ctaButtonText}>Sign Up Now - It's Free!</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate?.('login')}>
            <Text style={styles.alreadyHaveAccount}>Already have an account? Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 16,
    color: '#E8F5E8',
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 32,
  },
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  benefitCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    width: '47%',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  howItWorksTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  stepsContainer: {
    marginBottom: 32,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 16,
    color: '#333',
  },
  ctaSection: {
    backgroundColor: '#E8F5E8',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  ctaButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 16,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  alreadyHaveAccount: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
});

