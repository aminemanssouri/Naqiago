import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FormInput } from '../components/ui/FormInput';
import { Separator } from '../components/ui/Separator';
import { loginValidation } from '../utils/validationSchemas';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  // Single login method (email)
  const [isLoading, setIsLoading] = useState(false);
  const theme = useThemeColors();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const { signIn } = useAuth();
  const modal = useModal();
  const { t } = useLanguage();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      await signIn(data.email, data.password);
      // Navigation will happen automatically when auth state changes
      console.log('Login successful, auth state will handle navigation');
    } catch (error: any) {
      console.error('Login failed:', error);
      const message = (error?.message as string) || t('check_credentials');
      modal.show({
        type: 'warning',
        title: t('login_failed'),
        message,
      });
      // Ensure we stay on login screen
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    navigation.goBack();
  };

  // Removed tabs (email only)

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}> 
      <KeyboardAvoidingView
        style={[styles.content, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 12) }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <View style={styles.centeredContent}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logo} />
            </View>
            <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]}>{t('welcome_back')}</Text>
            <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>{t('sign_in_to_book')}</Text>
          </View>

          {/* Login Form */}
          <Card style={styles.formCard}>
            <View style={styles.form}>
              {/* Input Fields */}
                <FormInput
                  name="email"
                  control={control}
                  label={t('email')}
                  placeholder={t('enter_your_email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  rules={loginValidation.email}
                  error={errors.email}
                />

              {/* Password Field */}
              <View style={styles.passwordContainer}>
                <FormInput
                  name="password"
                  control={control}
                  label={t('password')}
                  placeholder={t('enter_your_password')}
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  rules={loginValidation.password}
                  error={errors.password}
                />
                <Pressable
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 
                    <EyeOff size={20} color={theme.textSecondary} /> : 
                    <Eye size={20} color={theme.textSecondary} />
                  }
                </Pressable>
              </View>

              {/* Forgot Password */}
              <View style={styles.forgotPasswordContainer}>
                <Pressable
                  onPress={() =>
                    modal.show({
                      type: 'info',
                      title: t('forgot_password'),
                      message: t('reset_password_coming_soon') || 'Password reset is coming soon. Please check back later.',
                    })
                  }
                >
                  <Text style={[styles.forgotPasswordText, { color: theme.accent }]}>{t('forgot password')}</Text>
                </Pressable>
              </View>

              {/* Submit Button */}
              <Button 
                onPress={handleSubmit(onSubmit)} 
                style={styles.submitButton}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? t('signing_in') : t('sign_in')}
                </Text>
              </Button>

              {/* Divider */}
              <View style={styles.divider}>
                <Separator style={[styles.dividerLine, { backgroundColor: theme.cardBorder }]} />
                <Text style={[styles.dividerText, { color: theme.textSecondary }]}>{t('or')}</Text>
                <Separator style={[styles.dividerLine, { backgroundColor: theme.cardBorder }]} />
              </View>

              {/* Continue as Guest */}
              <Button 
                variant="outline" 
                onPress={handleContinueAsGuest}
                style={styles.guestButton}
              >
                <Text style={[styles.guestButtonText, { color: theme.textPrimary }]}>{t('continue as guest')}</Text>
              </Button>

              {/* Sign Up Link */}
              <View style={styles.signupRow}>
                <Text style={[styles.signupText, { color: theme.textSecondary }]}>
                  {t('dont_have_account')}
                </Text>
                <Pressable onPress={() => navigation.navigate('Signup' as never)} style={styles.signupButtonLink}>
                  <Text style={[styles.signupLink, { color: theme.accent }]}>{t('sign up')}</Text>
                </Pressable>
              </View>
            </View>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logoContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#eff6ff',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 28,
    height: 28,
    backgroundColor: '#3b82f6',
    borderRadius: 14,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  formCard: {
    padding: 20,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  form: {
    gap: 12,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -14,
    padding: 8,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: -6,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  submitButton: {
    height: 48,
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
  },
  dividerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  guestButton: {
    height: 48,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  guestButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  signupContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  signupRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signupButtonLink: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  signupText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signupLink: {
    color: '#3b82f6',
    fontWeight: '500',
  },
});
