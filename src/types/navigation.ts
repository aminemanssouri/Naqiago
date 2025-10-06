export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Signup: undefined;
  WorkerDetail: { workerId: string };
  Booking: { workerId: string };
  BookingDateTime: undefined;
  BookingVehicle: undefined;
  BookingServices: undefined;
  BookingLocation: undefined;
  BookingPayment: undefined;
  BookingReview: undefined;
  BookingConfirmation: { bookingId: string };
  Review: { bookingId: string; workerId: string; workerName: string; workerAvatar?: string; workerRating?: number };
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Help: undefined;
  Addresses: undefined;
  ServiceDetail: { serviceKey: string };
  Notifications: undefined;
  ComingSoon: { feature?: string };
  SupportLegal: undefined;
  ServiceWorkers: { serviceKey: string };
  EditProfile: undefined;
  Profile: undefined;
  Language: undefined;
  ChangePassword: undefined;
};

export type TabParamList = {
  Home: undefined;
  Services: undefined;
  Bookings: undefined;
  Messaging: undefined;
  Store: undefined;
  Settings: undefined;
};
