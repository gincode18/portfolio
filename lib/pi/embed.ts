import { GoogleGenAI } from "@google/genai";

// gemini-embedding-001 supports configurable output dimensionality (768, 1536,
// 3072). 768 is plenty for portfolio-scale RAG and matches our SQLite vec0
// schema (FLOAT[768]).
const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIM = 768;

let _ai: GoogleGenAI | null = null;

function client(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Embeddings require a Gemini API key."
    );
  }
  if (!_ai) _ai = new GoogleGenAI({ apiKey: key });
  return _ai;
}

export async function embedOne(text: string): Promise<Float32Array> {
  const ai = client();
  const result = await ai.models.embedContent({
    model: EMBED_MODEL,
    contents: text,
    config: { outputDimensionality: EMBED_DIM },
  });
  const values = result.embeddings?.[0]?.values;
  if (!values || values.length !== EMBED_DIM) {
    throw new Error(
      `embedContent returned unexpected shape: ${
        values?.length ?? "missing"
      } values (expected ${EMBED_DIM})`
    );
  }
  return new Float32Array(values);
}

export async function embedBatch(texts: string[]): Promise<Float32Array[]> {
  // Gemini supports batch embedContent; do it one at a time for simplicity and
  // back-off-friendliness. For portfolio scale (~100 chunks), this is fine.
  const out: Float32Array[] = [];
  for (const t of texts) {
    out.push(await embedOne(t));
  }
  return out;
}

export const EMBEDDING_DIM = EMBED_DIM;
