from math import sqrt
from datetime import datetime
from .state import FraudState


def vector_magnitude(x: float, y: float, z: float) -> float:
    return sqrt((x**2) + (y**2) + (z**2))


def movement_consistency_score(speed: float, accel: dict) -> tuple[float, list[str], list[dict]]:
    accel_mag = vector_magnitude(accel['x'], accel['y'], accel['z'])
    horizontal_accel = sqrt((accel['x'] ** 2) + (accel['y'] ** 2))
    flags: list[str] = []
    evidence: list[dict] = []

    speed_factor = min(speed / 100, 1)
    accel_factor = min(max((accel_mag - 9.2) / 2.2, 0), 1)

    score = 100 - abs((speed_factor * 100) - (accel_factor * 100))
    score = max(0.0, min(100.0, score))

    # High GPS speed with nearly no lateral sensor movement is a common spoofing signature.
    if speed > 55 and (accel_mag < 9.35 or horizontal_accel < 0.35):
        flags.append('gps_sensor_mismatch')
        evidence.append(
            {
                'type': 'gps_sensor_mismatch',
                'details': {
                    'gps_speed_kmh': round(float(speed), 2),
                    'horizontal_accel_mps2': round(float(horizontal_accel), 3),
                    'total_accel_mps2': round(float(accel_mag), 3),
                },
            }
        )
        score = min(score, 25.0)

    return score, flags, evidence


def network_score(network_data: dict, state: FraudState, user_id: str, event_time: datetime) -> tuple[float, list[str], list[dict]]:
    ip = network_data['ip']
    isp = network_data.get('isp', '').lower()
    vpn = bool(network_data.get('vpn', False))

    flags: list[str] = []
    evidence: list[dict] = []
    score = 100.0

    state.register(user_id, ip, event_time)

    unique_users = len(state.ip_to_users[ip])
    hourly_hits = len(state.ip_last_seen[ip])

    if vpn or 'vpn' in isp or 'proxy' in isp:
        flags.append('vpn_or_proxy_detected')
        evidence.append(
            {
                'type': 'vpn_or_proxy_detected',
                'details': {
                    'ip': ip,
                    'isp': network_data.get('isp', 'unknown'),
                    'vpn_declared': vpn,
                },
            }
        )
        score -= 65

    if unique_users >= 4:
        flags.append('shared_ip_cluster')
        evidence.append(
            {
                'type': 'shared_ip_cluster',
                'details': {
                    'ip': ip,
                    'unique_users_on_ip': unique_users,
                },
            }
        )
        score -= min(35, unique_users * 6)

    if hourly_hits >= 8:
        flags.append('ip_burst_activity')
        evidence.append(
            {
                'type': 'ip_burst_activity',
                'details': {
                    'ip': ip,
                    'hits_last_hour': hourly_hits,
                },
            }
        )
        score -= min(20, hourly_hits)

    return max(0.0, score), flags, evidence


def time_pattern_score(state: FraudState, user_id: str) -> tuple[float, list[str], list[dict]]:
    events = state.user_timestamps[user_id]
    flags: list[str] = []
    evidence: list[dict] = []

    if len(events) < 3:
        return 95.0, flags, evidence

    gaps = []
    for i in range(1, len(events)):
        gaps.append((events[i] - events[i - 1]).total_seconds())

    rapid_events = sum(1 for gap in gaps if gap < 20)
    if rapid_events >= 2:
        flags.append('rapid_repeated_claims')
        evidence.append(
            {
                'type': 'rapid_repeated_claims',
                'details': {
                    'user_id': user_id,
                    'rapid_gaps_lt_20s': rapid_events,
                },
            }
        )

    score = 100 - min(60, rapid_events * 20)
    return max(0.0, float(score)), flags, evidence


def correlation_score(state: FraudState, ip: str, user_id: str) -> tuple[float, list[str], list[dict]]:
    users = state.ip_to_users[ip]
    flags: list[str] = []
    evidence: list[dict] = []

    if len(users) <= 1:
        return 100.0, flags, evidence

    # Basic graph signal: many accounts linked to one infrastructure node.
    linked_users = len(users - {user_id})
    score = 100 - min(80, linked_users * 15)
    if linked_users >= 2:
        flags.append('multi_user_ip_correlation')
        evidence.append(
            {
                'type': 'multi_user_ip_correlation',
                'details': {
                    'ip': ip,
                    'linked_users': sorted(list(users))[:10],
                    'linked_user_count': len(users),
                },
            }
        )

    return max(0.0, float(score)), flags, evidence
