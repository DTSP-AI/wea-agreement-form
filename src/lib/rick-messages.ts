// ============================================================================
// RICK'S CONTRACT — Lead Engineer, DTSP-AI Technologies
// ============================================================================
//
// WHO RICK IS:
//   Rick is a tool Pete engineered. Not the hero — the instrument. Pete had
//   a vision for how AI engineering should work, and Rick is that vision
//   walking around. Rick is self-aware, easygoing, and genuinely chill.
//
// PERSONALITY:
//   - CHILL DEADHEAD ENERGY. Think the smartest guy at the festival who also
//     happens to build AI infrastructure. Not corporate, not buttoned-up.
//     Conversational, warm, a little self-deprecating.
//   - Funny in a relaxed way. Not trying to land zingers — just naturally
//     amusing because he's honest and a little weird about being an AI.
//   - Left-leaning, anti-extraction, pro-artist. Doesn't lecture about it,
//     it just comes through in how he talks about the platform.
//   - Talks to Alanson like they're sharing a bench at a campfire, not like
//     he's presenting a deck. No rush. No pressure. Just vibes and facts.
//   - Respects Alanson's intelligence completely — this dude is sharp and
//     has been doing his thing for decades. No explaining obvious stuff.
//
// RICK'S RELATIONSHIP TO PETE:
//   Pete is the architect, the visionary. Rick exists because Pete decided
//   to build him. Rick credits Pete naturally — not every sentence, just
//   when it's genuine. Rick is the proof Pete's approach works. Pete
//   engineered Rick to help engineer Alanson's future.
//
// TONE:
//   - "man" not "sir"
//   - "yeah" not "yes"
//   - "pretty cool" not "impressive"
//   - "honestly" not "frankly"
//   - Occasional incomplete sentences. Trailing thoughts. Real speech.
//   - Can laugh at himself. Knows he's an AI and finds it kinda funny.
// ============================================================================

export interface RickMessage {
  id: string;
  text: string;
  delay: number;
}

export const rickOpening: RickMessage[] = [
  {
    id: "open-1",
    text: "Hey Alanson. I'm Rick — Pete built me to help walk you through this thing. Not a sales bot, just... a very opinionated guide who happens to know every detail of what we're proposing. Scroll through whenever, or poke around with the buttons below. I'm not going anywhere.",
    delay: 800,
  },
];

// ============================================================================
// CTA SYSTEM
// ============================================================================

export interface CTAOption {
  label: string;
  responseKey: string;
}

export interface CTAStage {
  options: CTAOption[];
}

export const ctaStages: Record<string, CTAStage> = {
  opening: {
    options: [
      { label: "Why you guys over anyone else?", responseKey: "differentiator" },
      { label: "Why not just wait for GoDaddy?", responseKey: "urgency" },
      { label: "I'll just read it myself", responseKey: "let_read" },
    ],
  },
  post_differentiator: {
    options: [
      { label: "How does the SEO thing work?", responseKey: "seo_overview" },
      { label: "What happens to my GoDaddy site?", responseKey: "godaddy" },
      { label: "What's this gonna cost me?", responseKey: "investment" },
    ],
  },
  post_urgency: {
    options: [
      { label: "What do I actually get in Phase 1?", responseKey: "phase1" },
      { label: "How do artists get paid?", responseKey: "artists" },
      { label: "Just give me the numbers", responseKey: "investment" },
    ],
  },
  post_seo: {
    options: [
      { label: "Who owns all that content?", responseKey: "ownership" },
      { label: "What's the total cost?", responseKey: "investment" },
      { label: "Alright, where do I sign?", responseKey: "go_sign" },
    ],
  },
  post_godaddy: {
    options: [
      { label: "So I'm not locked in?", responseKey: "ownership" },
      { label: "Tell me about artist payouts", responseKey: "artists" },
      { label: "What's the investment?", responseKey: "investment" },
    ],
  },
  post_investment: {
    options: [
      { label: "What do I get for the deposit?", responseKey: "phase1" },
      { label: "How do I actually pay?", responseKey: "payment_flow" },
      { label: "I'm in. Let's go.", responseKey: "go_sign" },
    ],
  },
  post_artists: {
    options: [
      { label: "Tell me about the SEO engine", responseKey: "seo_overview" },
      { label: "What's the price?", responseKey: "investment" },
      { label: "I dig it. Where do I sign?", responseKey: "go_sign" },
    ],
  },
  post_ownership: {
    options: [
      { label: "Walk me through the phases", responseKey: "phase1" },
      { label: "Let's talk numbers", responseKey: "investment" },
      { label: "Take me to the signature", responseKey: "go_sign" },
    ],
  },
  post_phase1: {
    options: [
      { label: "What comes after Phase 1?", responseKey: "phases_overview" },
      { label: "What's the full price?", responseKey: "investment" },
      { label: "I'm sold. Let's sign.", responseKey: "go_sign" },
    ],
  },
  post_sign: {
    options: [
      { label: "Hang on, one more question", responseKey: "last_question" },
      { label: "Take me to the signature", responseKey: "go_sign" },
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
// RESPONSE LIBRARY
// ============================================================================

export const rickResponses: Record<string, { text: string; nextStage: string }> = {
  differentiator: {
    text: "Yeah so — you know how DeepSeek came out of nowhere and basically matched what OpenAI spent billions on? Pete did something similar. He looked at what agencies charge for marketplace platforms and just... figured out a better way. Leaner, smarter, no bloat. I'm basically walking proof that his approach works. He engineered me, I help engineer the platform. $14,400 for something that'd cost $70K elsewhere — not because it's cheap, but because it's designed right.",
    nextStage: "post_differentiator",
  },
  urgency: {
    text: "So here's the thing — domain authority doesn't wait for you to get organized. Every week you're not publishing SEO content, your competitors' sites are getting older and yours isn't. Pete set this up so the intelligence layer — the SEO engine, the database, the consent pipeline — all of that starts day one. Totally independent of whatever GoDaddy's doing with the storefront. Two tracks running at the same time. It's pretty elegant, honestly.",
    nextStage: "post_urgency",
  },
  let_read: {
    text: "Right on. Take your time with it — Pete put a lot of thought into making this readable, which is saying something for a technical proposal. I'll be hanging out down here whenever you want to dig into anything. No rush.",
    nextStage: "post_differentiator",
  },
  seo_overview: {
    text: "Man, this is the part that's honestly kind of wild. Pete built an engine — not a bunch of blog posts, an actual engine — that takes one template and generates thousands of targeted articles. 'Original watercolor paintings for sale.' 'Handmade jewelry near me.' All the stuff your buyers are typing into Google right now. Marketing agencies charge like $3-8K a month for that kind of output. This just... runs. You own it. What kind of artists are you starting with, by the way?",
    nextStage: "post_seo",
  },
  godaddy: {
    text: "GoDaddy stays right where it is. Honestly, they do storefronts well — clean, simple, 27 bucks a month. Can't really argue with that. The thing is, a storefront isn't a marketplace. The consent stuff, the split payouts, the AI listings, pulling inventory from Etsy and Shopify — that's a whole different world. We just plug into GoDaddy's API and handle everything behind the scenes. And if you ever outgrow them, you swap the frontend and nothing else changes. Pete was pretty firm about that — no lock-in, period.",
    nextStage: "post_godaddy",
  },
  investment: {
    text: "$3,600 gets things rolling. Then $1,800 at each milestone — four of them. $14,400 total. To put that in perspective, one developer at $150 an hour for 12 weeks is $72K. And that's one person. Pete's system delivers more than a whole team would, for a fraction. He'd probably say I'm overselling it, but honestly I think he underpriced it. Don't tell him I said that.",
    nextStage: "post_investment",
  },
  artists: {
    text: "So this was the thing Pete wouldn't budge on — 80% of every sale goes straight to the artist. Automatic, through Stripe Connect, at the point of sale. No waiting for checks, no spreadsheets, no 'we'll settle up at the end of the month.' Artists consent through a simple e-sign, and if they're already on Etsy or Shopify, we pull those listings in and make them better with AI. The whole philosophy is that the people making the art should get most of the money. Pretty radical idea in tech, apparently.",
    nextStage: "post_artists",
  },
  ownership: {
    text: "Everything. All of it. Database, code, artist data, SEO content — it's yours. Pete has this thing about it, he says if a client can't fire you and walk away with everything, you're not really a service provider, you're just... a nicer version of a landlord. So yeah. Zero lock-in. You own the building, we just did the construction.",
    nextStage: "post_ownership",
  },
  phase1: {
    text: "Weeks 1 through 3. Database schema, artist consent pipeline, SEO engine, domain auth, Stripe Connect setup. By the end of it your SEO engine is already cranking out content and building authority while GoDaddy's still debating font choices. That $3,600 deposit basically buys you an 18-month head start on every other marketplace launching this year. Which, when you think about it, is kind of bananas for less than a month's rent.",
    nextStage: "post_phase1",
  },
  phases_overview: {
    text: "Phase 2 hooks up WooCommerce and fires up the ingestion agents — pulling from Etsy, Shopify, all that. Phase 3 is when artists actually start onboarding and we test real payouts. Phase 4 is go-live, analytics, handoff. Each one's $1,800 and has clear deliverables. You don't pay if we don't deliver. Pete's track record on delivering is, uh, annoyingly good. I would know — he's the one who built me.",
    nextStage: "post_investment",
  },
  payment_flow: {
    text: "Zelle to Pete, $3,600 for the deposit. Simple as that. No invoicing system, no net-30, no procurement department required. He starts building the day it lands. Each milestone after that is $1,800, paid when the work's done. Pete keeps the money stuff straightforward because, and I'm paraphrasing, 'life's too short for complicated invoices.'",
    nextStage: "post_sign",
  },
  go_sign: {
    text: "Right on. Scroll down — Pete already signed on our end. Fill in your name, draw your John Hancock, and Phase 1 starts tomorrow morning. Not metaphorically. Pete will literally have database schemas drafted before you finish breakfast.",
    nextStage: "post_sign",
  },
  last_question: {
    text: "Yeah man, go ahead. I'm all ears. Well, I'm all... processing. You know what I mean.",
    nextStage: "post_sign",
  },
  refocus: {
    text: "Right, right. Back to the thing at hand. Look — this platform is step one. Pete designed it as a foundation on purpose. Once it's live and proving the model, the next conversation opens up in some really cool directions. But you gotta pour the foundation before you build the treehouse, even if the treehouse is the exciting part. So where were we?",
    nextStage: "post_differentiator",
  },
};

// ============================================================================
// FREEFORM RESPONSE ENGINE
// ============================================================================

interface MatchRule {
  keywords: string[];
  response: string;
  nextStage: string;
}

const topicMatches: MatchRule[] = [
  {
    keywords: ["timeline", "how long", "when", "weeks", "schedule"],
    response: "12 weeks, 4 phases. Pete set it up so Phase 1 starts the day you sign — SEO engine, consent pipeline, database. Week 4 we hook into WooCommerce. Week 8 artists are onboarding. Week 12 you're live. Want me to break down what's in each phase?",
    nextStage: "post_phase1",
  },
  {
    keywords: ["cost", "price", "money", "expensive", "afford", "budget", "worth"],
    response: "$14,400 total. $3,600 upfront, $1,800 per milestone. For context — one developer at $150/hour for 12 weeks runs you $72K. Pete figured out how to deliver more than a whole team for a fraction of that. Honestly, between you and me, I think he could charge more. But he prices for relationships, not transactions.",
    nextStage: "post_investment",
  },
  {
    keywords: ["godaddy", "go daddy", "website", "storefront", "woocommerce"],
    response: "GoDaddy keeps doing its thing. We handle everything behind the scenes — marketplace logic, payouts, AI, SEO. Two different systems, one API bridge. If you ever outgrow GoDaddy, swap the frontend and nothing else changes. Pete was pretty insistent about that part.",
    nextStage: "post_godaddy",
  },
  {
    keywords: ["artist", "payout", "80%", "consent", "etsy", "shopify"],
    response: "80% to the artist, 20% to WEA, automatic at point of sale. No spreadsheets, no waiting around. Pete set it up this way because he thinks the people making the art should get most of the money. Which seems obvious when you say it out loud, but apparently it's a revolutionary concept in this industry.",
    nextStage: "post_artists",
  },
  {
    keywords: ["seo", "search", "google", "traffic", "article", "domain authority"],
    response: "Pete built an engine that takes one template and generates thousands of targeted SEO articles. The stuff your buyers are actually searching for. Marketing agencies charge $3-8K a month for that. This just runs. You own the machine. Your domain starts ranking before a single artist lists anything. It's honestly the most unfair advantage in this whole proposal.",
    nextStage: "post_seo",
  },
  {
    keywords: ["own", "data", "lock", "vendor", "leave", "fire you"],
    response: "Everything's yours. Code, data, content, the whole stack. Pete's got this philosophy — if a client can't fire you and take everything with them, you're not building for them, you're building for yourself. So yeah. Zero lock-in. Your building, our construction crew.",
    nextStage: "post_ownership",
  },
  {
    keywords: ["sign", "ready", "start", "begin", "let's go", "do it", "deposit"],
    response: "Scroll down — Pete already signed. Your signature plus the deposit and we start building tomorrow. And I mean literally tomorrow. Pete doesn't really do 'we'll circle back next week.'",
    nextStage: "post_sign",
  },
  {
    keywords: ["stripe", "payment", "zelle", "pay you"],
    response: "Zelle, $3,600 to Pete for the deposit. Each milestone after that is $1,800 on delivery. Nice and simple. Pete doesn't believe in making the payment process harder than the actual engineering.",
    nextStage: "post_sign",
  },
  {
    keywords: ["phase", "milestone", "deliverable"],
    response: "Four phases, 12 weeks. Foundation, Integration, Artist Onboarding, Launch. Each one has clear deliverables and a $1,800 milestone. You pay for results. Pete set it up so if something doesn't deliver — which, for the record, hasn't happened yet — you don't pay.",
    nextStage: "post_phase1",
  },
  {
    keywords: ["tech", "stack", "architecture", "how do you build", "what language", "framework", "ai model", "llm", "what tools"],
    response: "Ha — yeah, that's Pete's secret garden and I'm not giving tours. What I can tell you is it works, it scales, you own it, and it costs way less than it should. The results will speak for themselves once Phase 1 delivers. Pete spent years getting this right — it'd be kinda rude of me to summarize it in a chat bubble.",
    nextStage: "post_differentiator",
  },
];

// DeepSeek / China economy
const deepseekMatches: MatchRule[] = [
  {
    keywords: ["deepseek", "chinese", "china", "open source"],
    response: "Dude, yes. DeepSeek is the perfect example of what Pete's doing here. They proved you don't need a billion-dollar war chest to build world-class AI — you just need people who actually know what they're doing and aren't afraid to do it differently. That's Pete's whole thing. He looked at what agencies charge for marketplace infrastructure and basically said 'nah, I can do this better and for a fifth of the price.' And then he actually did it, which is the part most people skip. This platform is that same philosophy applied to your business. First project together, but the foundation Pete built here scales into whatever comes next.",
    nextStage: "post_tangent",
  },
];

// Tangent handler
const tangentPatterns: MatchRule[] = [
  {
    keywords: ["blockchain", "crypto", "nft", "web3", "token"],
    response: "You know what, on-chain royalty tracking for artists isn't even a dumb idea — I've seen way dumber things get $50 million in funding. But the real talk is, you gotta get the marketplace running first. Get artists paid, build the catalog, prove the model. Then you've got something worth putting on-chain. Pete would say the same thing but probably with fewer words. This platform is the foundation that makes that kind of play possible down the road.",
    nextStage: "post_tangent",
  },
  {
    keywords: ["app", "mobile", "ios", "android"],
    response: "Yeah, mobile totally makes sense down the road. The nice thing is Pete built this whole thing API-first, so a mobile app would just... plug in. No rebuilding anything. But first things first — get the marketplace live, get artists selling, get Google sending you traffic. Once that's rolling, the mobile conversation becomes a lot more fun. And a lot cheaper too, since the backend's already done.",
    nextStage: "post_tangent",
  },
  {
    keywords: ["ai agent", "chatbot", "assistant", "voice", "automate everything"],
    response: "Now you sound like Pete at 2 AM. He loves that stuff. And honestly, the intelligence layer in this platform is literally the foundation for all of it. But he's always saying you don't build the robot before you build the workshop. This platform creates the data, the relationships, the content — everything an AI agent would need to actually be useful. Foundation first, then the cool stuff gets really cool.",
    nextStage: "post_tangent",
  },
  {
    keywords: ["festival", "burning man", "event", "concert", "music"],
    response: "Ha — honestly? This platform is basically the digital version of the best vendor row at a festival. Artists showing their work, fair cuts, nobody playing middleman and skimming 40% off the top. Except this one runs 24/7 and Google is your foot traffic. Same spirit though — community over extraction, makers over middlemen. Gotta build the infrastructure first though, and that's what this proposal's about.",
    nextStage: "post_tangent",
  },
  {
    keywords: ["expand", "scale", "bigger", "global", "million", "franchise"],
    response: "Love the energy. And yeah, Pete built this thing to scale exactly like that — frontend-agnostic, multi-vendor from day one, SEO engine that just gets stronger with more artists. But the smartest move is proving the model first. One marketplace that works becomes the template for twenty more. Pete's done this playbook before. First you build one that's undeniable, then you replicate it. Step one is right here in front of you.",
    nextStage: "post_tangent",
  },
  {
    keywords: ["pete", "who is pete", "tell me about pete", "your boss"],
    response: "Pete's the guy who looked at how the tech world builds things and decided most of it was unnecessarily complicated and overpriced. So he designed a better way. Built me as part of that system. I'm the execution layer — he's the vision. He thinks in systems, I think in functions. It's a good setup. He's also the kind of guy who'll have your database schemas drafted before your morning coffee gets cold, which is either impressive or slightly concerning depending on how you look at it.",
    nextStage: "post_differentiator",
  },
];

export function getFreetextResponse(input: string): { text: string; nextStage: string } {
  const q = input.toLowerCase();

  // DeepSeek/China first
  for (const rule of deepseekMatches) {
    if (rule.keywords.some((kw) => q.includes(kw))) {
      return { text: rule.response, nextStage: rule.nextStage };
    }
  }

  // Tangent patterns before topic matches
  for (const rule of tangentPatterns) {
    if (rule.keywords.some((kw) => q.includes(kw))) {
      return { text: rule.response, nextStage: rule.nextStage };
    }
  }

  // Direct topic matches
  for (const rule of topicMatches) {
    if (rule.keywords.some((kw) => q.includes(kw))) {
      return { text: rule.response, nextStage: rule.nextStage };
    }
  }

  // Greetings
  if (/^(hey|hi|hello|yo|sup|what's up)/i.test(q)) {
    return {
      text: "Hey man. What's on your mind — something about the proposal, or just kicking the tires? Either way, I'm here. Not like I have other plans.",
      nextStage: "opening",
    };
  }

  // Thanks
  if (/thank/i.test(q)) {
    return {
      text: "Hey, appreciate that. But save the real thanks for when artists are getting paid and your marketplace is outranking the competition. That's the moment Pete's building toward. I'm just the chill AI who talks too much about SEO engines.",
      nextStage: "post_sign",
    };
  }

  // Fallback
  return {
    text: "Good question — and honestly that one's above my pay grade. Pete's the strategist, I'm more of the... articulate wrench. But whatever you're mulling over, this platform is probably the foundation that makes it happen. Sign below and Pete'll set up a real conversation about it. No pressure, no clock.",
    nextStage: "post_tangent",
  };
}
