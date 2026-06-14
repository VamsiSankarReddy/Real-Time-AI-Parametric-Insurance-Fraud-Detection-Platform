import { useState } from 'react';
import { submitClaim } from '../services/api';

const initialState = {
  user_id: 'worker_101',
  lat: 12.9716,
  lon: 77.5946,
  speed: 35,
  route_deviation: 0.1,
  idle_time: 1,
  acc_x: 1.2,
  acc_y: 1,
  acc_z: 9.7,
  gyro_x: 0.5,
  gyro_y: 0.4,
  gyro_z: 0.8,
  ip: '10.23.14.9',
  isp: 'trusted-isp',
  vpn: false
};

export default function ClaimForm({ onSubmitted }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        user_id: form.user_id,
        gps_location: {
          lat: Number(form.lat),
          lon: Number(form.lon),
          speed: Number(form.speed),
          route_deviation: Number(form.route_deviation),
          idle_time: Number(form.idle_time)
        },
        sensor_data: {
          accelerometer: {
            x: Number(form.acc_x),
            y: Number(form.acc_y),
            z: Number(form.acc_z)
          },
          gyroscope: {
            x: Number(form.gyro_x),
            y: Number(form.gyro_y),
            z: Number(form.gyro_z)
          }
        },
        network_data: {
          ip: form.ip,
          isp: form.isp,
          vpn: form.vpn
        },
        timestamp: new Date().toISOString()
      };

      await submitClaim(payload);
      onSubmitted();
    } catch (submitError) {
      setError(submitError.response?.data?.error || 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="glass-panel card-animate rounded-2xl p-5" onSubmit={handleSubmit}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Submit Claim</h2>
        <span className="font-mono text-xs text-slate-600">Live ingestion</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['user_id', 'User ID'],
          ['lat', 'Latitude'],
          ['lon', 'Longitude'],
          ['speed', 'Speed'],
          ['route_deviation', 'Route Deviation'],
          ['idle_time', 'Idle Time'],
          ['acc_x', 'Acc X'],
          ['acc_y', 'Acc Y'],
          ['acc_z', 'Acc Z'],
          ['gyro_x', 'Gyro X'],
          ['gyro_y', 'Gyro Y'],
          ['gyro_z', 'Gyro Z'],
          ['ip', 'IP Address'],
          ['isp', 'ISP']
        ].map(([name, label]) => (
          <label key={name} className="flex flex-col gap-1 text-sm">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-600">{label}</span>
            <input
              className="rounded-xl border border-slate-300 bg-white/80 px-3 py-2 outline-none ring-emerald-300 transition focus:ring"
              name={name}
              value={form[name]}
              onChange={updateField}
              required={name === 'user_id' || name === 'ip'}
            />
          </label>
        ))}
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" name="vpn" checked={form.vpn} onChange={updateField} />
        VPN / Proxy in use
      </label>

      {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-xl bg-ink px-4 py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Claim'}
      </button>
    </form>
  );
}
