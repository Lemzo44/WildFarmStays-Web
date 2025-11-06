import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LocalStorageService } from '../services/LocalStorageService';
import { APIService } from '../services/APIService';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../lib/supabase';
import { messageEmailWebhook } from '../lib/config';

interface ContactUsScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function ContactUsScreen({ onNavigate }: ContactUsScreenProps) {
  const { currentUser } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
    }
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.body?.scrollTo(0, 0);
      document.documentElement?.scrollTo(0, 0);
    }
  };

  useLayoutEffect(() => {
    scrollToTop();
  }, []);

  useEffect(() => {
    scrollToTop();
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToTop);
    });
    const timeoutId1 = setTimeout(scrollToTop, 50);
    const timeoutId2 = setTimeout(scrollToTop, 100);
    const timeoutId3 = setTimeout(scrollToTop, 200);
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setShowSuccess(false);

    try {
      // Check if user is logged in (camper or farmer)
      const isLoggedIn = currentUser && (currentUser.role === 'camper' || currentUser.role === 'farmer');
      
      if (isLoggedIn) {
        // Logged-in users: Create support ticket
        if (useSupabase) {
          const ticketData = {
            user_id: currentUser.id,
            name: formData.name,
            email: formData.email,
            subject: formData.subject || 'Contact Us Inquiry',
            message: formData.message,
            status: 'open',
          };

          console.log('Creating support ticket for logged-in user:', ticketData);
          const result = await APIService.create('support_tickets', ticketData);
          console.log('Support ticket created successfully:', result);
        } else {
          // Create support ticket in localStorage
          const ticket = {
            id: Date.now().toString(),
            subject: formData.subject || 'Contact Us Inquiry',
            message: formData.message,
            category: 'General',
            priority: 'normal',
            status: 'open',
            userName: formData.name,
            userEmail: formData.email,
            userId: currentUser.id,
            createdAt: new Date().toISOString(),
          };

          await LocalStorageService.save('tickets', ticket);
        }
      } else {
        // Public (non-logged-in) users: Store as contact message in support_tickets with user_id = NULL
        // This allows admin to view and respond to public contact messages
        if (useSupabase) {
          try {
            const contactData = {
              user_id: null, // NULL indicates public (non-logged-in) contact
              name: formData.name,
              email: formData.email,
              subject: formData.subject || 'Public Contact Inquiry',
              message: formData.message + (formData.phone ? `\n\nPhone: ${formData.phone}` : ''),
              status: 'open',
            };

            console.log('Creating public contact message:', contactData);
            const result = await APIService.create('support_tickets', contactData);
            console.log('Public contact message created successfully:', result);
            
            // Also send email notification to admin (optional)
            if (messageEmailWebhook) {
              try {
                await fetch(messageEmailWebhook, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    toEmail: 'admin@wildfarmstays.com',
                    toName: 'WildFarmStays Admin',
                    subject: `Public Contact Form: ${formData.subject || 'Contact Us Inquiry'}`,
                    messagePreview: `From: ${formData.name} (${formData.email}${formData.phone ? `, ${formData.phone}` : ''})\n\n${formData.message}`,
                    contactName: formData.name,
                    contactEmail: formData.email,
                    contactPhone: formData.phone || '',
                    contactMessage: formData.message,
                    contactSubject: formData.subject || 'Contact Us Inquiry',
                    isPublicContact: true,
                  }),
                });
                console.log('Email notification sent to admin');
              } catch (emailError) {
                console.warn('Email notification failed (non-critical):', emailError);
              }
            }
          } catch (error) {
            console.error('Error creating public contact message:', error);
            throw error; // Re-throw to show error to user
          }
        } else {
          // Fallback to localStorage for development
          const contact = {
            id: Date.now().toString(),
            subject: formData.subject || 'Public Contact Inquiry',
            message: formData.message + (formData.phone ? `\n\nPhone: ${formData.phone}` : ''),
            category: 'Public Contact',
            priority: 'normal',
            status: 'open',
            userName: formData.name,
            userEmail: formData.email,
            userId: null, // NULL indicates public contact
            createdAt: new Date().toISOString(),
          };

          await LocalStorageService.save('tickets', contact);
        }
      }
      
      // Show success message and clear form
      setShowSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      
      // Also show Alert as backup
      Alert.alert(
        'Message Sent!',
        isLoggedIn 
          ? 'Your support ticket has been created. We will get back to you as soon as possible.'
          : 'Thank you for contacting us. Your message has been received and we will get back to you as soon as possible.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting contact form:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView ref={scrollViewRef} contentOffset={{ x: 0, y: 0 }} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => onNavigate?.('landing')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate?.('landing')} style={styles.homeButton}>
            <Text style={styles.homeButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Contact Us</Text>
        <Text style={styles.subtitle}>We'd love to hear from you</Text>
      </View>

      <View style={styles.content}>
        {showSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>✓ Message sent successfully! We'll get back to you soon.</Text>
          </View>
        )}
        
        <Text style={styles.description}>
          Have questions or feedback? Send us a message and we'll get back to you within 24 hours.
        </Text>

        {currentUser && (
          <TouchableOpacity 
            style={styles.viewTicketsButton}
            onPress={() => onNavigate?.('my-support-tickets')}
          >
            <Text style={styles.viewTicketsButtonText}>📬 View My Support Tickets</Text>
          </TouchableOpacity>
        )}

        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => setFormData({ ...formData, name: value })}
            placeholder="Your name"
          />

          <Text style={styles.inputLabel}>Email *</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => setFormData({ ...formData, email: value })}
            placeholder="your.email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {!currentUser && (
            <>
              <Text style={styles.inputLabel}>Phone (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => setFormData({ ...formData, phone: value })}
                placeholder="+353 1 234 5678"
                keyboardType="phone-pad"
              />
            </>
          )}

          <Text style={styles.inputLabel}>Subject</Text>
          <TextInput
            style={styles.input}
            value={formData.subject}
            onChangeText={(value) => setFormData({ ...formData, subject: value })}
            placeholder="What is this about?"
          />

          <Text style={styles.inputLabel}>Message *</Text>
          <TextInput
            style={styles.textArea}
            value={formData.message}
            onChangeText={(value) => setFormData({ ...formData, message: value })}
            placeholder="Tell us how we can help..."
            multiline
            numberOfLines={6}
          />

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Other Ways to Reach Us</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📧</Text>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>support@wildfarmstays.com</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📱</Text>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>+353 1 234 5678</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>⏰</Text>
            <Text style={styles.infoLabel}>Hours</Text>
            <Text style={styles.infoValue}>Monday - Friday: 9am - 5pm</Text>
          </View>
        </View>
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
    fontSize: 16,
    color: '#E8F5E8',
  },
  content: {
    padding: 24,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  textArea: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 120,
    textAlignVertical: 'top',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successBanner: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  successBannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  viewTicketsButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  viewTicketsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 12,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
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

