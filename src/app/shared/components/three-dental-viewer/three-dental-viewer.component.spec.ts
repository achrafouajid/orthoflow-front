import { resolveArchFdiSequence } from './three-dental-viewer.component';

describe('resolveArchFdiSequence', () => {
  const upperFDI = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
  const lowerFDI = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];

  it('maps a full 16-tooth upper arch to all 16 FDI codes', () => {
    expect(resolveArchFdiSequence(16, upperFDI)).toEqual(upperFDI);
  });

  it('maps a full 16-tooth lower arch to all 16 FDI codes', () => {
    expect(resolveArchFdiSequence(16, lowerFDI)).toEqual(lowerFDI);
  });

  it('refuses to guess when the arch has fewer than 16 detected groups', () => {
    // Historically this silently shifted the FDI sequence by an offset —
    // exactly the defect that could record a finding against the wrong tooth.
    expect(resolveArchFdiSequence(14, upperFDI)).toBeNull();
  });

  it('refuses to guess when the arch has more than 16 detected groups', () => {
    expect(resolveArchFdiSequence(18, upperFDI)).toBeNull();
  });

  it('never returns a sequence shorter than 16 for a 16-code arch', () => {
    for (let count = 0; count < 32; count++) {
      const result = resolveArchFdiSequence(count, upperFDI);
      if (count !== 16) {
        expect(result).toBeNull();
      } else {
        expect(result?.length).toBe(16);
      }
    }
  });

  it('the full jaw is exactly 32 distinct FDI codes with no overlap', () => {
    const upper = resolveArchFdiSequence(16, upperFDI)!;
    const lower = resolveArchFdiSequence(16, lowerFDI)!;
    const all = [...upper, ...lower];
    expect(all.length).toBe(32);
    expect(new Set(all).size).toBe(32);
  });
});
