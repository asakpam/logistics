### Customer and Admin Dashboard Requirements

I am developing an ** Intelligent Logistics Platform with Machine Learning - Based Delivery Time Prediction and Real - Time Shipment Tracking **.

The system should have ** one secure authentication system **, but users must be redirected to different dashboards based on their roles.The two main roles are ** Customer ** and ** Administrator **.

### 1. Authentication and Login

Create a single login page where users enter:

* Email
    * Password

After successful authentication, the backend should determine the user's role.

    * If`role = customer`, redirect the user to the ** Customer Dashboard **.
* If`role = admin`, redirect the user to the ** Admin Dashboard **.

Do not create separate authentication systems for customers and administrators.

Authentication must be handled securely on the backend.Passwords must never be stored as plain text.Passwords should be securely hashed using a strong password-hashing algorithm such as Argon2id or bcrypt.

Use secure authentication sessions / cookies.Authentication should not depend only on frontend checks.

### 2. Role - Based Access Control

Implement Role - Based Access Control(RBAC).

Customers must only be able to access customer - related functions.

Administrators must have access to administrative functions.

The backend must verify the user's authentication and role before allowing access to protected API endpoints.

For example:

```text
Customer:
GET /api/shipments/my-shipments

Admin:
GET /api/admin/shipments
POST /api/admin/assign-driver
```

A customer must not be able to access an administrator endpoint simply by manually entering an admin URL or modifying a frontend request.

Unauthorized users should receive an appropriate `401` or `403` response.

---

## 3. Customer Dashboard

After a customer logs in, display a clean and simple dashboard.

The customer dashboard should contain:

### Dashboard Overview

Show:

* Number of active shipments
    * Number of delivered shipments
        * Number of pending shipments
            * Recent shipment activity

### Book Shipment

Allow customers to create a shipment by entering:

* Pickup location
    * Delivery location
        * Package information
            * Package weight
                * Preferred delivery information

After submission, the system should create the shipment and assign it a unique shipment ID.

### My Shipments

Display the customer's shipments in a table/card format.

Include:

* Shipment ID
    * Pickup location
        * Delivery location
            * Shipment status
                * Estimated Time of Arrival(ETA)
                    * Date created

### Track Shipment

Customers should be able to select a shipment and view:

* Current shipment status
    * Driver / location information where appropriate
        * Current GPS location on a map
            * Route
            * Predicted ETA

The ETA displayed here should come from the machine learning prediction service when a prediction is available.

### Notifications

Display important updates such as:

* Shipment booked
    * Driver assigned
        * Shipment picked up
            * Shipment in transit
            * Delivery delayed
                * Shipment delivered

### Profile

Allow the customer to view / update appropriate profile information.

### Logout

Provide a logout option that properly terminates the authenticated session.

---

# 4. Admin Dashboard

The administrator dashboard should provide a complete overview of the logistics operation.

### Dashboard Overview

Display statistics such as:

* Total shipments
    * Pending shipments
        * Shipments in transit
        * Delivered shipments
            * Number of customers
                * Number of drivers
                    * Number of active deliveries

### Customer Management

Administrators should be able to:

* View customers
    * Search customers
        * View customer details
            * Manage customer accounts where appropriate

### Driver Management

Administrators should be able to:

* Add drivers
    * View drivers
        * Edit driver information
            * Activate / deactivate driver accounts
                * View assigned deliveries

### Shipment Management

Administrators should be able to:

* View all shipments
    * Search / filter shipments
        * Create or update shipments where appropriate
            * Assign drivers
                * Change shipment status
                    * View shipment details

### Live Shipment Monitoring

Provide a map showing active shipments and their current GPS locations.

Administrators should be able to select a shipment and view:

* Shipment ID
    * Driver
    * Current location
        * Destination
        * Shipment status
            * Predicted ETA

### Machine Learning / ETA Section

Include a section showing information about the ETA prediction system.

For example:

* Predicted ETA
    * Actual delivery time
        * Prediction error
            * Model being used
                * Model performance metrics

If the machine learning model is available through an API, the backend should communicate with that service rather than running the model directly in the browser.

### Reports and Analytics

Allow administrators to view logistics statistics such as:

* Completed deliveries
    * Delayed deliveries
        * Average delivery time
            * Average ETA error
                * Driver delivery performance
                    * Shipment trends

### User Management

Administrators should be able to manage authorised users according to their permissions.

Do not allow normal customers to create administrator accounts through public registration.

---

# 5. Dashboard Access Rules

Use the following access model:

| Feature | Customer | Admin |
| ---------------------- | ------------- | ------------- |
| View own dashboard | ✅             | ❌             |
| Book shipment | ✅             | ✅             |
| View own shipments | ✅             | ✅             |
| Track own shipment | ✅             | ✅             |
| View live shipments | Own only | All |
| View ETA | Own shipments | All shipments |
| Manage customers | ❌             | ✅             |
| Manage drivers | ❌             | ✅             |
| Assign drivers | ❌             | ✅             |
| Manage all shipments | ❌             | ✅             |
| View reports | Limited / No | ✅             |
| Manage users | ❌             | ✅             |
| Manage system settings | ❌             | ✅             |

    The backend must enforce these permissions.Do not rely on hiding buttons or pages in the frontend as the security mechanism.

---

# 6. Security Requirements

Implement the following security measures:

1. Hash passwords before storing them.
2. Never store plaintext passwords.
3. Use HTTPS in production.
4. Use secure, HttpOnly authentication cookies.
5. Implement Role - Based Access Control.
6. Protect all private API routes.
7. Validate and sanitise user input.
8. Implement rate limiting on login attempts.
9. Prevent unauthorised access to admin routes.
10. Do not expose database credentials or API keys in frontend code.
11. Store secrets in environment variables.
12. Log important administrative actions.
13. Implement proper logout / session termination.
14. Use secure error messages that do not expose sensitive system information.

The goal is to build a system where ** the frontend controls the user experience, but the backend controls security and permissions **.

---

# 7. Overall User Flow

The expected flow is:

Login / Register
→ Authenticate User
→ Determine Role
→ Customer → Customer Dashboard

OR

Login
→ Authenticate User
→ Determine Role
→ Admin → Admin Dashboard

The system should maintain a consistent visual design across both dashboards while clearly differentiating the functionality available to each role.

Do not overcomplicate the interface.Prioritise a clean, professional logistics - management design with clear navigation, cards / statistics, tables, maps, shipment status indicators, and responsive layouts.
## 8. System Architecture

The Intelligent Logistics Platform should use a ** layered client - server architecture **.The architecture should separate the user interfaces, backend / business logic, authentication, database, machine learning services, and external services.

The architecture should be designed as follows:

```text
                         USERS
                           │
             ┌─────────────┴─────────────┐
             │                           │
       CUSTOMER                       ADMIN
             │                           │
             ▼                           ▼
   Customer Dashboard          Admin Dashboard
             │                           │
             └─────────────┬─────────────┘
                           │
                           ▼
                 PRESENTATION LAYER
                    React Web App
                           │
                        HTTPS
                           │
                           ▼
                  APPLICATION LAYER
                 Node.js / Express API
                           │
          ┌────────────────┼─────────────────┐
          │                │                 │
          ▼                ▼                 ▼
   Authentication     Logistics         Notification
      & RBAC          Services             Service
          │                │
          │        ┌───────┼────────┐
          │        │       │        │
          │        ▼       ▼        ▼
          │    Shipment  Driver   Tracking
          │    Management Management Service
          │                │        │
          │                │        ▼
          │                │    GPS / Maps API
          │                │
          └────────┬───────┘
                   │
                   ▼
              DATABASE LAYER
             PostgreSQL/MongoDB
                   │
          ┌────────┴─────────┐
          │                  │
          ▼                  ▼
    User/Shipment       Tracking/
    Data                 Prediction Data
                               │
                               ▼
                    MACHINE LEARNING LAYER
                         Python Service
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
              Data Processing        ETA Model
                    │                     │
                    └──────────┬──────────┘
                               │
                               ▼
                         Predicted ETA
                               │
                               ▼
                       Backend API
                               │
                               ▼
                     Customer / Admin UI
```

### 8.1 Presentation Layer

The presentation layer is the part of the system that users interact with.

It should contain:

* Customer Dashboard
    * Admin Dashboard
        * Login Page
            * Registration Page
                * Shipment Booking Interface
                    * Shipment Tracking Interface
                        * Notification Interface
                            * Profile Interface
                                * Reports and Analytics Interface

The customer and administrator should use the same web application, but their dashboards and available functions should be determined by their roles.

### 8.2 Application / Backend Layer

The backend will handle the main business logic of the system.

    Use:

* Node.js
    * Express.js

The backend should provide APIs for:

* Authentication
        * User management
            * Shipment management
                * Driver management
                    * Vehicle management
                        * Shipment tracking
                            * ETA prediction
                                * Notifications
                                * Reports
                                * Administrative operations

The backend is responsible for validating requests before interacting with the database.

### 8.3 Authentication and Authorization Layer

Authentication should determine ** who the user is **, while authorization determines ** what the user is allowed to do**.

The system should use Role - Based Access Control(RBAC).

The main roles are:

```text
Customer
Admin
Driver
```

After login:

```text
User Login
     ↓
Authenticate Credentials
     ↓
Retrieve User Role
     ↓
 ┌───┴───────────┐
 │               │
Customer        Admin
 │               │
 ▼               ▼
Customer       Admin
Dashboard      Dashboard
```

The backend must enforce these permissions.Hiding an admin button in the frontend is not sufficient security.

### 8.4 Database Layer

The database will store all persistent application data.

The database should contain information such as:

* Users
    * Customers
    * Drivers
    * Vehicles
    * Shipments
    * Tracking records
        * ETA predictions
            * Notifications
            * Reports

The database should use appropriate primary keys and foreign keys / relationships to maintain data integrity.

### 8.5 Machine Learning Layer

The machine learning component is responsible for predicting the Estimated Time of Arrival(ETA).

The machine learning service should be separated from the main web application.

Recommended structure:

```text
Historical Shipment Data
          ↓
Data Cleaning
          ↓
Feature Engineering
          ↓
Model Training
          ↓
Model Evaluation
          ↓
Best Model
          ↓
Prediction API
          ↓
Predicted ETA
          ↓
Backend
          ↓
Customer/Admin Dashboard
```

The model can use information such as:

* Pickup location
    * Delivery location
        * Distance
        * Vehicle type
            * Time of day
                * Day of week
                    * Historical delivery duration
                        * Traffic - related information where available
                            * Current location
                                * Other relevant logistics variables

The machine learning model should return the predicted delivery time to the backend API.

### 8.6 Real - Time Tracking Layer

The tracking component should receive GPS coordinates from the driver's device.

The flow should be:

```text
Driver Mobile Device
        ↓
GPS Coordinates
        ↓
Tracking API
        ↓
Backend
        ↓
Database
        ↓
Customer Dashboard
        ↓
Admin Dashboard
```

Customers should only be able to see tracking information for their own shipments.

Administrators should be able to monitor all active shipments.

### 8.7 External Services

The system may integrate with external services such as:

* Google Maps API
    * GPS / location services
        * Email notification service
            * SMS notification service

The Maps / GPS service can provide:

* Coordinates
    * Distance
    * Route information
        * Map visualisation

These services should communicate with the backend rather than exposing sensitive API credentials directly in the frontend.

### 8.8 Security Architecture

The system should follow a defence -in -depth approach.

Security should include:

* HTTPS
    * Password hashing using Argon2id or bcrypt
* Secure authentication sessions
    * HttpOnly cookies
        * Secure cookies
            * Appropriate SameSite cookie settings
                * Role - Based Access Control
                    * API authentication
                        * Backend authorization
                            * Input validation
                                * Rate limiting
                                    * Protection against common web attacks
                                        * Environment variables for secrets
                                            * Audit logging for important administrative activities
                                                * Secure logout / session termination

The architecture should ensure that:

```text
Customer
   ↓
Can access only customer-authorised resources

Admin
   ↓
Can access administrative resources

Driver
   ↓
Can access only driver-authorised resources
```

A customer must not be able to gain administrative access by manually changing a URL, modifying frontend code, or sending an unauthorized API request.

### 8.9 Overall Data Flow

The overall system interaction should follow this pattern:

```text
Customer/Admin
      ↓
Web Application
      ↓
Authentication
      ↓
Role Verification
      ↓
Backend API
      ↓
Business Logic
      ↓
Database
      ↓
Machine Learning / GPS / External APIs
      ↓
Backend
      ↓
Dashboard
```

The architecture should be implemented in a modular manner so that the machine learning service, tracking service, authentication system, and logistics modules can be maintained or upgraded independently.
