import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { ArrowLeft, User, Mail, Phone, MapPin, Edit, Star, Calendar, Briefcase, UserCheck, Key } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Separator } from '../components/ui/Separator';
import { Header } from '../components/ui/Header';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { safeGoBack } from '../lib/navigation';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useThemeColors();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  const handleSignup = () => {
    navigation.navigate('Signup' as never);
  };

  const handleEditProfile = () => {
    (navigation as any).navigate('EditProfile');
  };

  const handleChangePassword = () => {
    (navigation as any).navigate('ChangePassword');
  };

  const handleSignOut = async () => {
    Alert.alert(
      t('sign_out_confirm_title'),
      t('sign_out_confirm_message'),
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: t('sign_out'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert(t('error'), t('failed_sign_out'));
            }
          }
        }
      ]
    );
  };

  const isGuest = !user;

  if (isGuest) {
    return (
      <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.bg }]}>
        <Header 
          title={t('profile')} 
          onBack={() => safeGoBack(navigation)}
        />

        <View style={styles.content}>
          {/* Guest State */}
          <Card style={styles.guestCard}>
            <View style={styles.guestIcon}>
              <User size={32} color={theme.textSecondary} />
            </View>
            <Text style={[styles.guestTitle, { color: theme.textPrimary }]}>{t('welcome_guest')}</Text>
            <Text style={[styles.guestSubtitle, { color: theme.textSecondary }]}>
              {t('guest_prompt')}
            </Text>

            <View style={styles.guestButtons}>
              <Button onPress={handleLogin} style={styles.signInButton}>
                <Text style={styles.signInButtonText}>{t('sign_in')}</Text>
              </Button>
              <Button onPress={handleSignup} variant="outline" style={styles.createAccountButton}>
                <Text style={[styles.createAccountButtonText, { color: theme.textPrimary }]}>{t('create_account')}</Text>
              </Button>
            </View>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  // Get user display data
  const displayName = user.profile?.full_name || user.email.split('@')[0];
  const userRole = user.profile?.role || 'customer';
  const joinDate = user.profile?.created_at ? new Date(user.profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : t('recently');

  return (
    <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header 
        title={t('profile')} 
        onBack={() => safeGoBack(navigation)}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              src={user.profile?.avatar_url || undefined}
              size={80}
              fallback={displayName.split(' ').map((n: string) => n[0]).join('')}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>{displayName}</Text>
              <View style={styles.roleContainer}>
                {userRole === 'worker' ? (
                  <Briefcase size={16} color={theme.accent} />
                ) : (
                  <UserCheck size={16} color={theme.accent} />
                )}
                <Text style={[styles.roleText, { color: theme.accent }]}>
                  {userRole === 'worker' ? t('service_provider') : t('customer')}
                </Text>
              </View>
              <Text style={[styles.memberSince, { color: theme.textSecondary }]}>{t('member_since')} {joinDate}</Text>
            </View>
          </View>
        </Card>

        {/* Role-specific Stats */}
        {userRole === 'worker' && (
          <Card style={styles.statsCard}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('your_stats')}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Star size={20} color={theme.accent} />
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>4.8</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('rating_label')}</Text>
              </View>
              <View style={styles.statItem}>
                <Calendar size={20} color={theme.accent} />
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>127</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('jobs_done')}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Contact Information */}
        <Card style={styles.contactCard}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('contact_information')}</Text>
          <View style={styles.contactList}>
            <View style={styles.contactItem}>
              <Mail size={20} color={theme.textSecondary} />
              <View style={styles.contactDetails}>
                <Text style={[styles.contactLabel, { color: theme.textPrimary }]}>{t('email')}</Text>
                <Text style={[styles.contactValue, { color: theme.textSecondary }]}>{user.email}</Text>
              </View>
            </View>

            {user.profile?.phone && (
              <>
                <Separator style={styles.contactSeparator} />
                <View style={styles.contactItem}>
                  <Phone size={20} color={theme.textSecondary} />
                  <View style={styles.contactDetails}>
                    <Text style={[styles.contactLabel, { color: theme.textPrimary }]}>{t('phone')}</Text>
                    <Text style={[styles.contactValue, { color: theme.textSecondary }]}>{user.profile.phone}</Text>
                  </View>
                </View>
              </>
            )}

            <Separator style={styles.contactSeparator} />
            <View style={styles.contactItem}>
              <MapPin size={20} color={theme.textSecondary} />
              <View style={styles.contactDetails}>
                <Text style={[styles.contactLabel, { color: theme.textPrimary }]}>{t('location')}</Text>
                <Text style={[styles.contactValue, { color: theme.textSecondary }]}>Marrakech, Morocco</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Account Actions */}
        <Card style={styles.actionsCard}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('account_label')}</Text>
          <View style={styles.actionsList}>
            <Button variant="ghost" style={styles.actionButton} onPress={handleEditProfile}>
              <Edit size={20} color={theme.textSecondary} style={styles.actionIcon} />
              <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>{t('edit_profile')}</Text>
            </Button>
            <Button variant="ghost" style={styles.actionButton} onPress={handleChangePassword}>
              <Key size={20} color={theme.textSecondary} style={styles.actionIcon} />
              <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>{t('change_password')}</Text>
            </Button>
            {userRole === 'worker' && (
              <Button variant="ghost" style={styles.actionButton} onPress={() => navigation.navigate('WorkerDashboard' as never)}>
                <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>{t('worker_dashboard')}</Text>
              </Button>
            )}
            <Button variant="ghost" style={styles.actionButton} onPress={handleSignOut}>
              <Text style={[styles.actionButtonText, styles.destructiveText]}>{t('sign_out')}</Text>
            </Button>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    flex: 1,
  },
  headerActions: {
    marginLeft: 'auto',
  },
  editButton: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  // Guest state styles
  guestCard: {
    padding: 32,
    alignItems: 'center',
    maxWidth: 360,
    alignSelf: 'center',
    marginTop: 40,
    borderRadius: 20,
  },
  guestIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#f3f4f6',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  guestSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  guestButtons: {
    gap: 12,
    width: '100%',
  },
  signInButton: {
    height: 48,
    justifyContent: 'center',
  },
  signInButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  createAccountButton: {
    height: 48,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  createAccountButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  // Authenticated user styles
  profileCard: {
    padding: 24,
    marginBottom: 20,
    borderRadius: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  memberSince: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  contactCard: {
    padding: 24,
    marginBottom: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  contactList: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  contactSeparator: {
    marginVertical: 0,
  },
  actionsCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  actionsList: {
    gap: 8,
  },
  actionButton: {
    height: 52,
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionIcon: {
    marginRight: 0,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  destructiveText: {
    color: '#ef4444',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statsCard: {
    padding: 24,
    marginBottom: 20,
    borderRadius: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ProfileScreen;
