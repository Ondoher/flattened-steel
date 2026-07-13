/**
 * Compile and evaluate one relative three-channel spectral camera profile.
 * The helper owns no exposure, clipping, white balance selection, or display look.
 */

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

export function integratePiecewiseLinear(wavelengths, values, lower, upper) {
	requireCondition(wavelengths.length === values.length && wavelengths.length >= 2, 'A sampled curve is invalid.');
	const sample = (wavelength) => {
		if (wavelength <= wavelengths[0]) return values[0];
		if (wavelength >= wavelengths.at(-1)) return values.at(-1);
		let low = 0;
		let high = wavelengths.length - 1;
		while (high - low > 1) {
			const middle = Math.floor((low + high) / 2);
			if (wavelengths[middle] <= wavelength) low = middle;
			else high = middle;
		}
		const fraction = (wavelength - wavelengths[low]) / (wavelengths[high] - wavelengths[low]);
		return values[low] + fraction * (values[high] - values[low]);
	};
	const points = [lower];
	for (const wavelength of wavelengths) if (wavelength > lower && wavelength < upper) points.push(wavelength);
	points.push(upper);
	let integral = 0;
	for (let index = 1; index < points.length; index += 1) {
		const left = points[index - 1];
		const right = points[index];
		integral += (right - left) * (sample(left) + sample(right)) / 2;
	}
	return integral;
}

export function compileNativeWeights(wavelengths, rows, nativeBins) {
	return rows.map((row) => nativeBins.map((channel) => integratePiecewiseLinear(
		wavelengths,
		row,
		channel.centerNanometers - channel.widthNanometers / 2,
		channel.centerNanometers + channel.widthNanometers / 2,
	)));
}

export function multiplyMatrixVector(matrix, vector) {
	return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

function invert3(matrix) {
	const [[a,b,c],[d,e,f],[g,h,i]] = matrix;
	const A=e*i-f*h, B=c*h-b*i, C=b*f-c*e;
	const D=f*g-d*i, E=a*i-c*g, F=c*d-a*f;
	const G=d*h-e*g, H=b*g-a*h, I=a*e-b*d;
	const determinant=a*A+b*D+c*G;
	requireCondition(Number.isFinite(determinant) && Math.abs(determinant) > 1e-18, 'The camera normal matrix is singular.');
	return [[A,B,C],[D,E,F],[G,H,I]].map((row)=>row.map((value)=>value/determinant));
}

export function fitSensorToXyz(cameraRows, xyzRows, trainingIndices) {
	const ata=Array.from({length:3},()=>Array(3).fill(0));
	const aty=Array.from({length:3},()=>Array(3).fill(0));
	for(const index of trainingIndices){
		const camera=cameraRows[index]; const xyz=xyzRows[index];
		for(let row=0;row<3;row+=1)for(let column=0;column<3;column+=1){
			ata[row][column]+=camera[row]*camera[column];
			aty[row][column]+=camera[row]*xyz[column];
		}
	}
	const fittedColumns=Array.from({length:3},(_,row)=>Array.from({length:3},(_,column)=>
		invert3(ata)[row].reduce((sum,value,index)=>sum+value*aty[index][column],0)));
	return Array.from({length:3},(_,row)=>Array.from({length:3},(_,column)=>fittedColumns[column][row]));
}

export function projectSpectrum(weights, spectrum) {
	requireCondition(weights.length === 3 && spectrum.length === weights[0].length, 'Camera projection dimensions do not match.');
	return weights.map((row) => row.reduce((sum, value, index) => sum + value * spectrum[index], 0));
}

export function normalizedTriplet(values) {
	const sum = values.reduce((total, value) => total + value, 0);
	return sum > 0 ? values.map((value) => value / sum) : [0, 0, 0];
}
