/**
 * LaTeX template engine — fills {{placeholder}} syntax and
 * handles {{#each members}}...{{/each}} loops.
 */

/**
 * Fill a single-level template with key→value pairs.
 */
export function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    if (val === undefined) {
      console.warn(`[LaTeX] Missing placeholder: {{${key}}}`);
      return "";
    }
    return escapeLatex(val);
  });
}

/**
 * Fill {{#each members}} loops in the template.
 */
export function fillEachLoop(
  template: string,
  members: Record<string, string>[]
): string {
  return template.replace(
    /\{\{#each members\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_, rowTemplate) => {
      return members
        .map((member, idx) =>
          fillTemplate(rowTemplate, { ...member, s_no: String(idx + 1) })
        )
        .join("\n");
    }
  );
}

/**
 * Escapes special LaTeX characters to prevent compilation errors.
 */
export function escapeLatex(str: string): string {
  return str
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

/**
 * Validates that all required placeholders exist in a template.
 */
export function validateTemplatePlaceholders(
  templateContent: string,
  requiredPlaceholders: string[]
): { valid: boolean; missing: string[] } {
  const found = new Set(
    [...templateContent.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])
  );
  const missing = requiredPlaceholders.filter((p) => !found.has(p));
  return { valid: missing.length === 0, missing };
}

/**
 * Compiles a filled LaTeX string to PDF by calling the external microservice.
 * Returns a Buffer with the compiled PDF bytes.
 */
export async function compileLatexToPdf(
  latexContent: string
): Promise<Buffer> {
  const serviceUrl = process.env.LATEX_SERVICE_URL;
  const apiKey = process.env.LATEX_SERVICE_API_KEY;

  if (!serviceUrl) {
    throw new Error("LATEX_SERVICE_URL is not configured.");
  }

  const response = await fetch(`${serviceUrl}/compile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ latex: latexContent }),
    signal: AbortSignal.timeout(30000), // 30s timeout
  });

  if (!response.ok) {
    let errBody = "";
    try {
      const json = await response.json();
      errBody = json.error || json.log || "";
    } catch {
      errBody = await response.text();
    }
    throw new Error(`LaTeX compilation failed: ${errBody}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
