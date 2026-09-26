const CODE_FENCE_PATTERN = /```(?:jsx|tsx|javascript|typescript|react)?\s*|```/gi;
const LUCIDE_IMPORT_PATTERN = /\bimport\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"]\s*;?/g;
const ANY_IMPORT_PATTERN = /^\s*import\s+(?:[\s\S]*?\s+from\s+)?['"][^'"]+['"]\s*;?\s*$/gm;
const LUCIDE_DECLARATION_PATTERN = /\b(?:const|let|var)\s*\{[\s\S]*?\}\s*=\s*LucideIcons\s*;?/g;

const normalizeLucideBinding = (binding: string) => {
  const withoutComments = binding.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").trim();
  if (!withoutComments) return null;

  const aliasMatch = withoutComments.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
  if (aliasMatch) return { imported: aliasMatch[1], local: aliasMatch[2] };

  const nameMatch = withoutComments.match(/^([A-Za-z_$][\w$]*)$/);
  if (!nameMatch) return null;
  return { imported: nameMatch[1], local: nameMatch[1] };
};

export const sanitizeGeneratedCode = (rawCode: string): string => {
  let cleaned = rawCode.trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed?.code === "string") cleaned = parsed.code;
  } catch {
    // The model normally returns plain TSX.
  }

  cleaned = cleaned.replace(CODE_FENCE_PATTERN, "").trim();

  const lucideBindings = new Map<string, string>();
  cleaned = cleaned.replace(LUCIDE_IMPORT_PATTERN, (_statement, names: string) => {
    names.split(",").forEach((name) => {
      const binding = normalizeLucideBinding(name);
      if (binding) lucideBindings.set(binding.local, binding.imported);
    });
    return "";
  });

  cleaned = cleaned
    .replace(LUCIDE_DECLARATION_PATTERN, "")
    .replace(ANY_IMPORT_PATTERN, "")
    .replace(/^\s*export\s+\{[^}]*\}\s*;?\s*$/gm, "")
    .trim();

  if (/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/.test(cleaned)) {
    const match = cleaned.match(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/);
    const componentName = match?.[1];
    cleaned = cleaned.replace(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/, "function $1");
    if (componentName && componentName !== "App" && !/\b(?:const|let|var|function|class)\s+App\b/.test(cleaned)) {
      cleaned += `\nconst App = ${componentName};`;
    }
  } else if (/export\s+default\s+/.test(cleaned) && !/\b(?:const|let|var|function|class)\s+App\b/.test(cleaned)) {
    cleaned = cleaned.replace(/export\s+default\s+/, "const App = ");
  } else {
    cleaned = cleaned.replace(/export\s+default\s+/g, "");
  }

  cleaned = cleaned.replace(/^\s*export\s+/gm, "").trim();

  if (lucideBindings.size > 0) {
    const declarations = [...lucideBindings.entries()].map(([local, imported]) =>
      local === imported ? imported : `${imported}: ${local}`,
    );
    cleaned = `const { ${declarations.join(", ")} } = LucideIcons;\n${cleaned}`;
  }

  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
};