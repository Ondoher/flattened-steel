import {bands, mean} from './analysis.mjs';

/** Standard-library line plots of fixed spectral bands and retained angular cells.
 * @param {ReturnType<import('./analysis.mjs').analyze>} analysis
 * @param {DialFileIdentity} source
 * @returns {SkyClosurePlotRequest[]}
 */
export function plots(analysis, source) {
	return ['control', 'shared'].flatMap((name) =>
		['raw', 'centered'].map((mode) => {
			const table = mode === 'raw' ? analysis.raw : analysis.centeredBins;
			return {
				name: `angular-${name}-${mode}.png`,
				title: `${name === 'control' ? 'Experiment control' : 'Mean of Bruneton and libRadtran'}: ${mode} residual`,
				description:
					mode === 'raw'
						? 'Retained predictions minus Kider; Sun separation >=20 degrees'
						: 'Subtract each time/elevation/wavelength mean; Sun separation >=20 degrees',
				xLabel: 'Angle from Sun (degrees; bin mean)',
				yLabel: 'Signed spectral residual (mW m^-2 sr^-1 nm^-1)',
				kind: 'line',
				series: bands.map((band) => {
					const points = analysis.coverage
						.filter(
							(c) =>
								c.bin > 0 &&
								table.some(
									(r) => r.name === name && r.bin === c.bin && band.channels.includes(r.channel),
								),
						)
						.map((c) => ({
							x: table.find((r) => r.name === name && r.bin === c.bin).meanAngle,
							y: mean(
								table
									.filter(
										(r) => r.name === name && r.bin === c.bin && band.channels.includes(r.channel),
									)
									.map((r) => r.bias),
							),
						}));
					return {
						label: `${band.name} (${band.channels.length} wavelengths)`,
						x: points.map((p) => p.x),
						y: points.map((p) => p.y),
					};
				}),
				sources: [source],
				scope: '17 times; 81 original directions; 31 scoring wavelengths; retained data only',
				caption:
					'Positive means model too bright. Angular bins have unequal coverage; see coverage table. Lines connect bin averages, not phase-function estimates.',
				provenance: {name, mode, coverage: analysis.coverage},
			};
		}),
	);
}
