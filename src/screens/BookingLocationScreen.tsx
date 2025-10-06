import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { MapPin, Navigation, Plus, X, Home, Building } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Header } from '../components/ui/Header';
import { BookingFooter } from '../components/ui/BookingFooter';
import { Textarea } from '../components/ui/Textarea';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useBooking } from '../contexts/BookingContext';
import type { RootStackParamList } from '../types/navigation';
import { listAddresses, reverseGeocodeDetailed } from '../services/addresses';
import type { Address } from '../types/address';
import * as Location from 'expo-location';

type QuickItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  address: string;
};


export default function BookingLocationScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useLanguage();
  const { bookingData, updateBookingData, setCurrentStep } = useBooking();

  const [address, setAddress] = useState(bookingData.address || '');
  const [selectedQuickAddress, setSelectedQuickAddress] = useState<string | null>(null);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [loadingQuick, setLoadingQuick] = useState(false);

  const handleQuickAddressSelect = async (quickAddr: QuickItem) => {
    setSelectedQuickAddress(quickAddr.id);
    // If user chose Current Location, resolve a detailed street-level address
    if (quickAddr.id === 'current') {
      try {
        setLoadingQuick(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Permission denied: keep placeholder text
          setAddress(quickAddr.address);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        const results = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        // Try Expo first
        if (results && results.length > 0) {
          const r = results[0] as any;
          // Build a more specific address string
          const parts = [
            r.street || r.name,
            r.streetNumber,
            r.district || r.subregion || r.neighborhood,
            r.city || r.subregion,
            r.region,
            r.postalCode,
            r.country,
          ]
            .filter((p: string | undefined) => !!p)
            .map((p: string) => String(p));
          let detailed = parts.join(', ');

          // Fetch even more detailed street info from Nominatim and prefer it
          const osmDetailed = await reverseGeocodeDetailed(pos.coords.latitude, pos.coords.longitude);
          if (osmDetailed && osmDetailed.length > 0) {
            detailed = osmDetailed;
          }

          setAddress(detailed || quickAddr.address);
          // Persist precise coordinates in booking data
          updateBookingData({
            coordinates: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            },
          });
        } else {
          setAddress(quickAddr.address);
        }
      } catch (e) {
        setAddress(quickAddr.address);
      } finally {
        setLoadingQuick(false);
      }
    } else {
      setAddress(quickAddr.address);
    }
  };

  // Load user's saved addresses (if authenticated)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingQuick(true);
      try {
        const addrs = await listAddresses(true);
        if (mounted) setUserAddresses(addrs);
      } catch (e) {
        // Not authenticated or RLS error: ignore and keep only Current Location
      } finally {
        if (mounted) setLoadingQuick(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Build Quick Select items: Current Location + user's saved addresses
  const quickItems = useMemo<QuickItem[]>(() => {
    const current: QuickItem = {
      id: 'current',
      title: t('current_location_title'),
      subtitle: t('use_my_current_location'),
      icon: Navigation,
      // Placeholder; will be replaced with street-level address upon selection
      address: t('current_location_title'),
    };

    const mapped: QuickItem[] = (userAddresses || []).map((a) => {
      const title = a.title || t('saved_address_title');
      const isHome = title.toLowerCase().includes('home');
      const isWork = title.toLowerCase().includes('work');
      const icon = isHome ? Home : isWork ? Building : MapPin;
      const full = [a.address_line_1, a.address_line2, a.city, a.region, a.postal_code]
        .filter(Boolean)
        .join(', ');
      return {
        id: a.id,
        title,
        subtitle: full || t('saved_address_title'),
        icon,
        address: full || title,
      };
    });

    return [current, ...mapped];
  }, [userAddresses]);


  const handleContinue = () => {
    if (!address.trim()) {
      Alert.alert(t('missing_fields_location'), t('please_enter_service_address'));
      return;
    }

    updateBookingData({
      address: address.trim(),
    });

    setCurrentStep(5);
    navigation.navigate('BookingPayment' as any);
  };

  const handleBack = () => {
    setCurrentStep(3);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <Header 
        title={t('service_location_title')} 
        onBack={handleBack}
        subtitle={t('step_4_of_5')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '80%', backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {t('step_4_of_5_service_location')}
          </Text>
        </View>

        {/* Quick Address Selection */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('quick_select_label')}</Text>
          </View>
          
          <View style={styles.quickAddressGrid}>
            {quickItems.map((quickAddr: QuickItem) => {
              const isSelected = selectedQuickAddress === quickAddr.id;
              const IconComponent = quickAddr.icon;
              
              return (
                <Pressable
                  key={quickAddr.id}
                  onPress={() => handleQuickAddressSelect(quickAddr)}
                  style={[
                    styles.quickAddressCard,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.card,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    }
                  ]}
                >
                  <IconComponent 
                    size={20} 
                    color={isSelected ? '#ffffff' : colors.accent} 
                  />
                  <View style={styles.quickAddressInfo}>
                    <Text style={[
                      styles.quickAddressTitle,
                      { color: isSelected ? '#ffffff' : colors.textPrimary }
                    ]}>
                      {quickAddr.title}
                    </Text>
                    <Text style={[
                      styles.quickAddressSubtitle,
                      { color: isSelected ? '#ffffff' : colors.textSecondary }
                    ]}>
                      {quickAddr.subtitle}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Manual Address Input */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('service_address_label')} *</Text>
          
          <Input
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              setSelectedQuickAddress(null);
            }}
            placeholder={t('enter_your_full_address')}
            style={styles.addressInput}
            multiline
            numberOfLines={2}
          />
          
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            {t('include_building_number')}
          </Text>
        </Card>


        {/* Location Info */}
        <Card style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>{t('service_information_title')}</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: colors.accent }]} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t('worker_will_arrive_scheduled')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: colors.accent }]} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t('service_typically_takes')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: colors.accent }]} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t('all_water_equipment_provided')}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Footer */}
      <BookingFooter
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!address.trim()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionCard: {
    padding: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickAddressGrid: {
    gap: 12,
  },
  quickAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  quickAddressInfo: {
    flex: 1,
  },
  quickAddressTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickAddressSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addressInput: {
    marginTop: 16,
    marginBottom: 8,
    minHeight: 60,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  infoCard: {
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});
