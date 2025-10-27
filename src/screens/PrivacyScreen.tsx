import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface PrivacyScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function PrivacyScreen({ onNavigate }: PrivacyScreenProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to top when component mounts
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, []);

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => onNavigate?.('landing')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate?.('landing')} style={styles.homeButton}>
            <Text style={styles.homeButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>Last updated: December 2024</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.sectionText}>
          We collect information that you provide directly to us when you create an account, make a booking, or contact us. This includes your name, email address, phone number, and booking details.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.sectionText}>
          We use the information we collect to:
        </Text>
        <Text style={styles.bulletPoint}>• Process and manage your bookings</Text>
        <Text style={styles.bulletPoint}>• Communicate with you about your bookings</Text>
        <Text style={styles.bulletPoint}>• Improve our services and user experience</Text>
        <Text style={styles.bulletPoint}>• Send you important updates and notifications</Text>

        <Text style={styles.sectionTitle}>3. Information Sharing</Text>
        <Text style={styles.sectionText}>
          We share your information with farmers when you make a booking, including your name and contact details so they can confirm your reservation and communicate with you.
        </Text>

        <Text style={styles.sectionTitle}>4. Data Storage</Text>
        <Text style={styles.sectionText}>
          Your data is stored locally in your browser using localStorage. This means your account information, bookings, and preferences are stored on your device. We do not transmit this data to external servers without your consent.
        </Text>

        <Text style={styles.sectionTitle}>5. Cookies and Tracking</Text>
        <Text style={styles.sectionText}>
          We use localStorage to remember your login status and preferences. This is essential for the application to function properly.
        </Text>

        <Text style={styles.sectionTitle}>6. Your Rights</Text>
        <Text style={styles.sectionText}>
          You have the right to:
        </Text>
        <Text style={styles.bulletPoint}>• Access your personal information</Text>
        <Text style={styles.bulletPoint}>• Request correction of your data</Text>
        <Text style={styles.bulletPoint}>• Delete your account and data at any time</Text>

        <Text style={styles.sectionTitle}>7. Data Security</Text>
        <Text style={styles.sectionText}>
          We implement security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
        </Text>

        <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
        <Text style={styles.sectionText}>
          We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact Us</Text>
        <Text style={styles.sectionText}>
          If you have any questions about this Privacy Policy, please contact us through our Contact Us page.
        </Text>
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

