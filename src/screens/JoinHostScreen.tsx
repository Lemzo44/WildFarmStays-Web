import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface JoinHostScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function JoinHostScreen({ onNavigate }: JoinHostScreenProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('landing')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>List Your Farm</Text>
        <Text style={styles.subtitle}>Earn income from your farm land</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Why List Your Farm?</Text>
        <Text style={styles.description}>
          Join Irish farmers earning extra income by offering authentic farm experiences to campers. Reach new audiences, monetize your land, and share your farm's story with visitors from around the world.
        </Text>

        <View style={styles.benefitsContainer}>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>💰</Text>
            <Text style={styles.benefitTitle}>Earn Extra Income</Text>
            <Text style={styles.benefitText}>
              Set your own prices and earn from your unused land
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>👥</Text>
            <Text style={styles.benefitTitle}>Reach New Markets</Text>
            <Text style={styles.benefitText}>
              Connect with campers looking for unique rural experiences
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>⚙️</Text>
            <Text style={styles.benefitTitle}>Easy to Manage</Text>
            <Text style={styles.benefitText}>
              Simple dashboard to manage bookings and messages
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>📅</Text>
            <Text style={styles.benefitTitle}>Full Control</Text>
            <Text style={styles.benefitText}>
              Set your availability and manage your own calendar
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>📱</Text>
            <Text style={styles.benefitTitle}>Direct Communication</Text>
            <Text style={styles.benefitText}>
              Message campers directly before and after bookings
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>⭐</Text>
            <Text style={styles.benefitTitle}>Build Reviews</Text>
            <Text style={styles.benefitText}>
              Earn ratings and reviews to attract more campers
            </Text>
          </View>
        </View>

        <Text style={styles.howItWorksTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Create your farmer account</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Add your farm listing with details</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Set your prices and availability</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>Start receiving booking requests</Text>
          </View>
        </View>

        <Text style={styles.pricingTitle}>What You Get</Text>
        <View style={styles.pricingCard}>
          <Text style={styles.pricingText}>✓ FREE to list your farm</Text>
          <Text style={styles.pricingText}>✓ Keep 100% of your earnings</Text>
          <Text style={styles.pricingText}>✓ No commission fees</Text>
          <Text style={styles.pricingText}>✓ Manage everything from one dashboard</Text>
        </View>

        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => onNavigate?.('register', 'farmer')}
          >
            <Text style={styles.ctaButtonText}>Join as a Host - It's Free!</Text>
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
  pricingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 32,
  },
  pricingCard: {
    backgroundColor: '#E8F5E8',
    padding: 24,
    borderRadius: 12,
    marginBottom: 32,
  },
  pricingText: {
    fontSize: 16,
    color: '#2E7D32',
    marginBottom: 12,
    fontWeight: '600',
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

