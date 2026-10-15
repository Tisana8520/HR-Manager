# Final Exam: Internet Programming (2026) – HR Manager & Salary Analytics

## Run the backend (port 3000)
```
cd backend
npm install
npm start
```

## Run the frontend (Expo / Metro)
```
cd frontend
npm install
npx expo start
```
- Android emulator: works out of the box (uses 10.0.2.2:3000).
- iOS simulator / web: uses localhost:3000.
- Physical phone: set `LAN_URL` in `frontend/src/config.js` to `http://<your-computer-IP>:3000`.

Login: `admin` / `password123`

## API
| Method | Path | Notes |
|---|---|---|
| POST | /api/login | 200 + token, or 401 |
| GET | /api/employees | needs `Authorization: Bearer mock-jwt-token` |
| POST | /api/employees | 400 if any field empty / salary invalid |
| PUT | /api/employees/:id/status | toggles Active <-> On Leave |
| DELETE | /api/employees/:id | |
| GET | /api/employees/salary-clusters | 1D K-Means, k=3 |
