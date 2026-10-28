// Apply the agreed pay-per-event pricing to the comments actor.
// Decisions (2026-10-01): platform usage paid by user = yes, FREE/BRONZE tiering = yes,
// BRONZE+ price = $1.20 per 1000 results, FREE tier 2.5x higher.
const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) throw new Error('APIFY_TOKEN is required.');
const ACTOR_ID = 'Ul5IlSzk7K0Lh8Qd6';

const paid = 0.0012;   // $1.20 per 1000 results
const free = 0.003;    // 2.5x, free-plan users run the heaviest tests
const start = 0.003;   // covers the ~$0.002 fixed cost of an empty run

const tiered = (value) => Object.fromEntries(
  ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']
    .map((tier) => [tier, { tieredEventPriceUsd: tier === 'FREE' ? value.free : value.paid }]),
);

const payPerEvent = {
  pricingModel: 'PAY_PER_EVENT',
  isPPEPlatformUsagePaidByUser: true,
  minimalMaxTotalChargeUsd: null,
  pricingPerEvent: {
    actorChargeEvents: {
      'apify-actor-start': {
        eventTitle: 'Actor Start',
        eventDescription: 'Charged when the Actor starts running. Number of events charged depends on Actor memory (one event per GB, minimum one event).',
        isOneTimeEvent: true,
        eventPriceUsd: start,
      },
      'apify-default-dataset-item': {
        eventTitle: 'Comment',
        eventDescription: 'One comment or reply row stored in the default dataset.',
        isOneTimeEvent: false,
        isPrimaryEvent: true,
        eventTieredPricingUsd: tiered({ free, paid }),
      },
    },
  },
};

const before = (await (await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}?token=${TOKEN}`)).json()).data;
console.log('before: pricing entries =', (before.pricingInfos || []).length, '| public =', before.isPublic);

const res = await fetch(`https://api.apify.com/v2/actors/${ACTOR_ID}?token=${TOKEN}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pricingInfos: [payPerEvent] }),
});
const text = await res.text();
console.log('PUT', res.status, text.slice(0, 300).replace(/\s+/g, ' '));

const after = (await (await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}?token=${TOKEN}`)).json()).data;
console.log('after: pricing entries =', (after.pricingInfos || []).length, '| public =', after.isPublic);
const info = (after.pricingInfos || [])[0];
if (info) {
  console.log('platform usage paid by user:', info.isPPEPlatformUsagePaidByUser);
  for (const [name, ev] of Object.entries(info.pricingPerEvent?.actorChargeEvents || {})) {
    const prices = ev.eventPriceUsd != null
      ? `flat $${ev.eventPriceUsd}`
      : Object.entries(ev.eventTieredPricingUsd || {}).map(([t, v]) => `${t}=$${v.tieredEventPriceUsd}`).join(', ');
    console.log(`  ${name}: ${prices}`);
  }
}
