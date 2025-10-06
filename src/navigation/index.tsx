import React from 'react';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, Settings, Wrench, Briefcase } from 'lucide-react-native';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

import HomeScreen from '../screens/HomeScreen';
import BookingsScreen from '../screens/BookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LanguageScreen from '../screens/LanguageScreen';
import ServicesScreen from '../screens/ServicesScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import WorkerDetailScreen from '../screens/WorkerDetailScreen';
import BookingScreen from '../screens/BookingScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import BookingDateTimeScreen from '../screens/BookingDateTimeScreen';
import BookingVehicleScreen from '../screens/BookingVehicleScreen';
import BookingServicesScreen from '../screens/BookingServicesScreen';
import BookingLocationScreen from '../screens/BookingLocationScreen';
import BookingPaymentScreen from '../screens/BookingPaymentScreen';
import BookingReviewScreen from '../screens/BookingReviewScreen';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HelpScreen from '../screens/HelpScreen';
import AddressesScreen from '../screens/AddressesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ServiceWorkersScreen from '../screens/ServiceWorkersScreen';
import WorkerDashboardScreen from '../screens/WorkerDashboardScreen';
import WorkerBookingsScreen from '../screens/WorkerBookingsScreen';
import ManageBookingScreen from '../screens/ManageBookingScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import SupportLegalScreen from '../screens/SupportLegalScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import EditAddressScreen from '../screens/EditAddressScreen';
import ReviewScreen from '../screens/ReviewScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const theme = useThemeColors();
  const { user } = useAuth();
  const { t } = useLanguage();
  const userRole = user?.profile?.role || 'customer';

  return (
    <Tab.Navigator
      key={userRole}
      initialRouteName={userRole === 'worker' ? 'Dashboard' : 'Home'}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          if (route.name === 'Home') {
            IconComponent = Home;
          } else if (route.name === 'Bookings') {
            IconComponent = Calendar;
          } else if (route.name === 'Services') {
            IconComponent = Wrench;
          } else if (route.name === 'Dashboard') {
            IconComponent = Briefcase;
          } else if (route.name === 'Settings') {
            IconComponent = Settings;
          }

          return IconComponent ? <IconComponent size={size} color={color} /> : null;
        },
        tabBarLabel: (() => {
          switch (route.name) {
            case 'Home':
              return t('home') || 'Home';
            case 'Services':
              return t('services_title') || 'Services';
            case 'Bookings':
              return t('my_bookings') || 'Bookings';
            case 'Dashboard':
              return t('dashboard') || 'Dashboard';
            case 'Settings':
              return t('settings') || 'Settings';
            default:
              return route.name;
          }
        })(),
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.cardBorder,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
      })}
    >
      {userRole === 'worker' ? (
        <>
          <Tab.Screen name="Dashboard" component={WorkerDashboardScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Services" component={ServicesScreen} />
          <Tab.Screen name="Bookings" component={BookingsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="WorkerDetail" component={WorkerDetailScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="BookingDateTime" component={BookingDateTimeScreen} />
      <Stack.Screen name="BookingVehicle" component={BookingVehicleScreen} />
      <Stack.Screen name="BookingServices" component={BookingServicesScreen} />
      <Stack.Screen name="BookingLocation" component={BookingLocationScreen} />
      <Stack.Screen name="BookingPayment" component={BookingPaymentScreen} />
      <Stack.Screen name="BookingReview" component={BookingReviewScreen} />
      <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SupportLegal" component={SupportLegalScreen} />
      <Stack.Screen name="ServiceWorkers" component={ServiceWorkersScreen} />
      <Stack.Screen name="WorkerDashboard" component={WorkerDashboardScreen} />
      <Stack.Screen name="WorkerBookings" component={WorkerBookingsScreen} />
      <Stack.Screen name="ManageBooking" component={ManageBookingScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} />
      <Stack.Screen name="EditAddress" component={EditAddressScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const theme = useThemeColors();
  const { user, loading } = useAuth();

  if (loading) {
    // You can add a loading screen component here if needed
    return null;
  }

  return (
    <NavigationContainer theme={theme.isDark ? NavigationDarkTheme : NavigationLightTheme} linking={{
      prefixes: ['carwashpro://'],
      config: {
        screens: {
          ResetPassword: 'reset-password',
        },
      },
    }}>
      <AppStack />
    </NavigationContainer>
  );
}
