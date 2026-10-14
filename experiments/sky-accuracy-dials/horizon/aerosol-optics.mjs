import assert from 'node:assert/strict';

/** Evaluate a normalized material phase table; no radiance cache is involved.
 * @param {HorizonAerosolPhaseTable} table @param {number} cosine @returns {number} Phase, sr^-1.
 */
export function aerosolPhase(table, cosine) {
    let low = 0, high = table.mu.length - 1;
    while (high - low > 1) {
        const middle = Math.floor((low + high) / 2);
        if (cosine >= table.mu[middle]) low = middle; else high = middle;
    }
    const fraction = Math.max(0, Math.min(1, (cosine - table.mu[low]) / (table.mu[high] - table.mu[low])));
    return ((1 - fraction) * table.pdf[low] + fraction * table.pdf[high]) / (2 * Math.PI);
}

/** Validate the retained physical phase representation without re-fitting it.
 * @param {HorizonAerosolPhaseTable} table @returns {number} Verified cosine-density mass.
 */
export function validateAerosolTable(table) {
    assert.equal(table.mu.length, 83); assert.equal(table.pdf.length, 83);
    assert.equal(table.mu[0], -1); assert.equal(table.mu.at(-1), 1);
    let mass = 0;
    for (let index = 1; index < table.mu.length; index++) {
        assert.ok(table.mu[index] > table.mu[index - 1]);
        mass += (table.mu[index] - table.mu[index - 1]) * (table.pdf[index] + table.pdf[index - 1]) / 2;
    }
    assert.ok(table.pdf.every(value => Number.isFinite(value) && value > 0));
    assert.ok(Math.abs(mass - 1) < 1e-12);
    return mass;
}

/** Material values at native centers; unsupported centers retain baseline behavior.
 * @param {HorizonAerosolBand[]} bands @param {number[]} wavelengths @param {number} baselineAlbedo
 * @returns {HorizonAerosolMaterial} Supported-band controls, with no shortwave extrapolation.
 */
export function aerosolMaterial(bands, wavelengths, baselineAlbedo) {
    bands.forEach(band => {validateAerosolTable(band); assert.ok(band.albedo > 0 && band.albedo <= 1);});
    /** @type {HorizonAerosolMaterial} */
    const result = {phaseTables: [], albedos: [], changedChannels: [], unsupportedCenters: []};
    wavelengths.forEach((wavelength, channel) => {
        if (wavelength < bands[0].wavelength) {
            result.phaseTables.push(null); result.albedos.push(baselineAlbedo); result.unsupportedCenters.push(wavelength); return;
        }
        const index = bands.findIndex((band, at) => at < bands.length - 1 && wavelength >= band.wavelength && wavelength <= bands[at + 1].wavelength);
        assert.ok(index >= 0, 'Native wavelength outside retained measured bands.');
        const low = bands[index], high = bands[index + 1], fraction = (wavelength - low.wavelength) / (high.wavelength - low.wavelength);
        assert.deepEqual(low.mu, high.mu);
        const table = {mu: [...low.mu], pdf: low.pdf.map((value, angle) => (1 - fraction) * value + fraction * high.pdf[angle])};
        validateAerosolTable(table);
        result.phaseTables.push(table); result.albedos.push((1 - fraction) * low.albedo + fraction * high.albedo); result.changedChannels.push(channel);
    });
    return result;
}
