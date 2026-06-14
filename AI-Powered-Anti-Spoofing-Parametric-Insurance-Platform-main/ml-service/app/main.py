from fastapi import FastAPI
from .anomaly import AnomalyDetector
from .scoring import (
    movement_consistency_score,
    network_score,
    time_pattern_score,
    correlation_score,
)
from .schemas import ClaimInput, EvaluationResponse
from .state import FraudState

app = FastAPI(title="Fraud Detection ML Service", version="1.0.0")
state = FraudState()
anomaly_detector = AnomalyDetector()


@app.get('/health')
def health() -> dict:
    return {'status': 'ok', 'service': 'ml-service'}


@app.post('/evaluate-claim', response_model=EvaluationResponse)
def evaluate_claim(claim: ClaimInput) -> dict:
    movement_score, movement_flags, movement_evidence = movement_consistency_score(
        speed=claim.gps_location.speed,
        accel=claim.sensor_data.accelerometer.model_dump(),
    )

    anomaly_score = anomaly_detector.score(
        speed=claim.gps_location.speed,
        idle_time=claim.gps_location.idle_time,
        route_deviation=claim.gps_location.route_deviation,
    )

    network_score_value, network_flags, network_evidence = network_score(
        network_data=claim.network_data.model_dump(),
        state=state,
        user_id=claim.user_id,
        event_time=claim.timestamp,
    )

    time_score, time_flags, time_evidence = time_pattern_score(state=state, user_id=claim.user_id)
    corr_score, corr_flags, corr_evidence = correlation_score(
        state=state, ip=claim.network_data.ip, user_id=claim.user_id
    )

    trust_score = (
        (0.30 * movement_score)
        + (0.20 * anomaly_score)
        + (0.25 * network_score_value)
        + (0.15 * time_score)
        + (0.10 * corr_score)
    )

    if trust_score > 80:
        status = 'approved'
    elif 50 <= trust_score <= 80:
        status = 'verification_required'
    else:
        status = 'fraud_flagged'

    fraud_flags = list(
        {
            *movement_flags,
            *network_flags,
            *time_flags,
            *corr_flags,
            *(['manual_review_required'] if status == 'verification_required' else []),
        }
    )
    fraud_evidence = [*movement_evidence, *network_evidence, *time_evidence, *corr_evidence]

    return {
        'trust_score': round(float(trust_score), 2),
        'status': status,
        'fraud_flags': fraud_flags,
        'fraud_evidence': fraud_evidence,
        'component_scores': {
            'movement_score': round(float(movement_score), 2),
            'anomaly_score': round(float(anomaly_score), 2),
            'network_score': round(float(network_score_value), 2),
            'time_pattern_score': round(float(time_score), 2),
            'correlation_score': round(float(corr_score), 2),
        },
    }
