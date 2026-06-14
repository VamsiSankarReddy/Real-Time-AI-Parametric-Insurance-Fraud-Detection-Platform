from collections import defaultdict, deque
from datetime import datetime, timedelta


class FraudState:
    def __init__(self) -> None:
        self.ip_to_users: dict[str, set[str]] = defaultdict(set)
        self.ip_last_seen: dict[str, deque[datetime]] = defaultdict(deque)
        self.user_timestamps: dict[str, deque[datetime]] = defaultdict(deque)

    def register(self, user_id: str, ip: str, event_time: datetime) -> None:
        self.ip_to_users[ip].add(user_id)
        self.ip_last_seen[ip].append(event_time)
        self.user_timestamps[user_id].append(event_time)

        cutoff = event_time - timedelta(hours=1)
        while self.ip_last_seen[ip] and self.ip_last_seen[ip][0] < cutoff:
            self.ip_last_seen[ip].popleft()

        user_cutoff = event_time - timedelta(hours=24)
        while self.user_timestamps[user_id] and self.user_timestamps[user_id][0] < user_cutoff:
            self.user_timestamps[user_id].popleft()
