/**
 * Replaces {{ variable }} and {{variable}} in template string with values from context.
 */
export const interpolateTemplate = (
  template: string,
  context: Record<string, string | number | null | undefined>,
): string => {
  return template.replace(/\{\{\s*([\w\u0400-\u04FF._-]+)\s*\}\}/g, (_, key) => {
    const val = context[key]
    return val !== undefined && val !== null ? String(val) : ''
  })
}

/**
 * Extracts list of placeholder variable names from template string.
 */
export const extractTemplateVariables = (template: string): string[] => {
  const matches = template.matchAll(/\{\{\s*([\w\u0400-\u04FF._-]+)\s*\}\}/g)
  const set = new Set<string>()
  for (const m of matches) {
    if (m[1]) {
      set.add(m[1])
    }
  }
  return Array.from(set)
}
