type NormalizedIssueTone = {
  cleanedIssue: string;
  analysisStatement: string;
  complaintStatement: string;
};

type IssueCategory =
  | "refund"
  | "unauthorized"
  | "damaged"
  | "delivery"
  | "billing"
  | "subscription"
  | "service"
  | "generic";

const PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bwtf\b/gi, ""],
  [/\b(?:bullshit|bs)\b/gi, "unacceptable conduct"],
  [/\b(?:shit|crap)\b/gi, "serious problem"],
  [/\bscam(?:my)?\b/gi, "potentially misleading"],
  [/\brip(?:-|\s)?off\b/gi, "unfair charge"],
  [/\bghosted\b/gi, "did not respond"],
  [/\blied\b/gi, "provided inconsistent information"],
  [/\bignored me\b/gi, "did not respond to follow-up communications"],
  [/\bscrewed(?: me)? over\b/gi, "handled the matter improperly"],
  [/\bblown off\b/gi, "not taken seriously"],
  [/\bno one got back to me\b/gi, "no response was received"],
  [/\bwon't\b/gi, "will not"],
  [/\bcan't\b/gi, "cannot"],
  [/\bdidn't\b/gi, "did not"],
  [/\bdoesn't\b/gi, "does not"],
  [/\bit's\b/gi, "it is"],
];

const PROFANITY_WORDS = /\b(?:fuck|fucking|fucked|motherfucker|asshole|bitch|damn)\b/gi;

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizePunctuation(value: string) {
  return value
    .replace(/[!?]{2,}/g, ".")
    .replace(/\.{3,}/g, ".")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/([,.;:])(?=\S)/g, "$1 ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function ensureSentence(value: string, fallback: string) {
  const trimmed = value.trim() || fallback;
  const withCapital = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.?!]$/.test(withCapital) ? withCapital : `${withCapital}.`;
}

function joinSentences(...sentences: Array<string | null | undefined>) {
  return sentences.filter(Boolean).join(" ");
}

function maybeNormalizeAllCaps(value: string) {
  const letters = value.replace(/[^a-z]/gi, "");
  if (!letters) {
    return value;
  }

  const uppercaseRatio = letters.split("").filter((character) => character === character.toUpperCase()).length / letters.length;

  if (uppercaseRatio > 0.72) {
    return value.toLowerCase();
  }

  return value;
}

function cleanIssueDescription(rawIssueDescription: string) {
  let value = maybeNormalizeAllCaps(rawIssueDescription);

  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    value = value.replace(pattern, replacement);
  }

  value = value.replace(PROFANITY_WORDS, "unacceptable");
  value = normalizePunctuation(collapseWhitespace(value));

  return ensureSentence(value, "The matter remains unresolved and requires formal review");
}

function stripLeadingClause(value: string) {
  return value
    .replace(/^(?:i am|i'm|i was|i have|i had|i need|i want|i tried|i ordered|i paid)\b/gi, "the customer reports")
    .replace(/^the customer reports\s+the customer reports/gi, "the customer reports");
}

function normalizeSignalText(rawIssueDescription: string) {
  let value = maybeNormalizeAllCaps(rawIssueDescription);

  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    value = value.replace(pattern, replacement);
  }

  value = value
    .replace(PROFANITY_WORDS, "unacceptable")
    .replace(/[^a-z0-9\s-]/gi, " ")
    .toLowerCase();

  return collapseWhitespace(value);
}

const ISSUE_SIGNALS = {
  authenticity: [
    "fake",
    "counterfeit",
    "not authentic",
    "not genuine",
    "replica",
    "imitation",
    "authenticity",
    "different from advertised",
  ],
  quality: [
    "damaged",
    "defective",
    "broken",
    "faulty",
    "cracked",
    "poor quality",
    "quality issue",
    "spoiled",
    "expired",
    "smelly",
    "smell",
    "contaminated",
    "not as described",
    "wrong item",
    "serious problem",
  ],
  delivery: [
    "delivery",
    "shipping",
    "shipment",
    "tracking",
    "package",
    "not delivered",
    "delayed",
    "late",
    "missing item",
    "lost",
    "fulfillment",
  ],
  refund: [
    "refund",
    "return",
    "credit",
    "reimburse",
    "reimbursement",
    "not refunded",
    "refund not received",
    "refusal",
    "refused",
    "cancelled but charged",
  ],
  communication: [
    "did not respond",
    "no response",
    "did not reply",
    "ignored",
    "follow up",
    "follow-up",
    "support",
    "merchant response",
    "customer service",
  ],
  unauthorized: [
    "unauthorized",
    "fraud",
    "not mine",
    "stolen card",
    "charge not mine",
    "without consent",
    "unknown charge",
    "unknown transaction",
  ],
  billing: [
    "billing",
    "overcharge",
    "double charge",
    "charged twice",
    "incorrect charge",
    "wrong amount",
    "extra fee",
  ],
  subscription: [
    "subscription",
    "renewal",
    "auto renew",
    "auto-renew",
    "cancellation",
    "cancel",
  ],
  service: [
    "service",
    "not provided",
    "poor service",
    "failed service",
    "incomplete",
    "unresolved issue",
  ],
} as const;

type DetectedSignals = {
  authenticity: boolean;
  quality: boolean;
  delivery: boolean;
  refund: boolean;
  communication: boolean;
  unauthorized: boolean;
  billing: boolean;
  subscription: boolean;
  service: boolean;
};

function hasSignal(text: string, candidates: readonly string[]) {
  return candidates.some((candidate) => text.includes(candidate));
}

function detectSignals(text: string): DetectedSignals {
  return {
    authenticity: hasSignal(text, ISSUE_SIGNALS.authenticity),
    quality: hasSignal(text, ISSUE_SIGNALS.quality),
    delivery: hasSignal(text, ISSUE_SIGNALS.delivery),
    refund: hasSignal(text, ISSUE_SIGNALS.refund),
    communication: hasSignal(text, ISSUE_SIGNALS.communication),
    unauthorized: hasSignal(text, ISSUE_SIGNALS.unauthorized),
    billing: hasSignal(text, ISSUE_SIGNALS.billing),
    subscription: hasSignal(text, ISSUE_SIGNALS.subscription),
    service: hasSignal(text, ISSUE_SIGNALS.service),
  };
}

function buildPrimaryIssueSummary(category: IssueCategory, signals: DetectedSignals) {
  if (signals.unauthorized) {
    return "The transaction appears to be disputed as unauthorized and requires formal review.";
  }

  if (signals.authenticity) {
    return "The received item appeared inconsistent with the advertised product and raised authenticity concerns.";
  }

  if (category === "refund" || signals.refund) {
    return "The merchant has not yet resolved the refund request despite the complaint being raised.";
  }

  if (category === "delivery" || signals.delivery) {
    return "The order fulfillment process appears to have failed or resulted in an unsatisfactory delivery outcome.";
  }

  if (category === "damaged" || signals.quality) {
    return "The delivered product appears to have had a serious quality issue and did not meet reasonable expectations.";
  }

  if (category === "billing" || signals.billing) {
    return "The transaction record appears to contain a billing discrepancy that requires correction.";
  }

  if (category === "subscription" || signals.subscription) {
    return "The subscription or renewal handling appears inconsistent with the customer's instructions or reasonable expectations.";
  }

  if (category === "service" || signals.service) {
    return "The service outcome appears not to have met reasonable expectations and remains unresolved.";
  }

  return "The customer reports an unresolved issue with the transaction outcome that requires formal review.";
}

function buildSecondaryIssueSummary(signals: DetectedSignals, primarySummary: string) {
  if (signals.communication && !primarySummary.includes("response")) {
    return "A clear merchant response or documented resolution has not yet been provided.";
  }

  if (signals.delivery && !primarySummary.includes("delivery outcome")) {
    return "The available account also suggests shortcomings in the delivery or fulfillment process.";
  }

  if (signals.refund && !primarySummary.includes("refund request")) {
    return "The matter remains unresolved because the requested refund or credit has not yet been completed.";
  }

  if (signals.billing && !primarySummary.includes("billing discrepancy")) {
    return "The available information also suggests that the charged amount may not align with the expected transaction terms.";
  }

  return null;
}

function resolveIssueCategory(category: string): IssueCategory {
  switch (category) {
    case "refund":
    case "unauthorized":
    case "damaged":
    case "delivery":
    case "billing":
    case "subscription":
    case "service":
      return category;
    default:
      return "generic";
  }
}

export function normalizeIssueLanguage(
  rawIssueDescription: string,
  category: string,
  merchantName: string,
): NormalizedIssueTone {
  const resolvedCategory = resolveIssueCategory(category);
  const cleanedRawText = stripLeadingClause(cleanIssueDescription(rawIssueDescription));
  const signalText = normalizeSignalText(rawIssueDescription);
  const signals = detectSignals(signalText);
  const primaryIssueSummary = buildPrimaryIssueSummary(resolvedCategory, signals);
  const secondaryIssueSummary = buildSecondaryIssueSummary(signals, primaryIssueSummary);
  const cleanedIssue = joinSentences(primaryIssueSummary, secondaryIssueSummary);

  const analysisLeadByCategory: Record<IssueCategory, string> = {
    refund: `The case concerns an unresolved refund issue involving ${merchantName}.`,
    unauthorized: `The case concerns a transaction involving ${merchantName} that appears to be disputed as unauthorized.`,
    damaged: `The case concerns goods or services associated with ${merchantName} that appear damaged, defective, or not as described.`,
    delivery: `The case concerns a delivery or fulfillment issue involving ${merchantName}.`,
    billing: `The case concerns a billing discrepancy involving ${merchantName}.`,
    subscription: `The case concerns a subscription, renewal, or cancellation issue involving ${merchantName}.`,
    service: `The case concerns a service-related dispute involving ${merchantName}.`,
    generic: `The case concerns an unresolved consumer dispute involving ${merchantName}.`,
  };

  const complaintLeadByCategory: Record<IssueCategory, string> = {
    refund: `My complaint concerns an unresolved refund issue involving ${merchantName}.`,
    unauthorized: `My complaint concerns a disputed transaction involving ${merchantName} that I do not recognize as authorized.`,
    damaged: `My complaint concerns goods or services associated with ${merchantName} that were damaged, defective, or materially not as described.`,
    delivery: `My complaint concerns a delivery or fulfillment issue involving ${merchantName}.`,
    billing: `My complaint concerns a billing discrepancy involving ${merchantName}.`,
    subscription: `My complaint concerns a subscription, renewal, or cancellation issue involving ${merchantName}.`,
    service: `My complaint concerns a service-related dispute involving ${merchantName}.`,
    generic: `My complaint concerns an unresolved consumer dispute involving ${merchantName}.`,
  };

  return {
    cleanedIssue: ensureSentence(cleanedIssue, cleanedRawText),
    analysisStatement: joinSentences(
      analysisLeadByCategory[resolvedCategory],
      `The issue can be summarized in professional terms as follows: ${ensureSentence(cleanedIssue, cleanedRawText)}`,
    ),
    complaintStatement: joinSentences(
      complaintLeadByCategory[resolvedCategory],
      `The issue can be summarized as follows: ${ensureSentence(cleanedIssue, cleanedRawText)}`,
    ),
  };
}
