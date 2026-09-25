import { supabase } from "../config/db.js";

/**
 * Driver Model - Supabase Operations
 * ─────────────────────────────────────────────────────────────────────────────
 * Extended profile for delivery drivers with vehicle and verification info.
 */

export const Driver = {
  /**
   * Create a new driver profile
   * @param {Object} driverData - Driver data
   * @returns {Promise<Object>} Created driver
   */
  async create(driverData) {
    const { data, error } = await supabase
      .from("drivers")
      .insert({
        user_id: driverData.userId,
        license_number: driverData.licenseNumber,
        vehicle_number: driverData.vehicleNumber,
        vehicle_type: driverData.vehicleType || "Van",
        digital_address: driverData.digitalAddress || null,
        ghana_card_image: driverData.ghanaCardImage || null,
        status: driverData.status || "pending",
        current_latitude: driverData.currentLatitude || null,
        current_longitude: driverData.currentLongitude || null,
        is_available: driverData.isAvailable !== undefined ? driverData.isAvailable : false,
        last_location_at: driverData.lastLocationAt || null
      })
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Find driver by user ID
   * @param {string} userId - User UUID
   * @returns {Promise<Object|null>} Driver or null
   */
  async findByUserId(userId) {
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return this._mapFromDb(data);
  },

  /**
   * Find driver by ID
   * @param {string} id - Driver UUID
   * @returns {Promise<Object|null>} Driver or null
   */
  async findById(id) {
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return this._mapFromDb(data);
  },

  /**
   * Find one driver by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object|null>} Driver or null
   */
  async findOne(criteria) {
    let query = supabase.from("drivers").select("*");

    Object.entries(criteria).forEach(([key, value]) => {
      const dbKey = this._toSnakeCase(key);
      query = query.eq(dbKey, value);
    });

    const { data, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return this._mapFromDb(data);
  },

  /**
   * Find all drivers with optional user data populated
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of drivers
   */
  async find(criteria = {}, options = {}) {
    let selectQuery = "*";
    
    // If populate is requested, join with users table
    if (options.populate && options.populate.includes("userId")) {
      selectQuery = `
        *,
        user:users!drivers_user_id_fkey (
          id,
          name,
          email,
          phone,
          avatar,
          status,
          is_active,
          address_street,
          address_city,
          address_region,
          created_at
        )
      `;
    }

    let query = supabase.from("drivers").select(selectQuery);

    Object.entries(criteria).forEach(([key, value]) => {
      const dbKey = this._toSnakeCase(key);
      query = query.eq(dbKey, value);
    });

    if (options.orderBy) {
      const [field, direction = "asc"] = options.orderBy.split(" ");
      query = query.order(this._toSnakeCase(field), { ascending: direction === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data.map(driver => this._mapFromDb(driver, options.populate));
  },

  /**
   * Update driver by ID
   * @param {string} id - Driver UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated driver
   */
  async findByIdAndUpdate(id, updates, options = {}) {
    const updateData = {};

    if (updates.licenseNumber !== undefined) updateData.license_number = updates.licenseNumber;
    if (updates.vehicleNumber !== undefined) updateData.vehicle_number = updates.vehicleNumber;
    if (updates.vehicleType !== undefined) updateData.vehicle_type = updates.vehicleType;
    if (updates.digitalAddress !== undefined) updateData.digital_address = updates.digitalAddress;
    if (updates.ghanaCardImage !== undefined) updateData.ghana_card_image = updates.ghanaCardImage;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.currentLatitude !== undefined) updateData.current_latitude = updates.currentLatitude;
    if (updates.currentLongitude !== undefined) updateData.current_longitude = updates.currentLongitude;
    if (updates.isAvailable !== undefined) updateData.is_available = updates.isAvailable;
    if (updates.lastLocationAt !== undefined) updateData.last_location_at = updates.lastLocationAt;

    const { data, error } = await supabase
      .from("drivers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Update driver location
   * @param {string} id - Driver UUID
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<Object>} Updated driver
   */
  async updateLocation(id, latitude, longitude) {
    const { data, error } = await supabase
      .from("drivers")
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        last_location_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Find available drivers near a location
   * @param {number} latitude - Center latitude
   * @param {number} longitude - Center longitude
   * @param {number} radiusKm - Search radius in kilometers
   * @returns {Promise<Array>} Array of nearby available drivers
   */
  async findNearby(latitude, longitude, radiusKm = 10) {
    // PostgreSQL query with distance calculation
    const { data, error } = await supabase.rpc("find_nearby_drivers", {
      lat: latitude,
      lng: longitude,
      radius_km: radiusKm
    });

    if (error) {
      // Fallback: get all available drivers if function doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("drivers")
        .select("*")
        .eq("is_available", true)
        .eq("status", "approved");

      if (fallbackError) throw fallbackError;
      return fallbackData.map(driver => this._mapFromDb(driver));
    }

    return data.map(driver => this._mapFromDb(driver));
  },

  /**
   * Count drivers matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<number>} Count
   */
  async count(criteria = {}) {
    let query = supabase.from("drivers").select("*", { count: "exact", head: true });

    Object.entries(criteria).forEach(([key, value]) => {
      const dbKey = this._toSnakeCase(key);
      query = query.eq(dbKey, value);
    });

    const { count, error } = await query;
    if (error) throw error;
    return count;
  },

  /**
   * Delete driver (hard delete)
   * @param {string} id - Driver UUID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteById(id) {
    const { error } = await supabase
      .from("drivers")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  /**
   * Map database row to application object
   * @private
   */
  _mapFromDb(row, populate = []) {
    if (!row) return null;

    const driver = {
      id: row.id,
      _id: row.id, // Alias for MongoDB compatibility
      userId: row.user_id,
      licenseNumber: row.license_number,
      vehicleNumber: row.vehicle_number,
      vehicleType: row.vehicle_type,
      digitalAddress: row.digital_address,
      ghanaCardImage: row.ghana_card_image,
      status: row.status,
      currentLatitude: row.current_latitude,
      currentLongitude: row.current_longitude,
      isAvailable: row.is_available,
      lastLocationAt: row.last_location_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    // If user data was populated
    if (row.user) {
      driver.userId = {
        id: row.user.id,
        _id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        phone: row.user.phone,
        avatar: row.user.avatar,
        status: row.user.status,
        isActive: row.user.is_active,
        address: {
          street: row.user.address_street,
          city: row.user.address_city,
          region: row.user.address_region
        },
        createdAt: row.user.created_at
      };
    }

    return driver;
  },

  /**
   * Convert camelCase to snake_case
   * @private
   */
  _toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
};
