'use strict';
const crypto = require('node:crypto');

const STATES = Object.freeze({
  draft: ['review_pending', 'cancelled'], review_pending: ['approved', 'rejected'],
  approved: ['queued', 'cancelled'], queued: ['sent', 'failed', 'cancelled'],
  failed: ['queued', 'cancelled'], sent: ['delivered', 'bounced'], delivered: [],
  bounced: [], rejected: [], cancelled: []
});
const REGIONS = new Set(['US', 'CA', 'EU', 'UK', 'AU']);
const CHANNELS = new Set(['email', 'calendar_invite']);

function canonical(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError('non-finite number');
  return JSON.stringify(value);
}
function digest(value) { return crypto.createHash('sha256').update(canonical(value)).digest('hex'); }
function canTransition(from, to) { return Boolean(STATES[from] && STATES[from].includes(to)); }
function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }
function sourceIdentity(provider, sourceRecordId) {
  const p = String(provider || '').trim().toLowerCase(); const id = String(sourceRecordId || '').trim();
  if (!/^[a-z][a-z0-9_-]{1,31}$/.test(p) || !/^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/.test(id)) throw new Error('valid provider and sourceRecordId required');
  return `${p}:${id}`;
}
function evaluateOutreach(input = {}, now = new Date()) {
  const errors = []; const email = normalizeEmail(input.email); const region = String(input.region || '').toUpperCase();
  const channel = String(input.channel || '').toLowerCase(); const scheduledAt = Date.parse(input.scheduledAt || '');
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.push('valid recipient email required');
  if (!REGIONS.has(region)) errors.push('supported region required');
  if (!CHANNELS.has(channel)) errors.push('supported outreach channel required');
  if (input.consentStatus !== 'granted' || !String(input.consentRef || '').trim()) errors.push('affirmative consent evidence required');
  if (input.suppressed === true || input.optedOut === true) errors.push('suppressed or opted-out recipient');
  if (!String(input.ownerId || '').trim()) errors.push('accountable owner required');
  if (!String(input.templateVersion || '').trim() || !String(input.campaignId || '').trim()) errors.push('versioned template and campaign required');
  if (!Number.isFinite(scheduledAt) || scheduledAt < now.getTime() - 60000) errors.push('future scheduledAt required');
  const sent24h = Number(input.recipientMessagesLast24h || 0); const tenantMinute = Number(input.tenantMessagesLastMinute || 0);
  if (!Number.isInteger(sent24h) || sent24h < 0 || sent24h >= 3) errors.push('recipient frequency cap exceeded');
  if (!Number.isInteger(tenantMinute) || tenantMinute < 0 || tenantMinute >= 100) errors.push('tenant rate limit exceeded');
  if (['EU', 'UK'].includes(region) && !String(input.privacyBasis || '').trim()) errors.push('regional privacy basis required');
  return { errors, decision: { email, region, channel, scheduledAt: Number.isFinite(scheduledAt) ? new Date(scheduledAt).toISOString() : null,
    ownerId: String(input.ownerId || ''), campaignId: String(input.campaignId || ''), templateVersion: String(input.templateVersion || ''),
    humanReviewRequired: true, sendAllowed: errors.length === 0, attribution: { sourceRef: String(input.sourceRef || ''), model: 'first-touch-v1' } } };
}
function dataQuality(records = []) {
  const total = records.length; const seen = new Set(); let duplicates = 0; let complete = 0;
  for (const record of records) { const key = normalizeEmail(record.email); if (seen.has(key)) duplicates++; else seen.add(key); if (key && record.ownerId && record.consentRef) complete++; }
  return { total, unique: seen.size, duplicates, completenessRate: total ? Number((complete / total).toFixed(4)) : 0 };
}
function conversion(events = []) {
  const created = new Set(events.filter(e => e.type === 'lead_created').map(e => e.leadId));
  const converted = new Set(events.filter(e => e.type === 'lead_converted' && created.has(e.leadId)).map(e => e.leadId));
  return { leads: created.size, conversions: converted.size, conversionRate: created.size ? Number((converted.size / created.size).toFixed(4)) : 0 };
}
function retryState(attempts, retryable = true) { return !retryable || Number(attempts) >= 5 ? 'dead_letter' : 'failed'; }

module.exports = { STATES, canonical, digest, canTransition, normalizeEmail, sourceIdentity, evaluateOutreach, dataQuality, conversion, retryState };
