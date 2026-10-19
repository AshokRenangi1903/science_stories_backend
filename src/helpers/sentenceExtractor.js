
import { createHash } from "node:crypto";

function deltaText(ops) {
  if (!Array.isArray(ops)) return "";

  return ops
    .map((op) =>
      typeof op?.insert === "string" ? op.insert : "",
    )
    .join("")
    .replace(/\r\n?/g, "\n")
    .trim();
}

function addField(fields, value) {
  if (typeof value !== "string") return;

  const text = value.trim();
  if (text) fields.push(text);
}

function getReadableFields(type, content) {
  if (!content || typeof content !== "object") return [];

  const fields = [];

  switch (type) {
    case "PARAGRAPH":
    case "RELATED_CONTENT":
      addField(fields, deltaText(content.ops));
      break;

    case "HIGHLIGHT":
      addField(fields, content.title);
      addField(fields, deltaText(content.descriptionOps));
      break;

    case "IMAGE":
      addField(fields, content.title);
      addField(fields, deltaText(content.captionOps));
      break;

    case "SCIENTIST_CARD":
      addField(fields, content.scientistName);
      addField(fields, content.title);
      addField(fields, content.birth);
      addField(fields, content.death);
      addField(fields, deltaText(content.descriptionOps));
      break;

    case "CARD":
      addField(fields, content.title);
      addField(fields, content.description);
      break;

    case "QUOTATION":
      addField(fields, content.quote);
      addField(fields, content.author);
      break;

    default:
      // Unknown block types must not be narrated accidentally.
      break;
  }

  return fields;
}

function splitIntoSentences(text) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) return [];

  // Use the runtime's sentence segmenter when available.
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter("en", {
      granularity: "sentence",
    });

    return Array.from(segmenter.segment(normalized))
      .map(({ segment }) => segment.trim())
      .filter(Boolean);
  }

  // Fallback for runtimes without Intl.Segmenter.
  return (
    normalized.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) ?? []
  )
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function hashSentence(text) {
  return createHash("sha256")
    .update(text, "utf8")
    .digest("hex");
}

function extractSentences(block) {
  const fields = getReadableFields(block.type, block.content);
  const sentences = [];

  for (const field of fields) {
    for (const text of splitIntoSentences(field)) {
      sentences.push({
        text,
        textHash: hashSentence(text),
        position: sentences.length + 1,
      });
    }
  }

  return sentences;
}

export {
  extractSentences,
  getReadableFields,
  splitIntoSentences,
  hashSentence,
};
