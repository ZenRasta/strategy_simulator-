/**
 * Strategos Strategy Simulator v2.0
 * Simulation type definitions — frontend mirror of backend/data/simulation_types.json
 */

export const simulationTypes = [
  {
    id: "public_opinion",
    name: "Public Opinion & Reputation Simulation",
    tagline: "Map how stakeholders will react to a public event, announcement, or crisis.",
    icon: "\u{1F4E1}",
    mirofish_fit: 5,
    category: "reputation",
    colour: "--teal",
    recommended_rounds: [40, 80],
    nash_recommended: false,
    min_actors: 5,
    max_actors: 12,
    required_actor_roles: [
      { role: "protagonist", severity: "error", reason: "The organisation at the centre of opinion; without it there is no simulation subject" },
      { role: "amplifier", severity: "error", reason: "A media/press entity; without it opinion cannot spread" },
      { role: "reactor", severity: "error", reason: "A public segment; the audience for opinion formation" },
      { role: "enforcer", severity: "warning", reason: "A regulatory voice; drives escalation dynamics" },
      { role: "challenger", severity: "warning", reason: "Advocacy/pressure group; drives negative amplification" }
    ],
    environment_variable_keys: {
      sentiment_baseline: { type: "number", min: -100, max: 100, default: 0, description: "Public sentiment toward protagonist at t=0" },
      media_sensitivity: { type: "enum", options: ["low", "medium", "high"], default: "medium", description: "How quickly media picks up events" },
      regulatory_scrutiny_level: { type: "enum", options: ["low", "medium", "high", "active"], default: "medium", description: "Pre-existing regulatory attention" },
      social_media_velocity: { type: "enum", options: ["slow", "moderate", "viral"], default: "moderate", description: "Speed of social amplification" },
      crisis_severity: { type: "enum", options: ["minor", "moderate", "major", "catastrophic"], default: "moderate", description: "Severity of triggering event" }
    },
    extraction_directive: "EXTRACTION_FOCUS: Identify the organisation at the centre of opinion, all media channels as DISTINCT actors (do not merge print, social, and broadcast), at least two public segments with different opinion profiles, regulatory bodies, advocacy groups, and competitors.\n\nPERSONALITY CALIBRATION:\n- Public/collective actors: nash_prior_weight 0.1\u20130.2 (emotion-driven, not rational)\n- Corporate comms actors: nash_prior_weight 0.4\u20130.5\n- Regulatory actors: nash_prior_weight 0.5\u20130.7\n\nRELATIONSHIP STRENGTHS:\n- Media covering protagonist: 0.85\u20130.95\n- Public influenced by media: 0.75\u20130.85\n- Regulator oversight: 0.8\u20130.9\n- Competitor rivalry: 0.4\u20130.7\n\nENVIRONMENT VARIABLES: Estimate sentiment_baseline from any polling, analyst ratings, or brand reputation data in the source. Default 0 (neutral) if absent.",
    interview_templates: [
      "What was your initial reaction to the announcement and why?",
      "How has your opinion shifted over the simulation period?",
      "What action by the organisation would have changed your response?",
      "Which other actor's behaviour influenced you most?"
    ],
    prediction_questions: [
      "Will public sentiment shift positive or negative within the first 20 rounds?",
      "Which media channel will be the first to break the story?",
      "Will the regulator intervene before round 40?",
      "Will any competitor attempt to capitalize on this event?"
    ]
  },
  {
    id: "corporate_strategy",
    name: "Corporate Strategy Simulation",
    tagline: "Simulate strategic moves across divisions, competitors, and regulators over a planning horizon.",
    icon: "\u{1F3E2}",
    mirofish_fit: 4,
    category: "org",
    colour: "--teal",
    recommended_rounds: [40, 100],
    nash_recommended: true,
    min_actors: 4,
    max_actors: 15,
    required_actor_roles: [
      { role: "focal_firm", severity: "error", reason: "The company whose strategy is being simulated; the central decision-maker" },
      { role: "competitor", severity: "error", reason: "At least one rival firm; without competitive tension the simulation is trivial" },
      { role: "regulator", severity: "warning", reason: "Government or regulatory body; shapes the rules of engagement" },
      { role: "customer_segment", severity: "warning", reason: "A demand-side actor; provides revenue signal and preference shifts" },
      { role: "supplier", severity: "info", reason: "Upstream value-chain actor; influences cost structure and availability" }
    ],
    environment_variable_keys: {
      market_growth_rate: { type: "enum", options: ["declining", "stagnant", "slow", "moderate", "high"], default: "moderate", description: "Annual growth trajectory of the primary market" },
      competitive_intensity: { type: "enum", options: ["low", "medium", "high", "hypercompetitive"], default: "medium", description: "Degree of rivalry among incumbent firms" },
      regulatory_environment: { type: "enum", options: ["permissive", "moderate", "strict", "transitional"], default: "moderate", description: "How restrictive the regulatory framework is" },
      technology_disruption_risk: { type: "enum", options: ["low", "medium", "high"], default: "medium", description: "Likelihood of a technological shift altering the competitive landscape" },
      capital_availability: { type: "enum", options: ["constrained", "moderate", "abundant"], default: "moderate", description: "Access to investment capital for strategic initiatives" }
    },
    extraction_directive: "EXTRACTION_FOCUS: Identify the focal company and extract each major division or business unit as a sub-actor if the source material warrants it. Extract all named competitors as individual actors. Identify regulators, key customer segments, suppliers, and potential new entrants.\n\nPERSONALITY CALIBRATION:\n- Focal firm: nash_prior_weight 0.5\u20130.6 (strategic, moderately rational)\n- Competitors: nash_prior_weight 0.4\u20130.6 (varies by profile \u2014 aggressive vs defensive)\n- Regulators: nash_prior_weight 0.6\u20130.8 (rule-bound, predictable)\n- Customer segments: nash_prior_weight 0.2\u20130.3 (preference-driven, partially irrational)\n- Suppliers: nash_prior_weight 0.4\u20130.5\n\nRELATIONSHIP STRENGTHS:\n- Focal firm \u2194 competitor: 0.7\u20130.9 (high mutual awareness)\n- Focal firm \u2192 customer segment: 0.6\u20130.8\n- Regulator \u2192 all firms: 0.7\u20130.85\n- Supplier \u2192 focal firm: 0.5\u20130.7\n\nENVIRONMENT VARIABLES: Estimate market_growth_rate from revenue trends, analyst forecasts, or GDP data in the source. Estimate competitive_intensity from the number of competitors and margin data.",
    interview_templates: [
      "What is your primary strategic objective for the next planning period?",
      "Which competitor action would most threaten your current position?",
      "How would you respond to a major regulatory change in this sector?",
      "What resource constraint most limits your strategic options?"
    ],
    prediction_questions: [
      "Will the focal firm gain or lose market share by round 50?",
      "Which competitor will make the most aggressive move first?",
      "Will a new entrant emerge before the simulation ends?",
      "Will the regulatory environment tighten or loosen?"
    ]
  },
  {
    id: "regulatory_impact",
    name: "Regulatory Impact Simulation",
    tagline: "Model how a new regulation, policy, or legal ruling ripples through an industry.",
    icon: "\u2696\uFE0F",
    mirofish_fit: 5,
    category: "regulatory",
    colour: "--violet",
    recommended_rounds: [40, 80],
    nash_recommended: true,
    min_actors: 5,
    max_actors: 14,
    required_actor_roles: [
      { role: "regulator", severity: "error", reason: "The authority issuing the regulation; the initiating force of the simulation" },
      { role: "regulated_entity", severity: "error", reason: "At least one firm or sector subject to the regulation; the primary impact target" },
      { role: "lobbyist", severity: "warning", reason: "Industry association or lobby group; represents collective resistance or support" },
      { role: "consumer_advocate", severity: "warning", reason: "Public interest group; provides the counter-narrative to industry lobbying" },
      { role: "judiciary", severity: "info", reason: "Courts or legal review body; can invalidate or uphold regulatory action" }
    ],
    environment_variable_keys: {
      regulation_severity: { type: "enum", options: ["mild", "moderate", "strict", "transformative"], default: "moderate", description: "How disruptive the regulation is to existing business models" },
      compliance_deadline_pressure: { type: "enum", options: ["relaxed", "standard", "tight", "immediate"], default: "standard", description: "How much time entities have to comply" },
      political_alignment: { type: "enum", options: ["supportive", "neutral", "divided", "hostile"], default: "neutral", description: "Political climate toward the regulation" },
      enforcement_capacity: { type: "enum", options: ["weak", "moderate", "strong"], default: "moderate", description: "Regulator's ability to monitor and enforce compliance" },
      international_precedent: { type: "enum", options: ["none", "partial", "strong"], default: "partial", description: "Whether similar regulation exists in other jurisdictions" }
    },
    extraction_directive: "EXTRACTION_FOCUS: Identify the regulatory body as the primary actor. Extract each affected industry or company as separate regulated_entity actors. Look for industry associations, consumer advocacy groups, legal/judicial bodies, political actors, and international regulatory counterparts.\n\nPERSONALITY CALIBRATION:\n- Regulator: nash_prior_weight 0.7\u20130.85 (highly rule-bound, procedural)\n- Regulated entities: nash_prior_weight 0.4\u20130.6 (profit-motivated, strategic compliance)\n- Lobbyists: nash_prior_weight 0.3\u20130.5 (persuasion-focused, outcome-driven)\n- Consumer advocates: nash_prior_weight 0.2\u20130.4 (values-driven)\n- Judiciary: nash_prior_weight 0.8\u20130.95 (precedent-bound, highly rational)\n\nRELATIONSHIP STRENGTHS:\n- Regulator \u2192 regulated entity: 0.85\u20130.95 (enforcement relationship)\n- Lobbyist \u2192 regulator: 0.6\u20130.8 (influence relationship)\n- Consumer advocate \u2192 regulator: 0.5\u20130.7\n- Judiciary \u2192 all: 0.9\u20131.0 (binding authority)\n- Regulated entity \u2194 regulated entity: 0.5\u20130.7 (coordination on compliance)\n\nENVIRONMENT VARIABLES: Estimate regulation_severity from the scope of proposed changes. Estimate political_alignment from any partisan signals in the source.",
    interview_templates: [
      "How does this regulation affect your core business model?",
      "What compliance strategy are you pursuing and at what cost?",
      "Do you expect legal challenges to succeed or fail?",
      "Which stakeholder coalition do you see forming in response?"
    ],
    prediction_questions: [
      "Will the regulation survive legal challenge within the simulation period?",
      "What percentage of regulated entities will achieve full compliance by the deadline?",
      "Will industry lobbying lead to any amendments before enforcement?",
      "Will a second wave of related regulation emerge?"
    ]
  },
  {
    id: "market_entry",
    name: "Market Entry Simulation",
    tagline: "Test how incumbents, regulators, and consumers respond when a new player enters a market.",
    icon: "\u{1F6AA}",
    mirofish_fit: 4,
    category: "market",
    colour: "--amber",
    recommended_rounds: [40, 80],
    nash_recommended: true,
    min_actors: 5,
    max_actors: 12,
    required_actor_roles: [
      { role: "entrant", severity: "error", reason: "The new player entering the market; the simulation's central agent" },
      { role: "incumbent", severity: "error", reason: "At least one existing market player; provides competitive response dynamics" },
      { role: "customer_segment", severity: "error", reason: "Target customer group; determines adoption trajectory" },
      { role: "regulator", severity: "warning", reason: "Market regulator or licensing body; controls barrier to entry" },
      { role: "channel_partner", severity: "info", reason: "Distribution or platform partner; affects go-to-market velocity" }
    ],
    environment_variable_keys: {
      barrier_to_entry: { type: "enum", options: ["low", "medium", "high", "very_high"], default: "medium", description: "Structural and regulatory barriers the entrant must overcome" },
      market_maturity: { type: "enum", options: ["nascent", "growing", "mature", "declining"], default: "growing", description: "Life-cycle stage of the target market" },
      incumbent_response_speed: { type: "enum", options: ["slow", "moderate", "fast", "preemptive"], default: "moderate", description: "How quickly established players react to the new entrant" },
      customer_switching_cost: { type: "enum", options: ["low", "medium", "high"], default: "medium", description: "Cost and friction for customers to switch to the new entrant" },
      entrant_capital_runway: { type: "enum", options: ["short", "moderate", "long", "unlimited"], default: "moderate", description: "How long the entrant can sustain operations before needing profitability" }
    },
    extraction_directive: "EXTRACTION_FOCUS: Identify the entrant organisation and extract its distinct competitive advantages. List all incumbent competitors as individual actors with their defensive capabilities. Identify customer segments the entrant is targeting, regulators controlling market access, and any channel/distribution partners.\n\nPERSONALITY CALIBRATION:\n- Entrant: nash_prior_weight 0.3\u20130.5 (aggressive, risk-tolerant, opportunistic)\n- Incumbents: nash_prior_weight 0.5\u20130.7 (defensive, resource-rich, slower)\n- Customer segments: nash_prior_weight 0.2\u20130.3 (price/value sensitive)\n- Regulator: nash_prior_weight 0.6\u20130.8 (procedural)\n- Channel partners: nash_prior_weight 0.4\u20130.5 (commercially rational)\n\nRELATIONSHIP STRENGTHS:\n- Entrant \u2192 customer segment: 0.5\u20130.7 (aspirational, not yet established)\n- Incumbent \u2192 customer segment: 0.75\u20130.9 (established loyalty)\n- Incumbent \u2194 incumbent: 0.4\u20130.6 (coopetition)\n- Regulator \u2192 all firms: 0.7\u20130.85\n- Channel partner \u2192 entrant: 0.4\u20130.6 (tentative)\n\nENVIRONMENT VARIABLES: Estimate barrier_to_entry from licensing requirements, capital needs, and network effects mentioned in the source. Estimate market_maturity from growth rate indicators.",
    interview_templates: [
      "What is your go-to-market strategy and what differentiates you from incumbents?",
      "How do you expect the dominant incumbent to respond to your entry?",
      "What would make you accelerate, pause, or abandon this market entry?",
      "Which customer segment are you targeting first and why?"
    ],
    prediction_questions: [
      "Will the entrant achieve positive unit economics within the simulation period?",
      "Which incumbent will respond most aggressively?",
      "Will the regulator create additional barriers or ease entry?",
      "What market share will the entrant capture by the final round?"
    ]
  },
  {
    id: "product_launch",
    name: "Product Launch Simulation",
    tagline: "Simulate market reception, competitor response, and adoption dynamics for a new product.",
    icon: "\u{1F680}",
    mirofish_fit: 3,
    category: "market",
    colour: "--teal",
    recommended_rounds: [30, 60],
    nash_recommended: false,
    min_actors: 4,
    max_actors: 10,
    required_actor_roles: [
      { role: "launcher", severity: "error", reason: "The company launching the product; drives the release and marketing narrative" },
      { role: "early_adopter", severity: "error", reason: "First customer cohort; sets the tone for word-of-mouth and reviews" },
      { role: "mass_market", severity: "warning", reason: "Mainstream customer segment; determines long-term commercial success" },
      { role: "competitor", severity: "warning", reason: "Rival product owner; can respond with counter-launches or price cuts" },
      { role: "media_reviewer", severity: "info", reason: "Product reviewer/tech press; amplifies or dampens launch momentum" }
    ],
    environment_variable_keys: {
      product_readiness: { type: "enum", options: ["alpha", "beta", "mvp", "polished", "premium"], default: "mvp", description: "How complete and refined the product is at launch" },
      price_positioning: { type: "enum", options: ["budget", "value", "mid_range", "premium", "luxury"], default: "mid_range", description: "Price tier relative to competitors" },
      marketing_budget: { type: "enum", options: ["shoestring", "modest", "competitive", "aggressive", "dominant"], default: "competitive", description: "Scale of marketing investment behind the launch" },
      channel_availability: { type: "enum", options: ["limited", "selective", "broad", "universal"], default: "selective", description: "Distribution breadth at launch" },
      seasonal_timing: { type: "enum", options: ["off_peak", "neutral", "peak", "event_aligned"], default: "neutral", description: "Whether the launch aligns with favourable buying cycles" }
    },
    extraction_directive: "EXTRACTION_FOCUS: Identify the launching company and extract the product as a named entity within the launcher actor. Identify distinct customer segments (early adopters, mainstream, laggards). Extract competitors with their rival products. Identify media/reviewer entities and any distribution partners.\n\nPERSONALITY CALIBRATION:\n- Launcher: nash_prior_weight 0.4\u20130.5 (optimistic bias, marketing-driven)\n- Early adopters: nash_prior_weight 0.15\u20130.25 (enthusiasm-driven, low rationality)\n- Mass market: nash_prior_weight 0.2\u20130.35 (price/value rational)\n- Competitors: nash_prior_weight 0.5\u20130.6 (strategic response)\n- Media reviewers: nash_prior_weight 0.3\u20130.5 (reputation-driven, seeks engagement)\n\nRELATIONSHIP STRENGTHS:\n- Launcher \u2192 early adopter: 0.6\u20130.75 (cultivated relationship)\n- Early adopter \u2192 mass market: 0.5\u20130.7 (influence channel)\n- Media reviewer \u2192 all customer segments: 0.65\u20130.8\n- Competitor \u2192 launcher: 0.7\u20130.85 (high awareness)\n- Launcher \u2192 media reviewer: 0.6\u20130.75 (PR relationship)\n\nENVIRONMENT VARIABLES: Estimate product_readiness from any feature-completeness or beta feedback data. Estimate price_positioning from stated pricing or market context.",
    interview_templates: [
      "What is your first impression of this product and would you recommend it?",
      "How does this product compare to what you currently use?",
      "What would make you switch from your current solution?",
      "What is the single biggest risk to this product's success?"
    ],
    prediction_questions: [
      "Will early adopter reviews be predominantly positive or negative?",
      "Will the product meet its first-quarter sales target?",
      "Will any competitor launch a direct response product?",
      "Will the mass market segment begin adopting before round 30?"
    ]
  },
  {
    id: "crisis_management",
    name: "Crisis Management Simulation",
    tagline: "Stress-test how an organisation and its ecosystem respond to a sudden crisis or scandal.",
    icon: "\u{1F525}",
    mirofish_fit: 4,
    category: "reputation",
    colour: "--red",
    recommended_rounds: [30, 60],
    nash_recommended: false,
    min_actors: 5,
    max_actors: 14,
    required_actor_roles: [
      { role: "crisis_subject", severity: "error", reason: "The organisation at the centre of the crisis; all dynamics revolve around its response" },
      { role: "media", severity: "error", reason: "Press/media entity; drives information spread and narrative framing" },
      { role: "affected_public", severity: "error", reason: "The group harmed or perceiving harm; their reaction determines crisis severity" },
      { role: "crisis_responder", severity: "warning", reason: "Internal crisis team or PR function; drives the response strategy" },
      { role: "regulator", severity: "warning", reason: "Oversight body; may investigate, fine, or impose corrective action" },
      { role: "social_amplifier", severity: "info", reason: "Social media/influencer entities; can accelerate viral spread" }
    ],
    environment_variable_keys: {
      crisis_type: { type: "enum", options: ["operational_failure", "scandal", "data_breach", "environmental", "financial_fraud", "product_safety", "leadership_misconduct"], default: "operational_failure", description: "Nature of the triggering crisis event" },
      initial_transparency: { type: "enum", options: ["cover_up", "minimal", "partial", "full", "proactive"], default: "partial", description: "How forthcoming the organisation is at crisis onset" },
      pre_crisis_trust: { type: "number", min: 0, max: 100, default: 60, description: "Public trust in the organisation before the crisis (0-100)" },
      media_cycle_speed: { type: "enum", options: ["slow_news_day", "normal", "fast", "feeding_frenzy"], default: "normal", description: "Pace of the media reporting cycle" },
      legal_exposure: { type: "enum", options: ["minimal", "moderate", "significant", "existential"], default: "moderate", description: "Potential legal liability from the crisis" }
    },
    extraction_directive: "EXTRACTION_FOCUS: Identify the organisation in crisis and extract its leadership/crisis team as a separate actor from the corporate entity. Extract ALL media types as distinct actors (print, broadcast, social, industry press). Identify affected public segments, regulators, legal entities, competitors who may exploit the situation, and employee groups.\n\nPERSONALITY CALIBRATION:\n- Crisis subject (corporate entity): nash_prior_weight 0.3\u20130.45 (under stress, reactive)\n- Crisis team/leadership: nash_prior_weight 0.4\u20130.55 (strategic but time-pressured)\n- Media: nash_prior_weight 0.15\u20130.3 (narrative-driven, engagement-seeking)\n- Affected public: nash_prior_weight 0.1\u20130.2 (emotional, fear-driven)\n- Regulator: nash_prior_weight 0.6\u20130.75 (procedural but politically sensitive)\n- Social amplifiers: nash_prior_weight 0.05\u20130.15 (virality-driven, lowest rationality)\n\nRELATIONSHIP STRENGTHS:\n- Media \u2192 crisis subject: 0.9\u20130.98 (intense scrutiny)\n- Affected public \u2192 media: 0.8\u20130.9 (information dependency)\n- Regulator \u2192 crisis subject: 0.85\u20130.95\n- Social amplifier \u2192 affected public: 0.7\u20130.85\n- Competitor \u2192 crisis subject: 0.5\u20130.7 (opportunistic)\n\nENVIRONMENT VARIABLES: Estimate pre_crisis_trust from brand reputation data or NPS scores if available. Estimate crisis_type from the nature of the triggering event described in the source.",
    interview_templates: [
      "When did you first learn about the crisis and what was your immediate reaction?",
      "What information do you still feel is being withheld?",
      "Has the organisation's response increased or decreased your trust?",
      "What single action would most restore your confidence?"
    ],
    prediction_questions: [
      "Will the crisis escalate or de-escalate within the first 15 rounds?",
      "Will senior leadership survive the crisis without forced resignation?",
      "Will the regulator launch a formal investigation?",
      "Will public trust recover to pre-crisis levels by simulation end?"
    ]
  },
  {
    id: "stakeholder_negotiation",
    name: "Stakeholder Negotiation Simulation",
    tagline: "Model multi-party negotiations, coalition dynamics, and deal-making between stakeholders.",
    icon: "\u{1F91D}",
    mirofish_fit: 4,
    category: "org",
    colour: "--teal",
    recommended_rounds: [30, 60],
    nash_recommended: true,
    min_actors: 3,
    max_actors: 10,
    required_actor_roles: [
      { role: "proposer", severity: "error", reason: "The party initiating the negotiation; sets the opening terms" },
      { role: "counterparty", severity: "error", reason: "The primary negotiation partner; must be present for any deal dynamics" },
      { role: "mediator", severity: "info", reason: "Neutral facilitator; helps bridge positions and reduce deadlock risk" },
      { role: "influencer", severity: "warning", reason: "External party with leverage over one or both sides (e.g., investor, regulator)" },
      { role: "spoiler", severity: "info", reason: "An actor who benefits from negotiation failure; creates pressure dynamics" }
    ],
    environment_variable_keys: {
      negotiation_type: { type: "enum", options: ["distributive", "integrative", "multi_issue", "coalition"], default: "integrative", description: "The fundamental structure of the negotiation" },
      time_pressure: { type: "enum", options: ["none", "low", "moderate", "high", "deadline_imminent"], default: "moderate", description: "External pressure to reach agreement quickly" },
      information_asymmetry: { type: "enum", options: ["symmetric", "slight", "moderate", "severe"], default: "moderate", description: "Degree to which parties have unequal information" },
      batna_strength_proposer: { type: "enum", options: ["weak", "moderate", "strong"], default: "moderate", description: "Proposer's best alternative to a negotiated agreement" },
      batna_strength_counterparty: { type: "enum", options: ["weak", "moderate", "strong"], default: "moderate", description: "Counterparty's best alternative to a negotiated agreement" }
    },
    extraction_directive: "EXTRACTION_FOCUS: Identify the primary proposer and counterparty. Extract any mediators, arbitrators, or facilitators. Identify external influencers (investors, board members, regulators, unions) and potential spoilers who gain from deadlock. Note each party's stated interests and inferred reservation points.\n\nPERSONALITY CALIBRATION:\n- Proposer: nash_prior_weight 0.5\u20130.7 (strategic, outcome-focused)\n- Counterparty: nash_prior_weight 0.5\u20130.7 (strategic, potentially defensive)\n- Mediator: nash_prior_weight 0.6\u20130.8 (process-oriented, neutral)\n- Influencer: nash_prior_weight 0.4\u20130.6 (agenda-driven)\n- Spoiler: nash_prior_weight 0.2\u20130.4 (disruptive, opportunistic)\n\nRELATIONSHIP STRENGTHS:\n- Proposer \u2194 counterparty: 0.8\u20130.95 (high mutual dependency)\n- Mediator \u2192 both parties: 0.5\u20130.65 (neutral, equidistant)\n- Influencer \u2192 proposer or counterparty: 0.6\u20130.8 (leverage relationship)\n- Spoiler \u2192 all parties: 0.3\u20130.5 (adversarial or parasitic)\n\nENVIRONMENT VARIABLES: Estimate time_pressure from any deadlines mentioned. Estimate BATNA strengths from the alternatives each party has described or implied.",
    interview_templates: [
      "What is your ideal outcome and what is the minimum you would accept?",
      "What concession from the other side would unlock a deal?",
      "What happens if no agreement is reached by the deadline?",
      "Which third party has the most influence over this negotiation?"
    ],
    prediction_questions: [
      "Will the parties reach a deal within the simulation period?",
      "Which side will make the first major concession?",
      "Will a coalition form that excludes one of the parties?",
      "Will an external event (regulatory, market) force a deal or break negotiations?"
    ]
  },
  {
    id: "ma_integration",
    name: "M&A Integration Simulation",
    tagline: "Simulate post-merger integration dynamics between acquiring and target organisations.",
    icon: "\u{1F517}",
    mirofish_fit: 3,
    category: "org",
    colour: "--violet",
    recommended_rounds: [50, 100],
    nash_recommended: false,
    min_actors: 5,
    max_actors: 14,
    required_actor_roles: [
      { role: "acquirer", severity: "error", reason: "The acquiring company; drives integration strategy and timeline" },
      { role: "target", severity: "error", reason: "The acquired company; its culture, systems, and people are being integrated" },
      { role: "integration_team", severity: "warning", reason: "Dedicated integration management office; executes the merger plan" },
      { role: "employee_group", severity: "warning", reason: "Workforce segment; determines cultural integration success and retention" },
      { role: "investor", severity: "info", reason: "Shareholder or PE sponsor; monitors value creation and synergy capture" }
    ],
    environment_variable_keys: {
      deal_rationale: { type: "enum", options: ["cost_synergy", "revenue_synergy", "capability_acquisition", "market_access", "defensive", "conglomerate"], default: "revenue_synergy", description: "Primary strategic rationale for the merger" },
      cultural_compatibility: { type: "enum", options: ["aligned", "compatible", "different", "conflicting"], default: "different", description: "Degree of cultural fit between the two organisations" },
      integration_speed: { type: "enum", options: ["gradual", "phased", "accelerated", "big_bang"], default: "phased", description: "Pace of integration activities" },
      synergy_target_pressure: { type: "enum", options: ["relaxed", "moderate", "aggressive", "extreme"], default: "moderate", description: "Pressure to realise announced synergy targets" },
      key_person_retention_risk: { type: "enum", options: ["low", "moderate", "high", "critical"], default: "moderate", description: "Risk of losing critical talent during integration" }
    },
    extraction_directive: "EXTRACTION_FOCUS: Extract the acquirer and target as distinct actors with their own cultures, strategies, and leadership. Identify the integration team or PMO. Extract employee groups from BOTH organisations (acquirer employees, target employees, leadership from each). Identify investors/shareholders, regulators (antitrust), customers of both entities, and any competing bidders.\n\nPERSONALITY CALIBRATION:\n- Acquirer leadership: nash_prior_weight 0.5\u20130.65 (confident, directive)\n- Target leadership: nash_prior_weight 0.35\u20130.5 (uncertain, potentially resistant)\n- Integration team: nash_prior_weight 0.55\u20130.7 (process-driven, pragmatic)\n- Employee groups: nash_prior_weight 0.15\u20130.3 (anxiety-driven, cultural loyalty)\n- Investors: nash_prior_weight 0.6\u20130.75 (returns-focused, impatient)\n\nRELATIONSHIP STRENGTHS:\n- Acquirer \u2192 target: 0.85\u20130.95 (control relationship)\n- Integration team \u2192 both orgs: 0.7\u20130.85\n- Employee groups \u2194 their legacy org: 0.8\u20130.9 (loyalty)\n- Employee groups \u2194 new org: 0.2\u20130.4 (distrust)\n- Investor \u2192 acquirer: 0.7\u20130.85 (accountability)\n\nENVIRONMENT VARIABLES: Estimate cultural_compatibility from any descriptions of the two organisations' cultures. Estimate deal_rationale from the stated strategic objectives.",
    interview_templates: [
      "How do you feel about the integration process so far?",
      "What is the biggest cultural clash you have experienced?",
      "Are the announced synergy targets realistic given what you see on the ground?",
      "What would make you stay with or leave the combined organisation?"
    ],
    prediction_questions: [
      "Will the combined entity achieve its announced synergy targets?",
      "What percentage of key talent from the target will remain after 12 months?",
      "Will cultural integration be achieved or will silos persist?",
      "Will any major customer defect during the integration period?"
    ]
  },
  {
    id: "financial_stress_test",
    name: "Financial Stress Test Simulation",
    tagline: "Model how financial institutions and markets respond to economic shocks and contagion.",
    icon: "\u{1F4C9}",
    mirofish_fit: 3,
    category: "financial",
    colour: "--amber",
    recommended_rounds: [40, 100],
    nash_recommended: true,
    min_actors: 5,
    max_actors: 15,
    required_actor_roles: [
      { role: "central_bank", severity: "error", reason: "The monetary authority; sets interest rates and provides liquidity backstop" },
      { role: "systemic_bank", severity: "error", reason: "A systemically important financial institution; primary transmission channel for stress" },
      { role: "fiscal_agent", severity: "warning", reason: "Government treasury/ministry of finance; provides fiscal policy response" },
      { role: "depositor_segment", severity: "warning", reason: "Retail or institutional depositors; their confidence determines bank run risk" },
      { role: "foreign_investor", severity: "info", reason: "International capital; flight risk amplifies FX and capital account stress" }
    ],
    environment_variable_keys: {
      shock_type: { type: "enum", options: ["interest_rate_spike", "fx_crisis", "commodity_crash", "sovereign_default", "bank_run", "credit_crunch", "global_recession"], default: "fx_crisis", description: "Nature of the initial financial shock" },
      shock_severity: { type: "enum", options: ["mild", "moderate", "severe", "systemic"], default: "moderate", description: "Magnitude of the initial shock" },
      banking_system_health: { type: "enum", options: ["strong", "adequate", "stressed", "fragile"], default: "adequate", description: "Pre-shock capitalisation and asset quality of the banking system" },
      fx_reserve_adequacy: { type: "enum", options: ["abundant", "adequate", "low", "critical"], default: "adequate", description: "Foreign exchange reserve coverage in months of imports" },
      fiscal_space: { type: "enum", options: ["ample", "moderate", "limited", "exhausted"], default: "moderate", description: "Government capacity for counter-cyclical fiscal spending" },
      contagion_channel: { type: "enum", options: ["interbank", "trade", "fx", "confidence", "multi_channel"], default: "confidence", description: "Primary channel through which stress propagates" }
    },
    extraction_directive: "EXTRACTION_FOCUS: Identify the central bank, all major commercial banks as individual actors (do NOT merge them), the ministry of finance or treasury, depositor segments (retail, corporate, institutional), foreign investors, credit rating agencies, the IMF or regional development banks, and fintech/shadow banking entities.\n\nPERSONALITY CALIBRATION:\n- Central bank: nash_prior_weight 0.7\u20130.85 (mandate-driven, data-dependent)\n- Systemic banks: nash_prior_weight 0.5\u20130.65 (profit-motivated, risk-averse under stress)\n- Ministry of finance: nash_prior_weight 0.5\u20130.65 (politically constrained)\n- Depositors: nash_prior_weight 0.1\u20130.25 (panic-prone, herd behaviour)\n- Foreign investors: nash_prior_weight 0.6\u20130.75 (returns-driven, flight-prone)\n- IMF/multilateral: nash_prior_weight 0.75\u20130.9 (rule-based, conditional)\n\nRELATIONSHIP STRENGTHS:\n- Central bank \u2192 systemic banks: 0.9\u20130.98 (regulatory authority)\n- Systemic bank \u2194 systemic bank: 0.7\u20130.85 (interbank exposure)\n- Depositors \u2192 their bank: 0.8\u20130.9 (dependency)\n- Foreign investor \u2192 all banks: 0.5\u20130.7 (portfolio allocation)\n- Ministry of finance \u2194 central bank: 0.75\u20130.9 (policy coordination)\n\nENVIRONMENT VARIABLES: Estimate banking_system_health from any capital adequacy or NPL data. Estimate fx_reserve_adequacy from reserve figures if available. Default shock_type to fx_crisis for small open economies.",
    interview_templates: [
      "What is your current assessment of systemic risk in the banking sector?",
      "How would you respond to a sudden 30% currency depreciation?",
      "At what point would you consider withdrawing deposits or capital?",
      "What policy intervention would most effectively restore confidence?"
    ],
    prediction_questions: [
      "Will the central bank raise or cut interest rates in response to the shock?",
      "Will any bank require emergency liquidity assistance?",
      "Will foreign investor capital outflows exceed reserves?",
      "Will the government need to seek IMF assistance?"
    ]
  },
  {
    id: "digital_transformation",
    name: "Digital Transformation Simulation",
    tagline: "Model organisational change dynamics as a company adopts new technology and processes.",
    icon: "\u{1F4BB}",
    mirofish_fit: 3,
    category: "org",
    colour: "--teal",
    recommended_rounds: [50, 100],
    nash_recommended: false,
    min_actors: 5,
    max_actors: 12,
    required_actor_roles: [
      { role: "transformation_sponsor", severity: "error", reason: "C-suite sponsor or CEO; provides mandate and resources for the transformation" },
      { role: "it_leadership", severity: "error", reason: "CTO/CIO function; owns technical strategy and platform selection" },
      { role: "business_unit", severity: "error", reason: "An operational unit being transformed; where adoption success or resistance plays out" },
      { role: "workforce", severity: "warning", reason: "Employee cohort; determines adoption rate and cultural resistance" },
      { role: "technology_vendor", severity: "info", reason: "SaaS/platform provider; shapes capability and creates lock-in dynamics" }
    ],
    environment_variable_keys: {
      transformation_scope: { type: "enum", options: ["single_process", "department", "enterprise_wide", "ecosystem"], default: "enterprise_wide", description: "Breadth of the digital transformation initiative" },
      legacy_system_complexity: { type: "enum", options: ["low", "moderate", "high", "extreme"], default: "high", description: "Technical debt and complexity of existing systems" },
      change_readiness: { type: "enum", options: ["resistant", "cautious", "willing", "eager"], default: "cautious", description: "Organisation's cultural readiness for change" },
      budget_commitment: { type: "enum", options: ["underfunded", "adequate", "well_funded", "strategic_priority"], default: "adequate", description: "Financial commitment to the transformation programme" },
      executive_alignment: { type: "enum", options: ["fragmented", "partial", "aligned", "champion_led"], default: "partial", description: "Degree of C-suite consensus on the transformation vision" }
    },
    extraction_directive: "EXTRACTION_FOCUS: Identify the transformation sponsor (CEO/board), CTO/CIO, each business unit undergoing transformation as a separate actor, workforce segments (by function or seniority), technology vendors, external consultants, customers affected by the change, and any union or works council.\n\nPERSONALITY CALIBRATION:\n- Transformation sponsor: nash_prior_weight 0.5\u20130.65 (vision-driven, politically aware)\n- IT leadership: nash_prior_weight 0.55\u20130.7 (technically rational, risk-conscious)\n- Business units: nash_prior_weight 0.3\u20130.45 (outcome-focused, change-resistant)\n- Workforce: nash_prior_weight 0.15\u20130.3 (anxiety-driven, routine-attached)\n- Technology vendor: nash_prior_weight 0.5\u20130.6 (commercially motivated, lock-in seeking)\n- Consultants: nash_prior_weight 0.45\u20130.6 (methodology-driven)\n\nRELATIONSHIP STRENGTHS:\n- Sponsor \u2192 IT leadership: 0.8\u20130.9 (mandate relationship)\n- IT leadership \u2192 business units: 0.6\u20130.75 (implementation relationship)\n- Business units \u2192 workforce: 0.75\u20130.85 (management relationship)\n- Technology vendor \u2192 IT leadership: 0.65\u20130.8 (commercial dependency)\n- Workforce \u2192 business units: 0.7\u20130.85 (operational dependency)\n\nENVIRONMENT VARIABLES: Estimate legacy_system_complexity from any technology stack descriptions. Estimate change_readiness from cultural indicators or prior transformation history mentioned in the source.",
    interview_templates: [
      "How has the digital transformation affected your daily work so far?",
      "What is the biggest barrier to adoption you have encountered?",
      "Do you believe leadership is genuinely committed to this transformation?",
      "What training or support would make the transition smoother?"
    ],
    prediction_questions: [
      "Will the transformation programme stay on schedule and budget?",
      "Which business unit will adopt fastest and which will resist longest?",
      "Will the technology vendor deliver on its promised capabilities?",
      "Will employee satisfaction increase or decrease during the transformation?"
    ]
  },
  {
    id: "custom",
    name: "Custom Simulation",
    tagline: "Define your own simulation type with fully customisable actors, dynamics, and rules.",
    icon: "\u2699\uFE0F",
    mirofish_fit: null,
    category: "custom",
    colour: "--text-dim",
    recommended_rounds: [30, 100],
    nash_recommended: false,
    min_actors: 2,
    max_actors: 20,
    required_actor_roles: [],
    environment_variable_keys: {
      custom_var_1: { type: "string", default: "", description: "User-defined variable 1 \u2014 set label and value in simulation config" },
      custom_var_2: { type: "string", default: "", description: "User-defined variable 2 \u2014 set label and value in simulation config" },
      custom_var_3: { type: "string", default: "", description: "User-defined variable 3 \u2014 set label and value in simulation config" }
    },
    extraction_directive: "EXTRACTION_FOCUS: No predefined extraction template. Analyse the seed document and identify all named actors, organisations, groups, and environmental forces. Assign roles based on the user's stated simulation objective. If no objective is stated, classify actors as protagonist, antagonist, enabler, or observer based on their described behaviour.\n\nPERSONALITY CALIBRATION:\n- Default all actors to nash_prior_weight 0.4\u20130.5 (moderate rationality)\n- Adjust upward for institutional/bureaucratic actors (0.6\u20130.8)\n- Adjust downward for emotional/public actors (0.1\u20130.3)\n\nRELATIONSHIP STRENGTHS:\n- Default relationship strength: 0.5\n- Adjust based on described interactions in source material\n\nENVIRONMENT VARIABLES: Prompt the user to define custom environment variables relevant to their simulation scenario.",
    interview_templates: [
      "What is your primary objective in this simulation?",
      "How do you expect the other actors to respond to your actions?",
      "What external event would most change the dynamics of this situation?",
      "What outcome would you consider a success?"
    ],
    prediction_questions: [
      "What is the most likely outcome of this simulation?",
      "Which actor will be the first to change strategy?",
      "Will an unexpected alliance or conflict emerge?",
      "What will be the final power distribution among actors?"
    ]
  }
];

/**
 * Look up a simulation type by its id.
 * @param {string} id - One of the simulation type IDs (e.g. "public_opinion", "corporate_strategy")
 * @returns {object|undefined} The matching simulation type object, or undefined if not found
 */
export const getSimType = (id) => simulationTypes.find((t) => t.id === id);
