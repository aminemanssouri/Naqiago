import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useThemeColors } from '../lib/theme';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function ChangePasswordScreen() {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const handleBack = () => navigation.goBack();

  const onSubmit = async () => {
    console.log('🔄 Password update started');
  
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill all fields.');
      return;
    }
  
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters.');
      return;
    }
  
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
  
    if (!user?.email) {
      Alert.alert('Error', 'No authenticated user.');
      return;
    }
  
    if (loading) {
      console.log('⚠️ Already processing, ignoring duplicate submission');
      return;
    }
  
    try {
      console.log('🔄 Setting loading to true');
      setLoading(true);
  
      // Step 1: Re-authenticate with current password
      console.log('🔄 Re-authenticating user with current password');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
  
      if (signInError) {
        console.log('❌ Re-authentication failed:', signInError.message);
        Alert.alert('Error', 'Current password is incorrect.');
        return;
      }
  
      console.log('✅ Re-authentication successful');
  
      // Step 2: Update password
      console.log('🔄 Calling supabase.auth.updateUser');
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
  
      console.log('✅ Update completed, error:', updateError);
  
      if (updateError) {
        console.log('❌ Update failed:', updateError.message);
        Alert.alert('Error', updateError.message || 'Failed to change password.');
        return;
      }
  
      console.log('✅ Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessVisible(true);
    } catch (e) {
      console.error('❌ Password update error:', e);
      Alert.alert('Error', e?.message || 'Failed to update password. Please try again.');
    } finally {
      console.log('🔄 Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <Header title="Change Password" onBack={handleBack} />

      <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Update your password</Text>
          <Text style={[styles.helper, { color: colors.textSecondary }]}>Enter your current password and your new password.</Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Current Password</Text>
            <Input
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              placeholder="Enter current password"
              returnKeyType="next"
            />

            <Text style={[styles.label, { color: colors.textPrimary }]}>New Password</Text>
            <Input
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              placeholder="Enter new password"
              returnKeyType="next"
            />

            <Text style={[styles.label, { color: colors.textPrimary }]}>Confirm New Password</Text>
            <Input
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              placeholder="Confirm new password"
              returnKeyType="done"
            />
          </View>

          <Button 
            onPress={onSubmit} 
            disabled={loading} 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitText}>{loading ? 'Updating...' : 'Change Password'}</Text>
          </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  helper: { fontSize: 12, marginBottom: 16 },
  form: { gap: 8, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '500', marginTop: 8 },
  submitButton: { marginTop: 16 },
  submitText: { color: '#ffffff', fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalMessage: { fontSize: 14, textAlign: 'center' },
  modalButton: { marginTop: 8, alignSelf: 'stretch' },
  submitButtonDisabled: { opacity: 0.6 },
});
