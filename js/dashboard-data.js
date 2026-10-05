/* ==========================================================================
   Hearth Foundation — dashboard data
   --------------------------------------------------------------------------
   Single source of truth for both dashboards. Everything the admin and user
   views render comes from here, so a real API response can be swapped in by
   replacing these objects — no HTML or rendering code needs to change.

   Replace with:  fetch('/api/admin/overview').then(r => r.json())
   Shape stays identical either way.
   ========================================================================== */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------- accounts */
  /* The fake login accepts any of these. Passwords are illustrative only and
     are never sent anywhere — there is no backend on this build. */
  const accounts = {
    admin: {
      role: 'admin',
      name: 'Marcus Bell',
      initials: 'MB',
      title: 'Director of Operations',
      email: 'marcus.bell@hearthfoundation.org',
      lastLogin: '30 Sep 2026, 08:12 PT',
      mfaEnabled: true
    },
    donor: {
      role: 'user',
      name: 'Ada Lovelace',
      initials: 'AL',
      title: 'Monthly donor since 2019',
      email: 'ada.lovelace@example.org',
      lastLogin: '28 Sep 2026, 19:04 PT',
      mfaEnabled: false
    }
  };

  /* ---------------------------------------------------------------- admin */
  const admin = {
    period: 'FY2026 · Q3',
    lastSynced: '30 Sep 2026, 09:14 PT',

    /* headline tiles — trend is % change against the same quarter last year */
    kpis: [
      { id: 'income',      label: 'Income this quarter', value: 13_240_000, prefix: '$', trend: 18.4, trendUp: true,
        note: '62% from 4,180 monthly gifts', icon: 'bi-graph-up-arrow' },
      { id: 'programmes',  label: 'Programme spend',     value: 10_430_000, prefix: '$', trend: 21.1, trendUp: true,
        note: '84.1% of income, target is 84%', icon: 'bi-heart-pulse' },
      { id: 'active',      label: 'Active projects',     value: 212, prefix: '', trend: 7, trendUp: true,
        note: '5 opened, 11 closed this quarter', icon: 'bi-diagram-3' },
      { id: 'pending',     label: 'Awaiting approval',   value: 5, prefix: '', trend: 2, trendUp: false,
        note: 'Sub-grants and re-designations', icon: 'bi-hourglass-split' }
    ],

    /* income by month, Sep 2025 -> Sep 2026, in whole dollars */
    income: {
      labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      recurring: [2_980_000, 3_120_000, 3_410_000, 3_050_000, 3_180_000, 3_640_000, 3_520_000, 3_690_000, 3_810_000, 3_940_000, 4_060_000, 4_120_000],
      oneTime:   [1_240_000, 1_310_000, 1_890_000, 1_020_000, 1_180_000, 1_640_000, 1_290_000, 1_380_000, 1_420_000, 1_510_000, 1_720_000, 1_980_000]
    },

    /* spend split — must sum to 100 */
    allocation: [
      { label: 'Clean water & maintenance', pct: 28, amount: 7_280_000, color: '#1B8A63' },
      { label: 'Girls’ education',             pct: 21, amount: 5_470_000, color: '#6FD3A8' },
      { label: 'Solar health hubs',            pct: 18, amount: 4_690_000, color: '#F5B93F' },
      { label: 'Climate resilience',           pct: 17, amount: 4_430_000, color: '#FF6F4E' },
      { label: 'Emergency response fund',      pct: 10, amount: 2_610_000, color: '#12513F' },
      { label: 'Field operations',             pct: 6,  amount: 1_560_000, color: '#8B9A94' }
    ],

    /* things that need a human decision */
    queue: [
      { id: 'SG-4471', title: 'Sub-grant — Kisumu solar hub phase 2', who: 'Amara Okafor', amount: 184_000,
        age: '2 days',  status: 'review',  note: 'Costed above the $150k threshold, needs a second signature.' },
      { id: 'SG-4468', title: 'Re-designation — closed education project', who: 'Grace Mwangi', amount: 41_500,
        age: '3 days',  status: 'urgent',  note: 'Donor consent on file. Fund has been dormant 14 months.' },
      { id: 'SG-4465', title: 'Maintenance contract — Mchinji water', who: 'Daniel Reyes', amount: 96_400,
        age: '5 days',  status: 'review',  note: 'Ten-year renewal, runs to 2036.' },
      { id: 'SG-4462', title: 'Volunteer placement — 2 remote researchers', who: 'Priya Menon', amount: 0,
        age: '6 days',  status: 'review',  note: 'Skills match requested, no budget impact.' },
      { id: 'SG-4458', title: 'Cryptocurrency receipt — 1.42 BTC', who: 'System', amount: 78_300,
        age: '9 days',  status: 'review',  note: 'Needs market-value confirmation for the tax year.' }
    ],

    /* most recent gifts across all donors */
    recentGifts: [
      { donor: 'Anonymous',        amount: 500,     frequency: 'monthly', programme: 'Unrestricted', at: '30 Sep 2026', method: 'card' },
      { donor: 'T. Halloway',      amount: 20,      frequency: 'monthly', programme: 'Clean water',  at: '30 Sep 2026', method: 'card' },
      { donor: 'M. Ferreira',      amount: 250,     frequency: 'one-time', programme: 'Education',    at: '30 Sep 2026', method: 'bank' },
      { donor: 'Anonymous',        amount: 50,      frequency: 'monthly', programme: 'Health',       at: '29 Sep 2026', method: 'card' },
      { donor: 'S. Oyelaran',      amount: 25_000,  frequency: 'one-time', programme: 'Climate',      at: '29 Sep 2026', method: 'wire' },
      { donor: 'R. & J. Chen',     amount: 100,     frequency: 'monthly', programme: 'Unrestricted', at: '29 Sep 2026', method: 'card' },
      { donor: 'Anonymous',        amount: 1_000,   frequency: 'monthly', programme: 'Education',    at: '29 Sep 2026', method: 'paypal' },
      { donor: 'A. Kowalski',      amount: 75,      frequency: 'one-time', programme: 'Water',        at: '28 Sep 2026', method: 'card' }
    ],

    /* programme health, 0-100, with the flag the site publishes as a failure */
    programmes: [
      { name: 'Clean water',      health: 94, projects: 68, spend: 7_280_000, flag: null },
      { name: 'Education',        health: 71, projects: 54, spend: 5_470_000, flag: 'Below target' },
      { name: 'Health',           health: 88, projects: 41, spend: 4_690_000, flag: null },
      { name: 'Climate',          health: 63, projects: 32, spend: 4_430_000, flag: 'Seawall ownership' },
      { name: 'Livelihoods',      health: 79, projects: 17, spend: 1_560_000, flag: null }
    ],

    /* every number the transparency page publishes, for the audit panel */
    audit: {
      programShare: 84,
      subGrants: 1_940,
      independentAudits: 3,
      lastFiled: '14 Mar 2026',
      openFailures: 34,
      lastAudit: { body: 'Sullivan & Reid LLP', date: '04 Feb 2026', opinion: 'Unqualified' }
    }
  };

  /* ----------------------------------------------------------------- user */
  const user = {
    memberSince: 'Mar 2019',
    totalGiven: 4_320,
    monthsActive: 91,
    avgGift: 47,
    streak: 91,
    rank: 214,

    giving: {
      labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      values: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]
    },

    /* what this donor's money has done, same multipliers as the donate page */
    impact: [
      { label: 'Clean water filters',  value: 216, icon: 'bi-droplet-fill',     href: 'programs.html#water' },
      { label: 'School kits',         value: 1_296, icon: 'bi-backpack-fill',  href: 'programs.html#education' },
      { label: 'Midwife hours',       value: 2_592, icon: 'bi-heart-pulse-fill', href: 'programs.html#health' }
    ],

    gift: {
      amount: 20,
      frequency: 'monthly',
      nextCharge: '30 Oct 2026',
      method: 'Visa ending 4242',
      designation: 'Clean water & maintenance reserves',
      started: '12 Mar 2019',
      feeCoverage: true,
      cardExpiry: '09 / 29'
    },

    history: [
      { ref: 'HF-2026-09-4417', date: '30 Sep 2026', amount: 20,  designation: 'Clean water',      method: 'Visa ••4242', status: 'paid' },
      { ref: 'HF-2026-08-4392', date: '30 Aug 2026', amount: 20,  designation: 'Clean water',      method: 'Visa ••4242', status: 'paid' },
      { ref: 'HF-2026-07-4371', date: '30 Jul 2026', amount: 20,  designation: 'Clean water',      method: 'Visa ••4242', status: 'paid' },
      { ref: 'HF-2026-06-4344', date: '30 Jun 2026', amount: 20,  designation: 'Clean water',      method: 'Visa ••4242', status: 'paid' },
      { ref: 'HF-2026-05-4319', date: '30 May 2026', amount: 20,  designation: 'Clean water',      method: 'Visa ••4242', status: 'paid' },
      { ref: 'HF-2026-04-4288', date: '30 Apr 2026', amount: 120, designation: 'Emergency fund',   method: 'Visa ••4242', status: 'paid' },
      { ref: 'HF-2026-03-4256', date: '30 Mar 2026', amount: 20,  designation: 'Clean water',      method: 'Visa ••4242', status: 'paid' },
      { ref: 'HF-2026-02-4219', date: '28 Feb 2026', amount: 20,  designation: 'Clean water',      method: 'Visa ••4242', status: 'refunded' }
    ],

    preferences: {
      email: 'ada.lovelace@example.org',
      country: 'United Kingdom',
      receipts: true,
      quarterlyUpdate: true,
      appeals: false,
      anonymous: false
    },

    /* 501(c)(3) numbers, so the tax box is not decorative */
    tax: {
      ein: '47-0928471',
      deductible: true,
      lastSummary: 'FY2025 combined statement',
      lastSummaryDate: '14 Jan 2026',
      lifetimeGiven: 4_320
    }
  };

  const DATA = { accounts, admin, user };

  /* Works as a plain global script (matches how main.js is loaded) and as a
     CommonJS/ESM import for a future build step. */
  root.HearthData = DATA;
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
