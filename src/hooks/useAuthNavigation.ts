import { useNavigation } from '@react-navigation/native';
import { useNavigationContext } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export const useAuthNavigation = () => {
  const navigation = useNavigation();
  const { setPendingNavigation, pendingNavigation, clearPendingNavigation } = useNavigationContext();
  const { user } = useAuth();

  // Handle pending navigation after authentication
  useEffect(() => {
    if (user && pendingNavigation) {
      // User just authenticated and we have a pending navigation
      const { screen, params } = pendingNavigation;
      clearPendingNavigation();
      
      // Navigate to the intended screen
      setTimeout(() => {
        (navigation as any).navigate(screen, params);
      }, 100); // Small delay to ensure navigation is ready
    }
  }, [user, pendingNavigation, navigation, clearPendingNavigation]);

  const navigateWithAuth = (screen: string, params?: any) => {
    if (!user) {
      // Store the intended navigation
      setPendingNavigation({ screen, params });
      // Redirect to login
      (navigation as any).navigate('Login');
      return;
    }
    
    // User is authenticated, navigate directly
    (navigation as any).navigate(screen, params);
  };

  return { navigateWithAuth };
};
