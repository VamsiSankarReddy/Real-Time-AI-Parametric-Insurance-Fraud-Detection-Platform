# Real-Time AI Parametric Insurance Fraud Detection Platform

Production-grade multi-service system for delivery-worker insurance claim processing with GPS spoofing defense, trust scoring, and real-time decisioning.

## Architecture

Frontend (React + Tailwind) -> Backend (Node.js + Express + Socket.IO) -> ML Service (FastAPI + Isolation Forest) -> MongoDB -> Frontend Realtime Updates

## Project Structure

```text
project-root/
|-- frontend/
|-- backend/
|-- ml-service/
|-- docker-compose.yml
|-- README.md
```

## Core Features

- Claim submission workflow with anti-spoofing checks
- Real-time trust score updates via WebSocket
- JWT authentication with role-based verification actions
- Redis-backed trust-score caching for high-throughput repeated feature patterns
- Fraud ring graph API and dashboard visualization for user-IP correlation
- Decision engine:
  - `approved` for trust score > 80
  - `verification_required` for trust score between 50 and 80
  - `fraud_flagged` for trust score < 50
- Anti-fraud signals:
  - Sensor vs GPS mismatch detection
  - Network VPN/proxy detection and IP cluster analysis
  - Time-based rapid-claim detection
  - Multi-user correlation by shared IP node
- Evidence-rich fraud signals with real values (speed, accel, IP, ISP, linked users)
- Simulation engine for honest and attacker traffic

## Backend API

### `POST /api/submit-claim`
Submits a claim payload and returns trust decision.

### `GET /api/claim-status/:id`
Returns trust score and status.

### `GET /api/claims`
Returns recent claims for dashboard listing.

### `POST /api/verify-user`
Manual verification endpoint with mock selfie upload.
Requires JWT role `adjuster` or `admin`.

### `POST /api/auth/login`
Returns JWT token and role for demo users.

### `GET /api/fraud-graph`
Returns nodes/edges to visualize potential fraud rings.

### `POST /api/simulate/:mode/start`
Starts simulation (`mode` = `honest` or `attacker`).

### `POST /api/simulate/:mode/stop`
Stops simulation.

## ML Service Details

`POST /evaluate-claim` runs:

- Movement consistency model
- Isolation Forest anomaly score
- Network fraud detection (VPN + IP clustering)
- Time pattern analysis
- Multi-user correlation scoring

Returns:

```json
{
  "trust_score": 86.4,
  "status": "approved",
  "fraud_flags": ["..."],
  "fraud_evidence": [
    {
      "type": "gps_sensor_mismatch",
      "details": {
        "gps_speed_kmh": 118,
        "horizontal_accel_mps2": 0.05
      }
    }
  ],
  "component_scores": {
    "movement_score": 90,
    "anomaly_score": 84,
    "network_score": 88,
    "time_pattern_score": 95,
    "correlation_score": 92
  }
}
```

## Local Setup (Without Docker)

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 2. ML Service

```bash
cd ml-service
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Docker Setup

From root:

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- ML Service: http://localhost:8000
- MongoDB: localhost:27017
- Redis: localhost:6379

## Demo Credentials

- Worker: `worker1` / `worker123`
- Adjuster: `adjuster1` / `adjuster123`
- Admin: `admin1` / `admin123`

## Testing

### ML test cases (required scenarios)

```bash
cd ml-service
pytest -q
```

Covers:
1. Honest user -> approved
2. GPS spoof attacker -> fraud flagged
3. Borderline behavior -> verification required

### Backend smoke test

```bash
cd backend
npm test
```

## Notes on Production Readiness

- Modular service boundaries with clear API contracts
- Environment-variable driven configuration
- Dockerized runtime for reproducible deployments
- Real-time event push architecture via Socket.IO
- Extendable architecture for Redis/JWT/graph visualization in future iterations
# AI-Powered-Anti-Spoofing-Parametric-Insurance-Platform
# AI-Powered-Anti-Spoofing-Parametric-Insurance-Platform
