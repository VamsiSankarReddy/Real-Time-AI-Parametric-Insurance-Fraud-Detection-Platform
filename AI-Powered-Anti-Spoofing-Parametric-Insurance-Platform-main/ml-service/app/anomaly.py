import numpy as np
from sklearn.ensemble import IsolationForest


class AnomalyDetector:
    def __init__(self, seed: int = 42) -> None:
        self.model = IsolationForest(contamination=0.12, random_state=seed)
        self._train_baseline()

    def _train_baseline(self) -> None:
        # Baseline profile approximates normal delivery behavior.
        normal_data = np.array(
            [
                [18, 1, 0.05],
                [26, 0.8, 0.12],
                [33, 0.5, 0.08],
                [40, 1.4, 0.18],
                [22, 1.1, 0.10],
                [30, 0.6, 0.07],
                [35, 1.8, 0.20],
                [28, 0.9, 0.11],
                [24, 1.6, 0.14],
                [32, 1.3, 0.15],
            ]
        )
        self.model.fit(normal_data)

    def score(self, speed: float, idle_time: float, route_deviation: float) -> float:
        features = np.array([[speed, idle_time, route_deviation]])
        model_score = self.model.decision_function(features)[0]

        # Convert model score to trust-friendly 0-100 where higher is better.
        normalized = np.clip((model_score + 0.25) / 0.5, 0, 1)
        return float(normalized * 100)
