import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedModal from '../components/ui/AnimatedModal';
import {
  User,
  Globe,
  MapPin,
  CreditCard,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
  AlertTriangle,
  X,
} from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Separator } from '../components/ui/Separator';
import { Header } from '../components/ui/Header';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors, useThemeMode } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { safeGoBack } from '../lib/navigation';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useThemeColors();
  const { mode, setMode } = useThemeMode();
  const { signOut, user } = useAuth();
  const { t, setLanguage, languageLabel } = useLanguage();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'info' | 'warning'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const handleLanguagePress = () => {
    (navigation as any).navigate('Language');
  };

  const handleThemePress = () => {
    // Cycle through modes: system -> light -> dark -> system
    const next = mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';
    setMode(next as any);
  };

  const currentThemeLabel = useMemo(() => {
    if (mode === 'system') return 'System';
    if (mode === 'light') return 'Light';
    return 'Dark';
  }, [mode]);

  interface SettingItem {
    icon: any;
    label: string;
    description: string;
    action?: () => void;
    showArrow?: boolean;
    component?: React.ReactElement;
    value?: string;
  }

  const settingSections: { title: string; items: SettingItem[] }[] = [
    // Only show account section if user is authenticated
    ...(user ? [{
      title: t('account'),
      items: [
        {
          icon: User,
          label: t('edit profile'),
          description: t('update_personal_info'),
          action: () => (navigation as any).navigate('EditProfile' as never),
          showArrow: true,
        },
        {
          icon: MapPin,
          label: t('manage_addresses'),
          description: t('add_edit_locations'),
          action: () => (navigation as any).navigate('Addresses' as never),
          showArrow: true,
        },
        {
          icon: CreditCard,
          label: t('payment_methods'),
          description: t('manage_payment_options'),
          action: () => {
            setModalType('info');
            setModalTitle(t('payment_methods'));
            setModalMessage(`${t('payment_methods')} ${t('is_coming_soon')}.`);
            setModalVisible(true);
          },
          showArrow: true,
        },
      ],
    }] : []),
    {
      title: t('preferences'),
      items: [
        {
          icon: Globe,
          label: t('language'),
          description: t('choose_language'),
          action: handleLanguagePress,
          value: languageLabel,
          showArrow: true,
        },
        {
          icon: theme.isDark ? Moon : Sun,
          label: t('theme'),
          description: t('choose_app_appearance'),
          action: handleThemePress,
          value: currentThemeLabel,
          showArrow: true,
        },
      ],
    },
    // Notifications section removed
    {
      title: t('support_legal'),
      items: [
        {
          icon: Shield,
          label: t('support_legal'),
          description: t('help_privacy_terms_about'),
          action: () => {
            setModalType('info');
            setModalTitle(t('support_legal'));
            setModalMessage(`${t('support_legal')} ${t('is_coming_soon')}.\n\n${t('we_are_working_to_bring')} ${t('support_legal')} ${t('to_you_stay_tuned')}`);
            setModalVisible(true);
          },
          showArrow: true,
        },
      ],
    },
  ];

  const handleSignOut = () => {
    setSignOutModalVisible(true);
  };

  const confirmSignOut = async () => {
    setSignOutModalVisible(false);
    try {
      await signOut();
    } catch (e) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header 
        title={t('settings')} 
        onBack={() => safeGoBack(navigation)} 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{section.title}</Text>
            <Card style={[styles.sectionCard, { backgroundColor: theme.card }]}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex}>
                  <Pressable
                    style={[styles.settingItem, item.action && styles.pressableItem]}
                    onPress={item.action}
                  >
                    <View style={styles.settingIcon}>
                      <item.icon size={20} color={theme.accent} />
                    </View>
                    <View style={styles.settingContent}>
                      <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{item.label}</Text>
                      <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>{item.description}</Text>
                      {item.value && (
                        <Text style={[styles.settingValue, { color: theme.accent }]}>{item.value}</Text>
                      )}
                    </View>
                    {item.component && <View style={styles.settingComponent}>{item.component}</View>}
                    {item.showArrow && <ChevronRight size={20} color={theme.textSecondary} style={styles.arrow} />}
                  </Pressable>
                  {itemIndex < section.items.length - 1 && <Separator />}
                </View>
              ))}
            </Card>
          </View>
        ))}

        {/* Sign Out Button - Only show if user is authenticated */}
        {user && (
          <Card style={[styles.signOutCard, { backgroundColor: theme.card }]}>
            <Button
              variant="ghost"
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <LogOut size={20} color="#ef4444" />
              <Text style={[styles.signOutText, { color: '#ef4444' }]}>Sign Out</Text>
            </Button>
          </Card>
        )}

        {/* App Version */}
        <View style={styles.appVersion}>
          <Text style={[styles.appVersionText, { color: theme.textSecondary }]}>Car Wash App</Text>
          <Text style={[styles.appVersionText, { color: theme.textSecondary }]}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Animated Modal */}
      <AnimatedModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />

      {/* Modern Sign Out Modal */}
      <Modal
        visible={signOutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSignOutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modernModalContainer, { backgroundColor: theme.card }]}>
            {/* Header with Icon */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconContainer, { backgroundColor: '#fef2f2' }]}>
                <AlertTriangle size={32} color="#ef4444" />
              </View>
              <Pressable 
                style={styles.closeButton}
                onPress={() => setSignOutModalVisible(false)}
              >
                <X size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Content */}
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Sign Out
              </Text>
              <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
                Are you sure you want to sign out? You'll need to sign in again to access your account.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Button
                variant="outline"
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setSignOutModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textPrimary }]}>
                  Cancel
                </Text>
              </Button>
              <Button
                style={[styles.modalButton, styles.signOutConfirmButton]}
                onPress={confirmSignOut}
              >
                <LogOut size={16} color="#ffffff" />
                <Text style={styles.signOutConfirmButtonText}>
                  Sign Out
                </Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pressableItem: {
    backgroundColor: 'transparent',
  },
  settingIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    minWidth: 0,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingValue: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 2,
  },
  settingComponent: {
    marginLeft: 'auto',
  },
  arrow: {
    marginLeft: 'auto',
  },
  signOutCard: {
    padding: 16,
    marginBottom: 24,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    paddingHorizontal: 0,
    paddingVertical: 10,
    minHeight: 48,
  },
  signOutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'left',
    includeFontPadding: false,
  },
  appVersion: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  appVersionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Modern Sign Out Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modernModalContainer: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signOutConfirmButton: {
    backgroundColor: '#ef4444',
  },
  signOutConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default SettingsScreen;
