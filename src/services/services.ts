import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { handleSupabaseError, retryOperation, getCachedData, setCachedData, CACHE_KEYS } from './utils';

type Service = Database['public']['Tables']['services']['Row'];
type ServiceInsert = Database['public']['Tables']['services']['Insert'];
type ServiceUpdate = Database['public']['Tables']['services']['Update'];

export interface ServiceInclusion {
  title: string;
  description: string;
  icon: string;
  highlight?: boolean;
}

export interface ServiceItem {
  id: string;
  key: string;
  title: string;
  desc: string;
  price: number;
  icon: string;
  category: 'basic' | 'deluxe' | 'premium' | 'specialty';
  durationMinutes: number;
  isActive: boolean;
  // Additional fields
  notes?: string;
  inclusions?: ServiceInclusion[];
  imageUrl?: string;
  // Vehicle-specific multipliers
  sedanMultiplier?: number;
  suvMultiplier?: number;
  vanMultiplier?: number;
  truckMultiplier?: number;
}

class ServicesService {
  // Get all active services with caching
  async getServices(useCache: boolean = true): Promise<ServiceItem[]> {
    try {
      // Try to get from cache first
      if (useCache) {
        const cachedServices = await getCachedData<ServiceItem[]>(CACHE_KEYS.SERVICES);
        if (cachedServices) {
          return cachedServices;
        }
      }

      const services = await retryOperation(async () => {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('base_price', { ascending: true });

        if (error) throw error;
        return (data || []).map(service => this.transformServiceData(service));
      });

      // Cache the results
      await setCachedData(CACHE_KEYS.SERVICES, services, 6); // Cache for 6 hours
      return services;
    } catch (error) {
      console.error('Get services error:', error);
      
      // Try to return cached data as fallback
      const fallbackData = await getCachedData<ServiceItem[]>(CACHE_KEYS.SERVICES);
      if (fallbackData) {
        console.log('Returning cached services as fallback');
        return fallbackData;
      }
      
      // If database connection fails, return empty array for now
      console.warn('Database connection failed, returning empty services array');
      return [];
    }
  }

  // Get service by ID
  async getServiceById(serviceId: string): Promise<ServiceItem | null> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.transformServiceData(data);
    } catch (error) {
      console.error('Get service by ID error:', error);
      throw error;
    }
  }

  // Get service by key
  async getServiceByKey(key: string): Promise<ServiceItem | null> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('key', key)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.transformServiceData(data);
    } catch (error) {
      console.error('Get service by key error:', error);
      throw error;
    }
  }

  // Get services by category
  async getServicesByCategory(category: 'basic' | 'deluxe' | 'premium' | 'specialty'): Promise<ServiceItem[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('base_price', { ascending: true });

      if (error) throw error;

      return (data || []).map(service => this.transformServiceData(service));
    } catch (error) {
      console.error('Get services by category error:', error);
      throw error;
    }
  }

    // Get all services with vehicle-specific pricing
  async getServicesWithVehiclePricing(
    vehicleType: 'sedan' | 'suv' | 'hatchback' | 'van' | 'truck' | 'motorcycle'
  ): Promise<ServiceItem[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;

      // Transform and apply vehicle-specific pricing
      return (data || []).map(service => {
        const transformed = this.transformServiceData(service);
        
        // Update price based on vehicle type
        transformed.price = this.calculateServicePrice(transformed, vehicleType);
        
        return transformed;
      });
    } catch (error) {
      console.error('Get services with vehicle pricing error:', error);
      throw handleSupabaseError(error);
    }
  }

  // Calculate service price based on vehicle type using database multiplie using database multipliersrs
  calculateServicePrice(
    service: ServiceItem, 
    vehicleType: 'sedan' | 'suv' | 'hatchback' | 'van' | 'truck' | 'motorcycle'
  ): number {
    const basePrice = service.price;
    
    // Use database multipliers or fallback to defaults
    let multiplier: number;
    switch (vehicleType) {
      case 'suv':
        multiplier = service.suvMultiplier || 1.20;
        break;
      case 'van':
        multiplier = service.vanMultiplier || 1.40;
        break;
      case 'truck':
        multiplier = service.truckMultiplier || 1.60;
        break;
      case 'motorcycle':
        multiplier = 0.80; // Default discount for motorcycles
        break;
      case 'hatchback':
      case 'sedan':
      default:
        multiplier = service.sedanMultiplier || 1.00;
        break;
    }

    return Math.round(basePrice * multiplier);
  }

  // Create new service (admin only)
  async createService(serviceData: Omit<ServiceInsert, 'id'>): Promise<Service> {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create service error:', error);
      throw error;
    }
  }

  // Update service (admin only)
  async updateService(serviceId: string, updates: ServiceUpdate): Promise<Service> {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update service error:', error);
      throw error;
    }
  }

  // Deactivate service (admin only)
  async deactivateService(serviceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId);

      if (error) throw error;
    } catch (error) {
      console.error('Deactivate service error:', error);
      throw error;
    }
  }

  // Get popular services (most booked)
  async getPopularServices(limit: number = 5): Promise<ServiceItem[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          bookings!inner(service_id)
        `)
        .eq('is_active', true)
        .limit(limit);

      if (error) throw error;

      // Sort by booking count and transform
      const servicesWithBookingCount = (data || [])
        .map((service: any) => ({
          ...service,
          booking_count: service.bookings?.length || 0
        }))
        .sort((a: any, b: any) => b.booking_count - a.booking_count);

      return servicesWithBookingCount.map((service: any) => this.transformServiceData(service));
    } catch (error) {
      console.error('Get popular services error:', error);
      // Fallback to regular services if booking count query fails
      return this.getServices();
    }
  }

  // Transform database service to app format
  private transformServiceData(service: Service): ServiceItem {
    return {
      id: service.id,
      key: service.key,
      title: service.title,
      desc: service.description || '',
      price: service.base_price,
      icon: service.icon_name || 'Wrench',
      category: service.category,
      durationMinutes: service.duration_minutes,
      isActive: service.is_active,
      // Additional fields
      notes: service.notes || undefined,
      inclusions: service.inclusions as ServiceInclusion[] || undefined,
      imageUrl: service.image_url || undefined,
      // Include vehicle multipliers
      sedanMultiplier: service.sedan_multiplier || 1.00,
      suvMultiplier: service.suv_multiplier || 1.20,
      vanMultiplier: service.van_multiplier || 1.40,
      truckMultiplier: service.truck_multiplier || 1.60,
    };
  }

  // Check service availability for a specific date and time
  async checkServiceAvailability(
    serviceId: string, 
    date: string, 
    time: string
  ): Promise<{ available: boolean; conflictingBookings?: number }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, scheduled_date, scheduled_time, estimated_duration')
        .eq('service_id', serviceId)
        .eq('scheduled_date', date)
        .in('status', ['pending', 'confirmed', 'in_progress']);

      if (error) throw error;

      // Check for time conflicts (simplified logic)
      const conflictingBookings = (data || []).filter(booking => {
        const bookingTime = new Date(`${booking.scheduled_date}T${booking.scheduled_time}`);
        const requestedTime = new Date(`${date}T${time}`);
        const timeDiff = Math.abs(bookingTime.getTime() - requestedTime.getTime());
        
        // Consider conflict if within 2 hours (could be made more sophisticated)
        return timeDiff < 2 * 60 * 60 * 1000;
      });

      return {
        available: conflictingBookings.length === 0,
        conflictingBookings: conflictingBookings.length
      };
    } catch (error) {
      console.error('Check service availability error:', error);
      throw handleSupabaseError(error);
    }
  }
}

export const servicesService = new ServicesService();
