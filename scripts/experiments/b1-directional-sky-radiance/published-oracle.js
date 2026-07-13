export const PUBLISHED_MODELS = Object.freeze([
  'nishita93',
  'nishita96',
  'preetham',
  'oneal',
  'haber',
  'bruneton',
  'elek',
  'hosek',
  'libradtran'
]);

export const MODEL_LABELS = Object.freeze({
  nishita93: 'Nishita93',
  nishita96: 'Nishita96',
  preetham: 'Preetham',
  oneal: "O'Neal",
  haber: 'Haber',
  bruneton: 'Bruneton',
  elek: 'Elek',
  hosek: 'Hosek',
  libradtran: 'libRadtran'
});

// These are transcription oracles, fixed before local model regeneration.
// Figure 5 prints one decimal place. A regenerated value is compared after
// applying the paper source's own rounding rule; the extra 0.001 mW allowance
// covers floating-point differences at a half-decimal boundary.
export const PUBLISHED_RMSE_TOLERANCE_MW = 0.051;

export const PUBLISHED_RMSE_ORACLE = Object.freeze({
  quantity: 'spectral-radiance RMSE',
  unit: 'mW m^-2 sr^-1 nm^-1',
  commonWavelengthIntervalNm: Object.freeze([360, 720]),
  source: Object.freeze({
    paper: 'references/downloads/bruneton-clear-sky-models-paper-1612.04336/paper.pdf',
    perTimeLocator: 'Figure 5, page 8: bottom-left RMSE values',
    aggregateLocator: 'Sections 5.3, 6.4, 7.4, 8.4, 9.4, 10.4, 11.4, and 12.4; Section 3.4 for libRadtran',
    implementation: 'Bruneton clear-sky-models revision 4df2ec6609bc0127a478bd34fff29c94352579cc, atmosphere/comparisons.cc'
  }),
  perTime: Object.freeze({
    '10:15': Object.freeze({
      nishita93: 24.7,
      nishita96: 17.7,
      preetham: 92.4,
      oneal: 49.7,
      haber: 12.6,
      bruneton: 9.0,
      elek: 9.0,
      hosek: 39.9,
      libradtran: 9.3
    }),
    '11:15': Object.freeze({
      nishita93: 26.8,
      nishita96: 18.7,
      preetham: 88.4,
      oneal: 49.8,
      haber: 15.2,
      bruneton: 11.1,
      elek: 11.1,
      hosek: 42.8,
      libradtran: 11.1
    }),
    '13:15': Object.freeze({
      nishita93: 28.0,
      nishita96: 17.4,
      preetham: 83.3,
      oneal: 48.4,
      haber: 14.9,
      bruneton: 11.0,
      elek: 11.0,
      hosek: 40.5,
      libradtran: 10.9
    })
  }),
  aggregate: Object.freeze({
    nishita93: 26.6,
    nishita96: 18.3,
    preetham: 88.1,
    oneal: 49.5,
    haber: 14.7,
    bruneton: 11.3,
    elek: 11.3,
    hosek: 41.5,
    // Section 3.4 reports 11.48 for the adopted coarse-grid fit. The
    // comparison output is displayed at the paper's one-decimal precision.
    libradtran: 11.5
  }),
  aggregateUnrounded: Object.freeze({
    libradtran: 11.48
  }),
  expectedRankingGroups: Object.freeze([
    Object.freeze(['bruneton', 'elek']),
    Object.freeze(['libradtran']),
    Object.freeze(['haber']),
    Object.freeze(['nishita96']),
    Object.freeze(['nishita93']),
    Object.freeze(['hosek']),
    Object.freeze(['oneal']),
    Object.freeze(['preetham'])
  ])
});

