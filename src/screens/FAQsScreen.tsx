import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface FAQsScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function FAQsScreen({ onNavigate }: FAQsScreenProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  useEffect(() => {
    // Scroll to top when component mounts
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, []);

  const faqs = [
    {
      id: '1',
      question: 'What is WildFarmStays?',
      answer: 'WildFarmStays is a platform connecting campers with farmers in Ireland, offering authentic farm experiences in the countryside. Campers can book stays at verified farms and connect directly with farmers.'
    },
    {
      id: '2',
      question: 'How do I book a farm stay?',
      answer: 'Browse available farms, select your dates, check availability, and click "Book Now". The farmer will receive your booking request and can confirm or decline. You\'ll be notified of the status.'
    },
    {
      id: '3',
      question: 'What amenities are typically available?',
      answer: 'Amenities vary by farm but commonly include parking, toilets, showers, fire pits, and sometimes WiFi and electric hookups. Check each listing for specific amenities before booking.'
    },
    {
      id: '4',
      question: 'How much does it cost?',
      answer: 'Prices vary by farm and location. Most stays range from £15-£40 per night depending on amenities and location. Prices are clearly displayed on each listing.'
    },
    {
      id: '5',
      question: 'Can I cancel my booking?',
      answer: 'Cancellation policies vary by farm. Each listing displays its cancellation policy. Please review this before booking. Contact the farmer directly if you need to discuss cancellation.'
    },
    {
      id: '6',
      question: 'How do I become a host?',
      answer: 'Click "Join as a Host" to create an account, verify your farm, and start listing your property. You\'ll be able to set your own prices, amenities, and availability.'
    },
    {
      id: '7',
      question: 'Is it safe?',
      answer: 'All farms are verified before listing. We recommend reading reviews and messaging farmers before booking to ensure the stay meets your expectations.'
    },
    {
      id: '8',
      question: 'Can I message farmers before booking?',
      answer: 'Yes! Once logged in, you can send messages to any farmer to ask questions about their listing, amenities, or farm experience.'
    }
  ];

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

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
        <Text style={styles.title}>Frequently Asked Questions</Text>
      </View>

      <View style={styles.content}>
        {faqs.map((faq) => (
          <View key={faq.id} style={styles.faqCard}>
            <TouchableOpacity
              style={styles.faqHeader}
              onPress={() => toggleFAQ(faq.id)}
            >
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.toggleIcon}>
                {expandedFAQ === faq.id ? '−' : '+'}
              </Text>
            </TouchableOpacity>
            {expandedFAQ === faq.id && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Still have questions?</Text>
        <Text style={styles.helpText}>Contact us for more information</Text>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => onNavigate?.('contact')}
        >
          <Text style={styles.contactButtonText}>Contact Us</Text>
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
  content: {
    padding: 16,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  toggleIcon: {
    fontSize: 24,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  faqAnswer: {
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  helpSection: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  contactButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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

