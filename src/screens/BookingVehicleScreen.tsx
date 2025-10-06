import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Dimensions, TextInput, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Car, Search, Check } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { ComboBox, ComboBoxOption } from '../components/ui/ComboBox';
import { BookingFooter } from '../components/ui/BookingFooter';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useBooking } from '../contexts/BookingContext';
import { NaqiagoVehicleAPI, CarBrand, CarModel } from '../services/NaqiagoVehicleAPI';
import type { RootStackParamList } from '../types/navigation';

// Vehicle types will be translated dynamically in the component

// Motor types will be translated dynamically in the component



export default function BookingVehicleScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useLanguage();
  const { bookingData, updateBookingData, setCurrentStep } = useBooking();

  // Vehicle types with translations
  const vehicleTypes = [
    { id: "car", name: t('car_label'), icon: "🚗" },
    { id: "motor", name: t('motor_label'), icon: "🏍️" },
  ] as const;

  const motorTypes = [
    { id: "motor_49cc", name: "49cc " + t('motor_label'), icon: "🛵" },
    { id: "motor_plus49cc", name: "+49cc " + t('motor_label'), icon: "🏍️" },
  ];

  // Normalize initial vehicle type from existing booking data
  const initialVehicleType = ((): 'car' | 'motor' => {
    const ct = (bookingData.carType || '').toLowerCase();
    if (ct === 'car') return 'car';
    if (ct === 'motor') return 'motor';
    // If previously stored a detailed motor label, detect as motor
    if (ct.includes('motor')) return 'motor';
    return 'car';
  })();

  const [selectedVehicleType, setSelectedVehicleType] = useState<'car' | 'motor'>(initialVehicleType);
  const [selectedMotorType, setSelectedMotorType] = useState<string | null>(() => {
    const ct = (bookingData.carType || '').toLowerCase();
    if (ct.includes('plus') || ct.includes('+49')) return 'motor_plus49cc';
    if (ct.includes('49')) return 'motor_49cc';
    return null;
  });
  // Local brand/model selections are tracked by ID only locally
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(bookingData.carYear ? parseInt(bookingData.carYear) : null);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  
  // API data states
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);

  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;
  const cardColumns = isTablet ? 4 : 2;
  const brandColumns = isTablet ? 6 : 3;

  // Load brands on component mount
  useEffect(() => {
    loadBrands();
  }, []);

  // Load models when brand is selected
  useEffect(() => {
    if (selectedBrand) {
      loadModels(selectedBrand);
    } else {
      setModels([]);
      setSelectedModel(null);
    }
  }, [selectedBrand]);

  const loadBrands = async () => {
    try {
      setLoadingBrands(true);
      const brandsData = await NaqiagoVehicleAPI.getAllBrands();
      setBrands(brandsData);
    } catch (error) {
      console.error('Error loading brands:', error);
      // Fallback to cached or default brands
      setBrands(NaqiagoVehicleAPI.getPopularBrands());
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadModels = async (brandId: number) => {
    try {
      setLoadingModels(true);
      const modelsData = await NaqiagoVehicleAPI.getModelsForBrand(brandId);
      setModels(modelsData);
    } catch (error) {
      console.error('Error loading models:', error);
      setModels(NaqiagoVehicleAPI.getPopularModels());
    } finally {
      setLoadingModels(false);
    }
  };

  const popularBrands = brands.filter(brand => brand.popular);
  const otherBrands = brands.filter(brand => !brand.popular);
  const filteredBrands = NaqiagoVehicleAPI.searchBrands(
    showAllBrands ? brands : popularBrands,
    brandSearch
  );
  const displayedBrands = filteredBrands;

  // Generate options for ComboBoxes
  const modelOptions: ComboBoxOption[] = models.map(model => ({
    id: model.id,
    label: model.name,
    value: model.id
  }));

  const yearOptions: ComboBoxOption[] = NaqiagoVehicleAPI.getYearOptions().map(year => ({
    id: year,
    label: year.toString(),
    value: year
  }));

  const selectedBrandData = brands.find(brand => brand.id === selectedBrand);
  const selectedModelData = models.find(model => model.id === selectedModel);

  const selectedVehicleTypeData = vehicleTypes.find(type => type.id === selectedVehicleType);
  const selectedMotorTypeData = motorTypes.find(type => type.id === selectedMotorType);

  // Map internal motor IDs to desired human-readable labels
  const motorIdToLabel = (id: string | null): string => {
    switch (id) {
      case 'motor_plus49cc':
        return 'motor plus 49 CC';
      case 'motor_49cc':
        return 'motor 49 CC';
      default:
        return 'motor';
    }
  };

  const handleContinue = () => {
    if (!selectedVehicleType) {
      Alert.alert(t('missing_fields_alert'), t('please_select_vehicle_type'));
      return;
    }
    
    if (selectedVehicleType === 'motor' && !selectedMotorType) {
      Alert.alert(t('missing_fields_alert'), t('motor_type_label'));
      return;
    }
    
    if (selectedVehicleType === 'car' && !selectedBrand) {
      Alert.alert(t('missing_fields_alert'), t('car_brand_label'));
      return;
    }
    
    // Store a human-readable vehicle type for motor variants
    const finalVehicleType = selectedVehicleType === 'motor'
      ? motorIdToLabel(selectedMotorType)
      : 'car';
    
    updateBookingData({
      // Legacy display-friendly vehicle descriptor
      carType: finalVehicleType,
      // Send DB enum-friendly values
      vehicleType: selectedVehicleType === 'motor' ? (finalVehicleType as any) : 'sedan',
      carBrand: selectedVehicleType === 'car' ? (selectedBrandData?.name || '') : '',
      carModel: selectedVehicleType === 'car' ? (selectedModelData?.name || '') : '',
      carYear: selectedVehicleType === 'car' ? (selectedYear?.toString() || '') : '',
    });

    setCurrentStep(3);
    navigation.navigate('BookingServices' as any);
  };

  const handleBrandSelect = (brandId: number) => {
    setSelectedBrand(brandId);
    // Reset model and year when brand changes
    setSelectedModel(null);
    setSelectedYear(null);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
        <Header 
        title={t('vehicle_details_title')} 
        onBack={handleBack}
        subtitle={t('step_3_of_5')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '40%', backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {t('step_3_of_5_vehicle_details')}
          </Text>
        </View>

        {/* Car Type Selection */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <Car size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('vehicle_type_label')} *</Text>
          </View>
          
          <View style={[styles.vehicleTypeGrid, { gap: isTablet ? 12 : 8 }]}>
            {vehicleTypes.map((type) => {
              const isSelected = selectedVehicleType === type.id;
              
              return (
                <Pressable
                  key={type.id}
                  onPress={() => {
                    setSelectedVehicleType(type.id as 'car' | 'motor');
                    // Reset motor type and car details when switching vehicle types
                    if (type.id === 'motor') {
                      setSelectedBrand(null);
                      setSelectedModel(null);
                      setSelectedYear(null);
                    } else {
                      setSelectedMotorType(null);
                    }
                  }}
                  style={[
                    styles.carTypeCard,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                      width: screenWidth < 400 ? '48%' : screenWidth < 600 ? '31%' : '23%',
                      shadowColor: colors.textPrimary,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isSelected ? 0.1 : 0.03,
                      shadowRadius: 4,
                      elevation: isSelected ? 2 : 1,
                    }
                  ]}
                >
                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: '#ffffff' }]}>
                      <Check size={10} color={colors.accent} />
                    </View>
                  )}
                  <Text style={[styles.carTypeIcon, { fontSize: isTablet ? 20 : 16 }]}>{type.icon}</Text>
                  <Text style={[
                    styles.carTypeName,
                    { 
                      color: isSelected ? '#ffffff' : colors.textPrimary,
                      fontSize: isTablet ? 14 : 12
                    }
                  ]}>
                    {type.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Motor Type Selection - Only show when motor is selected */}
        {selectedVehicleType === 'motor' && (
          <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('motor_type_label')} *</Text>
            </View>
            
            <View style={[styles.vehicleTypeGrid, { gap: isTablet ? 12 : 8 }]}>
              {motorTypes.map((type) => {
                const isSelected = selectedMotorType === type.id;
                
                return (
                  <Pressable
                    key={type.id}
                    onPress={() => setSelectedMotorType(type.id)}
                    style={[
                      styles.carTypeCard,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.surface,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                        width: screenWidth < 400 ? '48%' : screenWidth < 600 ? '48%' : '48%',
                        shadowColor: colors.textPrimary,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isSelected ? 0.1 : 0.03,
                        shadowRadius: 4,
                        elevation: isSelected ? 2 : 1,
                      }
                    ]}
                  >
                    {isSelected && (
                      <View style={[styles.selectedBadge, { backgroundColor: '#ffffff' }]}>
                        <Check size={10} color={colors.accent} />
                      </View>
                    )}
                    <Text style={[styles.carTypeIcon, { fontSize: isTablet ? 20 : 16 }]}>{type.icon}</Text>
                    <Text style={[
                      styles.carTypeName,
                      { 
                        color: isSelected ? '#ffffff' : colors.textPrimary,
                        fontSize: isTablet ? 14 : 12
                      }
                    ]}>
                      {type.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        )}

        {/* Car Brand Selection - Only show when car is selected */}
        {selectedVehicleType === 'car' && (
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('car_brand_label')} *</Text>
          </View>
          
          {/* Search Bar */}
          <View style={[styles.modernSearchContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Search size={18} color={colors.textSecondary} style={styles.modernSearchIcon} />
            <TextInput
              value={brandSearch}
              onChangeText={setBrandSearch}
              placeholder={t('search_brands')}
              style={[styles.modernSearchInput, { color: colors.textPrimary }]}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          {/* Popular Brands Badge */}
          {!showAllBrands && (
            <View style={styles.popularBadge}>
              <Text style={[styles.popularBadgeText, { color: colors.accent }]}>
                ⭐ {t('popular_brands')}
              </Text>
            </View>
          )}
          
          {loadingBrands ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loading')}...</Text>
            </View>
          ) : (
            <View style={[styles.brandGrid, { gap: isTablet ? 12 : 8 }]}>
              {displayedBrands.map((brand) => {
                const isSelected = selectedBrand === brand.id;
                
                return (
                  <Pressable
                    key={brand.id}
                    onPress={() => handleBrandSelect(brand.id)}
                    style={[
                      styles.brandCard,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.surface,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                        width: isTablet ? '15%' : '30%',
                        minWidth: 80,
                        shadowColor: colors.textPrimary,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isSelected ? 0.1 : 0.03,
                        shadowRadius: 4,
                        elevation: isSelected ? 2 : 1,
                      }
                    ]}
                  >
                    {isSelected && (
                      <View style={[styles.selectedBadge, { backgroundColor: '#ffffff', top: 4, right: 4 }]}>
                        <Check size={10} color={colors.accent} />
                      </View>
                    )}
                    
                    {/* Brand Logo - Circle Mode */}
                    <View style={[
                      styles.brandCircle,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.surface,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      }
                    ]}>
                      {brand.logo ? (
                        <Image
                          source={{ uri: brand.logo }}
                          style={styles.brandCircleLogo}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={[
                          styles.brandCircleInitial, 
                          { color: isSelected ? '#ffffff' : colors.textSecondary }
                        ]}>
                          {brand.name.charAt(0)}
                        </Text>
                      )}
                    </View>
                    
                    <Text style={[
                      styles.brandName,
                      { 
                        color: isSelected ? '#ffffff' : colors.textPrimary,
                        fontSize: isTablet ? 13 : 12
                      }
                    ]}>
                      {brand.name}
                    </Text>
                    {brand.popular && !showAllBrands && (
                      <View style={styles.popularDot} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
          
          {!showAllBrands && filteredBrands.length === popularBrands.length && (
            <Pressable
              onPress={() => setShowAllBrands(true)}
              style={[styles.showMoreButton, { borderColor: colors.cardBorder }]}
            >
              <Text style={[styles.showMoreText, { color: colors.accent }]}>
                {t('show_all_brands')} ({brands.length - popularBrands.length} more)
              </Text>
            </Pressable>
          )}
          
          {brandSearch && displayedBrands.length === 0 && (
            <View style={styles.noResultsContainer}>
              <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                {t('no_brands_found')} "{brandSearch}"
              </Text>
            </View>
          )}
        </Card>
        )}

        {/* Model and Year Selection - Only show when car is selected */}
        {selectedVehicleType === 'car' && (
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('vehicle_details_title')}</Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailsItem}>
              <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{t('car_model_label')}</Text>
              {loadingModels ? (
                <View style={[styles.loadingComboBox, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[styles.loadingComboText, { color: colors.textSecondary }]}>{t('loading')}...</Text>
                </View>
              ) : (
                <ComboBox
                  options={modelOptions}
                  value={selectedModel}
                  onSelect={(option) => setSelectedModel(option.value as number)}
                  placeholder={selectedBrand ? t('car_model_label') : t('select_brand_first')}
                  disabled={!selectedBrand || models.length === 0}
                  searchable={true}
                />
              )}
            </View>
            
            <View style={styles.detailsItem}>
              <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{t('year_label')}</Text>
              <ComboBox
                options={yearOptions}
                value={selectedYear}
                onSelect={(option) => setSelectedYear(option.value as number)}
                placeholder={t('select_year')}
                searchable={true}
              />
            </View>
          </View>
          
          {/* Selected Vehicle Summary */}
          {selectedBrandData && (
            <View style={[styles.vehicleSummary, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>{t('selected_vehicle')}</Text>
              <Text style={[styles.summaryText, { color: colors.accent }]}>
                {selectedYear ? `${selectedYear} ` : ''}
                {selectedBrandData.name}
                {selectedModelData ? ` ${selectedModelData.name}` : ''}
              </Text>
            </View>
          )}
        </Card>
        )}

        {/* Vehicle Information */}
        <Card style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>{t('vehicle_info_card_title')}</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: colors.accent }]} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t('accurate_vehicle_details')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: colors.accent }]} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t('pricing_varies_by_vehicle')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: colors.accent }]} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t('all_vehicles_welcome')}
              </Text>
            </View>
          </View>
        </Card>

      </ScrollView>

      {/* Footer */}
      <BookingFooter
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!selectedVehicleType || 
                         (selectedVehicleType === 'car' && !selectedBrand) ||
                         (selectedVehicleType === 'motor' && !selectedMotorType)}
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
  carTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  vehicleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  carTypeCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    minHeight: 80,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  carTypeIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  carTypeName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 0,
  },
  carTypePrice: {
    fontSize: 12,
    fontWeight: '500',
  },
  carTypeMultiplier: {
    fontSize: 10,
    fontWeight: '400',
    marginTop: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiplierBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  brandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandCard: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  modernSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    marginBottom: 16,
    minHeight: 48,
  },
  modernSearchIcon: {
    marginRight: 12,
  },
  modernSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    padding: 0,
    margin: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInputWrapper: {
    flex: 1,
  },
  searchInput: {
    fontSize: 16,
    padding: 0,
    margin: 0,
    height: 24,
    lineHeight: 24,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  popularDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  showMoreButton: {
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  detailsItem: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  modernInputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modernInput: {
    fontSize: 16,
    padding: 0,
    margin: 0,
    lineHeight: 20,
  },
  inputContainer: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  detailInput: {
    fontSize: 16,
    padding: 0,
    margin: 0,
    height: 24,
    lineHeight: 24,
  },
  input: {
    marginBottom: 0,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  colorCard: {
    width: '18%',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  colorName: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  priceCard: {
    padding: 16,
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 14,
  },
  priceAdjustment: {
    fontSize: 12,
  },
  priceDivider: {
    height: 1,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    height: 48,
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
  // New styles for API integration
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingComboBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    gap: 12,
  },
  loadingComboText: {
    fontSize: 14,
  },
  vehicleSummary: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  brandCircleLogo: {
    width: 32,
    height: 32,
  },
  brandCircleInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
});
