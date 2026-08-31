import axe from 'axe-core';

/**
 * Runs a real axe-core scan against a rendered fixture and fails the test
 * with a readable list of violations. Kept as a single shared helper so
 * a11y checks are consistent across specs rather than each one reinventing
 * the assertion (audit Part X — "0 aria-*, 0 keyboard handlers" had nothing
 * in CI that would have caught a regression).
 */
export async function expectNoA11yViolations(element: Element): Promise<void> {
  const results = await axe.run(element, {
    // 'best-practice' rules are noisy opinions, not WCAG failures — scoped
    // to the two rulesets the audit actually measured against (WCAG 2.1 AA).
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  });

  if (results.violations.length > 0) {
    const details = results.violations
      .map(v => `- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
      .join('\n');
    throw new Error(`axe-core found ${results.violations.length} accessibility violation(s):\n${details}`);
  }
}
