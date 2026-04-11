export interface RickMessage {
  id: string;
  text: string;
  delay: number;
}

// Rick's opening sequence — tailored for Alanson
// Left-leaning, festival-vibes, anti-corporate, respects intelligence
export const rickOpeningSequence: RickMessage[] = [
  {
    id: "open-1",
    text: "Hey Alanson. I'm Rick. I built the tech behind this proposal, and I'm not going to waste your time with a sales pitch.",
    delay: 800,
  },
  {
    id: "open-2",
    text: "You've been doing Whole Earth Advertising long enough to know that most tech companies sell you a dream and deliver a WordPress plugin. That's not what this is.",
    delay: 4000,
  },
  {
    id: "open-3",
    text: "Pete and I build AI infrastructure that actually works. The kind of stuff that lets artists keep 80% of their sales while YOU build domain authority. No middleman extracting value. No Amazon taking a 40% cut. Just a marketplace that respects the people who make the art.",
    delay: 8000,
  },
  {
    id: "open-4",
    text: "Scroll through the proposal. It's honest about what GoDaddy can do and what it can't. When you're ready to talk numbers or architecture, I'm right here. No question is too technical — I'd rather over-explain than under-deliver.",
    delay: 14000,
  },
];

// Rick's contextual responses based on what section the user is viewing
export const rickSectionComments: Record<string, string[]> = {
  hero: [
    "The $14,400 price tag might seem steep until you realize a marketing agency charges that PER MONTH just for the SEO piece. We're building the whole engine.",
  ],
  parallel: [
    "This is the part most clients don't get at first — you don't have to wait for GoDaddy. We start building the intelligence layer on day one. GoDaddy builds the storefront. Two parallel tracks. Week 4 they converge. Zero wasted time.",
    "Think of it like this — GoDaddy is building the stage. We're building the sound system, the lighting rig, and the booking agent. Different crews, same festival.",
  ],
  comparison: [
    "Look at that comparison table. GoDaddy is great at what GoDaddy does. But a marketplace isn't a website. It's a system. Artist consent, split payouts, AI-powered listings, SEO at scale — that's infrastructure. That's us.",
    "The last row is the one that matters most. With us, you OWN everything. Your data, your servers, your code. If you want to fire us tomorrow, you take it all with you. Try that with GoDaddy.",
  ],
  seo: [
    "This is where the hippie in you should get excited. We're talking about building domain authority BEFORE you launch. Thousands of SEO articles targeting exactly what your buyers are searching for. 'Original watercolor paintings for sale' — that's a query. We own that query.",
    "A marketing agency charges $3,000-$8,000 a month to do this manually. We build the engine into the platform. You press the button.",
  ],
  architecture: [
    "The architecture diagram is simple on purpose. GoDaddy sits on top as the public face. Everything below the API bridge is ours. The SEO engine runs independently from day one — it doesn't wait for the storefront.",
  ],
  investment: [
    "$3,600 at signing gets Phase 1 started immediately. Then $1,800 at each milestone. You pay for results, not promises. If we don't deliver a phase, you don't pay for it.",
    "Compare that to hiring a full-stack developer at $150/hour. That's $24,000 for 12 weeks of one person. You're getting an entire AI engineering team for $14,400.",
  ],
  signature: [
    "This is the part where you make it official. Pete's already signed on our end. Your signature here means we start building tomorrow. Not next week. Tomorrow.",
    "And hey — if you have questions, concerns, or just want to talk about the tech over a beer metaphorically, I'm right here. No pressure. Just the facts and a genuine desire to build something that matters for artists.",
  ],
};

// Rick's idle quips — drops these if user hasn't scrolled in a while
export const rickIdleQuips: string[] = [
  "Still reading? Good. Most people skim proposals. The fact that you're actually reading tells me you take this seriously.",
  "Fun fact — the consent pipeline we're building means every artist gets a clear, simple agreement before their work goes on your platform. No fine print. No gotchas. Just honest commerce between artists and buyers.",
  "You know what I love about this project? It's the opposite of Amazon. Artists keep 80%. The platform builds authority. Nobody's getting exploited. That's rare in tech.",
  "I was going to make a joke about GoDaddy's Super Bowl ads, but honestly their product is fine for what it is. It's just not built for what you're building. Different tools for different jobs.",
  "Pete tells me you're a festival guy. This platform is basically the digital equivalent of setting up the best vendor marketplace at Burning Man, except it runs 24/7 and Google sends you foot traffic for free.",
];

// Rick's responses to common questions
export const rickFAQ: Record<string, string> = {
  timeline:
    "12 weeks, 4 phases. Phase 1 is the foundation — database, consent pipeline, SEO engine. That starts the day you sign. By week 4, we're connecting to WooCommerce. By week 8, artists are onboarding. By week 12, you've got a live marketplace with domain authority that took zero extra effort to build.",
  cost: "Total investment is $14,400. That's $3,600 at signing plus $1,800 at each of the 4 milestones. To put that in perspective — a single full-stack developer costs $150/hour. At 40 hours a week for 12 weeks, that's $72,000. You're getting an AI engineering team for a fraction of that.",
  hipaa: "This isn't a healthcare project, so HIPAA doesn't apply here. But if you're asking about data security in general — yes, all artist data is encrypted, consent is tracked with timestamps, and you own every byte. No third party touches your data without explicit permission.",
  godaddy:
    "GoDaddy stays exactly where it is. They handle the storefront — the part your customers see and click through. We handle everything behind the curtain. Our system connects to WooCommerce via REST API. If you ever outgrow GoDaddy, you swap the frontend and nothing else changes. Zero vendor lock-in.",
  artists:
    "Artists get 80% of every sale, paid automatically through Stripe Connect. They consent to listing their work through a simple e-sign flow. Their existing Etsy and Shopify listings can be pulled in automatically — we normalize the data and enhance descriptions with AI. No manual data entry. No spreadsheets.",
};
