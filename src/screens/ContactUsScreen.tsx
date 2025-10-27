import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';

interface ContactUsScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function ContactUsScreen({ onNavigate }: ContactUsScreenProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // In a real app, this would send data to a server
    Alert.alert(
      'Message Sent!',
      'Thank you for contacting us. We will get back to you as soon as possible.',
      [{ text: 'OK', onPress: () => {
        setFormData({ name: '', email: '', subject: '', message: '' });
      }}]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('landing')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Contact Us</Text>
        <Text style={styles.subtitle}>We'd love to hear from you</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Have questions or feedback? Send us a message and we'll get back to you within 24 hours.
        </Text>

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

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Send Message</Text>
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
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
});

