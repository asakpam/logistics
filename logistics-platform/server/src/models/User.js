import { supabase } from "../config/db.js";

/**
 * User Model - Supabase Operations
 * ─────────────────────────────────────────────────────────────────────────────
 * Central account record for every platform participant.
 * Firebase handles password / OAuth; this document stores profile data, role,
 * notification tokens, and preferences.
 */

export const User = {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    const { data, error } = await supabase
      .from("users")
      .insert({
        auth_id: userData.authId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || null,
        avatar: userData.avatar || null,
        role: userData.role || "customer",
        status: userData.status || (userData.role === "driver" ? "pending" : "active"),
        is_active: userData.isActive !== undefined ? userData.isActive : true,
        address_street: userData.address?.street || null,
        address_city: userData.address?.city || null,
        address_region: userData.address?.region || null,
        address_country: userData.address?.country || "Ghana",
        fcm_token: userData.fcmToken || null,
        pref_sms_alerts: userData.preferences?.smsAlerts !== undefined ? userData.preferences.smsAlerts : true,
        pref_push_alerts: userData.preferences?.pushAlerts !== undefined ? userData.preferences.pushAlerts : true,
        pref_email_alerts: userData.preferences?.emailAlerts !== undefined ? userData.preferences.emailAlerts : false
      })
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Find user by Supabase Auth ID
   * @param {string} authId - Supabase Auth UUID
   * @returns {Promise<Object|null>} User or null
   */
  async findByAuthId(authId) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }

    return this._mapFromDb(data);
  },

  /**
   * Find user by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} User or null
   */
  async findByEmail(email) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return this._mapFromDb(data);
  },

  /**
   * Find user by ID
   * @param {string} id - User UUID
   * @returns {Promise<Object|null>} User or null
   */
  async findById(id) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return this._mapFromDb(data);
  },

  /**
   * Find one user by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object|null>} User or null
   */
  async findOne(criteria) {
    let query = supabase.from("users").select("*").is("deleted_at", null);

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
   * Find all users matching criteria
   * @param {Object} criteria - Search criteria (optional)
   * @param {Object} options - Query options (limit, offset, orderBy)
   * @returns {Promise<Array>} Array of users
   */
  async find(criteria = {}, options = {}) {
    let query = supabase.from("users").select("*").is("deleted_at", null);

    Object.entries(criteria).forEach(([key, value]) => {
      const dbKey = this._toSnakeCase(key);
      query = query.eq(dbKey, value);
    });

    if (options.orderBy) {
      const [field, direction = "asc"] = options.orderBy.split(" ");
      query = query.order(this._toSnakeCase(field), { ascending: direction === "asc" });
    }

    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data.map(user => this._mapFromDb(user));
  },

  /**
   * Update user by ID
   * @param {string} id - User UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  async findByIdAndUpdate(id, updates, options = {}) {
    const updateData = {};

    if (updates.authId !== undefined) updateData.auth_id = updates.authId;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.fcmToken !== undefined) updateData.fcm_token = updates.fcmToken;

    if (updates.address) {
      if (updates.address.street !== undefined) updateData.address_street = updates.address.street;
      if (updates.address.city !== undefined) updateData.address_city = updates.address.city;
      if (updates.address.region !== undefined) updateData.address_region = updates.address.region;
      if (updates.address.country !== undefined) updateData.address_country = updates.address.country;
    }

    if (updates.preferences) {
      if (updates.preferences.smsAlerts !== undefined) updateData.pref_sms_alerts = updates.preferences.smsAlerts;
      if (updates.preferences.pushAlerts !== undefined) updateData.pref_push_alerts = updates.preferences.pushAlerts;
      if (updates.preferences.emailAlerts !== undefined) updateData.pref_email_alerts = updates.preferences.emailAlerts;
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Soft delete user
   * @param {string} id - User UUID
   * @returns {Promise<Object>} Deleted user
   */
  async softDelete(id) {
    const { data, error } = await supabase
      .from("users")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Count users matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<number>} Count
   */
  async count(criteria = {}) {
    let query = supabase.from("users").select("*", { count: "exact", head: true }).is("deleted_at", null);

    Object.entries(criteria).forEach(([key, value]) => {
      const dbKey = this._toSnakeCase(key);
      query = query.eq(dbKey, value);
    });

    const { count, error } = await query;
    if (error) throw error;
    return count;
  },

  /**
   * Check if user is suspended
   * @param {Object} user - User object
   * @returns {boolean} True if suspended
   */
  isSuspended(user) {
    return !user.isActive;
  },

  /**
   * Map database row to application object (snake_case → camelCase)
   * @private
   */
  _mapFromDb(row) {
    if (!row) return null;

    return {
      id: row.id,
      _id: row.id, // Alias for MongoDB compatibility
      authId: row.auth_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      avatar: row.avatar,
      role: row.role,
      status: row.status,
      isActive: row.is_active,
      address: {
        street: row.address_street,
        city: row.address_city,
        region: row.address_region,
        country: row.address_country
      },
      fcmToken: row.fcm_token,
      preferences: {
        smsAlerts: row.pref_sms_alerts,
        pushAlerts: row.pref_push_alerts,
        emailAlerts: row.pref_email_alerts
      },
      deletedAt: row.deleted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  /**
   * Convert camelCase to snake_case
   * @private
   */
  _toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
};
