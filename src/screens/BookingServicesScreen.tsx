import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Wrench, ChevronRight, ChevronLeft, Check, Plus, Minus, Droplets, Sparkles, Brush, SprayCan } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { BookingFooter } from '../components/ui/BookingFooter';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useBooking } from '../contexts/BookingContext';
import { servicesService } from '../services';
import type { ServiceItem } from '../services/services';
import type { RootStackParamList } from '../types/navigation';

export default function BookingServicesScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const colors = useThemeColors();
  const { t } = useLanguage();
  const { bookingData, updateBookingData, setCurrentStep } = useBooking();

  const [selectedServices, setSelectedServices] = useState<string[]>(bookingData.selectedServices || []);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;

  // Load services from Supabase
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get services with vehicle-specific pricing if available
      let servicesData: ServiceItem[];
      if (bookingData.carType) {
        // Map carType to vehicleType for the service
        const vehicleTypeMap: { [key: string]: 'sedan' | 'suv' | 'hatchback' | 'van' | 'truck' | 'motorcycle' } = {
          'Sedan': 'sedan',
          'SUV': 'suv', 
          'Hatchback': 'hatchback',
          'Van': 'van',
          'Truck': 'truck',
          'Motorcycle': 'motorcycle'
        };
        
        const vehicleType = vehicleTypeMap[bookingData.carType] || 'sedan';
        servicesData = await servicesService.getServicesWithVehiclePricing(vehicleType);
      } else {
        servicesData = await servicesService.getServices();
      }
      
      setServices(servicesData);
    } catch (err: any) {
      console.error('Error loading services:', err);
      setError(err.message || 'Failed to load services');
      // Show alert and allow retry
      Alert.alert(
        t('error_loading_services'),
        err.message || t('failed_to_load_services'),
        [
          { text: t('retry'), onPress: loadServices },
          { text: t('cancel'), style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get icon component
  const iconFor = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'droplets': return Droplets;
      case 'sparkles': return Sparkles;
      case 'wrench': return Wrench;
      case 'brush': return Brush;
      case 'spraycan': return SprayCan;
      default: return Wrench; // Default fallback
    }
  };

  const handleServiceToggle = (serviceKey: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceKey)) {
        return prev.filter(key => key !== serviceKey);
      } else {
        return [...prev, serviceKey];
      }
    });
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, serviceKey) => {
      const service = services.find(s => s.key === serviceKey);
      return total + (service?.price || 0);
    }, 0);
  };

  const handleContinue = () => {
    if (selectedServices.length === 0) {
      Alert.alert(t('no_services_selected'), t('please_select_at_least_one_service'));
      return;
    }

    const servicesTotal = calculateTotal();
    
    updateBookingData({
      selectedServices,
      servicesTotal,
      finalPrice: servicesTotal,
    });

    setCurrentStep(4);
    navigation.navigate('BookingLocation' as any);
  };

  const handleBack = () => {
    setCurrentStep(2);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={[]}>
      <Header 
        title={t('select_services')} 
        onBack={handleBack}
        subtitle={t('step_3_of_5')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '60%', backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {t('step_3_of_5_select_services')}
          </Text>
        </View>

        {/* Services Selection */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <Wrench size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('available_services')} *</Text>
          </View>
          
          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loading_services')}</Text>
            </View>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: '#FF5252' }]}>{error}</Text>
              <Pressable onPress={loadServices} style={[styles.retryButton, { backgroundColor: colors.accent }]}>
                <Text style={styles.retryButtonText}>{t('retry')}</Text>
              </Pressable>
            </View>
          )}

          {/* Services Grid */}
          {!isLoading && !error && (
            <View style={styles.servicesGrid}>
              {services.map((service) => {
                const isSelected = selectedServices.includes(service.key);
                const IconComponent = iconFor(service.icon);
                
                return (
                  <Pressable
                  key={service.key}
                  onPress={() => handleServiceToggle(service.key)}
                  style={[
                    styles.serviceCard,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                      shadowColor: colors.textPrimary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isSelected ? 0.1 : 0.03,
                      shadowRadius: 6,
                      elevation: isSelected ? 3 : 1,
                    }
                  ]}
                >
                  {/* Selection Badge */}
                  <View style={[
                    styles.selectionBadge,
                    {
                      backgroundColor: isSelected ? '#ffffff' : colors.cardBorder,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    }
                  ]}>
                    {isSelected ? (
                      <Check size={12} color={colors.accent} />
                    ) : (
                      <Plus size={12} color={colors.textSecondary} />
                    )}
                  </View>

                  {/* Service Icon */}
                  <View style={[
                    styles.serviceIconContainer,
                    { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : colors.accent + '20' }
                  ]}>
                    <IconComponent 
                      size={isTablet ? 28 : 24} 
                      color={isSelected ? '#ffffff' : colors.accent} 
                    />
                  </View>

                  {/* Service Info */}
                  <View style={styles.serviceInfo}>
                    <Text style={[
                      styles.serviceTitle,
                      { color: isSelected ? '#ffffff' : colors.textPrimary }
                    ]}>
                      {service.title}
                    </Text>
                    <Text style={[
                      styles.serviceDescription,
                      { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                    ]}>
                      {service.desc}
                    </Text>
                  </View>

                  {/* Service Price */}
                  <View style={styles.servicePriceContainer}>
                    <Text style={[
                      styles.servicePrice,
                      { color: isSelected ? '#ffffff' : colors.accent }
                    ]}>
                      {service.price} MAD
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          )}
        </Card>

        {/* Selected Services Summary */}
        {selectedServices.length > 0 && (
          <Card style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>{t('selected_services')}</Text>
            
            <View style={styles.selectedServicesList}>
              {selectedServices.map((serviceKey) => {
                const service = services.find(s => s.key === serviceKey);
                if (!service) return null;
                
                const IconComponent = iconFor(service.icon);
                
                return (
                  <View key={serviceKey} style={[styles.selectedServiceItem, { borderBottomColor: colors.cardBorder }]}>
                    <View style={styles.selectedServiceLeft}>
                      <View style={[styles.selectedServiceIcon, { backgroundColor: colors.accent + '20' }]}>
                        <IconComponent size={16} color={colors.accent} />
                      </View>
                      <View style={styles.selectedServiceInfo}>
                        <Text style={[styles.selectedServiceName, { color: colors.textPrimary }]}>
                          {service.title}
                        </Text>
                        <Text style={[styles.selectedServiceDesc, { color: colors.textSecondary }]}>
                          {service.desc}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.selectedServiceRight}>
                      <Text style={[styles.selectedServicePrice, { color: colors.accent }]}>
                        {service.price} MAD
                      </Text>
                      <Pressable
                        onPress={() => handleServiceToggle(serviceKey)}
                        style={[styles.removeButton, { backgroundColor: colors.cardBorder }]}
                      >
                        <Minus size={12} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Total Price */}
            <View style={[styles.totalContainer, { borderTopColor: colors.cardBorder }]}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>{t('total_services')}</Text>
              <Text style={[styles.totalPrice, { color: colors.accent }]}>
                {calculateTotal()} MAD
              </Text>
            </View>
          </Card>
        )}

        {/* Service Info */}
        <Card style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>{t('service_information')}</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: colors.accent }]} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t('all_services_include_professional')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: colors.accent }]} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t('service_duration_varies')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: colors.accent }]} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t('you_can_modify_selection')}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Footer */}
      <BookingFooter
        onBack={handleBack}
        onContinue={handleContinue}
        continueText={t('start_booking_process')}
        continueDisabled={selectedServices.length === 0}
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
  servicesGrid: {
    gap: 16,
  },
  serviceCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    position: 'relative',
  },
  selectionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  servicePriceContainer: {
    alignItems: 'flex-start',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryCard: {
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  selectedServicesList: {
    marginBottom: 16,
  },
  selectedServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  selectedServiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  selectedServiceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedServiceInfo: {
    flex: 1,
  },
  selectedServiceName: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedServiceDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedServiceRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  selectedServicePrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
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
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    // Make footer feel elevated and pinned visually
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  backButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Loading and error states
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
