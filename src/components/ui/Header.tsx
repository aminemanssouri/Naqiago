import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Button } from './Button';
import { useThemeColors } from '../../lib/theme';
import { useLanguage } from '../../contexts/LanguageContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle,
  onBack, 
  showBackButton = true 
}) => {
  const theme = useThemeColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      paddingTop: insets.top,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    }}>
      <View style={{
        height: 56,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {showBackButton ? (
          <Button 
            variant="ghost" 
            size="icon" 
            style={{
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              borderRadius: 12,
              width: 40,
              height: 40,
              marginTop: 4,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }} 
            onPress={onBack}
          >
            <ArrowLeft size={20} color={theme.textPrimary} strokeWidth={2.5} />
          </Button>
        ) : (
          <View style={{ width: 40 }} />
        )}
        
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textPrimary }}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
              {subtitle}
            </Text>
          )}
        </View>
        
        <View style={{ width: 40 }} />
      </View>
    </View>
  );
};
