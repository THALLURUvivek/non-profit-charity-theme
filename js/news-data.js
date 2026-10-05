/* ==========================================================================
   Hearth Foundation — news & article data
   --------------------------------------------------------------------------
   Single source of truth for article.html. The archive cards on news.html and
   the article template both read from this object, so a story only has to be
   written once.

Replace with:  fetch('/api/stories').then(r => r.json())
    Shape stays identical either way. readTime and wordCount are derived from
    the blocks rather than supplied, so a story arriving from an API with its
    own readTime has that value overwritten. That is deliberate.

    A story is:
      slug       url-safe id, used as article.html?id=<slug>
      category   field | research | announcement | opinion (drives the chip colour)
      title      headline
      dek        standfirst, shown under the headline and reused for meta
      date       publication date as written
      iso        machine-readable date for <time datetime>
      kicker     short label for the card footer (place, dataset, author…)
      hero       { src, alt, credit }
      author     { name, role, photo }
      blocks     article body, in order. One of:
                   p      plain paragraph
                   h2     section heading
                   quote  pull quote + attribution
                   list   bulleted list
                   stats  row of figures
                   note   callout — what went wrong / what we changed
                   figure image + caption
      takeaways  3 bullet summary for the top of the article
      related    slugs shown at the foot of the page
      wordCount  derived: whitespace-separated words across all blocks
      readTime   derived: wordCount / WORDS_PER_MINUTE, minimum 1
   ========================================================================== */
(function (root) {
  'use strict';

  const AUTHORS = {
    mwangi: {
      name: 'Grace Mwangi',
      role: 'Field coordinator, East Africa',
      photo: 'https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&w=160&h=160&q=70'
    },
    okafor: {
      name: 'Dr. Amara Okafor',
      role: 'Chief Executive Officer',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&h=160&q=70'
    },
    reyes: {
      name: 'Daniel Reyes',
      role: 'Director of Programmes',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&h=160&q=70'
    },
    menon: {
      name: 'Priya Menon',
      role: 'Head of Evidence & Learning',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&h=160&q=70'
    },
    bell: {
      name: 'Marcus Bell',
      role: 'Finance & Transparency Lead',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&h=160&q=70'
    }
  };

  const stories = [
    /* ------------------------------------------------------------------ 01 */
    {
      slug: 'mchinji-hand-pump-week-nine',
      category: 'field',
      title: 'The well that changed a market day',
      dek: 'A $40,000 hand pump in Mchinji passed inspection, then failed in week nine — the same story that runs 31% of the time worldwide. This is the full write-up of how we found it, who paid for the fix, and why the committee that caught it now sets the standard for the district.',
      excerpt: 'A pump that failed in week nine, and the committee that caught it before anyone else did.',
      date: '12 Aug 2026',
      iso: '2026-08-12',
      kicker: 'Malawi',
      kickerIcon: 'bi-geo-alt',
      hero: {
        src: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1600&q=70',
        alt: 'Children in a community classroom',
        credit: 'Field photograph, Mchinji district, July 2026'
      },
      author: AUTHORS.mwangi,
      takeaways: [
        'The pump passed our own inspection and still failed in week nine.',
        'The village water committee found it three days before our monitoring officer did.',
        'Repair cost $1,340 of the original $40,000 — and we published the receipt.'
      ],
      blocks: [
        { t: 'p', v: 'The pump was installed on a Tuesday in the last week of May. It was photographed, logged and signed off by our monitoring officer, three of us and the chair of the village water committee. The water came. For eight days it came at four litres a minute, which is close enough to the nine we designed for that nobody complained.' },
        { t: 'p', v: 'On the ninth day it came at zero. Not slow — zero. And because Mchinji market day falls on a Thursday, the queue that formed was the worst possible place to discover it: two hundred people, four hours of daylight, and no water.' },
        { t: 'h2', v: 'Why it failed' },
        { t: 'p', v: 'The rod seal was the problem. Hand pumps fail at the seal far more often than the published failure tables suggest, because a seal that is slightly too tight passes water beautifully for a month and then binds when the rubber takes its permanent set. Our installation checklist asked the technician to confirm "smooth operation". He wrote that down. He was not lying.' },
        { t: 'p', v: 'The borehole itself is fine. We logged a static water level of 41 metres and a yield of 11.4 litres a minute on test pumping, which is comfortably above design. The failure was in the last two feet of the assembly, and it was ours to catch.' },
        { t: 'quote', v: 'We are very good at measuring whether water comes out. We were terrible at measuring whether it keeps coming out.', by: 'Grace Mwangi' },
        { t: 'h2', v: 'Who noticed first' },
        { t: 'p', v: 'The water committee chair, Mercy Banda, called our Mchinji field office at 06:40 on the Thursday. Our monitoring officer logged the call at 10:15, after the site visit. That four-hour gap is the actual finding of this report, and we would rather say so than bury it.' },
        { t: 'p', v: 'Mercy has chaired that committee for six years and keeps a paper logbook — carbon copy, every reading, every day. When we asked her how she knew to call so early, she said the logbook showed the yield dropping on the three previous days and she assumed the pump was dying because that is what pumps do.' },
        { t: 'note', v: 'What we changed: yield-trend alerting, not threshold alerting. Every committee logbook is now read weekly against a rolling seven-day mean, and a drop of more than 15% raises a flag to the field office automatically. We have backfilled this for all 68 water points in the district.' },
        { t: 'h2', v: 'Why the four hours matters more than the seal' },
        { t: 'p', v: 'The seal is a part worth a few dollars. The repair was $1,340 of mostly labour. The expensive number on this page is the gap between Mercy Banda telephoning us at 06:40 and our monitoring officer logging that call at 10:15 — and it is not a story about one village in Malawi. Across the 68 water points in the district, the median gap between a committee reporting a fault and our system recording it was nine days.' },
        { t: 'p', v: 'The reason was not that our officers were slow. It was that we had built a system which expected faults to arrive at a monthly district review, so a phone call in the morning sat in somebody\'s notebook until the next supervision cycle. A system designed around a reporting calendar will always lose to a person with a logbook.' },
        { t: 'list', items: [
          'Median committee-to-system gap, before the change: 9 days. After: 6 hours.',
          'Faults first identified by a committee logbook rather than by us: 71%.',
          'Faults first identified by our own monitoring visit: 12%.',
          'Water points now read on a yield trend rather than a threshold: 68 of 68.'
        ] },
        { t: 'h2', v: 'The repair' },
        { t: 'p', v: 'A regional mechanic replaced the seal set on the Friday, by Saturday, for $1,340 including call-out. We paid it. We also paid for the second mechanic to train three committee members to do the same job, because they are the ones who will be there in three years.' },
        { t: 'stats', items: [
          { v: '$40,000', l: 'original installation' },
          { v: '$1,340', l: 'repair, including call-out' },
          { v: '9 days', l: 'time to failure' },
          { v: '31%', l: 'industry-reported seal failures' }
        ] },
        { t: 'h2', v: 'What the district does now' },
        { t: 'p', v: 'The committee has written its own acceptance standard — a seven-day rolling yield check with a named person responsible each week — and presented it at the district water forum in July. It has since been adopted for all 22 village water points in the district, including four we do not fund.' },
        { t: 'p', v: 'We did not ask them to. That part is worth more than the pipe.' },
        { t: 'figure', src: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=70', alt: 'Hand pump at a rural borehole', credit: 'The repaired pump at Mchinji market. Photo: Grace Mwangi.' },
        { t: 'p', v: 'The full inspection checklist, the committee standard and both repair invoices are in the transparency section. If you are funding water anywhere, the checklist is the thing to take from this report.' }
      ],
      related: ['eleven-days-power-zero-lost-vaccines', 'three-million-saplings-who-waters-them', 'we-paused-five-projects']
    },

    /* ------------------------------------------------------------------ 02 */
    {
      slug: 'cash-beats-aid-five-years',
      category: 'research',
      title: 'Does cash beat aid? Our five-year answer',
      dek: '4,200 households tracked across three flood cycles. Cash recovered spending 2.4× faster than in-kind food.',
      excerpt: '4,200 households tracked across three flood cycles. Cash recovered spending 2.4× faster than in-kind food.',
      date: '24 Jul 2026',
      iso: '2026-07-24',
      kicker: 'Working paper',
      kickerIcon: 'bi-bar-chart',
      hero: {
        src: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1600&q=70',
        alt: 'Researchers reviewing data in a bright office',
        credit: 'Our evidence team, mid-analysis'
      },
      author: AUTHORS.menon,
      takeaways: [
        'Cash transfers restored household spending 2.4× faster than in-kind food.',
        'The gap shrank after month three, but never closed within our window.',
        'Market price spikes cost households more than the transfer itself did.'
      ],
      blocks: [
        { t: 'p', v: 'Between 2021 and 2026 we ran the same cash-versus-in-kind comparison across three flood response cycles in three countries, with 4,200 households in total. The design was not randomised — we could not ethically hold back food from a family after a flood to run an experiment — so this is an observational comparison and we describe it as such throughout.' },
        { t: 'p', v: 'Every household received the same declared value: $420 either as a cash transfer with no strings, or as a food parcel assembled by our logistics partner to an equivalent costed basket. Both arms were eligible for the same health, shelter and cash-for-work components.' },
        { t: 'h2', v: 'How we measured "recovered"' },
        { t: 'p', v: 'Recovery is not a feeling, so we did not ask. We tracked three things monthly for six months: total household consumption, the share of spending on food, and whether any household member had gone without eating on a given day. The first is the headline; the third is the one we refuse to leave out.' },
        { t: 'quote', v: 'The question is not whether people are spending. Of course they are spending. The question is whether they are spending on the thing that stops them being hungry next month.', by: 'Priya Menon' },
        { t: 'h2', v: 'What happened' },
        { t: 'p', v: 'Cash arms returned to 89% of pre-flood consumption in a median of 5.2 weeks. In-kind arms reached 79% in a median of 12.4 weeks, and the food basket they received had shrunk by roughly a fifth in market value within two months because wholesale prices moved after the flood.' },
        { t: 'stats', items: [
          { v: '2.4×', l: 'faster recovery on cash' },
          { v: '5.2 wks', l: 'median cash recovery' },
          { v: '12.4 wks', l: 'median in-kind recovery' },
          { v: '−19%', l: 'real value of the parcel by week 8' }
        ] },
        { t: 'note', v: 'What we got wrong: our first round of analysis compared arms at month six and found no significant difference. That was a mistake in the measurement window, not in the transfers — six months is long enough for a cash recipient to run into the same market prices we were faulting in-kind aid for. Priya has written up the error analysis; it is in the appendix.' },
        { t: 'h2', v: 'Where cash loses' },
        { t: 'p', v: 'Cash was worse on two measures, and neither is small. First, households spent the transfer on debt repayment more often than we modelled — 31% of the cash arm versus 6% of the in-kind arm cleared a microfinance balance within four months. That is often the right choice and occasionally catastrophic.' },
        { t: 'p', v: 'Second, in the two districts where we had no active market traders — two flood-cut districts where supply had not returned — cash performed worse than food, because cash cannot buy what is not for sale. In cycle three, 14% of cash households in those two districts reported a day without food, against 4% in the in-kind arm.' },
        { t: 'list', items: [
          'Cash wins where markets are functioning and prices are visible to households.',
          'In-kind wins where the supply chain has itself been destroyed.',
          'Debt repayment is an under-modelled benefit and a real risk, in that order.',
          'Neither arm reached our pre-flood target of 95% consumption. Neither one has, ever.'
        ] },
        { t: 'h2', v: 'What this design can and cannot show' },
        { t: 'p', v: 'We want to be blunt about the limits, because a five-year paper is the sort of document that gets cited for a decade by people who read the headline and skip the caveats. Assignment to cash or in-kind was made by our field teams, not by a randomiser, and teams that judged the local market to be weak were more likely to choose food. That confound works against cash, so it does not explain our result — but it does mean we cannot claim the 2.4× would survive true random assignment. Only that we found no bias large enough to account for it.' },
        { t: 'p', v: 'The household panel also leaks. Of the 4,200 households enrolled, 3,914 were still reporting at month six, and the 286 we lost were disproportionately in the two flood-cut districts — that is, we are missing most of the observations from precisely where cash looked worst. The published panel carries the missingness flags rather than the complete cases alone, because the complete cases flatter us.' },
        { t: 'h2', v: 'What we changed' },
        { t: 'p', v: 'For the 2026 cycle we moved to a market-check before transfer: in the first ten days we confirm a functioning market in the target district, and we default to food parcels where we cannot. Where we do transfer, we pair it with a short, plain-language disclosure about debt risk at the point of payment, and we ask the microfinance partners operating in the district to flag accounts rather than repossess inside the transfer window.' },
        { t: 'figure', src: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=70', alt: 'Two researchers reviewing charts together', credit: 'Working through the month-six error analysis.' },
        { t: 'p', v: 'The dataset, the analysis scripts and the pre-registration for the next cycle are published alongside this paper. We would rather be corrected early than admired late.' }
      ],
      related: ['attendance-is-not-learning', 'mchinji-hand-pump-week-nine', 'rapid-response-depots-open']
    },

    /* ------------------------------------------------------------------ 03 */
    {
      slug: 'rapid-response-depots-open',
      category: 'announcement',
      title: 'Two new rapid-response depots open',
      dek: 'Kisumu and Dar es Salaam cut the last mile in half. Median reach is now 61 hours.',
      excerpt: 'Kisumu and Dar es Salaam cut the last mile in half. Median reach is now 61 hours.',
      date: '02 Jul 2026',
      iso: '2026-07-02',
      kicker: '3 regions',
      kickerIcon: 'bi-geo-alt',
      hero: {
        src: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=1600&q=70',
        alt: 'Volunteers packing supplies in a warehouse',
        credit: 'Packing day at the Kisumu depot, June 2026'
      },
      author: AUTHORS.reyes,
      takeaways: [
        'Median time from alert to delivery fell from 132 hours to 61.',
        'Stock is pre-positioned, not stored — anything over 90 days is moved or sold.',
        'Both depots are shared with two national agencies we do not fund.'
      ],
      blocks: [
        { t: 'p', v: 'The Kisumu and Dar es Salaam depots opened on 12 and 26 June. Between them they hold 640 family shelter kits, 1.9 million oral rehydration salts, 480 water purification units and the vehicle capacity to move all of it within eight hours.' },
        { t: 'p', v: 'The point of a depot is not the stock. It is that the stock is already closer than the port, so the first truck is not spent on a nine-hundred-kilometre round trip before anything reaches anybody.' },
        { t: 'h2', v: 'The numbers we will be judged on' },
        { t: 'stats', items: [
          { v: '61 hrs', l: 'median alert-to-delivery' },
          { v: '132 hrs', l: 'previous median' },
          { v: '640', l: 'shelter kits pre-positioned' },
          { v: '2', l: 'partner agencies sharing each site' }
        ] },
        { t: 'p', v: 'Median alert-to-delivery across the twelve activations since opening is 61 hours. The worst was 143 hours, to a district reachable only by a bridge that was itself submerged. We publish the worst case alongside the median because the median is the number that flatters us.' },
        { t: 'note', v: 'The honest caveat: we have had three flood seasons of evidence and two of them were mild. Sixty-one hours is not a claim about a category five event, and we will not present it as one.' },
        { t: 'h2', v: 'Where the 61 hours actually go' },
        { t: 'p', v: 'The remaining time is not warehouse time. Of the 61-hour median: 9 hours for the alert to reach a human and be acknowledged, 14 to locate, count and load the stock, 22 on the road, and 16 on the last mile — the stretch between where the vehicle can stop and where people actually are. Two of our twelve activations lost most of that final 16 hours to a washed-out causeway, and no amount of racking would have helped.' },
        { t: 'p', v: 'The depots cut the first two segments of that journey. The last two belong to the partner agencies who hold the district relationships and the vehicles rated for an ungraded road. That is the reason both sites are shared rather than ours, and the reason we would be cautious about claiming the 61 hours as a capability of our own.' },
        { t: 'list', items: [
          '9 hrs — alert received and acknowledged by a duty officer.',
          '14 hrs — stock located, counted and loaded.',
          '22 hrs — median road time from depot to district.',
          '16 hrs — median last mile, on foot or by handcart.'
        ] },
        { t: 'h2', v: 'Pre-positioned, not stockpiled' },
        { t: 'p', v: 'Anything in a depot older than 90 days is moved to a partner programme or sold locally and the proceeds go back into pre-positioning. This is unpopular with procurement, who would rather buy once and hold it, and it is the only reason our shelf life problem is a money problem rather than a waste problem.' },
        { t: 'figure', src: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=70', alt: 'Warehouse racking with boxed supplies', credit: 'Racking layout at Kisumu. The oldest stock is always on the floor, by design.' },
        { t: 'p', v: 'Both sites are shared with the national disaster agency and one international NGO each. We hold no exclusivity and no logo above their sign. If either partner withdraws, the depot reverts to them entirely — that is written into the agreement, not implied by good manners.' },
        { t: 'h2', v: 'What the depots do not do' },
        { t: 'p', v: 'A depot is a logistics device, and logistics has never been the hard part of disaster response. The hard parts are deciding early that this is an activation, and being honest when you are wrong in the direction of being early. We activated eight times and called two of them unnecessary. Both were stood down inside six hours, before a vehicle moved, at a combined cost of $4,100 in staff time and no deliveries.' },
        { t: 'p', v: 'We publish the false activations because a depot network that only ever reports its successes is a marketing asset. Holding stock in two countries against somebody else\'s forecast means somebody has to be wrong quickly, and the cost of that being visible is the price of the forecast being worth anything.' },
        { t: 'p', v: 'Depot operating costs for FY2026 are in the published accounts. They came in at $310,000, about 2.3% of programme spend, which is a number our own governance group asked us to justify twice.' }
      ],
      related: ['cash-beats-aid-five-years', 'mchinji-hand-pump-week-nine', 'eleven-days-power-zero-lost-vaccines']
    },

    /* ------------------------------------------------------------------ 04 */
    {
      slug: 'overhead-ratios-are-a-bad-measure',
      category: 'opinion',
      title: 'Overhead ratios are a bad way to judge a charity',
      dek: 'A defence of spending money on maintenance, monitoring and staff — with our own numbers as evidence.',
      excerpt: 'A defence of spending money on maintenance, monitoring and staff — with our own numbers as evidence.',
      date: '18 Jun 2026',
      iso: '2026-06-18',
      kicker: 'Dr. Amara Okafor',
      kickerIcon: 'bi-pen',
      hero: {
        src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=70',
        alt: 'Hands reviewing a budget spreadsheet',
        credit: ''
      },
      author: AUTHORS.okafor,
      takeaways: [
        '83% of our income reaches programmes. We consider the other 17% a cost of not being careless.',
        'The Mchinji pump failure cost $1,340 to fix and $39,000 to install. Monitoring decides which of those you pay twice.',
        'Ratio targets push charities to under-report overhead rather than to get more efficient.'
      ],
      blocks: [
        { t: 'p', v: 'Every year some fraction of our donors writes to ask why so little of their money reaches the work. They are usually shown the 83% figure and usually satisfied. This piece is for the people who are not satisfied by a figure, because a single percentage genuinely cannot answer the question.' },
        { t: 'p', v: 'The overhead ratio measures the share of our money we spend on being an organisation rather than on programmes. It is a measure of our own shape, not of our output. A charity that ran no monitoring, kept no vehicles, employed no field staff and paid nothing for evaluation would post a beautiful ratio. It would also be wrong in a way that shows up later, on someone else\'s doorstep.' },
        { t: 'quote', v: 'We are not arguing that overhead is always justified. We are arguing that a ratio cannot tell you whether this particular overhead was.', by: 'Amara Okafor' },
        { t: 'h2', v: 'The arithmetic of the pump' },
        { t: 'p', v: 'In Mchinji we spent $40,000 installing a hand pump and $1,340 repairing it nine days later. Ratio accounting would score the first as program spending and the second as, well, whatever you want to call fixing your own mistake. The relevant question is not how the two were labelled. It is that the $1,340 was found by a village committee because we spent money on a weekly yield check that a purely output-focused budget would not have funded.' },
        { t: 'p', v: 'Monitoring, vehicle maintenance, a salaried mechanic, and a functioning emergency contact list are all overhead. All four are why the second $1,340 was the only number we paid.' },
        { t: 'h2', v: 'What the ratio actually rewards' },
        { t: 'p', v: 'Charities that publish a low overhead ratio are, in the aggregate, more likely to be deferring costs than eliminating them. Deferred maintenance becomes emergency procurement. Deferred safeguarding training becomes an incident. Deferred staff travel becomes a monitoring gap, which becomes a failure we do not know about yet.' },
        { t: 'list', items: [
          'You cannot measure water safety with a line in a budget.',
          'Deferred costs reappear as failures, at 5 to 20 times the original amount.',
          'A ratio target is a target you can hit by spending less on knowing what is happening.',
          'The honest questions are about governance, controls and outcomes — none of which is a percentage.'
        ] },
        { t: 'h2', v: 'What we would ask instead' },
        { t: 'p', v: 'Four questions, none of them a percentage. What share of the charity\'s projects have been independently evaluated in the last three years, and what did those evaluations find? What happened to the last project that failed, in public and on the record? Who signs the accounts, and are there any related-party transactions? What did the last safeguarding incident cost, and would you recognise it if it happened again?' },
        { t: 'p', v: 'A charity that answers those four plainly is telling you something real. A charity that answers with a ratio is telling you which number it likes best.' },
        { t: 'note', v: 'Where we are not pure: our own fund-raising ratio rose from 9% to 12% this year because we bought a donor database we had been resisting. Marcus Bell wrote the board paper and it argued against the purchase. He lost and we bought it. That is also overhead, and it was probably worth it.' },
        { t: 'figure', src: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=70', alt: 'Printed financial report with a pen resting on it', credit: 'The FY2025 accounts, published unedited in April.' },
        { t: 'p', v: 'If you want a real test of a charity, our suggestion costs nothing: find out how many projects they have publicly written up as failures, ask what the last one cost to fix, and see whether they published it. Thirty-four for us. Ask us about any of them.' }
      ],
      related: ['we-paused-five-projects', 'fy2025-accounts-published-unedited', 'mchinji-hand-pump-week-nine']
    },

    /* ------------------------------------------------------------------ 05 */
    {
      slug: 'eleven-days-power-zero-lost-vaccines',
      category: 'field',
      title: 'Eleven days of power, zero lost vaccines',
      dek: 'What changed at Ramanagara clinic the monsoon after the solar array went in.',
      excerpt: 'What changed at Ramanagara clinic the monsoon after the solar array went in.',
      date: '30 May 2026',
      iso: '2026-05-30',
      kicker: 'India',
      kickerIcon: 'bi-geo-alt',
      hero: {
        src: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=70',
        alt: 'Health worker in a rural clinic',
        credit: 'Ramanagara clinic cold room, October 2025'
      },
      author: AUTHORS.reyes,
      takeaways: [
        'Eleven consecutive days of grid failure during the monsoon, no vaccine lost.',
        'The cold room held 2–8°C for 71 hours on a single full charge.',
        'Two of the four batteries in the first array were undersized — corrected in week one.'
      ],
      blocks: [
        { t: 'p', v: 'In October 2025 the grid at Ramanagara went down for eleven consecutive days during the monsoon. The clinic holds a childhood immunisation programme covering 3,400 children in eleven villages, and the cold room for those vaccines had, until then, been fed by the grid with a generator as backup that started perhaps twice a year.' },
        { t: 'p', v: 'Nothing was lost. That is a boring sentence to write and a very unusual one to be able to write.' },
        { t: 'h2', v: 'What went in' },
        { t: 'p', v: 'A 3.2 kW solar array with battery storage, sized by our engineer against the actual outage history rather than the design assumption: a 48-hour outage, which is what the grid operator had promised in the district plan. Outage history said 96 hours was more realistic, and it turned out to be 264.' },
        { t: 'stats', items: [
          { v: '3.2 kW', l: 'array capacity' },
          { v: '264 hrs', l: 'total grid outage' },
          { v: '71 hrs', l: 'cold room held on one charge' },
          { v: '0', l: 'doses lost' }
        ] },
        { t: 'p', v: 'The cold room itself is a standard pharmaceutical unit with a 40-litre capacity, logging temperature every fifteen minutes to a card and, since installation, to a phone that sends an alert if the trace leaves 2–8°C. Those logs are the evidence for the headline figure. They are continuous and unaudited.' },
        { t: 'quote', v: 'The generator was the reason nothing was lost before, too. We just built one that does not need fuel delivered by a road that is under water.', by: 'Daniel Reyes' },
        { t: 'h2', v: 'The part we got wrong' },
        { t: 'p', v: 'Our first specification sized all four batteries to the design assumption. Two of them were undersized for the real duty cycle and were replaced inside the first week, at our cost. A monitoring contractor should have caught this before shipment and did not. That contractor no longer works on health infrastructure for us and we published the failure rather than quietly re-tendering.' },
        { t: 'note', v: 'Cost of the correction: $4,180 for two batteries and a re-commissioning visit. Listed in the FY2026 programme spend under maintenance rather than capital, which flatters the capital line and is the honest place for it.' },
        { t: 'h2', v: 'Sizing against history, not against the plan' },
        { t: 'p', v: 'The most consequential line in the specification was not the panel capacity. It was the decision to size the battery against three years of the site\'s own outage records rather than the 48-hour reliability figure in the district plan. Those records showed two of the previous three monsoons exceeding 96 hours. Our engineer asked for 96. He got 264, and the margin that absorbed 264 hours is the whole difference between a boring outcome and a wasted clinic.' },
        { t: 'p', v: 'The revised standard now sizes every health-infrastructure battery we install from the site\'s own outage log, and requires that log to exist before the quotation does. Where there is no log we fund twelve months of metering first and defer the build. We have done that twice, which means two clinics are further from having power and better placed to keep their vaccines cold when it arrives.' },
        { t: 'figure', src: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=70', alt: 'Solar panels on a clinic roof', credit: 'Array and cold room telemetry, photographed during the November inspection.' },
        { t: 'h2', v: 'Two years on' },
        { t: 'p', v: 'The clinic has now run 214 days with at least one full grid outage. The battery has been replaced once. Uptake in the eleven villages is 91%, against 62% for the district — the single largest change we have measured in this programme, and the batteries are only a small part of it.' },
        { t: 'p', v: 'The larger part was that the clinic could stop telling mothers to come back next week for a dose they had already given a child who then got mildly ill.' }
      ],
      related: ['mchinji-hand-pump-week-nine', 'rapid-response-depots-open', 'three-million-saplings-who-waters-them']
    },

    /* ------------------------------------------------------------------ 06 */
    {
      slug: 'attendance-is-not-learning',
      category: 'research',
      title: 'Attendance is not learning: six years of comprehension data',
      dek: 'Termly oral checks from 1,140 schools, and what they revealed about our own targets.',
      excerpt: 'Termly oral checks from 1,140 schools, and what they revealed about our own targets.',
      date: '11 May 2026',
      iso: '2026-05-11',
      kicker: 'Full dataset',
      kickerIcon: 'bi-bar-chart',
      hero: {
        src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=70',
        alt: 'Students collaborating on a group project',
        credit: ''
      },
      author: AUTHORS.menon,
      takeaways: [
        'Our enrolment target was met in 2022. Reading comprehension was not, and had not been.',
        'The schools with the highest attendance were not the schools with the best outcomes.',
        'We have replaced the attendance indicator in three partner contracts.'
      ],
      blocks: [
        { t: 'p', v: 'From 2020 we asked partner schools to report enrolment and attendance every term. It was a reasonable request, it was easy to audit, and for six years it was the education programme\'s headline indicator. This paper is the result of asking what we had actually been measuring.' },
        { t: 'p', v: 'We took termly oral comprehension checks in 1,140 schools across four countries, in the local language, using a 40-item instrument that our evidence team developed with teacher colleges and validated against national assessments in two of the four countries.' },
        { t: 'h2', v: 'The uncomfortable finding' },
        { t: 'p', v: 'Enrolment rose 38% over six years, which is a real achievement and the number every donor has been given. Mean comprehension in grade 5 rose by 4.1 percentage points. On a scale where 50% is the national threshold, we finished at 46.8%. We were, in plain terms, below the national average in reading, while reporting our strongest enrolment figures in the programme\'s history.' },
        { t: 'stats', items: [
          { v: '+38%', l: 'enrolment, 2020–2026' },
          { v: '+4.1 pts', l: 'grade 5 comprehension' },
          { v: '46.8%', l: 'vs 50% national threshold' },
          { v: '1,140', l: 'schools assessed' }
        ] },
        { t: 'quote', v: 'We optimised the number that was easy to count, and we told ourselves it was a proxy for the number that mattered. It was not a proxy. It was a comfort.', by: 'Priya Menon' },
        { t: 'h2', v: 'Attendance was not the predictor' },
        { t: 'p', v: 'The correlation between average attendance and grade 5 comprehension was 0.11 — effectively nothing. Two predictors did carry signal: whether a school had a trained library lead, and whether teachers had received in-service instruction that was observed rather than delivered. Enrolment per teacher, our previous second indicator, was negatively correlated, because our fastest-growing schools were the ones with the largest classes.' },
        { t: 'list', items: [
          'School libraries with a trained lead: +9.2 points.',
          'Observed in-service instruction: +7.4 points.',
          'Average attendance: +1.3 points, not significant.',
          'Enrolment per teacher: negative, because growth outran staffing.'
        ] },
        { t: 'h2', v: 'Why the low-comprehension schools are the interesting ones' },
        { t: 'p', v: 'Two hundred and eleven schools scored above 60%. The pattern that surprised us is where they are: 78 of them are the schools that failed our enrolment target in 2021 and were nearly defunded, mostly small rural schools in one country where we had assumed the intervention needed to be larger, not better. The intervention that works in those schools is a person with a key to a book cupboard.' },
        { t: 'note', v: 'What we got wrong: we proposed the comprehension check in 2020 and the partner boards rejected it as an unfunded burden on teachers. They were right about the cost and we were wrong about the evidence. The instrument now costs schools about 40 minutes a term and is administered by the teacher, not by us.' },
        { t: 'h2', v: 'What the instrument does not measure' },
        { t: 'p', v: 'Forty items administered orally in the language of instruction is a narrow instrument and we should not pretend otherwise. It samples one domain of comprehension, at one point in the year. It does not measure writing, numeracy, mathematics taught in a second language, or anything a child learned at home that no termly check will ever see.' },
        { t: 'p', v: 'We validated it against national assessments in two of the four countries, where the correlation with grade 5 national scores was 0.71 and 0.66. In the other two we could only validate against teacher-colleague marking, which is a weaker standard and we say so. We report all four numbers rather than the two that flatter the instrument, and a 40-minute termly check is a floor for evidence, not a ceiling on teaching.' },
        { t: 'figure', src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=70', alt: 'A child reading in a classroom', credit: 'Grade 5 comprehension checks, term three.' },
        { t: 'h2', v: 'What we changed' },
        { t: 'p', v: 'Attendance stays, because families need it and because dropout is real. It is no longer a performance indicator. In three partner contracts, comprehension at grade 5 now carries the payment milestone, with the library-lead training attached to it. Budgets moved: $610,000 a year, taken from school construction we were going to build anyway.' },
        { t: 'p', v: 'The dataset is 1,140 schools × 12 terms of anonymised school-level data, plus the item-level responses with school identifiers removed. It is downloadable below. If you find a confound we missed, we would like to hear it.' }
      ],
      related: ['cash-beats-aid-five-years', 'we-paused-five-projects', 'mchinji-hand-pump-week-nine']
    },

    /* ------------------------------------------------------------------ 07 */
    {
      slug: 'fy2025-accounts-published-unedited',
      category: 'announcement',
      title: 'FY2025 accounts published, unedited',
      dek: 'Bank statements, executive pay bands and all 1,940 sub-grants above $1,000. Download it and check us.',
      excerpt: 'Bank statements, executive pay bands and all 1,940 sub-grants above $1,000. Download it and check us.',
      date: '22 Apr 2026',
      iso: '2026-04-22',
      kicker: '14 Mar 2026',
      kickerIcon: 'bi-file-earmark',
      hero: {
        src: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=70',
        alt: 'Notebook and pen on a desk',
        credit: ''
      },
      author: AUTHORS.bell,
      takeaways: [
        'Filed 14 Mar 2026, 31 days before the deadline.',
        'Unqualified opinion from Sullivan & Reid LLP, with no management letter attached.',
        'Executive pay is published as bands, not names — with the band boundaries stated.'
      ],
      blocks: [
        { t: 'p', v: 'The FY2025 accounts are filed with the state charity commission as of 14 March 2026 and are published here in full: the complete financial statements, the independent auditor\'s report, the bank reconciliation, executive pay bands, and every sub-grant above $1,000 — 1,940 of them, each with the recipient organisation and the amount.' },
        { t: 'p', v: 'No redactions. Two donor names are withheld at their own request; the amounts are not, and the row still appears.' },
        { t: 'h2', v: 'The audit' },
        { t: 'p', v: 'Sullivan & Reid LLP issued an unqualified opinion on 4 February 2026. There is no management letter this year. We asked them to tell us, privately and in advance, if they were going to issue one, so that we could fix the issue rather than publish it. They declined to commit to that in advance, which is the correct answer.' },
        { t: 'stats', items: [
          { v: '84.1%', l: 'of income to programmes' },
          { v: '1,940', l: 'sub-grants published' },
          { v: '3', l: 'independent audits a year' },
          { v: '0', l: 'management letters' }
        ] },
        { t: 'h2', v: 'What the numbers say when you do the arithmetic' },
        { t: 'p', v: 'Total income $18.4m, total programme spend $15.5m, fundraising $2.2m, governance and operations $0.7m. The programme share is 84.1% against a board target of 84%. That is a rounding difference, not a triumph, and we would rather you noticed it than not.' },
        { t: 'note', v: 'The one line we cannot improve without a board decision: executive pay sits at $412,000 for four people including the CEO. The band boundaries ($140k–$180k, $180k–$230k, $230k–$310k, $310k+) are published with the figures. Our own governance group has asked us twice to lower the top band. It survives because the evidence team argues that paying below market for research directors is how you end up with the October 2024 monitoring failure.' },
        { t: 'figure', src: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=1200&q=70', alt: 'Desk with printed financial statements', credit: 'The unedited filing, April 2026.' },
        { t: 'h2', v: 'What is not in the accounts' },
        { t: 'p', v: 'In-kind gifts valued by us rather than sold by the donor are not in the income line. For FY2025 that was $310,000 across 44 gifts, which is material enough to move the programme share by about half a point. It is disclosed in the notes and excluded from the headline on purpose, because we would rather understate.' },
        { t: 'h2', v: 'Three ways to check us without an accountant' },
        { t: 'list', items: [
          'Take the sub-grant file and add up one region. It should reconcile to the programme note to the dollar. Ours does. If yours does not, we want to know.',
          'Find the four executive pay bands and check the total against the governance note: $412,000 across four people, with the band boundaries published.',
          'Read the auditor\'s opinion, then search the whole document for a management letter. There is none. If a charity has one and will not show it to you, that is your answer.'
        ] },
        { t: 'p', v: 'All three take about twenty minutes. If you run them against five charities including this one, you will learn more than any rating on this website tells you.' },
        { t: 'p', v: 'If you find something in these documents that does not add up, write to Marcus Bell directly. There is a published commitment that we answer that email within five working days and that we say so publicly when we have been wrong.' }
      ],
      related: ['overhead-ratios-are-a-bad-measure', 'we-paused-five-projects', 'attendance-is-not-learning']
    },

    /* ------------------------------------------------------------------ 08 */
    {
      slug: 'three-million-saplings-who-waters-them',
      category: 'field',
      title: 'Three million saplings, and who waters them',
      dek: 'Mangrove restoration only works if someone owns the seawall afterwards. Ours do.',
      excerpt: 'Mangrove restoration only works if someone owns the seawall afterwards. Ours do.',
      date: '08 Apr 2026',
      iso: '2026-04-08',
      kicker: 'Bangladesh',
      kickerIcon: 'bi-geo-alt',
      hero: {
        src: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1600&q=70',
        alt: 'Mangrove roots at the shoreline',
        credit: 'Sundarbans coastline, February 2026'
      },
      author: AUTHORS.mwangi,
      takeaways: [
        '3.1 million saplings planted since 2019. A survival rate of 61%, not 87%.',
        'The seawall ownership dispute behind the 63/100 programme health score is unresolved.',
        'Nine village committees now hold the maintenance contracts, not us.'
      ],
      blocks: [
        { t: 'p', v: 'We have planted 3.1 million mangrove saplings on the Bangladesh coast since 2019. That number appears in our annual report with a photograph of green seedlings, which is the least informative sentence in the document.' },
        { t: 'p', v: 'The number that matters is 61%. That is our measured survival rate at eighteen months, against a target of 87% and a project plan that assumed 92%. Sediment, storm surge and the honest fact that planting mangroves is farming, not landscaping.' },
        { t: 'h2', v: 'Who waters them' },
        { t: 'p', v: 'From the third season we stopped paying contractors to maintain plots. Nine village committees hold the maintenance contracts now, they are paid a fixed annual sum per surviving hectare, and they hold the title to the planting rights. If the saplings die, the payment does not continue. This is the entire design and it took us two failed cycles to arrive at it.' },
        { t: 'stats', items: [
          { v: '3.1m', l: 'saplings planted' },
          { v: '61%', l: 'survival at 18 months' },
          { v: '87%', l: 'our target' },
          { v: '9', l: 'committees holding maintenance' }
        ] },
        { t: 'quote', v: 'A mangrove programme where the planting is finished and the watering is nobody\'s job is not a restoration programme. It is a photograph.', by: 'Grace Mwangi' },
        { t: 'h2', v: 'The seawall' },
        { t: 'p', v: 'Mangroves protect against storm surge only if something behind them holds. Along four of our eleven planting sites the seawall is owned jointly by two unions with an unresolved boundary from 2021. While that is open, the survival number is almost academic: the most recent cyclone surge destroyed 38% of the saplings at one site and the wall behind them.' },
        { t: 'note', v: 'This is why climate resilience scores 63/100 on our own dashboard, and it is the single largest unresolved item in the programme. We have not resolved it in four years and we are not going to resolve it by writing about it here. What would resolve it is the unions agreeing a boundary survey, and we have funded that survey twice.' },
        { t: 'h2', v: 'Why 61% and not 87%' },
        { t: 'p', v: 'Our first two cycles were planned against a 92% survival assumption, taken from published mangrove restoration trials in Indonesia. Those trials measured survival at sites sheltered from direct wave action. Two of our eleven sites are exposed. Sediment burial during the monsoon killed roughly a third of one season\'s planting, and browse from the fish and crab stock in an unprotected channel took more of it.' },
        { t: 'p', v: 'We did not learn that by counting seedlings at planting time. We learned it at the eighteen-month count, which means two funded cycles had already been committed at a survival rate we had no way of achieving. Plans now count at eighteen months and fund the following cycle off that number rather than off the seedling count, which makes for a smaller budget and a more honest one.' },
        { t: 'figure', src: 'https://images.unsplash.com/photo-1622279489860-d5b3b8b1a9f8?auto=format&fit=crop&w=1200&q=70', alt: 'Mangrove seedlings in nursery beds', credit: 'Committee-run nursery, Cox\'s Bazar district.' },
        { t: 'h2', v: 'What the committees get' },
        { t: 'p', v: 'A fixed annual sum per surviving hectare — assessed at eighteen months, not at planting — plus a share of any carbon credit generated, which is currently nil because we have not registered the plots. Both terms are in the published sub-grant file, at the amounts actually paid.' },
        { t: 'p', v: 'The next honest milestone is not more saplings. It is a survival figure above 70% on the two sites where we do not own the wall, which would tell us the planting is surviving on its own merits.' }
      ],
      related: ['mchinji-hand-pump-week-nine', 'we-paused-five-projects', 'eleven-days-power-zero-lost-vaccines']
    },

    /* ------------------------------------------------------------------ 09 */
    {
      slug: 'we-paused-five-projects',
      category: 'opinion',
      title: 'We paused five projects this year. Here is why.',
      dek: 'Not a failure story exactly — a governance one. The reasons are all documented, unedited.',
      excerpt: 'Not a failure story exactly — a governance one. The reasons are all documented, unedited.',
      date: '19 Mar 2026',
      iso: '2026-03-19',
      kicker: 'Marcus Bell',
      kickerIcon: 'bi-pen',
      hero: {
        src: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=70',
        alt: 'Team meeting around a table',
        credit: 'Governance group, February 2026'
      },
      author: AUTHORS.bell,
      takeaways: [
        'Five of 212 active projects paused this financial year. Four resumed within ninety days.',
        'One is still paused and we do not have a restart date.',
        'Pausing cost $214,000 in committed-but-unspent funds, all of it documented.'
      ],
      blocks: [
        { t: 'p', v: 'Our programme share of income did not move this year despite the largest active project count in our history. The reason is this article: five projects were paused, which removed $214,000 of committed spend from the denominator, and one of them has not resumed.' },
        { t: 'p', v: 'We are publishing all five, with the minutes, because a governance group that only tells you about the decisions it reversed is not doing governance.' },
        { t: 'h2', v: 'What a pause is' },
        { t: 'p', v: 'A pause stops new commitments and new disbursements while leaving committed funds ring-fenced. It is not a closure, and the distinction matters for the community partner, who continues to be paid for the work already done. In every case below the local partner was told before the board paper was circulated, not after.' },
        { t: 'list', items: [
          'Northern livelihoods microfinance — paused 41 days. Resumed on condition the partner appoints a qualified accountant; it did, in March.',
          'Two school blocks in the education programme — paused 63 days. Resumed after the comprehension check was added to the milestone.',
          'Secondary solar installations, Livelihoods — paused 90 days. Still paused. No restart date.',
          'A monitoring vendor contract — paused 22 days. Resumed after a new subcontracting clause was signed.'
        ] },
        { t: 'h2', v: 'The one that is still paused' },
        { t: 'p', v: 'Secondary solar installations for small enterprises paused in December and has not restarted. The reason is a governance one rather than a technical one: our monitoring contractor had an undisclosed financial relationship with two of the three subcontracted installers, which came to light through a routine related-party declaration in January.' },
        { t: 'note', v: 'That disclosure was filed by the contractor, late, and only after our procurement lead asked a direct question. The board has commissioned a review of our own related-party controls, which reported in May and produced two procedural changes we have adopted. The review found no evidence that money moved to the installers. We are not going to state more than the review found.' },
        { t: 'quote', v: 'We did not catch it. Somebody told us, because we had put them in a position where saying something was survivable. Keep doing that.', by: 'Marcus Bell' },
        { t: 'stats', items: [
          { v: '5', l: 'projects paused' },
          { v: '4', l: 'resumed within 90 days' },
          { v: '0', l: 'restart dates invented' },
          { v: '$214k', l: 'committed spend ring-fenced' }
        ] },
        { t: 'h2', v: 'Who decided, and how' },
        { t: 'p', v: 'Every pause was recommended by the programme director who ran the work, reviewed by the finance lead for the ring-fencing position, and approved by the governance group rather than by a single executive. That is three signatures on a document saying we are stopping work a community is relying on, and it is deliberately slower than a launch, which takes one.' },
        { t: 'p', v: 'It also means the people affected cannot pause their own work, which is the point of a pause but not a kindness. Four of the five resumed on conditions set by the group rather than by us, and in two of those the condition was a change we had wanted all along. If that reads as a process discovering something on its own, we would rather say so than let it look like five independent corrections.' },
        { t: 'figure', src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=70', alt: 'Board meeting with papers on the table', credit: 'Governance group reviewing the pause register, February 2026.' },
        { t: 'h2', v: 'Why we did not quietly write it off' },
        { t: 'p', v: 'The tempting move is to reclassify a paused project as closed and stop counting it against the programme share. We have four paused projects that would qualify and we have not done it, because the measure is more honest when it carries the cost of the decisions.' },
        { t: 'p', v: 'All five pause notices, the procurement review and the revised related-party controls are in the accountability section of the staff console, under the same figures the board sees.' }
      ],
      related: ['overhead-ratios-are-a-bad-measure', 'three-million-saplings-who-waters-them', 'fy2025-accounts-published-unedited']
    }
  ];

  const CATEGORIES = {
    field:       { label: 'Field report', cls: '' },
    research:    { label: 'Research', cls: 'card-shell__tag--gold' },
    announcement:{ label: 'Announcement', cls: 'card-shell__tag--mint' },
    opinion:     { label: 'Opinion', cls: 'card-shell__tag--coral' }
  };

  /* Reading time is measured, never declared. An earlier version of this file
     carried hand-written readTime values copied from the archive cards, and
     they ran up to five times longer than the articles actually were — on a
     site whose entire pitch is publishing honest numbers, that was the worst
     possible thing to get wrong. Count the words instead, at 200 wpm for
     non-fiction prose. */
  const WORDS_PER_MINUTE = 200;

  const words = v => String(v == null ? '' : v).trim().split(/\s+/).filter(Boolean).length;

  /* Count the words a reader actually reads, mirroring how each block is
     rendered. Notably: a figure's alt text is not counted (it is an attribute,
     not copy the reader scrolls through) but its caption is, and a pull quote
     includes its attribution. */
  const blockWords = b => {
    switch (b.t) {
      case 'list':  return b.items.reduce((n, i) => n + words(i), 0);
      case 'stats': return b.items.reduce((n, i) => n + words(i.v) + words(i.l), 0);
      case 'quote': return words(b.v) + words(b.by);
      case 'figure':return words(b.credit);
      default:      return words(b.v);
    }
  };

  stories.forEach(s => {
    s.wordCount = s.blocks.reduce((n, b) => n + blockWords(b), 0);
    s.readTime = Math.max(1, Math.round(s.wordCount / WORDS_PER_MINUTE));
  });

  const byslug = {};
  stories.forEach(s => { byslug[s.slug] = s; });

  /* article links get pasted through mail clients and chat apps, which like to
     change case and add stray whitespace. Match on the tidied slug so that
     still resolves instead of 404ing. */
  const tidy = v => String(v == null ? '' : v).trim().toLowerCase().replace(/[\s_]+/g, '-');

  root.HearthNews = {
    stories,
    categories: CATEGORIES,
    get: slug => byslug[slug] || byslug[tidy(slug)] || null,
    /* newest first — the order the archive is meant to read in */
    latest: n => stories.slice().sort((a, b) => (a.iso < b.iso ? 1 : -1)).slice(0, n || stories.length),
    related: (story, n) => (story.related || [])
      .map(slug => byslug[slug] || byslug[tidy(slug)]).filter(Boolean).slice(0, n || 3)
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = root.HearthNews;
})(typeof window !== 'undefined' ? window : globalThis);