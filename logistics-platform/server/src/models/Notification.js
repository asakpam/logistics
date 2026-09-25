import { supabase } from "../config/db.js";

/**
 * Notification Model - Supabase Operations
 * ─────────────────────────────────────────────────────────────────────────────
 * User notifications for SMS, push, email, and in-app alerts.
 */

export const NOTIFICATION_TYPES = ["sms", "push", "email", "in_app"];

export const Notification = {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async create(notificationData) {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || "in_app",
        is_read: notificationData.isRead || false,
        shipment_id: notificationData.shipmentId || null,
        metadata: notificationData.metadata || null
      })
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Create multiple notifications in bulk
   * @param {Array} notificationsData - Array of notification data objects
   * @returns {Promise<Array>} Array of created notifications
   */
  async createMany(notificationsData) {
    const insertData = notificationsData.map(notification => ({
      user_id: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || "in_app",
      is_read: notification.isRead || false,
      shipment_id: notification.shipmentId || null,
      metadata: notification.metadata || null
    }));

    const { data, error } = await supabase
      .from("notifications")
      .insert(insertData)
      .select();

    if (error) throw error;
    return data.map(notification => this._mapFromDb(notification));
  },

  /**
   * Find notification by ID
   * @param {string} id - Notification UUID
   * @returns {Promise<Object|null>} Notification or null
   */
  async findById(id) {
    const { data, error } = await supabase
      .from("notifications")
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
   * Find all notifications with optional filters
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options (orderBy, limit, offset)
   * @returns {Promise<Array>} Array of notifications
   */
  async find(criteria = {}, options = {}) {
    let selectQuery = "*";

    // Join with shipment if requested
    if (options.populate && options.populate.includes("shipmentId")) {
      selectQuery = `
        *,
        shipment:shipments!notifications_shipment_id_fkey(
          id,
          tracking_number,
          status
        )
      `;
    }

    let query = supabase.from("notifications").select(selectQuery);

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
    return data.map(notification => this._mapFromDb(notification, options.populate));
  },

  /**
   * Find unread notifications for a user
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of unread notifications
   */
  async findUnread(userId, options = {}) {
    return this.find({ userId, isRead: false }, options);
  },

  /**
   * Find recent notifications for a user
   * @param {string} userId - User UUID
   * @param {number} limit - Number of notifications to fetch (default: 20)
   * @returns {Promise<Array>} Array of recent notifications
   */
  async findRecent(userId, limit = 20) {
    return this.find({ userId }, { limit, orderBy: "created_at desc" });
  },

  /**
   * Update notification by ID
   * @param {string} id - Notification UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated notification
   */
  async findByIdAndUpdate(id, updates, options = {}) {
    const updateData = {};

    if (updates.isRead !== undefined) updateData.is_read = updates.isRead;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.message !== undefined) updateData.message = updates.message;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const { data, error } = await supabase
      .from("notifications")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this._mapFromDb(data);
  },

  /**
   * Mark notification as read
   * @param {string} id - Notification UUID
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(id) {
    return this.findByIdAndUpdate(id, { isRead: true });
  },

  /**
   * Mark multiple notifications as read
   * @param {Array<string>} ids - Array of notification UUIDs
   * @returns {Promise<Array>} Array of updated notifications
   */
  async markManyAsRead(ids) {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids)
      .select();

    if (error) throw error;
    return data.map(notification => this._mapFromDb(notification));
  },

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User UUID
   * @returns {Promise<number>} Number of notifications updated
   */
  async markAllAsReadForUser(userId) {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .select("id");

    if (error) throw error;
    return data.length;
  },

  /**
   * Count unread notifications for a user
   * @param {string} userId - User UUID
   * @returns {Promise<number>} Count of unread notifications
   */
  async countUnread(userId) {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return count;
  },

  /**
   * Count total notifications matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<number>} Count
   */
  async count(criteria = {}) {
    let query = supabase.from("notifications").select("*", { count: "exact", head: true });

    Object.entries(criteria).forEach(([key, value]) => {
      const dbKey = this._toSnakeCase(key);
      query = query.eq(dbKey, value);
    });

    const { count, error } = await query;
    if (error) throw error;
    return count;
  },

  /**
   * Delete notification by ID
   * @param {string} id - Notification UUID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteById(id) {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  /**
   * Delete old notifications for a user (older than X days)
   * @param {string} userId - User UUID
   * @param {number} daysOld - Delete notifications older than this many days (default: 30)
   * @returns {Promise<number>} Number of notifications deleted
   */
  async deleteOldForUser(userId, daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .lt("created_at", cutoffDate.toISOString())
      .select("id");

    if (error) throw error;
    return data.length;
  },

  /**
   * Create notification for shipment status change
   * @param {string} userId - User UUID to notify
   * @param {Object} shipment - Shipment object
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} Created notification
   */
  async createForStatusChange(userId, shipment, newStatus) {
    const statusMessages = {
      "Assigned": `Driver assigned to your shipment ${shipment.trackingNumber}`,
      "Dispatched": `Your shipment ${shipment.trackingNumber} has been dispatched`,
      "In Transit": `Your shipment ${shipment.trackingNumber} is now in transit`,
      "Out For Delivery": `Your shipment ${shipment.trackingNumber} is out for delivery`,
      "Delivered": `Your shipment ${shipment.trackingNumber} has been delivered`,
      "Cancelled": `Your shipment ${shipment.trackingNumber} has been cancelled`
    };

    return this.create({
      userId,
      title: "Shipment Status Update",
      message: statusMessages[newStatus] || `Shipment ${shipment.trackingNumber} status changed to ${newStatus}`,
      type: "in_app",
      shipmentId: shipment.id,
      metadata: {
        tracking_number: shipment.trackingNumber,
        status: newStatus,
        timestamp: new Date().toISOString()
      }
    });
  },

  /**
   * Map database row to application object
   * @private
   */
  _mapFromDb(row, populate = []) {
    if (!row) return null;

    const notification = {
      id: row.id,
      _id: row.id, // MongoDB compatibility alias
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      isRead: row.is_read,
      shipmentId: row.shipment_id,
      metadata: row.metadata,
      createdAt: row.created_at
    };

    // Populate shipment data if joined
    if (row.shipment) {
      notification.shipmentId = {
        id: row.shipment.id,
        trackingNumber: row.shipment.tracking_number,
        status: row.shipment.status
      };
    }

    return notification;
  },

  /**
   * Convert camelCase to snake_case
   * @private
   */
  _toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
};
