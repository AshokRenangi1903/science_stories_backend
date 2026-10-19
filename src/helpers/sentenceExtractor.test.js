import assert from "node:assert/strict";
import { extractSentences } from "./sentenceExtractor.js";

const paragraph = {
  type: "PARAGRAPH",
  content: {
    ops: [
      {
        insert:
          "Imagine waking up with your nose gone. Not from an accident — cut away deliberately, as a legal punishment.\n\n",
      },
    ],
  },
};

const image = {
  type: "IMAGE",
  content: {
    title: "Figure 1: The Ancient Surgical Theatre",
    imageUrl: "https://example.com/image.jpg",
    captionOps: [
      {
        insert: "An ancient Indian surgical scene.\n",
      },
    ],
  },
};

const scientist = {
  type: "SCIENTIST_CARD",
  content: {
    scientistName: "Acharya Sushruta",
    title: "Father of Surgery",
    birth: "Kashi, Ancient India",
    death: "",
    imageUrl: "https://example.com/sushruta.jpg",
    descriptionOps: [
      {
        insert: "He studied the human body. He developed surgical methods.\n",
      },
    ],
  },
};

const paragraphSentences = extractSentences(paragraph);
assert.equal(paragraphSentences.length, 2);
assert.equal(
  paragraphSentences[0].text,
  "Imagine waking up with your nose gone.",
);

const imageSentences = extractSentences(image);
assert.equal(imageSentences.length, 2);
assert.equal(
  imageSentences.some((s) => s.text.includes("example.com")),
  false,
);

const scientistSentences = extractSentences(scientist);
assert.equal(scientistSentences[0].text, "Acharya Sushruta");
assert.equal(
  scientistSentences.some((s) => s.text.includes("example.com")),
  false,
);

assert.equal(
  new Set(paragraphSentences.map((s) => s.textHash)).size,
  paragraphSentences.length,
);

const highlight = {
  type: "HIGHLIGHT",
  content: {
    title: "Think About It",
    descriptionOps: [
      {
        insert: "Patience can solve difficult problems. Think differently.\n",
      },
    ],
  },
};

const relatedContent = {
  type: "RELATED_CONTENT",
  content: {
    section: "past",
    ops: [
      {
        insert: "c. 3000 BCE\nOrigins of Ayurveda in Vedic revelation.\n",
      },
    ],
  },
};

const card = {
  type: "CARD",
  content: {
    title: "300",
    description: "Distinct surgical procedures described in detail.",
  },
};

const quotation = {
  type: "QUOTATION",
  content: {
    quote: "Knowledge begins with observation.",
    author: "Sushruta",
  },
};

const unknown = {
  type: "UNKNOWN_BLOCK",
  content: {
    title: "Should not be spoken",
    description: "This must not enter narration.",
  },
};

// HIGHLIGHT
const highlightSentences = extractSentences(highlight);
assert.equal(highlightSentences[0].text, "Think About It");
assert.ok(
  highlightSentences.some(
    (s) => s.text === "Patience can solve difficult problems.",
  ),
);

// RELATED_CONTENT
const relatedSentences = extractSentences(relatedContent);
assert.ok(relatedSentences.some((s) => s.text.includes("Origins of Ayurveda")));
assert.equal(
  relatedSentences.some((s) => s.text === "past"),
  false,
);

// CARD
const cardSentences = extractSentences(card);
assert.equal(cardSentences[0].text, "300");
assert.equal(
  cardSentences.some((s) => s.text.includes("Distinct surgical procedures")),
  true,
);

// QUOTATION
const quotationSentences = extractSentences(quotation);
assert.ok(
  quotationSentences.some(
    (s) => s.text === "Knowledge begins with observation.",
  ),
);
assert.ok(quotationSentences.some((s) => s.text === "Sushruta"));

// UNKNOWN BLOCK
assert.deepEqual(extractSentences(unknown), []);

console.log("Sentence extractor tests passed!");
