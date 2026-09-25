import { supabase } from "../config/db.js";

/**
 * Staff Model - Supabase Operations
 * ─────────────────────────────────────────────────────────────────────────────
 * Extended profile for admin and staff users with organizational info.
 */

export const Staff = {
  /**
   * Create a new staff profile
   * @param {Object} staffData - Staff data
   * @returns {Promise<Object>} Created staff profile
   */
  async create(staffData) {
    const { data, error } = await supabase
      .from("staff")
      .insert({
        user_id: staffData.userId,
        department: staffData.department || null,
        position: staffData.position || null,
        hire_date: staffData.hireDate || null
      })
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Find staff by user ID
   * @param {string} userId - User UUID
   * @returns {Promise<Object|null>} Staff profile or null
   */
  async findByUserId(userId) {
    const { data, error } = await supabase
      .from("staff")
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
   * Find staff by ID
   * @param {string} id - Staff UUID
   * @returns {Promise<Object|null>} Staff profile or null
   */
  async findById(id) {
    const { data, error } = await supabase
      .from("staff")
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
   * Find one staff by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object|null>} Staff profile or null
   */
  async findOne(criteria) {
    let query = supabase.from("staff").select("*");

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
   * Find all staff with optional user data populated
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of staff profiles
   */
  async find(criteria = {}, options = {}) {
    let selectQuery = "*";

    // Join with user data if requested
    if (options.populate && options.populate.includes("userId")) {
      selectQuery = `
        *,
        user:users!staff_user_id_fkey(
          id,
          name,
          email,
          phone,
          avatar,
          role,
          status,
          is_active,
          created_at
        )
      `;
    }

    let query = supabase.from("staff").select(selectQuery);

    // Apply criteria filters
    Object.entries(criteria).forEach(([key, value]) => {
      const dbKey = this._toSnakeCase(key);
      query = query.eq(dbKey, value);
    });

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
    return data.map(staff => this._mapFromDb(staff, options.populate));
  },

  /**
   * Find staff by department
   * @param {string} department - Department name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of staff in department
   */
  async findByDepartment(department, options = {}) {
    return this.find({ department }, options);
  },

  /**
   * Get all unique departments
   * @returns {Promise<Array<string>>} Array of department names
   */
  async getDepartments() {
    const { data, error } = await supabase
      .from("staff")
      .select("department")
      .not("department", "is", null);

    if (error) throw error;

    // Get unique departments
    const departments = [...new Set(data.map(row => row.department))];
    return departments.filter(Boolean).sort();
  },

  /**
   * Update staff by ID
   * @param {string} id - Staff UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated staff profile
   */
  async findByIdAndUpdate(id, updates, options = {}) {
    const updateData = {};

    if (updates.department !== undefined) updateData.department = updates.department;
    if (updates.position !== undefined) updateData.position = updates.position;
    if (updates.hireDate !== undefined) updateData.hire_date = updates.hireDate;

    const { data, error } = await supabase
      .from("staff")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Count staff matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<number>} Count
   */
  async count(criteria = {}) {
    let query = supabase.from("staff").select("*", { count: "exact", head: true });

    Object.entries(criteria).forEach(([key, value]) => {
      const dbKey = this._toSnakeCase(key);
      query = query.eq(dbKey, value);
    });

    const { count, error } = await query;
    if (error) throw error;
    return count;
  },

  /**
   * Delete staff (hard delete)
   * @param {string} id - Staff UUID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteById(id) {
    const { error } = await supabase
      .from("staff")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  /**
   * Delete staff by user ID
   * @param {string} userId - User UUID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteByUserId(userId) {
    const { error } = await supabase
      .from("staff")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  },

  /**
   * Map database row to application object
   * @private
   */
  _mapFromDb(row, populate = []) {
    if (!row) return null;

    const staff = {
      id: row.id,
      _id: row.id, // MongoDB compatibility alias
      userId: row.user_id,
      department: row.department,
      position: row.position,
      hireDate: row.hire_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    // Populate user data if joined
    if (row.user) {
      staff.userId = {
        id: row.user.id,
        _id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        phone: row.user.phone,
        avatar: row.user.avatar,
        role: row.user.role,
        status: row.user.status,
        isActive: row.user.is_active,
        createdAt: row.user.created_at
      };
    }

    return staff;
  },

  /**
   * Convert camelCase to snake_case
   * @private
   */
  _toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
};
