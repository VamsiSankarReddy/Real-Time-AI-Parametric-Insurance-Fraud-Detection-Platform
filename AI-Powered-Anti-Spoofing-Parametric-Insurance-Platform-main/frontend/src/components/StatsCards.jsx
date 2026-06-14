function StatCard({ title, value, subtitle, tone }) {
  const toneMap = {
    green: 'from-emerald-200 to-emerald-50 border-emerald-300',
    yellow: 'from-amber-200 to-amber-50 border-amber-300',
    red: 'from-rose-200 to-rose-50 border-rose-300',
    blue: 'from-sky-200 to-sky-50 border-sky-300'
  };

  return (
    <div className={`card-animate rounded-2xl border bg-gradient-to-br p-4 ${toneMap[tone] || toneMap.blue}`}>
      <p className="font-mono text-xs uppercase tracking-wider text-slate-600">{title}</p>
      <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

export default function StatsCards({ claims }) {
  const approved = claims.filter((c) => c.status === 'approved').length;
  const verification = claims.filter((c) => c.status === 'verification_required').length;
  const fraud = claims.filter((c) => c.status === 'fraud_flagged').length;
  const avgTrust =
    claims.length > 0
      ? (claims.reduce((sum, claim) => sum + (claim.trust_score || 0), 0) / claims.length).toFixed(1)
      : '0.0';

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total Claims" value={claims.length} subtitle="Realtime volume" tone="blue" />
      <StatCard title="Approved" value={approved} subtitle="Instant payouts" tone="green" />
      <StatCard title="Verification" value={verification} subtitle="Soft checks" tone="yellow" />
      <StatCard title="Avg Trust" value={avgTrust} subtitle="Weighted score" tone="red" />
    </section>
  );
}
