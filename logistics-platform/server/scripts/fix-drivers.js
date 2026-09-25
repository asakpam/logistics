import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import "dotenv/config";
import mongoose from "mongoose";

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/logistics-platform";
  console.log("Connecting to:", uri);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log("Connected to MongoDB!");

  const usersColl = mongoose.connection.db.collection("users");
  const driversColl = mongoose.connection.db.collection("drivers");

  // 1. Fix testdrivernew123@example.com
  const testDriver = await usersColl.findOne({ email: "testdrivernew123@example.com" });
  if (testDriver) {
    await usersColl.updateOne(
      { _id: testDriver._id },
      {
        $set: {
          role: "driver",
          status: "pending",
          isActive: true,
          address: {
            street: "Independence Avenue 15",
            city: "Accra",
            region: "Greater Accra",
            country: "Ghana"
          }
        }
      }
    );

    await driversColl.updateOne(
      { userId: testDriver._id },
      {
        $set: {
          userId: testDriver._id,
          licenseNumber: "LIC-GA-9021",
          vehicleNumber: "GT-4521-23",
          vehicleType: "Van",
          digitalAddress: "GA-001-1234",
          ghanaCardImage: "sShh2nikYFZw1u4O05cDtZReSlZ2_1788983662320_cc7d4f8977c5.jpeg",
          status: "pending",
          isAvailable: false,
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
    console.log("✅ testdrivernew123 fixed as pending driver with driver record.");
  }

  // 2. Fix or create blessasakpam@gmail.com
  let blessUser = await usersColl.findOne({ email: "blessasakpam@gmail.com" });
  if (!blessUser) {
    const res = await usersColl.insertOne({
      firebaseUid: "8Ax1kCo79Gh0RRQFfdVwESz0F9I3",
      name: "Bless Asakpam",
      email: "blessasakpam@gmail.com",
      phone: "+233245678901",
      role: "driver",
      status: "pending",
      isActive: true,
      address: {
        street: "Ring Road Central",
        city: "Accra",
        region: "Greater Accra",
        country: "Ghana"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    blessUser = { _id: res.insertedId };
  } else {
    await usersColl.updateOne(
      { _id: blessUser._id },
      { $set: { role: "driver", status: "pending", isActive: true } }
    );
  }

  await driversColl.updateOne(
    { userId: blessUser._id },
    {
      $set: {
        userId: blessUser._id,
        licenseNumber: "LIC-GA-8877",
        vehicleNumber: "GE-1234-24",
        vehicleType: "Van",
        digitalAddress: "GA-123-4567",
        ghanaCardImage: "8Ax1kCo79Gh0RRQFfdVwESz0F9I3_1788983970172_6002c9e3d98d.jpeg",
        status: "pending",
        isAvailable: false,
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
  );
  console.log("✅ blessasakpam fixed as pending driver with driver record.");

  // 3. Fix oseisamuel321@gmail.com
  const oseiUser = await usersColl.findOne({ email: "oseisamuel321@gmail.com" });
  if (oseiUser) {
    await driversColl.updateOne(
      { userId: oseiUser._id },
      {
        $set: {
          licenseNumber: "LIC-OS-4521",
          vehicleNumber: "GR-8912-23",
          vehicleType: "Van",
          digitalAddress: "GA-234-5678",
          status: "pending",
          isAvailable: false
        }
      }
    );
    console.log("✅ oseisamuel driver record updated.");
  }

  // Print all users and drivers
  const allUsers = await usersColl.find({}).toArray();
  const allDrivers = await driversColl.find({}).toArray();

  console.log("\n=== ALL USERS IN DB ===");
  console.log(allUsers.map(u => ({ id: u._id, email: u.email, role: u.role, status: u.status })));
  console.log("\n=== ALL DRIVERS IN DB ===");
  console.log(allDrivers.map(d => ({ id: d._id, userId: d.userId, status: d.status, license: d.licenseNumber, vehicle: d.vehicleNumber, card: d.ghanaCardImage })));

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error("Error in fix-drivers:", err);
  process.exit(1);
});
