import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Button } from './Button';
import { useThemeColors } from '../../lib/theme';

interface BookingFooterProps {
  onBack?: () => void;
  onContinue?: () => void;
  continueText?: string;
  continueDisabled?: boolean;
  showBackButton?: boolean;
  style?: ViewStyle;
  continueIcon?: React.ReactNode;
}

export function BookingFooter({
  onBack,
  onContinue,
  continueText = 'Continue',
  continueDisabled = false,
  showBackButton = true,
  style,
  continueIcon = <ChevronRight size={16} color="#ffffff" />,
}: BookingFooterProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <View style={[
      styles.footer,
      {
        backgroundColor: colors.card,
        borderTopColor: colors.cardBorder,
        paddingBottom: Math.max(insets.bottom, 16),
      },
      style,
    ]}>
      <View style={styles.footerButtons}>
        {showBackButton && onBack && (
          <Button 
            variant="ghost"
            size="icon"
            style={[styles.backButton, {
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }]}
            onPress={onBack}
          >
            <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
          </Button>
        )}
        
        {onContinue && (
          <Button 
            style={[
              styles.continueButton,
              { opacity: continueDisabled ? 0.5 : 1 },
              !showBackButton && styles.continueButtonFullWidth,
            ]}
            onPress={onContinue}
            disabled={continueDisabled}
          >
            <Text style={styles.continueButtonText}>{continueText}</Text>
            {continueIcon}
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  continueButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
  },
  continueButtonFullWidth: {
    flex: 1,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
