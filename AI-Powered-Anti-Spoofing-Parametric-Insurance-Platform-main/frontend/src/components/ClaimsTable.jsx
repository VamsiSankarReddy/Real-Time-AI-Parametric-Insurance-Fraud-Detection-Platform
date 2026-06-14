const statusColor = {
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  verification_required: 'bg-amber-100 text-amber-800 border-amber-300',
  fraud_flagged: 'bg-rose-100 text-rose-800 border-rose-300'
};

function statusLabel(status) {
  if (status === 'verification_required') {
    return 'verification';
  }
  if (status === 'fraud_flagged') {
    return 'fraud';
  }
  return 'approved';
}

function renderEvidence(evidenceItem) {
  const details = evidenceItem.details || {};
  const tokens = Object.entries(details)
    .slice(0, 2)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' | ');

  return `${evidenceItem.type} -> ${tokens}`;
}

export default function ClaimsTable({ claims, onVerify, canVerify }) {
  return (
    <section className="glass-panel card-animate rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Claims Feed</h2>
        <span className="font-mono text-xs text-slate-600">Realtime WebSocket stream</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2">Claim ID</th>
              <th className="py-2">User</th>
              <th className="py-2">Trust Score</th>
              <th className="py-2">Status</th>
              <th className="py-2">Flags</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim._id || claim.id} className="border-b border-slate-100">
                <td className="py-2 font-mono text-xs">{claim._id || claim.id}</td>
                <td className="py-2">{claim.user_id}</td>
                <td className="py-2 font-semibold">{claim.trust_score?.toFixed ? claim.trust_score.toFixed(2) : claim.trust_score}</td>
                <td className="py-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColor[claim.status] || statusColor.approved}`}>
                    {statusLabel(claim.status)}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-1">
                    {(claim.fraud_evidence || []).slice(0, 3).map((item, idx) => (
                      <span key={`${item.type}-${idx}`} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {renderEvidence(item)}
                      </span>
                    ))}
                    {(!claim.fraud_evidence || claim.fraud_evidence.length === 0) && (
                      <span className="text-xs text-slate-500">none</span>
                    )}
                  </div>
                </td>
                <td className="py-2">
                  {claim.status === 'verification_required' && canVerify ? (
                    <button
                      className="rounded-lg bg-slate-900 px-3 py-1 text-xs text-white"
                      onClick={() => onVerify(claim._id || claim.id)}
                    >
                      Verify
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">{claim.status === 'verification_required' ? 'Role required' : '-'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
