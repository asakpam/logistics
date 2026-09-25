import { supabase } from "../config/db.js";

/**
 * Product Model - Supabase Operations
 * ─────────────────────────────────────────────────────────────────────────────
 * Marketplace products for sale by customers/vendors.
 */

export const Product = {
  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async create(productData) {
    const { data, error } = await supabase
      .from("products")
      .insert({
        owner_id: productData.ownerId,
        title: productData.title,
        description: productData.description || null,
        price: productData.price,
        image_url: productData.imageUrl || null,
        category: productData.category || null,
        is_active: productData.isActive !== undefined ? productData.isActive : true
      })
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Find product by ID
   * @param {string} id - Product UUID
   * @returns {Promise<Object|null>} Product or null
   */
  async findById(id) {
    const { data, error } = await supabase
      .from("products")
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
   * Find one product by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object|null>} Product or null
   */
  async findOne(criteria) {
    let query = supabase.from("products").select("*");

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
   * Find all products with optional filters
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options (populate, orderBy, limit, offset)
   * @returns {Promise<Array>} Array of products
   */
  async find(criteria = {}, options = {}) {
    let selectQuery = "*";

    // Join with owner user data if requested
    if (options.populate && options.populate.includes("ownerId")) {
      selectQuery = `
        *,
        owner:users!products_owner_id_fkey(
          id,
          name,
          email,
          phone,
          avatar
        )
      `;
    }

    let query = supabase.from("products").select(selectQuery);

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
    return data.map(product => this._mapFromDb(product, options.populate));
  },

  /**
   * Find active products (for marketplace display)
   * @param {Object} filters - Optional filters (category, search term, etc.)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of active products
   */
  async findActive(filters = {}, options = {}) {
    let query = supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    // Category filter
    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    // Search filter (title or description)
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Price range filter
    if (filters.minPrice !== undefined) {
      query = query.gte("price", filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte("price", filters.maxPrice);
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
    return data.map(product => this._mapFromDb(product));
  },

  /**
   * Find products by owner
   * @param {string} ownerId - Owner user UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of products
   */
  async findByOwner(ownerId, options = {}) {
    return this.find({ ownerId }, options);
  },

  /**
   * Find products by category
   * @param {string} category - Category name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of products
   */
  async findByCategory(category, options = {}) {
    return this.find({ category, isActive: true }, options);
  },

  /**
   * Get all unique categories
   * @returns {Promise<Array<string>>} Array of category names
   */
  async getCategories() {
    const { data, error } = await supabase
      .from("products")
      .select("category")
      .eq("is_active", true)
      .not("category", "is", null);

    if (error) throw error;

    // Get unique categories
    const categories = [...new Set(data.map(row => row.category))];
    return categories.filter(Boolean).sort();
  },

  /**
   * Update product by ID
   * @param {string} id - Product UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated product
   */
  async findByIdAndUpdate(id, updates, options = {}) {
    const updateData = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Deactivate product (soft delete)
   * @param {string} id - Product UUID
   * @returns {Promise<Object>} Updated product
   */
  async deactivate(id) {
    return this.findByIdAndUpdate(id, { isActive: false });
  },

  /**
   * Activate product
   * @param {string} id - Product UUID
   * @returns {Promise<Object>} Updated product
   */
  async activate(id) {
    return this.findByIdAndUpdate(id, { isActive: true });
  },

  /**
   * Count products matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<number>} Count
   */
  async count(criteria = {}) {
    let query = supabase.from("products").select("*", { count: "exact", head: true });

    Object.entries(criteria).forEach(([key, value]) => {
      const dbKey = this._toSnakeCase(key);
      query = query.eq(dbKey, value);
    });

    const { count, error } = await query;
    if (error) throw error;
    return count;
  },

  /**
   * Delete product (hard delete)
   * @param {string} id - Product UUID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteById(id) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  /**
   * Search products (full-text search)
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of matching products
   */
  async search(searchTerm, options = {}) {
    let query = supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

    if (options.category) {
      query = query.eq("category", options.category);
    }

    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data.map(product => this._mapFromDb(product));
  },

  /**
   * Map database row to application object
   * @private
   */
  _mapFromDb(row, populate = []) {
    if (!row) return null;

    const product = {
      id: row.id,
      _id: row.id, // MongoDB compatibility alias
      ownerId: row.owner_id,
      title: row.title,
      description: row.description,
      price: parseFloat(row.price), // Convert from decimal to number
      imageUrl: row.image_url,
      category: row.category,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    // Populate owner data if joined
    if (row.owner) {
      product.ownerId = {
        id: row.owner.id,
        _id: row.owner.id,
        name: row.owner.name,
        email: row.owner.email,
        phone: row.owner.phone,
        avatar: row.owner.avatar
      };
    }

    return product;
  },

  /**
   * Convert camelCase to snake_case
   * @private
   */
  _toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
};
