import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useThemeColors } from '../lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { servicesService } from '../services';
import type { ServiceItem } from '../services/services';
import { Button } from '../components/ui/Button';
import { Header } from '../components/ui/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { Droplets, Sparkles, Wrench, Brush, SprayCan, CheckCircle, Clock, Star } from 'lucide-react-native';

// Service inclusions interface
interface ServiceInclusion {
  title: string;
  description: string;
  icon: string;
  highlight?: boolean;
}

// Enhanced service interface
interface EnhancedServiceItem extends ServiceItem {
  inclusions?: ServiceInclusion[];
  notes?: string;
  imageUrl?: string;
}

export default function ServiceDetailScreen() {
  const theme = useThemeColors();
  const route = useRoute<RouteProp<RootStackParamList, 'ServiceDetail'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { serviceKey } = route.params || ({} as any);
  const { t } = useLanguage();

  const [service, setService] = useState<EnhancedServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get icon component
  const getIconComponent = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'droplets': return Droplets;
      case 'sparkles': return Sparkles;
      case 'wrench': return Wrench;
      case 'brush': return Brush;
      case 'spraycan': return SprayCan;
      case 'check-all': case 'checkcircle': return CheckCircle;
      case 'clock': return Clock;
      case 'star': return Star;
      default: return Wrench;
    }
  };

  // Load service details from Supabase
  useEffect(() => {
    loadServiceDetails();
  }, [serviceKey]);

  const loadServiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const serviceData = await servicesService.getServiceByKey(serviceKey);
      
      if (!serviceData) {
        setError('Service not found');
        return;
      }
      
      setService(serviceData as EnhancedServiceItem);
    } catch (err: any) {
      console.error('Error loading service details:', err);
      setError(err.message || 'Failed to load service details');
      Alert.alert(
        'Error Loading Service',
        err.message || 'Failed to load service details. Please try again.',
        [
          { text: 'Retry', onPress: loadServiceDetails },
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const Icon = service ? getIconComponent(service.icon) : Wrench;

  // Loading state
  if (loading) {
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: theme.bg }}>
        <Header 
          title={t('service_details')} 
          onBack={() => navigation.goBack()} 
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ fontSize: 16, color: theme.textSecondary, marginTop: 16 }}>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state or service not found
  if (error || !service) {
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: theme.bg }}>
        <Header 
          title={t('service_details')} 
          onBack={() => navigation.goBack()} 
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ fontSize: 16, color: theme.textSecondary, marginTop: 16 }}>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state or service not found
  if (error || !service) {
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: theme.bg }}>
        <Header 
          title={t('service details')} 
          onBack={() => navigation.goBack()} 
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Text style={{ fontSize: 16, color: theme.textPrimary, marginBottom: 12 }}>
            {error || t('service_not_found')}
          </Text>
          <Button onPress={loadServiceDetails} style={{ marginBottom: 8 }}>Retry</Button>
          <Button variant="outline" onPress={() => navigation.goBack()}>{t('go_back')}</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header 
        title={t('service details')} 
        onBack={() => navigation.goBack()} 
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {/* Service Image */}
        {service.imageUrl && (
          <Image 
            source={{ uri: service.imageUrl }} 
            style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 16 }}
            resizeMode="cover"
          />
        )}

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Icon size={24} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: theme.textPrimary }}>{service.title}</Text>
            <Text style={{ marginTop: 4, color: theme.textSecondary }}>{service.desc}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Clock size={14} color={theme.textSecondary} />
              <Text style={{ marginLeft: 4, color: theme.textSecondary, fontSize: 12 }}>
                {service.durationMinutes} minutes
              </Text>
            </View>
          </View>
          <Text style={{ fontWeight: '700', color: theme.accent, fontSize: 18 }}>{service.price} MAD</Text>
        </View>

        {/* What's Included */}
        {service.inclusions && service.inclusions.length > 0 && (
          <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.textPrimary, marginBottom: 12 }}>What's Included</Text>
            {service.inclusions.map((item, index) => {
              const ItemIcon = getIconComponent(item.icon);
              return (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingVertical: 4 }}>
                  <View style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 16, 
                    backgroundColor: item.highlight ? theme.accent + '20' : theme.surface, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginRight: 12 
                  }}>
                    <ItemIcon size={16} color={item.highlight ? theme.accent : theme.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary, flex: 1 }}>
                        {item.title}
                      </Text>
                      {item.highlight && (
                        <View style={{ backgroundColor: theme.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, color: 'white', fontWeight: '600' }}>Premium</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2, lineHeight: 16 }}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Service Notes */}
        {service.notes && (
          <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 8 }}>Important Notes</Text>
            <Text style={{ color: theme.textSecondary, lineHeight: 20 }}>
              {service.notes}
            </Text>
          </View>
        )}

        {/* Actions */}
<View style={[styles.actionsContainer, { marginTop: 16, gap: 12 }]}>
  <Button 
    style={styles.actionButton} 
    onPress={() => navigation.navigate('ServiceWorkers', { serviceKey })}
  >
    <Text style={styles.actionButtonText}>{t('view_providers_for_service')}</Text>
  </Button>

  <Button 
    style={styles.actionButton} 
    onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Home' })}
  >
    <Text style={styles.actionButtonText}>{t('find_nearby_providers')}</Text>
  </Button>

</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
