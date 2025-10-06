import React from 'react';
import { Pressable, Text, PressableProps, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeColors } from '../../lib/theme';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
}

export function Button({
  variant = 'default',
  size = 'default',
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const theme = useThemeColors();
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      marginBottom: 8,
    };
    
    // Variant styles
    switch (variant) {
      case 'default':
        baseStyle.backgroundColor = theme.accent;
        break;
      case 'destructive':
        baseStyle.backgroundColor = '#ef4444';
        break;
      case 'outline':
        baseStyle.backgroundColor = theme.card;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = theme.cardBorder as string;
        break;
      case 'secondary':
        baseStyle.backgroundColor = theme.isDark ? '#1f2937' : '#f3f4f6';
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
      case 'link':
        baseStyle.backgroundColor = 'transparent';
        break;
    }
    
    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.height = 32;
        baseStyle.paddingHorizontal = 12;
        baseStyle.paddingVertical = 6;
        break;
      case 'lg':
        baseStyle.height = 40;
        baseStyle.paddingHorizontal = 24;
        baseStyle.paddingVertical = 10;
        break;
      case 'icon':
        baseStyle.height = 36;
        baseStyle.width = 36;
        baseStyle.padding = 0;
        break;
      default:
        baseStyle.height = 36;
        baseStyle.paddingHorizontal = 16;
        baseStyle.paddingVertical = 8;
        break;
    }
    
    if (disabled) {
      baseStyle.opacity = 0.5;
    }
    
    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontSize: 14,
      fontWeight: '500',
    };
    
    switch (variant) {
      case 'default':
      case 'destructive':
        baseTextStyle.color = 'white';
        break;
      case 'outline':
      case 'secondary':
      case 'ghost':
        baseTextStyle.color = theme.textPrimary;
        break;
      case 'link':
        baseTextStyle.color = theme.accent;
        baseTextStyle.textDecorationLine = 'underline';
        break;
    }
    
    return baseTextStyle;
  };

  return (
    <Pressable
      style={[getButtonStyle(), style] as any}
      disabled={disabled}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text style={getTextStyle()}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginBottom: 8,
  },
  default: {
    backgroundColor: '#3b82f6',
  },
  destructive: {
    backgroundColor: '#ef4444',
  },
  outline: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondary: {
    backgroundColor: '#f3f4f6',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
  },
  defaultSize: {
    height: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sm: {
    height: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lg: {
    height: 40,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  icon: {
    height: 36,
    width: 36,
    padding: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  whiteText: {
    color: 'white',
  },
  darkText: {
    color: '#111827',
  },
  linkText: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
});
