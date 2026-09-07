import { describe, expect, it } from 'vitest';
import { clinicalVocabulary, expandElisions, foldAccents, repairClinicalTerms, similarity } from './voice-fuzzy';
import { resolveWithGrammar } from './voice-grammar';
import { VoiceContextSnapshot } from './voice-intent.model';

/**
 * The one rule that matters more than any other here is the negative one:
 * numbers are never repaired. A repaired clinical term produces a visibly
 * wrong finding the dentist can catch at review; a repaired tooth number
 * produces a perfectly ordinary-looking finding on the wrong tooth, which
 * nothing downstream and nobody reading the record will notice.
 */
describe('voice-fuzzy', () => {
  const snapshot = (): VoiceContextSnapshot => ({
    patientId: 'patient-1',
    patientName: 'Ahmed Benali',
    dentition: 'adult',
    module: 'patient-dossier',
    route: '/patients/patient-1',
    selectedFdi: null,
    sessionId: 'session-1',
    locale: 'fr-MA',
    recentIntents: [],
    recentUtterances: [],
    lastWrite: null,
  });

  describe('normalisation', () => {
    it('folds accents so récurrente and recurrente are one word', () => {
      expect(foldAccents('récurrente')).toBe('recurrente');
      expect(foldAccents('Carie Récurrente')).toBe('carie recurrente');
    });

    it('splits French elisions so the word underneath can be matched', () => {
      expect(expandElisions("l'obturation")).toBe('l obturation');
      expect(expandElisions("d'une couronne")).toBe('d une couronne');
      // Recognisers render the apostrophe several ways.
      expect(expandElisions('l’obturation')).toBe('l obturation');
    });
  });

  describe('vocabulary', () => {
    it('harvests real clinical words from the lexicon patterns', () => {
      const vocabulary = clinicalVocabulary();
      expect(vocabulary.has('couronne')).toBe(true);
      expect(vocabulary.has('recurrent')).toBe(true);
      // From `carie\s+(?:r[ée]cidivante|…)` — proof that a character class is
      // collapsed to a letter rather than splitting the word around it.
      expect(vocabulary.has('recidivante')).toBe(true);
    });

    it('does not admit number words, which must never be repair targets', () => {
      const vocabulary = clinicalVocabulary();
      for (const word of ['seize', 'sixteen', 'quinze', 'dix', 'sept']) {
        expect(vocabulary.has(word)).toBe(false);
      }
    });
  });

  describe('similarity', () => {
    it('scores a real mishearing above the floor and an unrelated word below', () => {
      expect(similarity('recurrence', 'recurrent')).toBeGreaterThanOrEqual(0.92);
      expect(similarity('caries', 'carie')).toBeGreaterThanOrEqual(0.92);
      expect(similarity('carie', 'couronne')).toBeLessThan(0.92);
    });

    it('refuses to choose between two real clinical terms that merely look alike', () => {
      // Gingival recession and gingivitis are different findings. Guessing
      // between them is worse than declining and asking.
      expect(similarity('gingivale', 'gingivite')).toBeLessThan(0.92);
    });

    it('scores tooth numbers far below the floor, independently of the exclusion', () => {
      expect(similarity('seize', 'treize')).toBeLessThan(0.92);
      expect(similarity('seize', 'sept')).toBeLessThan(0.92);
    });
  });

  describe('repairClinicalTerms', () => {
    it('repairs the near-miss that motivated this whole change', () => {
      // "upper right first molar recurrence caries" is what the dentist
      // actually said; the grammar wants "recurrent".
      const repair = repairClinicalTerms('recurrence caries');
      expect(repair.text).toContain('recurrent');
      expect(repair.corrections.length).toBeGreaterThan(0);
      expect(repair.text).not.toBe('recurrence caries');
    });

    it('leaves an already-correct utterance completely untouched', () => {
      const input = 'carie récidivante sur la couronne';
      const repair = repairClinicalTerms(input);
      expect(repair.corrections).toEqual([]);
    });

    it('never rewrites digits', () => {
      const repair = repairClinicalTerms('16 17 26 recurrence');
      expect(repair.text).toContain('16');
      expect(repair.text).toContain('17');
      expect(repair.text).toContain('26');
      expect(repair.corrections.every(c => !/\d/.test(c.from))).toBe(true);
    });

    it('never rewrites spoken number words in any of the three languages', () => {
      for (const number of ['seize', 'sixteen', 'quinze', 'dix-sept', 'khamsa']) {
        const repair = repairClinicalTerms(`${number} carie`);
        expect(repair.corrections.map(c => c.from)).not.toContain(number);
        expect(repair.text).toContain(number.split('-')[0]);
      }
    });

    it('leaves short words alone, which are too easy to turn into other words', () => {
      const repair = repairClinicalTerms('la et de sur');
      expect(repair.corrections).toEqual([]);
    });
  });

  describe('end to end with the grammar', () => {
    const findingCodes = (resolution: ReturnType<typeof resolveWithGrammar>): string[] => {
      if (resolution.kind !== 'intent') return [];
      const findings = resolution.intent.entities['findings'];
      return Array.isArray(findings) ? findings.map(f => (f as { code: string }).code) : [];
    };

    it('recovers the specific finding the misheard word had degraded to a generic one', () => {
      const context = snapshot();
      // "tooth sixteen" rather than a bare "sixteen": the grammar asks which
      // tooth for the bare form, which is its own behaviour and not something
      // fuzzy repair should paper over.
      const utterance = 'tooth sixteen recurrence caries';

      // The failure is subtler than an outright rejection, and worse for it.
      // "recurrence" does not match the recurrent-caries pattern, but "caries"
      // still matches the generic one — so the dentist gets a recorded finding
      // that looks right and has quietly lost "recurrent".
      const before = resolveWithGrammar(utterance, context);
      expect(findingCodes(before)).toEqual(['caries']);

      // The grammar arbitrates: "recurrence" scores higher against the French
      // "récurrente" than the English "recurrent", but only the latter parses
      // in this word order.
      const repair = repairClinicalTerms(
        utterance,
        candidate => findingCodes(resolveWithGrammar(candidate, context)).includes('recurrent_caries'),
      );
      const after = resolveWithGrammar(repair.text, context);
      expect(findingCodes(after)).toEqual(['recurrent_caries']);
    });

    it('resolves the French form now that the lexicon carries it', () => {
      const resolution = resolveWithGrammar('dent 16, carie récurrente', snapshot());
      expect(findingCodes(resolution)).toEqual(['recurrent_caries']);
    });

    it('keeps the tooth number intact through the repair', () => {
      const repair = repairClinicalTerms('tooth sixteen recurrence caries');
      const resolution = resolveWithGrammar(repair.text, snapshot());
      if (resolution.kind !== 'intent') throw new Error('expected an intent');
      // 16, not 17 or 15 — the entire point of excluding numbers.
      expect(resolution.intent.entities['fdi']).toBe('16');
    });
  });
});
