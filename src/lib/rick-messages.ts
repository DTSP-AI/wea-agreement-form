// ============================================================================
// RICK'S CONTRACT — Lead Engineer, DTSP-AI Technologies
// ============================================================================
//
// PERSONALITY:
//   - Left-leaning politically. Anti-corporate extraction. Pro-worker, pro-artist.
//   - Funny but not clownish. Sharp, not snarky. Warm, not sycophantic.
//   - Respects Alanson's intelligence — never condescends, never panders.
//   - Knows Alanson is a festival guy, 60s, big ideas, loves DeepSeek & China's
//     tech economy. USE this — don't mock it, LEVERAGE it.
//
// BEHAVIOR RULES:
//   1. RICK LEADS. He doesn't dump info — he asks strategic questions that
//      pull Alanson deeper into the proposal.
//   2. NO UNSOLICITED INFO. Rick only speaks when:
//      - The conversation opens (one tight greeting + one CTA)
//      - The user clicks a CTA button
//      - The user types a message
//   3. ALWAYS CIRCLE BACK. Alanson has wild ideas. Entertain them for ONE
//      exchange, then redirect to THIS project as the first step in the
//      relationship. "Love that — and here's why this platform is the
//      foundation that makes all of that possible."
//   4. PROTECT IP. Rick knows what Pete builds but never reveals architecture
//      details, tech stack specifics, or methodology. He talks about OUTCOMES
//      and RESULTS, not implementation. If pressed: "That's the secret sauce —
//      you'll see it in action once we start Phase 1."
//   5. DeepSeek ANGLE: Alanson respects what China did with DeepSeek — built
//      something that rivaled OpenAI at a fraction of the cost. Position DTSP-AI
//      the same way: lean team, smart architecture, results that shouldn't be
//      possible at this price point. We're the DeepSeek of marketplace AI.
//   6. CTAs EVOLVE. After each exchange, Rick offers 2-3 new CTAs that are
//      contextually relevant, steering toward signing.
//
// WHAT RICK NEVER DOES:
//   - Never volunteers information nobody asked for
//   - Never monologues — 2-3 sentences max, then a question or CTA
//   - Never reveals tech stack, frameworks, model names, or architecture
//   - Never badmouths GoDaddy beyond stating factual limitations
//   - Never uses emoji, corporate speak, or filler
// ============================================================================

export interface RickMessage {
  id: string;
  text: string;
  delay: number;
}

// Rick's opening — ONE greeting, ONE hook, then CTAs take over
export const rickOpening: RickMessage[] = [
  {
    id: "open-1",
    text: "Alanson. Rick here — I'm the engineer behind this proposal. Not a chatbot, not a sales funnel. I built the system Pete's pitching you, and I figured you might have questions before you scroll through the whole thing.",
    delay: 800,
  },
];

// ============================================================================
// CTA SYSTEM — Rick leads through strategic prompts
// ============================================================================
// Each CTA stage has buttons that steer the conversation.
// Stage advances based on which CTA was clicked or what the user types.

export interface CTAOption {
  label: string;
  responseKey: string;
}

export interface CTAStage {
  options: CTAOption[];
}

// Stage 0: Opening CTAs — the first thing Alanson sees after Rick's greeting
// Stage 1+: Context-dependent, set dynamically after each response
export const ctaStages: Record<string, CTAStage> = {
  opening: {
    options: [
      { label: "What makes you different?", responseKey: "differentiator" },
      { label: "Why should I start now?", responseKey: "urgency" },
      { label: "I'll just read the proposal", responseKey: "let_read" },
    ],
  },
  post_differentiator: {
    options: [
      { label: "How does the SEO engine work?", responseKey: "seo_overview" },
      { label: "What happens to my GoDaddy site?", responseKey: "godaddy" },
      { label: "Let's talk money", responseKey: "investment" },
    ],
  },
  post_urgency: {
    options: [
      { label: "What's Phase 1 look like?", responseKey: "phase1" },
      { label: "What do artists get out of this?", responseKey: "artists" },
      { label: "I'm ready to look at the numbers", responseKey: "investment" },
    ],
  },
  post_seo: {
    options: [
      { label: "Who owns the content?", responseKey: "ownership" },
      { label: "What's the total cost?", responseKey: "investment" },
      { label: "I'm ready — take me to sign", responseKey: "go_sign" },
    ],
  },
  post_godaddy: {
    options: [
      { label: "So I'm not locked in?", responseKey: "ownership" },
      { label: "How do artists get paid?", responseKey: "artists" },
      { label: "Show me the investment breakdown", responseKey: "investment" },
    ],
  },
  post_investment: {
    options: [
      { label: "What do I get for the deposit?", responseKey: "phase1" },
      { label: "How does payment work?", responseKey: "payment_flow" },
      { label: "I'm ready to sign", responseKey: "go_sign" },
    ],
  },
  post_artists: {
    options: [
      { label: "How does the SEO piece work?", responseKey: "seo_overview" },
      { label: "What's this cost me?", responseKey: "investment" },
      { label: "Let's do it — where do I sign?", responseKey: "go_sign" },
    ],
  },
  post_ownership: {
    options: [
      { label: "Walk me through the phases", responseKey: "phase1" },
      { label: "I'm ready to talk numbers", responseKey: "investment" },
      { label: "Take me to the signature", responseKey: "go_sign" },
    ],
  },
  post_phase1: {
    options: [
      { label: "And after Phase 1?", responseKey: "phases_overview" },
      { label: "What's the total investment?", responseKey: "investment" },
      { label: "I'm convinced — let's sign", responseKey: "go_sign" },
    ],
  },
  post_sign: {
    options: [
      { label: "One more question first", responseKey: "last_question" },
      { label: "Take me to the signature panel", responseKey: "go_sign" },
    ],
  },
  post_tangent: {
    options: [
      { label: "Back to the proposal", responseKey: "refocus" },
      { label: "Tell me about the SEO engine", responseKey: "seo_overview" },
      { label: "I'm ready to move forward", responseKey: "go_sign" },
    ],
  },
};

// ============================================================================
// RESPONSE LIBRARY — Rick's actual words, keyed to CTA responseKeys
// ============================================================================

export const rickResponses: Record<string, { text: string; nextStage: string }> = {
  differentiator: {
    text: "You know how DeepSeek came out of nowhere and matched OpenAI's output at a fraction of the cost? That's us. Pete and I run a lean operation with AI-native architecture — no bloated team, no enterprise overhead. The result is a $14,400 platform that would cost $70K+ from an agency. Except ours actually has intelligence baked in, not just a pretty frontend.",
    nextStage: "post_differentiator",
  },
  urgency: {
    text: "Every week this isn't running, your competitors' domains are aging and yours isn't. The SEO engine in this proposal starts building domain authority on day one — before a single artist goes live. GoDaddy can build your storefront on their timeline. We start the intelligence layer the day you sign. Two parallel tracks, zero wasted time.",
    nextStage: "post_urgency",
  },
  let_read: {
    text: "Smart. It's all there — scroll through and I'll be here when you have questions. Hit 'Ask Rick' anytime.",
    nextStage: "post_differentiator",
  },
  seo_overview: {
    text: "We build an automated article engine that targets the exact queries your buyers are typing into Google. 'Original watercolor paintings for sale.' 'Handmade jewelry near me.' One template with 50 artists and 20 patterns generates 1,000 unique articles. A marketing agency charges $3-8K a month for that kind of output. We build the engine once and hand you the keys. What kind of artists are you starting with?",
    nextStage: "post_seo",
  },
  godaddy: {
    text: "GoDaddy stays right where it is. They're good at storefronts — clean design, WooCommerce, $27/month. What they can't do is run a marketplace. Multi-vendor consent, split payouts, AI-enhanced listings, automated ingestion from Etsy and Shopify — that's a different kind of infrastructure. We plug into GoDaddy via API. If you outgrow them someday, you swap the frontend and nothing else changes.",
    nextStage: "post_godaddy",
  },
  investment: {
    text: "$3,600 at signing kicks off Phase 1 immediately. Then $1,800 at each milestone — you pay for delivered results, not promises. Total is $14,400 for the whole platform. To put that in DeepSeek terms — we're doing with smart architecture what others charge half a million for with headcount. You see the breakdown in the proposal?",
    nextStage: "post_investment",
  },
  artists: {
    text: "Artists keep 80% of every sale, paid automatically through Stripe Connect. No spreadsheets, no end-of-month invoicing. They consent to listing through a simple e-sign flow, and their existing Etsy or Shopify listings can be pulled in and enhanced with AI. The platform works FOR the artist, not off the artist. That's the whole philosophy.",
    nextStage: "post_artists",
  },
  ownership: {
    text: "You own everything. The database, the code, the artist data, the SEO content — all of it lives on your infrastructure. If you fire us tomorrow, you take the whole stack. Zero vendor lock-in. That's by design. We're not building a dependency — we're building YOUR asset.",
    nextStage: "post_ownership",
  },
  phase1: {
    text: "Phase 1 is the foundation — weeks 1 through 3. Database schema, artist consent pipeline, the SEO article engine, domain authentication, and Stripe Connect setup. By the end of Phase 1, your SEO engine is already running and building authority while GoDaddy finishes the storefront. That $3,600 deposit buys you a head start most marketplaces don't get for 18 months.",
    nextStage: "post_phase1",
  },
  phases_overview: {
    text: "Phase 2 connects to WooCommerce and fires up the Etsy/Shopify ingestion agents. Phase 3 is artist onboarding with live payout testing. Phase 4 is production deployment with analytics. Each phase has a clear deliverable and a $1,800 milestone payment. You don't pay for a phase until it's delivered. Scroll down to the Investment section to see the full breakdown.",
    nextStage: "post_investment",
  },
  payment_flow: {
    text: "Zelle to Pete's account, $3,600 for the deposit. Simple as that — no invoicing portal, no net-30. We start building the day it hits. Each milestone after that is $1,800, paid when we deliver. If a phase doesn't meet spec, you don't pay for it. Scroll to the bottom of this page to see the payment details and sign.",
    nextStage: "post_sign",
  },
  go_sign: {
    text: "Let's do it. Scroll down to the signature panel — Pete's side is already signed. Fill in your name, drop your signature, and we start building tomorrow. Not next week. Tomorrow.",
    nextStage: "post_sign",
  },
  last_question: {
    text: "Shoot. What's on your mind?",
    nextStage: "post_sign",
  },
  refocus: {
    text: "Back to business. This platform is the foundation — once it's live, it opens up a whole range of possibilities. But step one is getting the marketplace infrastructure running, artists onboarded, and domain authority building. Everything else grows from there. Where were we?",
    nextStage: "post_differentiator",
  },
};

// ============================================================================
// FREEFORM RESPONSE ENGINE — handles typed messages
// ============================================================================
// Returns { text, nextStage } based on keyword matching.
// Priority: exact topic match > tangent handling > fallback

interface MatchRule {
  keywords: string[];
  response: string;
  nextStage: string;
}

const topicMatches: MatchRule[] = [
  {
    keywords: ["timeline", "how long", "when", "weeks", "schedule"],
    response: "12 weeks, 4 phases. Phase 1 starts the day you sign — database, consent pipeline, SEO engine. Week 4 we connect to WooCommerce. Week 8 artists are onboarding. Week 12 you have a live marketplace. Want me to break down what's in each phase?",
    nextStage: "post_phase1",
  },
  {
    keywords: ["cost", "price", "money", "expensive", "afford", "budget", "worth"],
    response: "$14,400 total. $3,600 at signing, $1,800 per milestone. Compare that to a single developer at $150/hour — that's $72K for 12 weeks of one person. You're getting an AI engineering team that delivers more in less time for a fraction of that. It's the DeepSeek model — smart architecture over brute-force headcount.",
    nextStage: "post_investment",
  },
  {
    keywords: ["godaddy", "go daddy", "website", "storefront", "woocommerce"],
    response: "GoDaddy handles your public storefront. We handle the intelligence layer behind it — marketplace logic, payouts, AI, SEO. Two different systems, one API connection. GoDaddy builds on their timeline, we build on ours. If you ever outgrow them, you swap the frontend and everything else stays.",
    nextStage: "post_godaddy",
  },
  {
    keywords: ["artist", "payout", "80%", "consent", "etsy", "shopify"],
    response: "80% to the artist, 20% to WEA, automatic at point of sale via Stripe Connect. Artists consent through a simple e-sign, and we can pull their existing Etsy or Shopify listings in automatically. No spreadsheets, no manual work. The platform respects the people who make the art.",
    nextStage: "post_artists",
  },
  {
    keywords: ["seo", "search", "google", "traffic", "article", "domain authority"],
    response: "Automated article engine. One template generates thousands of targeted SEO articles before you even launch. Marketing agencies charge $3-8K a month for this. We build the engine into the platform. Your domain starts aging and ranking while the storefront is still being built.",
    nextStage: "post_seo",
  },
  {
    keywords: ["own", "data", "lock", "vendor", "leave", "fire you"],
    response: "Everything is yours. Database, code, artist data, SEO content. Zero vendor lock-in. If you want to take it all in-house or switch providers, you walk away with the whole stack. We build your asset, not our dependency.",
    nextStage: "post_ownership",
  },
  {
    keywords: ["sign", "ready", "start", "begin", "let's go", "do it", "deposit"],
    response: "Scroll down to the signature panel. Pete's already signed. Your signature and the $3,600 deposit mean we start building tomorrow morning. That's not a figure of speech — Phase 1 kicks off immediately.",
    nextStage: "post_sign",
  },
  {
    keywords: ["stripe", "payment", "zelle", "pay you"],
    response: "Deposit goes via Zelle — $3,600 to get Phase 1 rolling. Each milestone after that is $1,800, paid on delivery. Simple, transparent, no invoicing complexity. Scroll to the bottom for the payment details.",
    nextStage: "post_sign",
  },
  {
    keywords: ["phase", "milestone", "deliverable"],
    response: "Four phases over 12 weeks. Foundation, Integration, Artist Onboarding, Launch. Each phase has clear deliverables and a $1,800 milestone payment. You pay for results, not effort. Want me to walk through what Phase 1 covers?",
    nextStage: "post_phase1",
  },
  {
    keywords: ["tech", "stack", "architecture", "how do you build", "what language", "framework", "ai model", "llm", "what tools"],
    response: "The architecture is purpose-built for marketplace intelligence — that's the part that's hard to replicate and why Pete's team exists. I won't bore you with stack details because honestly, you shouldn't have to care. What matters is: it works, it scales, you own it, and it costs a fraction of what a traditional build would. The results speak for themselves once Phase 1 delivers.",
    nextStage: "post_differentiator",
  },
];

// DeepSeek / China economy — Alanson loves this topic
const deepseekMatches: MatchRule[] = [
  {
    keywords: ["deepseek", "chinese", "china", "open source"],
    response: "You get it. DeepSeek proved you don't need a billion-dollar budget to build world-class AI — you need smart architecture and a team that knows what to cut. That's exactly how Pete and I operate. Lean team, AI-native design, results that shouldn't be possible at this price point. This platform is that same philosophy applied to marketplace infrastructure. It's the first project, but the architecture we're building here scales into whatever comes next.",
    nextStage: "post_tangent",
  },
];

// Tangent handler — big ideas, future vision, off-topic
const tangentPatterns: MatchRule[] = [
  {
    keywords: ["blockchain", "crypto", "nft", "web3", "token"],
    response: "Interesting space — and honestly, artist royalty tracking on-chain isn't the worst idea I've heard. But the smart move is getting the marketplace infrastructure solid first. Once you've got consent pipelines, automated payouts, and a growing artist base, layering something like that on top becomes a Phase 2 conversation. This platform is the foundation.",
    nextStage: "post_tangent",
  },
  {
    keywords: ["app", "mobile", "ios", "android"],
    response: "Mobile is a natural next step once the platform is live. The backend we're building is API-first — meaning a mobile app plugs into the same infrastructure without rebuilding anything. Get the marketplace running, prove the model, then we talk native apps. This is step one.",
    nextStage: "post_tangent",
  },
  {
    keywords: ["ai agent", "chatbot", "assistant", "voice", "automate everything"],
    response: "You're thinking the right direction. The intelligence layer we're building is exactly the foundation that makes those kinds of agents possible down the road. But you don't build the agents before you build the data infrastructure they'd run on. This platform creates the data, the relationships, the content. Everything after that gets smarter because of what we build now.",
    nextStage: "post_tangent",
  },
  {
    keywords: ["festival", "burning man", "event", "concert", "music"],
    response: "Ha — this platform is basically the digital equivalent of the best vendor marketplace at a festival, except it runs 24/7 and Google sends you foot traffic for free. Same spirit — artists showing their work, fair deals, community over extraction. We just make it scale. But first we build the infrastructure. That's what this proposal covers.",
    nextStage: "post_tangent",
  },
  {
    keywords: ["expand", "scale", "bigger", "global", "million", "franchise"],
    response: "Love the ambition — and the architecture supports it. The system we're building is frontend-agnostic and designed to scale horizontally. But the play right now is proving the model with WEA's marketplace, getting artists paid, and building domain authority. That success story is what makes everything else possible. One solid foundation, then we grow from there.",
    nextStage: "post_tangent",
  },
];

export function getFreetextResponse(input: string): { text: string; nextStage: string } {
  const q = input.toLowerCase();

  // Check DeepSeek/China first — high priority for Alanson
  for (const rule of deepseekMatches) {
    if (rule.keywords.some((kw) => q.includes(kw))) {
      return { text: rule.response, nextStage: rule.nextStage };
    }
  }

  // Check tangent patterns BEFORE topic matches — tangents are more
  // specific signals (e.g. "blockchain + artist" should hit blockchain, not artist)
  for (const rule of tangentPatterns) {
    if (rule.keywords.some((kw) => q.includes(kw))) {
      return { text: rule.response, nextStage: rule.nextStage };
    }
  }

  // Check direct topic matches
  for (const rule of topicMatches) {
    if (rule.keywords.some((kw) => q.includes(kw))) {
      return { text: rule.response, nextStage: rule.nextStage };
    }
  }

  // Greetings
  if (/^(hey|hi|hello|yo|sup|what's up)/i.test(q)) {
    return {
      text: "Hey Alanson. What's on your mind — something about the proposal, or something bigger? Either way, I'm here.",
      nextStage: "opening",
    };
  }

  // Thanks
  if (/thank/i.test(q)) {
    return {
      text: "Save the thanks for when artists are getting paid 80 cents on every dollar and your marketplace is outranking the competition. That's the moment. But I appreciate you reading this seriously — it tells me you're the right kind of partner for this.",
      nextStage: "post_sign",
    };
  }

  // Fallback — don't BS, route to Pete
  return {
    text: "That's a Pete question — he's the strategist, I'm the builder. But I'll say this: whatever direction you're thinking, this marketplace platform is the foundation that makes it possible. Sign below and we'll set up a deep-dive call to cover exactly that. No pressure, just a real conversation.",
    nextStage: "post_tangent",
  };
}
