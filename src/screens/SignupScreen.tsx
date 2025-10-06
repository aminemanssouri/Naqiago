import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, InteractionManager } from 'react-native';
import { Eye, EyeOff, User } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FormInput } from '../components/ui/FormInput';
import { Separator } from '../components/ui/Separator';
import { Switch } from '../components/ui/Switch';
import { Header } from '../components/ui/Header';
import { signupValidation } from '../utils/validationSchemas';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useThemeColors } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export default function SignupScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Client-only signup; email only
  const [isLoading, setIsLoading] = useState(false);
  const theme = useThemeColors();

  const { control, handleSubmit, formState: { errors }, watch } = useForm<SignupFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    }
  });

  const { signUp } = useAuth();
  const modal = useModal();
  const { t } = useLanguage();

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    // Email-only signup
    if (data.password !== data.confirmPassword) {
      modal.show({
        type: 'warning',
        title: t('passwords_dont_match'),
        message: t('passwords_must_match'),
      });
      return;
    }

    if (!data.agreeToTerms) {
      modal.show({
        type: 'warning',
        title: t('terms_not_accepted'),
        message: t('agree_to_terms'),
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const email = data.email;
      await signUp(email, data.password, data.name, data.phone, 'customer');
      // Show modern modal prompting email verification
      modal.show({
        type: 'email',
        title: t('verify_your_email'),
        message: t('verification_email_sent').replace('{email}', email),
        primaryActionText: t('ok'),
        onPrimaryAction: () => {
          // Close modal first, then navigate after animations to avoid white screen
          modal.hide?.();
          InteractionManager.runAfterInteractions(() => {
            (navigation as any).dispatch?.(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              })
            );
          });
        },
      });
    } catch (error: any) {
      const raw = String(error?.message || '');
      const code = String(error?.code || '');
      const status = Number(error?.status || 0);
      const lower = raw.toLowerCase();

      let friendly = 'Please try again.';
      const isDuplicateEmail =
        lower.includes('already registered') ||
        lower.includes('already exists') ||
        lower.includes('duplicate key') ||
        code === 'user_already_exists' ||
        status === 409;

      if (isDuplicateEmail) {
        friendly = t('email_already_registered');
      } else if (lower.includes('invalid email')) {
        friendly = t('invalid_email');
      } else if (lower.includes('weak password') || lower.includes('password')) {
        friendly = t('weak_password');
      } else if (raw) {
        friendly = raw;
      }

      modal.show({
        type: 'warning',
        title: t('signup_failed'),
        message: friendly,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    navigation.goBack();
  };


  // Removed tabs and role selection (client-only, email signup)

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header 
        title={t('sign up')} 
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logo} />
          </View>
          <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]}>{t('create_account')}</Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>{t('join_us_to_book')}</Text>
        </View>

        {/* Signup Form */}
        <Card style={styles.formCard}>
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.nameContainer}>
              <FormInput
                name="name"
                control={control}
                label={t('full_name')}
                placeholder={t('enter_full_name')}
                autoCapitalize="words"
                rules={signupValidation.name}
                error={errors.name}
              />
              <View style={styles.nameIcon}>
                <User size={16} color={theme.textSecondary} />
              </View>
            </View>

            {/* Email Input */}
            <FormInput
              name="email"
              control={control}
              label={t('email')}
              placeholder={t('enter_email')}
              keyboardType="email-address"
              autoCapitalize="none"
              rules={signupValidation.email}
              error={errors.email}
            />

            {/* Client-only: role selection removed */}

            {/* Password Field */}
            <View style={styles.passwordContainer}>
              <FormInput
                name="password"
                control={control}
                label={t('password')}
                placeholder={t('create_password')}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                rules={signupValidation.password}
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

            {/* Confirm Password Field */}
            <View style={styles.passwordContainer}>
              <FormInput
                name="confirmPassword"
                control={control}
                label={t('confirm_password')}
                placeholder={t('confirm_your_password')}
                secureTextEntry={!showConfirmPassword}
                style={styles.passwordInput}
                rules={{
                  required: t('please_confirm_password'),
                  validate: (value: string) => value === password || t('passwords_do_not_match')
                }}
                error={errors.confirmPassword}
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? 
                  <EyeOff size={20} color={theme.textSecondary} /> : 
                  <Eye size={20} color={theme.textSecondary} />
                }
              </Pressable>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Controller
                name="agreeToTerms"
                control={control}
                rules={{ required: 'You must agree to the terms' }}
                render={({ field: { onChange, value } }) => (
                  <Switch
                    checked={value}
                    onCheckedChange={onChange}
                  />
                )}
              />
              <View style={styles.termsRow}>
                <Text style={[styles.termsText, { color: theme.textPrimary }]}>{t('i_agree_to')}</Text>
                <Pressable onPress={() => Alert.alert(t('terms_of_service'), t('terms_of_service'))} style={styles.termsLinkButton}>
                  <Text style={[styles.termsLink, { color: theme.accent }]}>{t('terms_of_service')}</Text>
                </Pressable>
                <Text style={[styles.termsText, { color: theme.textPrimary }]}>{t('and')}</Text>
                <Pressable onPress={() => Alert.alert(t('privacy_policy'), t('privacy_policy'))} style={styles.termsLinkButton}>
                  <Text style={[styles.termsLink, { color: theme.accent }]}>{t('privacy_policy')}</Text>
                </Pressable>
              </View>
            </View>

            {/* Submit Button */}
            <Button 
              onPress={handleSubmit(onSubmit)} 
              style={styles.submitButton}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? t('creating_account') : t('create_account')}
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

            {/* Sign In Link */}
            <View style={styles.signinRow}>
              <Text style={[styles.signinText, { color: theme.textSecondary }] }>
                {t('already_have_account')}
              </Text>
              <Pressable onPress={() => navigation.navigate('Login' as never)} style={styles.signinButtonLink}>
                <Text style={[styles.signinLink, { color: theme.accent }]}>{t('sign_in')}</Text>
              </Pressable>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
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
    paddingTop: 50,
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
    padding: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#eff6ff',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  formCard: {
    padding: 24,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  form: {
    gap: 16,
  },
  nameContainer: {
    position: 'relative',
  },
  nameInput: {
    paddingRight: 50,
  },
  nameIcon: {
    position: 'absolute',
    right: 12,
    top: 38,
    padding: 8,
  },
  
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -14,
    padding: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  termsLink: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  termsLinkButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
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
  signinContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  signinRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signinText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signinLink: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  signinButtonLink: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  
});
