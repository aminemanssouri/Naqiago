import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { handleSupabaseError, retryOperation, getCachedData, setCachedData, CACHE_KEYS } from './utils';

type WorkerProfile = Database['public']['Tables']['worker_profiles']['Row'];
type WorkerProfileInsert = Database['public']['Tables']['worker_profiles']['Insert'];
type WorkerProfileUpdate = Database['public']['Tables']['worker_profiles']['Update'];
type WorkerListing = Database['public']['Views']['worker_listings']['Row'];

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  serviceQualityRating?: number;
  punctualityRating?: number;
  communicationRating?: number;
  isVerified: boolean;
  photos?: string[];
}

export interface Worker {
  id: string;
  userId: string;
  name: string;
  rating: number;
  reviewCount: number;
  avatar: string | null;
  location: { latitude: number; longitude: number };
  services: string[];
  price: number;
  isAvailable: boolean;
  businessName?: string;
  bio?: string;
  experienceYears?: number;
  // Enhanced fields from database
  status: 'available' | 'busy' | 'offline' | 'on_break';
  serviceRadiusKm: number;
  hourlyRate?: number;
  totalJobsCompleted: number;
  totalEarnings: number;
  averageCompletionTime?: number;
  worksWeekends: boolean;
  startTime: string;
  endTime: string;
  specialties?: string[];
  distanceKm?: number;
  phone?: string;
  reviews?: Review[];
}

export interface NearbyWorkerResult {
  worker_id: string;
  user_id: string;
  full_name: string;
  worker_rating: number;
  distance_km: number;
  base_price: number;
}

class WorkersService {
  // Get all available workers with caching
  async getWorkers(useCache: boolean = true): Promise<Worker[]> {
    try {
      // Try cache first
      if (useCache) {
        const cached = await getCachedData<Worker[]>(CACHE_KEYS.WORKERS);
        if (cached) return cached;
      }

      let workers = await retryOperation(async () => {
        const { data, error } = await supabase
          .from('worker_listings')
          .select('*'); // Get all workers regardless of status

        if (error) throw error;
        return (data || []).map(worker => this.transformWorkerData(worker));
      });

      // Override coordinates with worker default address when available
      if (workers.length > 0) {
        const userIds = workers.map(w => w.userId);
        const defaults = await this.fetchDefaultAddressCoords(userIds);
        workers = workers.map(w => {
          const coords = defaults[w.userId];
          if (coords && isFinite(coords.latitude) && isFinite(coords.longitude)) {
            return { ...w, location: { latitude: coords.latitude, longitude: coords.longitude } };
          }
          return w;
        });
      }

      // Cache successful result
      await setCachedData(CACHE_KEYS.WORKERS, workers, 6); // Cache for 6 hours
      return workers;
    } catch (error) {
      console.error('Get workers error:', error);
      
      // Try fallback from cache
      const fallbackData = await getCachedData<Worker[]>(CACHE_KEYS.WORKERS);
      if (fallbackData) {
        console.log('Returning cached workers as fallback');
        return fallbackData;
      }
      
      // If database connection fails, return empty array for now
      // In production, you might want to return a curated set of default workers
      console.warn('Database connection failed, returning empty workers array');
      return [];
    }
  }

  // Find nearby workers using PostGIS function with enhanced error handling
  async findNearbyWorkers(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    serviceId?: string
  ): Promise<NearbyWorkerResult[]> {
    try {
      const { data, error } = await supabase.rpc('find_nearby_workers', {
        customer_lat: latitude,
        customer_lon: longitude,
        radius_km: radiusKm,
        service_uuid: serviceId || null,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Find nearby workers error:', error);
      throw handleSupabaseError(error);
    }
  }

  // Get worker by ID
  async getWorkerById(workerId: string): Promise<Worker | null> {
    try {
      // Get worker data with phone from profiles
      const { data, error } = await supabase
        .from('worker_profiles')
        .select(`
          *,
          profiles!user_id(phone, full_name, avatar_url)
        `)
        .eq('id', workerId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Get worker's services
      const { data: workerServices, error: servicesError } = await supabase
        .from('worker_services')
        .select(`
          service_id,
          custom_price,
          is_active,
          services(id, key, title, description, base_price, duration_minutes, icon_name)
        `)
        .eq('worker_id', workerId)
        .eq('is_active', true);

      if (servicesError) {
        console.error('Error fetching worker services:', servicesError);
      }

      // Transform worker_profiles data to Worker format
      let worker = this.transformWorkerProfileData(data);
      worker.phone = (data as any).profiles?.phone || undefined;
      
      // Add services to worker object
      if (workerServices && workerServices.length > 0) {
        worker.services = workerServices
          .filter(ws => ws.services)
          .map(ws => (ws.services as any).title || (ws.services as any).key);
        
        // Add detailed services info
        (worker as any).detailedServices = workerServices
          .filter(ws => ws.services)
          .map(ws => ({
            id: (ws.services as any).id,
            key: (ws.services as any).key,
            title: (ws.services as any).title,
            description: (ws.services as any).description,
            basePrice: (ws.services as any).base_price,
            customPrice: ws.custom_price,
            duration: (ws.services as any).duration_minutes,
            icon: (ws.services as any).icon_name,
          }));
      }
      
      // Override coordinates with default address if present
      try {
        const userId = worker.userId;
        const { data: addr, error: addrError } = await supabase
          .from('addresses')
          .select('latitude, longitude')
          .eq('user_id', userId)
          .eq('is_default', true)
          .maybeSingle();
        if (!addrError && addr && addr.latitude != null && addr.longitude != null) {
          worker = { ...worker, location: { latitude: addr.latitude as number, longitude: addr.longitude as number } };
        }
      } catch {}
      
      return worker;
    } catch (error) {
      console.error('Get worker by ID error:', error);
      throw error;
    }
  }

  // Get workers by service key
  async getWorkersByService(serviceKey: string, useCache: boolean = true): Promise<Worker[]> {
    try {
      // Try cache first
      const cacheKey = `${CACHE_KEYS.WORKERS}_service_${serviceKey}`;
      if (useCache) {
        const cached = await getCachedData<Worker[]>(cacheKey);
        if (cached) return cached;
      }

      let workers = await retryOperation(async () => {
        // Get service ID first
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .select('id')
          .eq('key', serviceKey)
          .eq('is_active', true)
          .single();

        if (serviceError) throw serviceError;
        if (!service) return [];

        // Get workers who offer this service
        const { data, error } = await supabase
          .from('worker_listings')
          .select(`
            *,
            worker_services!inner(service_id, is_active)
          `)
          .eq('status', 'available')
          .eq('worker_services.service_id', service.id)
          .eq('worker_services.is_active', true);

        if (error) throw error;
        return (data || []).map(worker => this.transformWorkerData(worker));
      });

      // Cache the results
      await setCachedData(cacheKey, workers, 4); // Cache for 4 hours
      return workers;
    } catch (error) {
      console.error('Get workers by service error:', error);
      
      // Try fallback from cache
      const cacheKey = `${CACHE_KEYS.WORKERS}_service_${serviceKey}`;
      const fallbackData = await getCachedData<Worker[]>(cacheKey);
      if (fallbackData) {
        console.log('Returning cached workers by service as fallback');
        return fallbackData;
      }
      
      throw handleSupabaseError(error);
    }
  }

  // Create worker profile
  async createWorkerProfile(userId: string, profileData: Omit<WorkerProfileInsert, 'user_id'>) {
    try {
      const { data, error } = await supabase
        .from('worker_profiles')
        .insert({
          user_id: userId,
          ...profileData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create worker profile error:', error);
      throw error;
    }
  }

  // Update worker profile
  async updateWorkerProfile(workerId: string, updates: WorkerProfileUpdate) {
    try {
      const { data, error } = await supabase
        .from('worker_profiles')
        .update(updates)
        .eq('id', workerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update worker profile error:', error);
      throw error;
    }
  }

  // Update worker location
  async updateWorkerLocation(workerId: string, latitude: number, longitude: number) {
    try {
      const { error } = await supabase
        .from('worker_profiles')
        .update({
          current_location: `POINT(${longitude} ${latitude})`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workerId);

      if (error) throw error;
    } catch (error) {
      console.error('Update worker location error:', error);
      throw error;
    }
  }

  // Update worker status
  async updateWorkerStatus(workerId: string, status: 'available' | 'busy' | 'offline' | 'on_break') {
    try {
      const { error } = await supabase
        .from('worker_profiles')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workerId);

      if (error) throw error;
    } catch (error) {
      console.error('Update worker status error:', error);
      throw error;
    }
  }

  // Get worker's services
  async getWorkerServices(workerId: string) {
    try {
      const { data, error } = await supabase
        .from('worker_services')
        .select(`
          *,
          services (
            id,
            key,
            title,
            description,
            base_price,
            category,
            icon_name
          )
        `)
        .eq('worker_id', workerId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get worker services error:', error);
      throw error;
    }
  }

  // Add service to worker
  async addWorkerService(workerId: string, serviceId: string, customPrice?: number) {
    try {
      const { data, error } = await supabase
        .from('worker_services')
        .insert({
          worker_id: workerId,
          service_id: serviceId,
          custom_price: customPrice,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Add worker service error:', error);
      throw error;
    }
  }

  // Remove service from worker
  async removeWorkerService(workerId: string, serviceId: string) {
    try {
      const { error } = await supabase
        .from('worker_services')
        .delete()
        .eq('worker_id', workerId)
        .eq('service_id', serviceId);

      if (error) throw error;
    } catch (error) {
      console.error('Remove worker service error:', error);
      throw error;
    }
  }

    // Find nearby workers with full details and service filtering
  async findNearbyWorkersWithDetails(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    serviceKey?: string
  ): Promise<Worker[]> {
    try {
      // Get service ID if serviceKey is provided
      let serviceId: string | null = null;
      if (serviceKey) {
        const { data: serviceData } = await supabase
          .from('services')
          .select('id')
          .eq('key', serviceKey)
          .single();
        
        if (serviceData) {
          serviceId = serviceData.id;
        }
      }
      
      // Find nearby workers
      const nearbyResults = await this.findNearbyWorkers(
        latitude, 
        longitude, 
        radiusKm, 
        serviceId || undefined
      );
      
      if (nearbyResults.length === 0) return [];
      
      // Get full worker details
      const workerIds = nearbyResults.map(w => w.worker_id);
      
      const { data: workerDetails, error } = await supabase
        .from('worker_listings')
        .select('*')
        .in('worker_id', workerIds)
        .eq('status', 'available');
        
      if (error) throw error;
      
      // Transform and merge with distance data
      return this.transformWorkersData(workerDetails || []).map(worker => {
        const nearbyData = nearbyResults.find(n => n.worker_id === worker.id);
        return {
          ...worker,
          // Add distance information if available
          distance: nearbyData?.distance_km
        } as Worker & { distance?: number };
      });
    } catch (error) {
      console.error('Find nearby workers with details error:', error);
      throw handleSupabaseError(error);
    }
  }

  // Get worker availability for specific date and time
  async checkWorkerAvailability(
    workerId: string,
    date: string,
    time: string,
    duration: number = 120 // in minutes
  ): Promise<{ available: boolean; conflictingBookings?: number }> {
    try {
      const requestedDateTime = new Date(`${date}T${time}`);
      const endDateTime = new Date(requestedDateTime.getTime() + duration * 60000);
      
      const { data, error } = await supabase
        .from('bookings')
        .select('scheduled_date, scheduled_time, estimated_duration')
        .eq('worker_id', workerId)
        .eq('scheduled_date', date)
        .in('status', ['pending', 'confirmed', 'in_progress']);

      if (error) throw error;

      const conflicts = (data || []).filter(booking => {
        const bookingStart = new Date(`${booking.scheduled_date}T${booking.scheduled_time}`);
        const bookingEnd = new Date(bookingStart.getTime() + booking.estimated_duration * 60000);
        
        // Check for time overlap
        return (
          (requestedDateTime >= bookingStart && requestedDateTime < bookingEnd) ||
          (endDateTime > bookingStart && endDateTime <= bookingEnd) ||
          (requestedDateTime <= bookingStart && endDateTime >= bookingEnd)
        );
      });

      return {
        available: conflicts.length === 0,
        conflictingBookings: conflicts.length
      };
    } catch (error) {
      console.error('Check worker availability error:', error);
      throw handleSupabaseError(error);
    }
  }

  // Transform database worker data to app format
  private transformWorkersData(data: WorkerListing[]): Worker[] {
    return data.map(worker => this.transformWorkerData(worker));
  }

  private transformWorkerData(worker: WorkerListing): Worker {
    // Extract coordinates from PostGIS point
    const coordinates = this.extractCoordinatesFromPoint(worker.base_location);
    
    return {
      id: worker.worker_id,
      userId: worker.user_id,
      name: worker.full_name,
      rating: worker.worker_rating,
      reviewCount: worker.worker_review_count,
      avatar: worker.avatar_url,
      location: coordinates,
      services: worker.services || [],
      price: worker.avg_price || 0,
      isAvailable: worker.status === 'available',
      businessName: worker.business_name || undefined,
      bio: worker.bio || undefined,
      experienceYears: worker.experience_years || undefined,
      // Enhanced fields from database
      status: worker.status,
      serviceRadiusKm: worker.service_radius_km,
      hourlyRate: worker.hourly_rate || undefined,
      totalJobsCompleted: 0, // Not available in worker_listings view
      totalEarnings: 0, // Not available in worker_listings view
      averageCompletionTime: undefined, // Not available in worker_listings view
      worksWeekends: true, // Default value, not in worker_listings view
      startTime: '08:00', // Default value, not in worker_listings view
      endTime: '18:00', // Default value, not in worker_listings view
      specialties: worker.services || undefined,
      phone: undefined, // Will be set separately when available
    };
  }

  private transformWorkerProfileData(worker: any): Worker {
    // Extract coordinates from PostGIS point
    const coordinates = this.extractCoordinatesFromPoint(worker.base_location);
    
    return {
      id: worker.id,
      userId: worker.user_id,
      name: (worker as any).profiles?.full_name || 'Unknown Worker',
      rating: worker.avg_rating || 0,
      reviewCount: worker.review_count || 0,
      avatar: (worker as any).profiles?.avatar_url || null,
      location: coordinates,
      services: worker.services || [],
      price: worker.hourly_rate || 50, // Use hourly rate as base price
      isAvailable: worker.status === 'available',
      businessName: worker.business_name || undefined,
      bio: worker.bio || undefined,
      experienceYears: worker.experience_years || undefined,
      // Enhanced fields from database
      status: worker.status,
      serviceRadiusKm: worker.service_radius_km || 10,
      hourlyRate: worker.hourly_rate || undefined,
      totalJobsCompleted: worker.total_jobs_completed || 0,
      totalEarnings: worker.total_earnings || 0,
      averageCompletionTime: worker.avg_completion_time || undefined,
      worksWeekends: worker.works_weekends ?? true,
      startTime: worker.available_from || '08:00',
      endTime: worker.available_to || '18:00',
      specialties: worker.services || undefined,
      phone: undefined, // Will be set separately when available
    };
  }

  // Get worker reviews
  async getWorkerReviews(workerId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          overall_rating,
          review_text,
          service_quality_rating,
          punctuality_rating,
          communication_rating,
          is_verified,
          photos,
          created_at,
          profiles!customer_id(full_name)
        `)
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (!data) return [];

      return data.map(review => ({
        id: review.id,
        customerId: '', // Not needed for display
        customerName: (review as any).profiles?.full_name || 'Anonymous',
        rating: review.overall_rating,
        comment: review.review_text || '',
        date: new Date(review.created_at).toLocaleDateString(),
        serviceQualityRating: review.service_quality_rating || undefined,
        punctualityRating: review.punctuality_rating || undefined,
        communicationRating: review.communication_rating || undefined,
        isVerified: review.is_verified,
        photos: review.photos || undefined,
      }));
    } catch (error) {
      console.error('Get worker reviews error:', error);
      return [];
    }
  }

  // Extract coordinates from PostGIS point format
  private extractCoordinatesFromPoint(point: any): { latitude: number; longitude: number } {
    // Default to Marrakech center if no point provided
    if (!point) {
      return { latitude: 31.6295, longitude: -7.9811 };
    }

    // Handle different PostGIS point formats
    if (typeof point === 'string') {
      // Parse "POINT(lng lat)" format
      const match = point.match(/POINT\(([^)]+)\)/);
      if (match) {
        const [lng, lat] = match[1].split(' ').map(Number);
        return { latitude: lat, longitude: lng };
      }
    }

    // Handle GeoJSON format
    if (point.coordinates && Array.isArray(point.coordinates)) {
      const [lng, lat] = point.coordinates;
      return { latitude: lat, longitude: lng };
    }

    // Fallback to Marrakech center
    return { latitude: 31.6295, longitude: -7.9811 };
  }

  // Batch fetch default address coordinates for given user IDs
  private async fetchDefaultAddressCoords(userIds: string[]): Promise<Record<string, { latitude: number; longitude: number }>> {
    const unique = Array.from(new Set(userIds)).filter(Boolean);
    const result: Record<string, { latitude: number; longitude: number }> = {};
    if (unique.length === 0) return result;

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('user_id, latitude, longitude, is_default')
        .in('user_id', unique)
        .eq('is_default', true);

      if (error) throw error;
      for (const row of data || []) {
        if (row.latitude != null && row.longitude != null) {
          result[(row as any).user_id] = { latitude: row.latitude as number, longitude: row.longitude as number };
        }
      }
    } catch (e) {
      console.warn('Failed to fetch default address coords:', e);
    }
    return result;
  }
}

export const workersService = new WorkersService();
