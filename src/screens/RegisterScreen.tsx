import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface RegisterScreenProps {
  onNavigate?: (screen: string) => void;
  userRole?: 'camper' | 'farmer';
}

export default function RegisterScreen({ onNavigate, userRole: initialRole }: RegisterScreenProps) {
  const { register } = useAuth();
  const [role, setRole] = useState<'camper' | 'farmer'>(initialRole || 'camper');

  // Common fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  // Password validation state
  const [passwordError, setPasswordError] = useState('');

  // Farmer-specific fields
  const [farmName, setFarmName] = useState('');
  const [farmAddress, setFarmAddress] = useState('');
  const [postcode, setPostcode] = useState('');

  // Real-time password validation
  const validatePasswords = (pwd = password, confirmPwd = confirmPassword) => {
    if (!confirmPwd) {
      setPasswordError('');
      return true;
    }
    if (pwd !== confirmPwd) {
      setPasswordError('Passwords do not match');
      return false;
    }
    if (pwd.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async () => {
    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword || !phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!validatePasswords()) {
      Alert.alert('Error', passwordError);
      return;
    }

    if (role === 'farmer' && (!farmName || !farmAddress || !postcode)) {
      Alert.alert('Error', 'Please fill in all farm details');
      return;
    }

    try {
      const userData = {
        firstName,
        lastName,
        email,
        password,
        phone,
        ...(role === 'farmer' && {
          farmName,
          farmAddress,
          postcode
        })
      };

      const success = await register(email, password, role, userData);

      if (!success) {
        Alert.alert('Error', 'Registration failed. Email may already be in use.');
      } else {
        Alert.alert('Success', 'Registration successful!', [
          { text: 'OK', onPress: () => onNavigate?.('home') }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during registration');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('landing')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>
          Join as a {role === 'camper' ? 'Camper' : 'Farmer'}
        </Text>
      </View>

      <View style={styles.card}>
        {/* Role Selection */}
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

        {/* Personal Information */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />

        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="your.email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="+353 XXX XXXXXX"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {/* Farmer-Specific Fields */}
        {role === 'farmer' && (
          <>
            <Text style={styles.sectionTitle}>Farm Information</Text>
            
            <Text style={styles.label}>Farm Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Your Farm Name"
              value={farmName}
              onChangeText={setFarmName}
            />

            <Text style={styles.label}>Farm Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Street Address"
              value={farmAddress}
              onChangeText={setFarmAddress}
            />

            <Text style={styles.label}>Postcode *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., BT12 7AB or Dublin 4"
              value={postcode}
              onChangeText={setPostcode}
            />
          </>
        )}

        {/* Password Section */}
        <Text style={styles.sectionTitle}>Security</Text>

        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="At least 6 characters"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setTimeout(() => validatePasswords(text, confirmPassword), 0);
          }}
          secureTextEntry
        />

        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setTimeout(() => validatePasswords(password, text), 0);
          }}
          secureTextEntry
          onSubmitEditing={handleSubmit}
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => onNavigate?.('login')}
        >
          <Text style={styles.switchButtonText}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  roleSelector: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
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
  inputError: {
    borderColor: '#D32F2F',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginBottom: 8,
    marginTop: -12,
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
    paddingTop: 8,
  },
  switchButtonText: {
    color: '#2E7D32',
    fontSize: 14,
  },
});

