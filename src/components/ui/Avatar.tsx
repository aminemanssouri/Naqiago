import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface AvatarProps {
  src?: string;
  source?: any;
  alt?: string;
  name?: string;
  size?: number;
  fallback?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  source,
  alt, 
  name,
  size = 40, 
  fallback 
}) => {
  const [imageError, setImageError] = React.useState(false);

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = name || alt || fallback || 'U';
  const imageSource = source || (src ? { uri: src } : null);

  return (
    <View style={avatarStyle}>
      {imageSource && !imageError ? (
        <Image
          source={imageSource}
          style={avatarStyle}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[avatarStyle, { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: size * 0.4, fontWeight: '600', color: '#374151' }}>
            {getInitials(displayName)}
          </Text>
        </View>
      )}
    </View>
  );
};
