import twilio from "twilio";
import { Notification } from "../models/Notification.js";

function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null;
  }

  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export async function recordNotification(userId, message, type = "system") {
  return Notification.create({ userId, message, type });
}

export async function sendSms(phone, message) {
  const client = getTwilioClient();
  if (!client || !phone || !process.env.TWILIO_FROM_NUMBER) return null;

  return client.messages.create({
    to: phone,
    from: process.env.TWILIO_FROM_NUMBER,
    body: message
  });
}

export async function notifyStatusChange({ shipment, customer }) {
  const message = `Shipment ${shipment.trackingNumber} is now ${shipment.status}.`;
  await recordNotification(customer._id, message, "system");

  if (["Dispatched", "In Transit", "Delivered"].includes(shipment.status)) {
    await sendSms(customer.phone, message);
  }
}
