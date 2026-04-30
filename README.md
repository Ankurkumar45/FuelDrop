# FuelDrop ⛽

> A MERN stack platform to find nearby petrol pumps, order fuel delivery, and send emergency SOS alerts.

---

## Project structure

```
fueldrop/
├── backend/
│   ├── config/         → db.js (MongoDB connection)
│   ├── controllers/    → authController.js
│   ├── middleware/     → auth.js (JWT protect + authorize)
│   ├── models/         → User.js, Pump.js, Order.js, SosAlert.js
│   ├── routes/         → authRoutes.js
│   ├── sockets/        → (Phase 4: tracking, sos handlers)
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/ → ProtectedRoute.jsx
        ├── pages/      → LoginPage.jsx, RegisterPage.jsx
        ├── services/   → api.js (axios + all endpoints)
        ├── store/      → index.js, authSlice.js
        ├── App.jsx
        └── main.jsx
```

---

## Setup

### Backend

```bash
cd backend
npm install

# Copy env file and fill in your values
cp .env.example .env

# Start dev server
npm run dev
```

Required env values:
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — any long random string

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## API routes (Phase 1)

| Method | Endpoint                  | Access   | Description            |
|--------|---------------------------|----------|------------------------|
| POST   | /api/auth/register        | Public   | Register new user      |
| POST   | /api/auth/login           | Public   | Login, returns JWT     |
| GET    | /api/auth/me              | Private  | Get current user       |
| PUT    | /api/auth/update-profile  | Private  | Update name/phone/pic  |
| PUT    | /api/auth/change-password | Private  | Change password        |
| PUT    | /api/auth/update-location | Private  | Agent location update  |
| GET    | /api/health               | Public   | Health check           |

---

## User roles

| Role             | Description                        |
|------------------|------------------------------------|
| `seeker`         | Riders/drivers who need fuel       |
| `pump_owner`     | Petrol pump owners                 |
| `delivery_agent` | Agents who deliver fuel to seekers |

---

## Build phases

- ✅ **Phase 1** — Auth system, MongoDB models, role-based routing
- 🔲 **Phase 2** — Map view, pump finder (Leaflet + geo queries)
- 🔲 **Phase 3** — Order placement, delivery tracking
- 🔲 **Phase 4** — SOS alerts, Socket.IO real-time, payments (Razorpay)
