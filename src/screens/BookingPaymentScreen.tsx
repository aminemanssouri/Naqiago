import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { CreditCard, Banknote, Smartphone, Wallet } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { BookingFooter } from '../components/ui/BookingFooter';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useBooking } from '../contexts/BookingContext';
import { useAuth } from '../contexts/AuthContext';
import { bookingsService, paymentsService } from '../services';
import type { RootStackParamList } from '../types/navigation';

// Payment methods will be translated dynamically in the component

export default function BookingPaymentScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { bookingData, updateBookingData, setCurrentStep, resetBookingData } = useBooking();

  const [selectedPayment, setSelectedPayment] = useState(bookingData.paymentMethod || 'cash');
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  // Payment methods with translations
  const paymentMethods = [
    {
      id: 'cash',
      title: t('cash_on_delivery_title'),
      subtitle: t('pay_with_cash_when_completed'),
      icon: Banknote,
      recommended: true,
      available: true,
    },
    {
      id: 'card',
      title: t('credit_debit_card_title'),
      subtitle: t('pay_securely_with_card'),
      icon: CreditCard,
      recommended: false,
      available: false, // Not implemented yet
    },
    {
      id: 'mobile',
      title: t('mobile_payment_title'),
      subtitle: t('pay_with_mobile_wallet'),
      icon: Smartphone,
      recommended: false,
      available: false, // Not implemented yet
    },
    {
      id: 'wallet',
      title: t('digital_wallet_title'),
      subtitle: t('pay_with_digital_wallet'),
      icon: Wallet,
      recommended: false,
      available: false, // Not implemented yet
    },
  ];

  const handleContinue = async () => {
    if (!selectedPayment) {
      Alert.alert(t('missing_fields_alert'), t('select_payment_method_label'));
      return;
    }

    if (!user) {
      Alert.alert(t('authentication_required_alert'), t('please_sign_in_to_create_booking'));
      return;
    }

    // Validate required booking data with detailed logging
    const missingFields = [];
    if (!bookingData.workerId) missingFields.push('workerId');
    if (!bookingData.serviceId) missingFields.push('serviceId');
    if (!bookingData.date) missingFields.push('date');
    if (!bookingData.time) missingFields.push('time');
    if (!bookingData.address) missingFields.push('address');

    if (missingFields.length > 0) {
      console.log('❌ Missing booking fields:', missingFields);
      console.log('📋 Current booking data:', {
        workerId: bookingData.workerId,
        serviceId: bookingData.serviceId,
        date: bookingData.date,
        time: bookingData.time,
        address: bookingData.address,
        workerName: bookingData.workerName,
        serviceName: bookingData.serviceName
      });
      Alert.alert(t('missing_information_alert'), `${t('please_complete_all_steps')} ${missingFields.join(', ')}`);
      return;
    }

    try {
      setIsCreatingBooking(true);
      
      // Update booking data with selected payment
      updateBookingData({
        paymentMethod: selectedPayment,
      });

      // Prepare booking data for database
      const createBookingData = {
        workerId: bookingData.workerId,
        serviceId: bookingData.serviceId,
        scheduledDate: bookingData.date,
        scheduledTime: bookingData.time,
        serviceAddressText: bookingData.address,
        vehicleType: bookingData.vehicleType || 'sedan',
        vehicleMake: bookingData.vehicleMake || bookingData.carBrand,
        vehicleModel: bookingData.vehicleModel || bookingData.carModel,
        vehicleYear: bookingData.vehicleYear || (bookingData.carYear ? parseInt(bookingData.carYear) : undefined),
        vehicleColor: bookingData.vehicleColor,
        licensePlate: bookingData.licensePlate,
        basePrice: bookingData.basePrice,
        totalPrice: bookingData.finalPrice,
        specialInstructions: bookingData.notes,
        estimatedDuration: bookingData.estimatedDuration || 60,
        serviceLocation: bookingData.coordinates,
      };

      // Create booking in database
      const newBooking = await bookingsService.createBooking(user.id, createBookingData);
      
      console.log('✅ Booking created successfully:', {
        id: newBooking.id,
        booking_number: newBooking.booking_number,
        customer_id: newBooking.customer_id,
        worker_id: newBooking.worker_id,
        total_price: newBooking.total_price
      });

      // Create payment record for the booking
      try {
        const payment = await paymentsService.createPayment({
          bookingId: newBooking.id,
          customerId: user.id,
          workerId: bookingData.workerId,
          amount: bookingData.finalPrice,
          paymentMethod: selectedPayment as 'cash' | 'card' | 'mobile' | 'wallet',
          // Optional: customize platform fee percentage (default is 15%)
          // platformFeePercentage: 15
        });

        console.log('✅ Payment record created successfully:', {
          id: payment.id,
          booking_id: payment.booking_id,
          amount: payment.amount,
          payment_method: payment.payment_method,
          status: payment.status,
          platform_fee: payment.platform_fee,
          worker_earnings: payment.worker_earnings
        });
      } catch (paymentError: any) {
        // Log payment creation error but don't fail the booking
        console.error('⚠️ Warning: Payment record creation failed:', paymentError);
        console.error('Booking was created but payment record is missing');
        // You might want to implement a retry mechanism or alert system here
      }
      
      // Reset booking data and navigate to confirmation
      resetBookingData();
      navigation.navigate('BookingConfirmation', { 
        bookingId: newBooking.booking_number || newBooking.id,
        booking: newBooking 
      } as any);
      
    } catch (error: any) {
      console.error('Error creating booking:', error);
      Alert.alert(
        t('booking_failed_alert'), 
        error.message || t('failed_to_create_booking'),
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(4);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <Header 
        title={t('payment_method_title')} 
        onBack={handleBack}
        subtitle={t('step_5_of_5')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%', backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {t('step_5_of_5_payment_method')}
          </Text>
        </View>

        {/* Payment Methods */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('select_payment_method_label')} *</Text>
          </View>
          
          <View style={styles.paymentMethodsList}>
            {paymentMethods.map((method) => {
              const isSelected = selectedPayment === method.id;
              const IconComponent = method.icon;
              
              return (
                <Pressable
                  key={method.id}
                  onPress={() => method.available && setSelectedPayment(method.id)}
                  disabled={!method.available}
                  style={[
                    styles.paymentMethodCard,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.card,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                      opacity: method.available ? 1 : 0.5,
                    }
                  ]}
                >
                  <View style={styles.paymentMethodLeft}>
                    <View style={[
                      styles.paymentMethodIcon,
                      { 
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : colors.surface,
                      }
                    ]}>
                      <IconComponent 
                        size={20} 
                        color={isSelected ? '#ffffff' : colors.accent} 
                      />
                    </View>
                    
                    <View style={styles.paymentMethodInfo}>
                      <View style={styles.paymentMethodTitleRow}>
                        <Text style={[
                          styles.paymentMethodTitle,
                          { color: isSelected ? '#ffffff' : colors.textPrimary }
                        ]}>
                          {method.title}
                        </Text>
                        {method.recommended && (
                          <View style={[
                            styles.recommendedBadge,
                            { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : colors.accent }
                          ]}>
                            <Text style={[
                              styles.recommendedText,
                              { color: isSelected ? '#ffffff' : '#ffffff' }
                            ]}>
                              {t('recommended_badge')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.paymentMethodSubtitle,
                        { color: isSelected ? '#ffffff' : colors.textSecondary }
                      ]}>
                        {method.subtitle}
                      </Text>
                      {!method.available && (
                        <Text style={[
                          styles.comingSoonText,
                          { color: colors.textSecondary }
                        ]}>
                          {t('coming_soon_text')}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  {isSelected && (
                    <View style={[styles.selectedIndicator, { backgroundColor: '#ffffff' }]}>
                      <View style={[styles.selectedDot, { backgroundColor: colors.accent }]} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Payment Details */}
        {selectedPayment === 'cash' && (
          <Card style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.paymentTitle, { color: colors.textPrimary }]}>{t('cash_on_delivery_title')}</Text>
            <View style={styles.detailsList}>
              <View style={styles.detailItem}>
                <View style={[styles.detailBullet, { backgroundColor: colors.accent }]} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {t('payment_due_after_completion')}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <View style={[styles.detailBullet, { backgroundColor: colors.accent }]} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {t('exact_change_appreciated')}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <View style={[styles.detailBullet, { backgroundColor: colors.accent }]} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {t('receipt_will_be_provided')}
                </Text>
              </View>
            </View>
          </Card>
        )}
        {selectedPayment === 'card' && (
          <Card style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.paymentTitle, { color: colors.textSecondary }]}>{t('credit_debit_card_title')}</Text>
            <View style={styles.detailsList}>
              <View style={styles.detailItem}>
                <View style={[styles.detailBullet, { backgroundColor: colors.accent }]} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {t('payment_due_after_completion')}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <View style={[styles.detailBullet, { backgroundColor: colors.accent }]} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {t('exact_change_appreciated')}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <View style={[styles.detailBullet, { backgroundColor: colors.accent }]} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {t('receipt_will_be_provided')}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Price Summary */}
        <Card style={[styles.priceCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.paymentTitle, { color: colors.textPrimary }]}>{t('payment_summary_title')}</Text>
          
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={[styles.paymentDescription, { color: colors.textSecondary }]}>{t('pay_after_service_completion')}</Text>
              <Text style={[styles.priceValue, { color: colors.textPrimary }]}>{bookingData.basePrice} MAD</Text>
            </View>
            
            {bookingData.carType && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                  {t('vehicle_type_label')} ({bookingData.carType}):
                </Text>
                <Text style={[styles.priceValue, { color: colors.textPrimary }]}>
                  {bookingData.finalPrice - bookingData.basePrice >= 0 ? '+' : ''}
                  {bookingData.finalPrice - bookingData.basePrice} MAD
                </Text>
              </View>
            )}
            
            <View style={[styles.priceDivider, { backgroundColor: colors.cardBorder }]} />
            
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>{t('total_amount_label')}</Text>
              <Text style={[styles.totalValue, { color: colors.accent }]}>{bookingData.finalPrice} MAD</Text>
            </View>
          </View>
          
          <View style={[styles.paymentNote, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.paymentNoteText, { color: colors.textSecondary }]}>
              {selectedPayment === 'cash' 
                ? t('amount_to_be_paid_cash')
                : t('secure_payment_processing')
              }
            </Text>
          </View>
        </Card>

        {/* Security Info */}
        <Card style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('payment_information_title')}</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: colors.accent }]} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t('all_transactions_secure')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: colors.accent }]} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t('no_payment_required_now')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: colors.accent }]} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t('no_hidden_fees')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: colors.accent }]} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t('satisfaction_guaranteed')}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Footer */}
      <BookingFooter
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!selectedPayment}
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
  paymentMethodsList: {
    gap: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    marginBottom: 2,
  },
  comingSoonText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailsCard: {
    padding: 16,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailsList: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
  detailText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  priceCard: {
    padding: 16,
    marginBottom: 24,
  },
  priceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  priceBreakdown: {
    marginBottom: 16,
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
  paymentNote: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  paymentNoteText: {
    fontSize: 12,
    textAlign: 'center',
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
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  paymentDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
});
