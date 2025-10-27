import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<'camper' | 'farmer'>('camper');

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      let success = false;
      if (isRegistering) {
        success = await register(email, password, role);
      } else {
        success = await login(email, password);
      }

      if (!success) {
        Alert.alert('Error', isRegistering ? 'Registration failed' : 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred');
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WildFarmStays</Text>
        <Text style={styles.subtitle}>
          {isRegistering ? 'Create your account' : 'Welcome back!'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {isRegistering ? 'Register' : 'Login'}
        </Text>

        {isRegistering && (
          <View style={styles.roleSelector}>
            <Text style={styles.roleLabel}>I am a:</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'camper' && styles.roleButtonActive]}
                onPress={() => setRole('camper')}
              >
                <Text style={[styles.roleButtonText, role === 'camper' && styles.roleButtonTextActive]}>
                  🏕️ Camper
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'farmer' && styles.roleButtonActive]}
                onPress={() => setRole('farmer')}
              >
                <Text style={[styles.roleButtonText, role === 'farmer' && styles.roleButtonTextActive]}>
                  🚜 Farmer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>
            {isRegistering ? 'Register' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsRegistering(!isRegistering)}
        >
          <Text style={styles.switchButtonText}>
            {isRegistering
              ? 'Already have an account? Login'
              : "Don't have an account? Register"}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  roleSelector: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E8',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#2E7D32',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#2E7D32',
    fontSize: 14,
  },
});
