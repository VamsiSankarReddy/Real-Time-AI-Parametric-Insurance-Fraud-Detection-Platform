import { useEffect, useMemo, useState } from 'react';
import ClaimForm from './components/ClaimForm';
import ClaimsTable from './components/ClaimsTable';
import StatsCards from './components/StatsCards';
import AuthPanel from './components/AuthPanel';
import FraudGraph from './components/FraudGraph';
import { fetchClaims, fetchFraudGraph, runSimulation, setAuthToken, verifyClaim } from './services/api';
import { socket } from './services/socket';

export default function App() {
  const [claims, setClaims] = useState([]);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [auth, setAuth] = useState(null);
  const [connection, setConnection] = useState('connecting');

  async function refreshClaims() {
    const data = await fetchClaims();
    setClaims(data);
  }

  async function refreshGraph() {
    const data = await fetchFraudGraph();
    setGraph(data);
  }

  useEffect(() => {
    refreshClaims();
    refreshGraph();

    socket.on('connect', () => setConnection('online'));
    socket.on('disconnect', () => setConnection('offline'));

    socket.on('claim_update', (incoming) => {
      setClaims((prev) => {
        const existingIndex = prev.findIndex((claim) => (claim._id || claim.id) === (incoming._id || incoming.id));
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...incoming };
          return updated;
        }
        return [incoming, ...prev].slice(0, 50);
      });
      refreshGraph();
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('claim_update');
    };
  }, []);

  async function handleVerify(claimId) {
    await verifyClaim(claimId);
    await refreshClaims();
    await refreshGraph();
  }

  function handleAuth(authPayload) {
    setAuth(authPayload);
    setAuthToken(authPayload.token);
  }

  const riskHeadline = useMemo(() => {
    const flagged = claims.filter((c) => c.status === 'fraud_flagged').length;
    if (flagged > 10) {
      return 'Coordinated fraud ring suspected';
    }
    if (flagged > 3) {
      return 'Elevated spoofing activity';
    }
    return 'Fraud pressure in normal range';
  }, [claims]);

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-12 pt-8 md:px-6">
      <header className="card-animate mb-6 rounded-3xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500">FraudShield Platform</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">AI Parametric Insurance Command Center</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Realtime trust scoring and anti-spoofing decisions for delivery claim payouts.</p>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm">
            <p className="font-mono text-xs uppercase tracking-wider text-slate-500">Socket status</p>
            <p className={`mt-1 font-semibold ${connection === 'online' ? 'text-emerald-700' : 'text-rose-700'}`}>{connection}</p>
            <p className="mt-1 text-xs text-slate-600">Role: {auth?.role || 'anonymous'}</p>
          </div>
        </div>
      </header>

      <AuthPanel onAuth={handleAuth} />

      <StatsCards claims={claims} />

      <section className="my-6 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700">
        <span className="font-mono uppercase tracking-wider text-slate-500">Risk Signal:</span> {riskHeadline}
      </section>

      <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <button className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white" onClick={() => runSimulation('honest', 'start')}>
          Start Honest Simulation
        </button>
        <button className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white" onClick={() => runSimulation('attacker', 'start')}>
          Start Attacker Simulation
        </button>
        <button className="rounded-xl bg-slate-700 px-4 py-2 font-semibold text-white" onClick={() => runSimulation('honest', 'stop')}>
          Stop Honest Simulation
        </button>
        <button className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white" onClick={() => runSimulation('attacker', 'stop')}>
          Stop Attacker Simulation
        </button>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1.9fr]">
        <ClaimForm onSubmitted={refreshClaims} />
        <ClaimsTable claims={claims} onVerify={handleVerify} canVerify={['admin', 'adjuster'].includes(auth?.role)} />
      </div>

      <div className="mt-6">
        <FraudGraph graph={graph} />
      </div>
    </main>
  );
}
