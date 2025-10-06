import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { useThemeColors } from '../lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wrench, Sparkles, Droplets, Brush, SprayCan, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { useLanguage } from '../contexts/LanguageContext';

const SERVICES = [
  { key: 'basic', title: 'Basic Wash', desc: 'Exterior wash and dry', price: 60, Icon: Droplets },
  { key: 'deluxe', title: 'Deluxe Wash', desc: 'Exterior + interior clean', price: 120, Icon: Sparkles },
  { key: 'deep', title: 'Deep Clean', desc: 'Full detailing in/out', price: 220, Icon: Wrench },
  { key: 'interior', title: 'Interior Detail', desc: 'Vacuum and interior detail', price: 140, Icon: Brush },
  { key: 'pro', title: 'Pro Package', desc: 'Rinse, wax, and shine', price: 260, Icon: SprayCan },
];

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const theme = useThemeColors();
  const { t } = useLanguage();

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header 
        title={t('services_title')} 
        onBack={() => (navigation as any).navigate('MainTabs', { screen: 'Home' })} 
      />

      <ScrollView
        contentContainerStyle={{ 
          padding: 16,
          paddingBottom: Math.max(16, insets.bottom + 12) 
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}>
          {SERVICES.map(({ key, title, desc, price, Icon }) => (
            <Pressable
              key={key}
              style={{
                width: '48%',
                backgroundColor: theme.card,
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                shadowColor: '#000',
                shadowOpacity: theme.isDark ? 0.3 : 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 8,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 160,
              }}
              onPress={() => (navigation as any).navigate('ServiceDetail', { serviceKey: key })}
            >
              {/* Icon container */}
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: theme.isDark ? `${theme.accent}20` : `${theme.accent}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Icon color={theme.accent} size={28} />
              </View>
              
              {/* Service info */}
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '700', 
                color: theme.textPrimary,
                textAlign: 'center',
                marginBottom: 6,
              }}>
                {t(`service_${key}_title`) || title}
              </Text>
              
              <Text style={{ 
                fontSize: 12, 
                color: theme.textSecondary,
                textAlign: 'center',
                marginBottom: 12,
                lineHeight: 16,
              }}>
                {t(`service_${key}_desc`) || desc}
              </Text>
              
              {/* Price */}
              <View style={{
                backgroundColor: theme.isDark ? `${theme.accent}25` : `${theme.accent}10`,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.isDark ? `${theme.accent}40` : `${theme.accent}20`,
              }}>
                <Text style={{ 
                  fontWeight: '700', 
                  color: theme.accent,
                  fontSize: 14,
                }}>
                  {price} MAD
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
