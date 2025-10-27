import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface LandingPageProps {
  onNavigate?: (screen: string, data?: any) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroTitle}>WildFarmStays</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => onNavigate?.('login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.heroSubtitle}>
          Experience authentic farm life in Ireland's countryside
        </Text>
        <View style={styles.heroButtons}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => onNavigate?.('join-camper')}
          >
            <Text style={styles.primaryButtonText}>Find Your Stay</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => onNavigate?.('join-host')}
          >
            <Text style={styles.secondaryButtonText}>List Your Farm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose WildFarmStays?</Text>
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🏕️</Text>
            <Text style={styles.featureTitle}>Unique Stays</Text>
            <Text style={styles.featureDescription}>
              Discover authentic farm experiences across Ireland
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🐄</Text>
            <Text style={styles.featureTitle}>Connect with Nature</Text>
            <Text style={styles.featureDescription}>
              Experience rural life and connect with farmers
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>⭐</Text>
            <Text style={styles.featureTitle}>Verified Farms</Text>
            <Text style={styles.featureDescription}>
              All listings verified for quality and safety
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>💰</Text>
            <Text style={styles.featureTitle}>Fair Pricing</Text>
            <Text style={styles.featureDescription}>
              Support local farmers while you stay
            </Text>
          </View>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Browse Farms</Text>
              <Text style={styles.stepDescription}>
                Search through verified farm stays across Ireland
              </Text>
            </View>
          </View>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Book Your Stay</Text>
              <Text style={styles.stepDescription}>
                Choose dates and secure your farm experience
              </Text>
            </View>
          </View>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Connect & Enjoy</Text>
              <Text style={styles.stepDescription}>
                Message farmers and experience authentic rural life
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Call to Action */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Start Your Adventure?</Text>
        <Text style={styles.ctaSubtitle}>
          Join hundreds of campers experiencing Ireland's countryside
        </Text>
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={() => onNavigate?.('register', 'camper')}
        >
          <Text style={styles.ctaButtonText}>Get Started for Free</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => onNavigate?.('about')}>
            <Text style={styles.footerLink}>About Us</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate?.('faqs')}>
            <Text style={styles.footerLink}>FAQs</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate?.('terms')}>
            <Text style={styles.footerLink}>Terms</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate?.('privacy')}>
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate?.('contact')}>
            <Text style={styles.footerLink}>Contact</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footerText}>© 2024 WildFarmStays. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  heroSection: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    position: 'relative',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
    paddingRight: 12,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    maxWidth: 100,
    minWidth: 70,
  },
  loginButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: 'bold',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
    marginBottom: 24,
    textAlign: 'center',
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    padding: 32,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  featureCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    width: '47%',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 24,
  },
  stepCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  ctaSection: {
    backgroundColor: '#E8F5E8',
    padding: 40,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#333',
    padding: 32,
    alignItems: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerLink: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
});

