import { supabase } from "../config/db.js";

/**
 * Shipment Model - Supabase Operations
 * ─────────────────────────────────────────────────────────────────────────────
 * Package delivery tracking with status history and location updates.
 */

export const SHIPMENT_STATUSES = [
  "Pending",
  "Assigned",
  "Dispatched",
  "In Transit",
  "Out For Delivery",
  "Delivered",
  "Cancelled"
];

export const Shipment = {
  /**
   * Create a new shipment with auto-generated tracking number
   * @param {Object} shipmentData - Shipment data
   * @returns {Promise<Object>} Created shipment
   */
  async create(shipmentData) {
    // Generate tracking number using database function
    const { data: trackingData, error: trackingError } = await supabase
      .rpc("generate_tracking_number");

    if (trackingError) {
      // Fallback to JavaScript generation if function doesn't exist
      const trackingNumber = this._generateTrackingNumber();
      return this._createWithTrackingNumber(trackingNumber, shipmentData);
    }

    return this._createWithTrackingNumber(trackingData, shipmentData);
  },

  /**
   * Create shipment with specific tracking number
   * @private
   */
  async _createWithTrackingNumber(trackingNumber, shipmentData) {
    const { data, error } = await supabase
      .from("shipments")
      .insert({
        tracking_number: trackingNumber,
        customer_id: shipmentData.customerId,
        driver_id: shipmentData.driverId || null,
        pickup_address: shipmentData.pickupAddress,
        destination_address: shipmentData.destinationAddress,
        receiver_name: shipmentData.receiverName,
        receiver_phone: shipmentData.receiverPhone,
        package_type: shipmentData.packageType,
        weight: shipmentData.weight,
        delivery_fee: shipmentData.deliveryFee || 0,
        status: shipmentData.status || "Pending",
        current_latitude: shipmentData.currentLatitude || null,
        current_longitude: shipmentData.currentLongitude || null,
        estimated_arrival: shipmentData.estimatedArrival || null,
        pickup_date: shipmentData.pickupDate || null
      })
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Find shipment by tracking number
   * @param {string} trackingNumber - Tracking number
   * @returns {Promise<Object|null>} Shipment or null
   */
  async findByTrackingNumber(trackingNumber) {
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("tracking_number", trackingNumber)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return this._mapFromDb(data);
  },

  /**
   * Find shipment by ID
   * @param {string} id - Shipment UUID
   * @param {Object} options - Query options (populate)
   * @returns {Promise<Object|null>} Shipment or null
   */
  async findById(id, options = {}) {
    let selectQuery = "*";

    if (options.populate) {
      const joins = [];
      if (options.populate.includes("customerId")) {
        joins.push("customer:users!shipments_customer_id_fkey(id,name,email,phone,avatar,address_street,address_city,address_region)");
      }
      if (options.populate.includes("driverId")) {
        joins.push(`driver:drivers!shipments_driver_id_fkey(
          id,
          license_number,
          vehicle_number,
          vehicle_type,
          user:users!drivers_user_id_fkey(id,name,phone,email)
        )`);
      }
      if (joins.length > 0) {
        selectQuery = `*, ${joins.join(", ")}`;
      }
    }

    const { data, error } = await supabase
      .from("shipments")
      .select(selectQuery)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return this._mapFromDb(data, options.populate);
  },

  /**
   * Find all shipments with optional population
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options (populate, orderBy, limit, offset, or)
   * @returns {Promise<Array>} Array of shipments
   */
  async find(criteria = {}, options = {}) {
    let selectQuery = "*";

    // Build select query with joins if populate is requested
    if (options.populate) {
      const joins = [];
      if (options.populate.includes("customerId")) {
        joins.push("customer:users!shipments_customer_id_fkey(id,name,email,phone,avatar,address_street,address_city,address_region)");
      }
      if (options.populate.includes("driverId")) {
        joins.push(`driver:drivers!shipments_driver_id_fkey(
          id,
          license_number,
          vehicle_number,
          vehicle_type,
          user:users!drivers_user_id_fkey(id,name,phone,email)
        )`);
      }
      if (joins.length > 0) {
        selectQuery = `*, ${joins.join(", ")}`;
      }
    }

    let query = supabase.from("shipments").select(selectQuery);

    // Apply criteria filters
    Object.entries(criteria).forEach(([key, value]) => {
      const dbKey = this._toSnakeCase(key);
      if (value === null) {
        query = query.is(dbKey, null);
      } else {
        query = query.eq(dbKey, value);
      }
    });

    // Apply custom OR filter if provided
    if (options.or) {
      query = query.or(options.or);
    }

    // Ordering
    if (options.orderBy) {
      const [field, direction = "asc"] = options.orderBy.split(" ");
      query = query.order(this._toSnakeCase(field), { ascending: direction === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Pagination
    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data.map(shipment => this._mapFromDb(shipment, options.populate));
  },

  /**
   * Find one shipment by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object|null>} Shipment or null
   */
  async findOne(criteria) {
    let query = supabase.from("shipments").select("*");

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
   * Update shipment by ID
   * @param {string} id - Shipment UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated shipment
   */
  async findByIdAndUpdate(id, updates, options = {}) {
    const updateData = {};

    if (updates.driverId !== undefined) updateData.driver_id = updates.driverId;
    if (updates.pickupAddress !== undefined) updateData.pickup_address = updates.pickupAddress;
    if (updates.destinationAddress !== undefined) updateData.destination_address = updates.destinationAddress;
    if (updates.receiverName !== undefined) updateData.receiver_name = updates.receiverName;
    if (updates.receiverPhone !== undefined) updateData.receiver_phone = updates.receiverPhone;
    if (updates.packageType !== undefined) updateData.package_type = updates.packageType;
    if (updates.weight !== undefined) updateData.weight = updates.weight;
    if (updates.deliveryFee !== undefined) updateData.delivery_fee = updates.deliveryFee;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.currentLatitude !== undefined) updateData.current_latitude = updates.currentLatitude;
    if (updates.currentLongitude !== undefined) updateData.current_longitude = updates.currentLongitude;
    if (updates.estimatedArrival !== undefined) updateData.estimated_arrival = updates.estimatedArrival;
    if (updates.pickupDate !== undefined) updateData.pickup_date = updates.pickupDate;

    const { data, error } = await supabase
      .from("shipments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Update shipment location
   * @param {string} id - Shipment UUID
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<Object>} Updated shipment
   */
  async updateLocation(id, latitude, longitude) {
    const { data, error } = await supabase
      .from("shipments")
      .update({
        current_latitude: latitude,
        current_longitude: longitude
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Get shipment status history
   * @param {string} shipmentId - Shipment UUID
   * @returns {Promise<Array>} Array of status history entries
   */
  async getStatusHistory(shipmentId) {
    const { data, error } = await supabase
      .from("shipment_status_history")
      .select(`
        id,
        status,
        note,
        changed_at,
        changed_by:users(id, name)
      `)
      .eq("shipment_id", shipmentId)
      .order("changed_at", { ascending: true });

    if (error) throw error;

    return data.map(entry => ({
      id: entry.id,
      status: entry.status,
      note: entry.note,
      changedAt: entry.changed_at,
      changedBy: entry.changed_by ? {
        id: entry.changed_by.id,
        name: entry.changed_by.name
      } : null
    }));
  },

  /**
   * Add status history entry manually (trigger handles most cases automatically)
   * @param {string} shipmentId - Shipment UUID
   * @param {string} status - New status
   * @param {string} note - Optional note
   * @param {string} changedBy - User UUID who made the change
   * @returns {Promise<Object>} Created history entry
   */
  async addStatusHistory(shipmentId, status, note = null, changedBy = null) {
    const { data, error } = await supabase
      .from("shipment_status_history")
      .insert({
        shipment_id: shipmentId,
        status,
        note,
        changed_by: changedBy
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Count shipments matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<number>} Count
   */
  async count(criteria = {}) {
    let query = supabase.from("shipments").select("*", { count: "exact", head: true });

    Object.entries(criteria).forEach(([key, value]) => {
      const dbKey = this._toSnakeCase(key);
      query = query.eq(dbKey, value);
    });

    const { count, error } = await query;
    if (error) throw error;
    return count;
  },

  /**
   * Delete shipment (hard delete)
   * @param {string} id - Shipment UUID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteById(id) {
    const { error } = await supabase
      .from("shipments")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  /**
   * Generate tracking number (fallback if DB function doesn't exist)
   * @private
   */
  _generateTrackingNumber() {
    const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
    return `TRK${randomDigits}GH`;
  },

  /**
   * Map database row to application object
   * @private
   */
  _mapFromDb(row, populate = []) {
    if (!row) return null;

    const shipment = {
      id: row.id,
      _id: row.id, // MongoDB compatibility alias
      trackingNumber: row.tracking_number,
      customerId: row.customer_id,
      driverId: row.driver_id,
      pickupAddress: row.pickup_address,
      destinationAddress: row.destination_address,
      receiverName: row.receiver_name,
      receiverPhone: row.receiver_phone,
      packageType: row.package_type,
      weight: row.weight,
      deliveryFee: row.delivery_fee,
      status: row.status,
      currentLatitude: row.current_latitude,
      currentLongitude: row.current_longitude,
      estimatedArrival: row.estimated_arrival,
      pickupDate: row.pickup_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    // Populate customer data if joined
    if (row.customer) {
      shipment.customerId = {
        id: row.customer.id,
        _id: row.customer.id,
        name: row.customer.name,
        email: row.customer.email,
        phone: row.customer.phone,
        avatar: row.customer.avatar,
        addressStreet: row.customer.address_street,
        addressCity: row.customer.address_city,
        addressRegion: row.customer.address_region
      };
      shipment.customer = row.customer.name;
      shipment.customerName = row.customer.name;
      shipment.customerEmail = row.customer.email;
      shipment.customerPhone = row.customer.phone;
    }

    // Populate driver data if joined
    if (row.driver) {
      shipment.driverId = {
        id: row.driver.id,
        _id: row.driver.id,
        licenseNumber: row.driver.license_number,
        vehicleNumber: row.driver.vehicle_number,
        vehicleType: row.driver.vehicle_type,
        user: row.driver.user ? {
          id: row.driver.user.id,
          name: row.driver.user.name,
          phone: row.driver.user.phone,
          email: row.driver.user.email
        } : null
      };
      shipment.driver = row.driver.user?.name || "Driver";
      shipment.driverName = row.driver.user?.name || "Driver";
      shipment.driverPhone = row.driver.user?.phone || "";
    } else {
      shipment.driver = "—";
      shipment.driverName = "—";
    }

    // Additional aliases for frontend UI compatibility
    shipment.from = row.pickup_address;
    shipment.to = row.destination_address;
    shipment.type = row.package_type;
    shipment.date = row.created_at;

    return shipment;
  },

  /**
   * Convert camelCase to snake_case
   * @private
   */
  _toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
};
