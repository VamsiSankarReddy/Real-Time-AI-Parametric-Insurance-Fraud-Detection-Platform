from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def build_payload(user_id: str, speed: float, accel_xyz: tuple, route_dev: float, idle: float, ip: str, vpn: bool):
    return {
        'user_id': user_id,
        'gps_location': {
            'lat': 12.9716,
            'lon': 77.5946,
            'speed': speed,
            'route_deviation': route_dev,
            'idle_time': idle,
        },
        'sensor_data': {
            'accelerometer': {
                'x': accel_xyz[0],
                'y': accel_xyz[1],
                'z': accel_xyz[2],
            },
            'gyroscope': {'x': 0.8, 'y': 0.7, 'z': 0.6},
        },
        'network_data': {
            'ip': ip,
            'isp': 'trusted-isp' if not vpn else 'public-vpn-provider',
            'vpn': vpn,
        },
        'timestamp': '2026-03-20T10:00:00Z',
    }


def test_honest_user_approved():
    payload = build_payload(
        user_id='honest_t1',
        speed=28,
        accel_xyz=(1.4, 1.1, 9.7),
        route_dev=0.08,
        idle=1.0,
        ip='10.10.10.1',
        vpn=False,
    )
    response = client.post('/evaluate-claim', json=payload)
    body = response.json()

    assert response.status_code == 200
    assert body['status'] == 'approved'
    assert body['trust_score'] > 80


def test_gps_spoof_flagged():
    payload = build_payload(
        user_id='attacker_t1',
        speed=115,
        accel_xyz=(0.05, 0.04, 9.82),
        route_dev=1.2,
        idle=25,
        ip='185.203.119.11',
        vpn=True,
    )
    response = client.post('/evaluate-claim', json=payload)
    body = response.json()

    assert response.status_code == 200
    assert body['status'] == 'fraud_flagged'
    assert body['trust_score'] < 50


def test_borderline_verification_required():
    payload = build_payload(
        user_id='borderline_t1',
        speed=46,
        accel_xyz=(0.6, 0.5, 9.3),
        route_dev=0.32,
        idle=4.5,
        ip='172.16.5.20',
        vpn=False,
    )
    response = client.post('/evaluate-claim', json=payload)
    body = response.json()

    assert response.status_code == 200
    assert body['status'] == 'verification_required'
    assert 50 <= body['trust_score'] <= 80
