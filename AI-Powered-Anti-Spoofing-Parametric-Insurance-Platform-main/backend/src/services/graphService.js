function buildFraudGraph(claims) {
  const nodes = [];
  const edges = [];

  const nodeMap = new Map();

  function ensureNode(id, label, type, risk = 0) {
    if (!nodeMap.has(id)) {
      const node = { id, label, type, risk };
      nodeMap.set(id, node);
      nodes.push(node);
    } else {
      const existing = nodeMap.get(id);
      existing.risk = Math.max(existing.risk || 0, risk || 0);
    }
  }

  claims.forEach((claim) => {
    const claimRisk = claim.status === 'fraud_flagged' ? 100 : claim.status === 'verification_required' ? 65 : 25;
    const userNodeId = `user:${claim.user_id}`;
    const ip = claim.network_data?.ip || 'unknown-ip';
    const ipNodeId = `ip:${ip}`;

    ensureNode(userNodeId, claim.user_id, 'user', claimRisk);
    ensureNode(ipNodeId, ip, 'ip', claimRisk);

    edges.push({
      source: userNodeId,
      target: ipNodeId,
      reason: 'claim_network_link',
      status: claim.status,
      trust_score: claim.trust_score
    });
  });

  return {
    nodes,
    edges,
    generated_at: new Date().toISOString()
  };
}

module.exports = { buildFraudGraph };
