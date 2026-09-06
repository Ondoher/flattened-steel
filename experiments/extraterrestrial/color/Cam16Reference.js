const CAT16 = [
	[0.401288, 0.650173, -0.051461],
	[-0.250268, 1.204414, 0.045854],
	[-0.002079, 0.048952, 0.953127],
];
const CAT16_INVERSE = [
	[1.862067855087233, -1.011254630531685, 0.1491867754444518],
	[0.3875265432361372, 0.6214474419314753, -0.0089739851676125],
	[-0.01584149884933386, -0.03412293802851557, 1.049964436877849],
];

export const CAM16_DIM_SURROUND = Object.freeze({ F: 0.9, c: 0.59, Nc: 0.9 });

function requireCondition(value, message) { if (!value) throw new Error(message); }
function multiply(matrix, vector) { return matrix.map((row) => row.reduce((sum, coefficient, index) => sum + coefficient * vector[index], 0)); }
function compress(value, FL) {
	const powered = (FL * Math.abs(value) / 100) ** 0.42;
	return Math.sign(value) * 400 * powered / (powered + 27.13) + 0.1;
}

/** Expose the exact CAT16-domain receptor-response control used by CAM16. */
export function cam16ReceptorResponse({ xyz, whiteXyz, adaptingLuminanceCdPerSquareMeter, backgroundRelativeY, surround = CAM16_DIM_SURROUND, discountIlluminant = false }) {
	requireCondition([xyz, whiteXyz].every((value) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)), 'CAM16 receptor control requires finite XYZ triplets.');
	const state = viewingState({ whiteXyz, adaptingLuminanceCdPerSquareMeter, backgroundRelativeY, surround, discountIlluminant });
	const rawCat16 = multiply(CAT16, xyz); const adaptedCat16 = rawCat16.map((value, index) => state.degree[index] * value); const compressedCat16 = adaptedCat16.map((value) => compress(value, state.FL));
	return { rawCat16, adaptedCat16, compressedCat16, viewingState: state };
}

function viewingState({ whiteXyz, adaptingLuminanceCdPerSquareMeter, backgroundRelativeY, surround, discountIlluminant = false }) {
	const LA = adaptingLuminanceCdPerSquareMeter;
	const Yw = whiteXyz[1];
	const n = backgroundRelativeY / Yw;
	const k = 1 / (5 * LA + 1);
	const k4 = k ** 4;
	const FL = 0.2 * k4 * 5 * LA + 0.1 * (1 - k4) ** 2 * (5 * LA) ** (1 / 3);
	const Nbb = 0.725 * (1 / n) ** 0.2;
	const z = 1.48 + Math.sqrt(n);
	const D = discountIlluminant ? 1 : Math.max(0, Math.min(1, surround.F * (1 - Math.exp((-LA - 42) / 92) / 3.6)));
	const rgbWhite = multiply(CAT16, whiteXyz);
	const degree = rgbWhite.map((value) => D * Yw / value + 1 - D);
	const adaptedWhite = rgbWhite.map((value, index) => degree[index] * value).map((value) => compress(value, FL));
	const Aw = (2 * adaptedWhite[0] + adaptedWhite[1] + 0.05 * adaptedWhite[2] - 0.305) * Nbb;
	return { LA, Yw, n, FL, Nbb, Ncb: Nbb, z, D, degree, Aw };
}

/** Binary64 forward CIECAM16 following Li et al. 2017 equations. */
export function forwardCam16({ xyz, whiteXyz, adaptingLuminanceCdPerSquareMeter, backgroundRelativeY, surround = CAM16_DIM_SURROUND, discountIlluminant = false }) {
	requireCondition([xyz, whiteXyz].every((value) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)), 'CAM16 requires finite XYZ triplets.');
	requireCondition(xyz[1] >= 0 && whiteXyz[1] > 0, 'CAM16 requires nonnegative sample Y and positive white Y.');
	requireCondition(Number.isFinite(adaptingLuminanceCdPerSquareMeter) && adaptingLuminanceCdPerSquareMeter > 0, 'CAM16 requires positive adapting luminance.');
	requireCondition(Number.isFinite(backgroundRelativeY) && backgroundRelativeY > 0, 'CAM16 requires positive background relative Y.');
	const state = viewingState({ whiteXyz, adaptingLuminanceCdPerSquareMeter, backgroundRelativeY, surround, discountIlluminant });
	const rgb = multiply(CAT16, xyz);
	const adapted = rgb.map((value, index) => state.degree[index] * value).map((value) => compress(value, state.FL));
	const a = adapted[0] - 12 * adapted[1] / 11 + adapted[2] / 11;
	const b = (adapted[0] + adapted[1] - 2 * adapted[2]) / 9;
	const hueRadians = Math.atan2(b, a);
	const h = (hueRadians * 180 / Math.PI + 360) % 360;
	const et = 0.25 * (Math.cos(hueRadians + 2) + 3.8);
	const A = (2 * adapted[0] + adapted[1] + 0.05 * adapted[2] - 0.305) * state.Nbb;
	const J = A <= 0 || state.Aw <= 0 ? 0 : 100 * (A / state.Aw) ** (surround.c * state.z);
	const denominator = adapted[0] + adapted[1] + 21 * adapted[2] / 20;
	const t = denominator === 0 ? 0 : (50000 / 13) * surround.Nc * state.Ncb * et * Math.hypot(a, b) / denominator;
	const alpha = Math.max(0, t) ** 0.9 * (1.64 - 0.29 ** state.n) ** 0.73;
	const C = alpha * Math.sqrt(J / 100);
	const M = C * state.FL ** 0.25;
	const Q = (4 / surround.c) * Math.sqrt(J / 100) * (state.Aw + 4) * state.FL ** 0.25;
	return { J, Q, C, M, h, s: Q > 0 ? 100 * Math.sqrt(M / Q) : 0, viewingState: state };
}

function uncompress(value, FL) {
	const shifted = value - 0.1;
	const magnitude = Math.min(399.999999999, Math.abs(shifted));
	return Math.sign(shifted) * 100 / FL * (27.13 * magnitude / (400 - magnitude)) ** (1 / 0.42);
}

/** Binary64 inverse CIECAM16 from brightness Q, colorfulness M, and hue h. */
export function inverseCam16Qmh({ Q, M, h, whiteXyz, adaptingLuminanceCdPerSquareMeter, backgroundRelativeY, surround = CAM16_DIM_SURROUND, discountIlluminant = false }) {
	requireCondition([Q, M, h, adaptingLuminanceCdPerSquareMeter, backgroundRelativeY].every(Number.isFinite), 'Inverse CAM16 requires finite Q, M, h, L_A, and Y_b.');
	requireCondition(Q >= 0 && M >= 0 && adaptingLuminanceCdPerSquareMeter > 0 && backgroundRelativeY > 0, 'Inverse CAM16 requires nonnegative correlates and positive viewing inputs.');
	if (Q === 0) return { xyz: [0, 0, 0], J: 0, C: 0, h: (h % 360 + 360) % 360 };
	const state = viewingState({ whiteXyz, adaptingLuminanceCdPerSquareMeter, backgroundRelativeY, surround, discountIlluminant });
	const brightnessScale = (4 / surround.c) * (state.Aw + 4) * state.FL ** 0.25;
	const J = 100 * (Q / brightnessScale) ** 2;
	const C = M / state.FL ** 0.25;
	const sqrtJ = Math.sqrt(J / 100);
	const alpha = sqrtJ > 0 ? C / sqrtJ : 0;
	const t = alpha <= 0 ? 0 : (alpha / (1.64 - 0.29 ** state.n) ** 0.73) ** (1 / 0.9);
	const A = state.Aw * (J / 100) ** (1 / (surround.c * state.z));
	const p2 = A / state.Nbb + 0.305;
	let a = 0; let b = 0;
	if (t > 0) {
		const hueRadians = h * Math.PI / 180;
		const sine = Math.sin(hueRadians); const cosine = Math.cos(hueRadians);
		const et = 0.25 * (Math.cos(hueRadians + 2) + 3.8);
		const p1 = (50000 / 13) * surround.Nc * state.Ncb * et / t;
		const p3 = 21 / 20;
		if (Math.abs(sine) >= Math.abs(cosine)) {
			const ratio = cosine / sine;
			b = p2 * (2 + p3) * (460 / 1403) / (p1 / sine + (2 + p3) * (220 / 1403) * ratio - 27 / 1403 + p3 * 6300 / 1403);
			a = b * ratio;
		} else {
			const ratio = sine / cosine;
			a = p2 * (2 + p3) * (460 / 1403) / (p1 / cosine + (2 + p3) * (220 / 1403) - (27 / 1403 - p3 * 6300 / 1403) * ratio);
			b = a * ratio;
		}
	}
	const adapted = [
		(460 * p2 + 451 * a + 288 * b) / 1403,
		(460 * p2 - 891 * a - 261 * b) / 1403,
		(460 * p2 - 220 * a - 6300 * b) / 1403,
	];
	const rgb = adapted.map((value, index) => uncompress(value, state.FL) / state.degree[index]);
	return { xyz: multiply(CAT16_INVERSE, rgb), J, C, h: (h % 360 + 360) % 360 };
}

/** Scalar expansion used as an internal formulation check, not the independent external oracle. */
export function forwardCam16ScalarCheck(request) {
	const [X, Y, Z] = request.xyz; const [Xw, Yw, Zw] = request.whiteXyz;
	const cone = (x, y, z) => [0.401288*x+0.650173*y-0.051461*z,-0.250268*x+1.204414*y+0.045854*z,-0.002079*x+0.048952*y+0.953127*z];
	const rgbW = cone(Xw,Yw,Zw); const LA=request.adaptingLuminanceCdPerSquareMeter; const n=request.backgroundRelativeY/Yw; const k=1/(5*LA+1); const FL=0.2*k**4*5*LA+0.1*(1-k**4)**2*(5*LA)**(1/3); const Nbb=0.725*(1/n)**0.2; const z=1.48+Math.sqrt(n); const surround=request.surround??CAM16_DIM_SURROUND; const D=request.discountIlluminant?1:Math.max(0,Math.min(1,surround.F*(1-Math.exp((-LA-42)/92)/3.6))); const degree=rgbW.map(v=>D*Yw/v+1-D); const response=(v)=>{const p=(FL*Math.abs(v)/100)**0.42;return Math.sign(v)*400*p/(p+27.13)+0.1;}; const awc=rgbW.map((v,i)=>response(v*degree[i])); const Aw=(2*awc[0]+awc[1]+0.05*awc[2]-0.305)*Nbb; const rgb=cone(X,Y,Z).map((v,i)=>response(v*degree[i])); const a=rgb[0]-12*rgb[1]/11+rgb[2]/11; const b=(rgb[0]+rgb[1]-2*rgb[2])/9; const hr=Math.atan2(b,a); const h=(hr*180/Math.PI+360)%360; const A=(2*rgb[0]+rgb[1]+0.05*rgb[2]-0.305)*Nbb; const J=A<=0?0:100*(A/Aw)**(surround.c*z); const et=0.25*(Math.cos(hr+2)+3.8); const denominator=rgb[0]+rgb[1]+21*rgb[2]/20; const t=denominator===0?0:(50000/13)*surround.Nc*Nbb*et*Math.hypot(a,b)/denominator; const alpha=Math.max(0,t)**0.9*(1.64-0.29**n)**0.73; const C=alpha*Math.sqrt(J/100); const M=C*FL**0.25; const Q=(4/surround.c)*Math.sqrt(J/100)*(Aw+4)*FL**0.25;
	return { J,Q,C,M,h,s:Q>0?100*Math.sqrt(M/Q):0 };
}
