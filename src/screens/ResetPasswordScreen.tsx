import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useModal } from '../contexts/ModalContext';
import { authService } from '../services/auth';
import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { t } = useLanguage();
  const { show } = useModal();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Exchange recovery code for a session when arriving via deep link
  useEffect(() => {
    let mounted = true;

    const handleUrl = async (url?: string | null) => {
      if (!url) return;
      try {
        const u = new URL(url);
        const type = u.searchParams.get('type') || undefined;
        const code = u.searchParams.get('code') || undefined;
        if (type === 'recovery' && code) {
          setIsLoading(true);
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error as any;
          if (mounted) setSessionReady(true);
        }
      } catch (err: any) {
        show({
          type: 'warning',
          title: t('error') || 'Error',
          message: err?.message || (t('link_invalid') || 'Recovery link is invalid or expired.'),
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Handle initial URL (cold start)
    Linking.getInitialURL().then(handleUrl);
    // Handle future URL events (warm start)
    const sub = Linking.addEventListener('url', ({ url }: { url: string }) => handleUrl(url));
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [show, t]);

  const onSubmit = async () => {
    // Basic validation
    if (!password || password.length < 8) {
      show({
        type: 'warning',
        title: t('validation_error') || 'Validation Error',
        message: t('password_too_short') || 'Password must be at least 8 characters long.',
      });
      return;
    }
    if (password !== confirm) {
      show({
        type: 'warning',
        title: t('validation_error') || 'Validation Error',
        message: t('passwords_do_not_match') || 'Passwords do not match.',
      });
      return;
    }

    try {
      if (!sessionReady) {
        show({
          type: 'warning',
          title: t('session_not_ready') || 'Session Not Ready',
          message: t('open_from_email_link') || 'Please open the app from the password reset email link first.',
        });
        return;
      }
      setIsLoading(true);
      await authService.updatePassword(password);

      show({
        type: 'success',
        title: t('password_updated') || 'Password Updated',
        message: t('password_update_success') || 'Your password has been updated successfully. Please sign in again.',
      });

      // Reset to Login screen
      setTimeout(() => {
        // @ts-ignore
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' as never }],
        });
      }, 600);
    } catch (error: any) {
      show({
        type: 'warning',
        title: t('error') || 'Error',
        message: error?.message || (t('password_update_failed') || 'Failed to update password. Try again.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}> 
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder, paddingTop: insets.top + 12 }]}> 
        <Button 
          variant="ghost"
          size="icon"
          style={[styles.backButton, {
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            borderRadius: 12,
            width: 40,
            height: 40,
            marginTop: 4,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color={theme.textPrimary} strokeWidth={2.5} />
        </Button>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('set_new_password') || 'Set New Password'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
              <Lock size={24} color={theme.accent} />
            </View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{t('create_new_password') || 'Create a new password'}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t('new_password_instructions') || 'Enter and confirm your new password to complete the reset process.'}
            </Text>
          </View>
        </Card>

        {/* Form */}
        <Card style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('new_password') || 'New Password'}</Text>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder={t('enter_new_password') || 'Enter new password'}
              secureTextEntry
              autoCapitalize="none"
              style={[styles.fieldInput, { borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('confirm_password') || 'Confirm Password'}</Text>
            <Input
              value={confirm}
              onChangeText={setConfirm}
              placeholder={t('reenter_new_password') || 'Re-enter new password'}
              secureTextEntry
              autoCapitalize="none"
              style={[styles.fieldInput, { borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
            />
          </View>

          <Button onPress={onSubmit} style={styles.submitButton} disabled={isLoading}>
            <Text style={[styles.submitButtonText, { color: '#ffffff' }]}>
              {isLoading ? (t('saving') || 'Saving...') : (t('update_password') || 'Update Password')}
            </Text>
          </Button>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { width: 40, height: 40 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { paddingTop: 20, paddingBottom: 32, gap: 20 },
  headerCard: { padding: 20 },
  headerContent: { alignItems: 'center' },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  formCard: { padding: 20 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  fieldInput: {
    fontSize: 16,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  submitButton: { height: 48, marginTop: 8 },
  submitButtonText: { fontSize: 16, fontWeight: '600' },
});
