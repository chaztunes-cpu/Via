// Works out whether a sample's name/tags mention a musical key, and builds the
// search terms for one. Loaded by index.html; also runnable in Node for tests.
(function (root) {
  // Pitch classes, with the common sharp/flat spellings of each.
  const NOTES = [
    ['C'], ['C#', 'Db'], ['D'], ['D#', 'Eb'], ['E'], ['F'],
    ['F#', 'Gb'], ['G'], ['G#', 'Ab'], ['A'], ['A#', 'Bb'], ['B'],
  ];

  function keyName(note, mode) {
    return `${NOTES[note].join('/')} ${mode}`;
  }

  // Regex source for one spelling, e.g. "C#" matches "C#", "C♯", "C sharp", "Csharp".
  function spellingPattern(spelling) {
    const letter = spelling[0];
    const acc = spelling.slice(1);
    if (acc === '#') return `${letter}(?:#|♯|\\s?sharp)`;
    if (acc === 'b') return `${letter}(?:b|♭|\\s?flat)`;
    // A bare letter must not be the start of a sharp/flat note.
    return `${letter}(?![#♯b♭]|\\s?(?:sharp|flat))`;
  }

  const START = '(?<![A-Za-z0-9#♯])';
  const END = '(?![A-Za-z])';

  function buildMatchers(note, mode) {
    const notes = NOTES[note].map(spellingPattern).join('|');
    const long = mode === 'minor' ? '(?:min|minor|moll)' : '(?:maj|major|dur)';
    const matchers = [
      // "C minor", "c-min", "Cminor", "C# Major" — any letter case.
      new RegExp(`${START}(?:${notes})\\s?${long}${END}`, 'i'),
    ];
    if (mode === 'minor') {
      // "Cm", "C#m7" — capital letter only, so words like "am" don't count.
      matchers.push(new RegExp(`${START}(?:${notes})m${END}`));
    } else {
      // "key of C" / "key C" with no minor marker usually means major.
      matchers.push(new RegExp(`${START}key\\s(?:of\\s)?(?:${notes})(?!\\s?(?:m|min|minor|moll)${END})${END}`, 'i'));
    }
    return matchers;
  }

  function textMatches(text, note, mode) {
    // Treat separators in names and tags ("vocal_Am-120", "c-minor") as spaces.
    const clean = String(text).replace(/[_\-.,()[\]{}/|+]/g, ' ');
    return buildMatchers(note, mode).some(re => re.test(clean));
  }

  // Search phrases for Freesound's text search. Results are loose, so every
  // hit is re-checked with textMatches.
  function textQueries(note, mode) {
    return NOTES[note].flatMap(s => mode === 'minor'
      ? [`${s} minor`, `${s}m`]
      : [`${s} major`, `${s}maj`]);
  }

  // Values Freesound's key analysis may report, e.g. "C# minor" or "Db minor".
  function analysisValues(note, mode) {
    return NOTES[note].map(s => `${s} ${mode}`);
  }

  function isCC0(licenseUrl) {
    return /publicdomain\/zero/i.test(licenseUrl || '');
  }

  // CC0 always; plain CC BY only when allowed. Never NonCommercial or Sampling+.
  function licenseOk(licenseUrl, allowBy) {
    if (isCC0(licenseUrl)) return true;
    return Boolean(allowBy) && /\/licenses\/by\//i.test(licenseUrl || '');
  }

  const api = { NOTES, keyName, textMatches, textQueries, analysisValues, isCC0, licenseOk };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KeyMatch = api;
})(this);
