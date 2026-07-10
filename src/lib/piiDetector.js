/**
 * piiDetector.js
 * ----------------
 * Rule-based PII classifier that runs entirely in the browser (no network
 * calls, no server). It takes the word-level tokens produced by the OCR
 * engine (see ocr.js) — each token has text + a bounding box — and returns
 * a list of "matches": spans of one or more consecutive words that together
 * form a sensitive value, tagged with a category and the union of their
 * bounding boxes (so the UI knows exactly what rectangle to redact).
 *
 * Why word-span matching instead of plain regex-on-a-string?
 * OCR frequently splits a single logical value like "1234 5678 9012"
 * (Aadhaar) or "9876543210" across separate word tokens, sometimes with
 * inconsistent spacing. We reconstruct short sliding windows of 1-4
 * consecutive words, strip incidental punctuation, and test each window
 * against the pattern library. The longest valid match wins for a given
 * starting position so we don't double-flag substrings.
 */

// ---- Pattern library -------------------------------------------------

const PATTERNS = [
  {
    id: "AADHAAR",
    label: "Aadhaar Number",
    color: "#ff5d5d",
    maxWindow: 3,
    test: (joined) => /^\d{4}\s?\d{4}\s?\d{4}$/.test(joined),
  },
  {
    id: "PAN",
    label: "PAN Number",
    color: "#ffb020",
    maxWindow: 1,
    test: (joined) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(joined.toUpperCase()),
  },
  {
    id: "PHONE",
    label: "Phone Number",
    color: "#00b4e6",
    maxWindow: 2,
    test: (joined) => {
      const digits = joined.replace(/[\s+-]/g, "");
      // Indian mobile numbers: 10 digits starting 6-9, optional +91/91 prefix
      return /^(91|0)?[6-9]\d{9}$/.test(digits) && digits.replace(/^(91|0)/, "").length === 10;
    },
  },
  {
    id: "EMAIL",
    label: "Email Address",
    color: "#c084fc",
    maxWindow: 1,
    test: (joined) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(joined),
  },
  {
    id: "BANK_ACCOUNT",
    label: "Bank / Card Number",
    color: "#00e6a8",
    maxWindow: 4,
    test: (joined) => {
      const digits = joined.replace(/[\s-]/g, "");
      // 9-18 raw digits covers most Indian bank account numbers and
      // 16-digit card numbers, while staying above phone-number length.
      return /^\d{9,18}$/.test(digits) && digits.length !== 10;
    },
  },
  {
    id: "IFSC",
    label: "IFSC Code",
    color: "#7c8896",
    maxWindow: 1,
    test: (joined) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(joined.toUpperCase()),
  },
  {
    id: "PINCODE",
    label: "PIN Code",
    color: "#8b96a3",
    maxWindow: 1,
    // Only flagged as low-priority context, not blurred by default (see UI).
    test: (joined) => /^\d{6}$/.test(joined),
    lowPriority: true,
  },
];

const cleanToken = (t) => t.replace(/[|_~`]/g, "").trim();

function unionBox(boxes) {
  const x0 = Math.min(...boxes.map((b) => b.x0));
  const y0 = Math.min(...boxes.map((b) => b.y0));
  const x1 = Math.max(...boxes.map((b) => b.x1));
  const y1 = Math.max(...boxes.map((b) => b.y1));
  return { x0, y0, x1, y1 };
}

/**
 * @param {Array<{text:string, x0:number,y0:number,x1:number,y1:number}>} words
 * @param {{includeLowPriority?: boolean}} opts
 * @returns {Array<{id:string,label:string,color:string,value:string,box:object,wordIndexes:number[]}>}
 */
export function detectPII(words, opts = {}) {
  const matches = [];
  const consumed = new Set();

  for (let i = 0; i < words.length; i++) {
    if (consumed.has(i)) continue;

    let bestMatch = null;

    for (const pattern of PATTERNS) {
      if (pattern.lowPriority && !opts.includeLowPriority) continue;

      for (let span = 1; span <= pattern.maxWindow; span++) {
        if (i + span > words.length) break;
        // Don't cross words already claimed by a previous, longer match.
        if (Array.from({ length: span }, (_, k) => i + k).some((idx) => consumed.has(idx))) {
          break;
        }

        const slice = words.slice(i, i + span);
        const rawJoined = slice.map((w) => cleanToken(w.text)).join(" ");
        const tightJoined = slice.map((w) => cleanToken(w.text)).join("");

        if (pattern.test(rawJoined) || pattern.test(tightJoined)) {
          const candidate = {
            id: pattern.id,
            label: pattern.label,
            color: pattern.color,
            value: rawJoined,
            box: unionBox(slice),
            wordIndexes: slice.map((_, k) => i + k),
          };
          // Prefer the widest span that matches (greedy longest match).
          if (!bestMatch || span > bestMatch.wordIndexes.length) {
            bestMatch = candidate;
          }
        }
      }
    }

    if (bestMatch) {
      bestMatch.wordIndexes.forEach((idx) => consumed.add(idx));
      matches.push(bestMatch);
    }
  }

  return matches;
}

export function summarize(matches) {
  const counts = {};
  for (const m of matches) {
    counts[m.id] = (counts[m.id] || 0) + 1;
  }
  return counts;
}

export { PATTERNS };
