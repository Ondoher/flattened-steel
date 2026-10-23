import assert from 'node:assert/strict';

/** Read fixed-size CDF-1 numeric fields without allocating complete optical cubes. */
export function readCdf(bytes) {
	assert.equal(bytes.subarray(0, 4).toString('hex'), '43444601');
	let at = 4;
	const size = (type) => ({1: 1, 2: 1, 3: 2, 4: 4, 5: 4, 6: 8})[type];
	const uint = () => {
		const n = bytes.readUInt32BE(at);
		at += 4;
		return n;
	};
	const name = () => {
		const n = uint(),
			s = bytes.subarray(at, at + n).toString();
		at += Math.ceil(n / 4) * 4;
		return s;
	};
	const attributes = () => {
		const tag = uint(),
			count = uint();
		assert.ok(tag === 0 || tag === 12);
		for (let i = 0; i < count; i++) {
			name();
			const type = uint(),
				n = uint();
			assert.ok(size(type));
			at += Math.ceil((size(type) * n) / 4) * 4;
		}
	};
	assert.equal(uint(), 0);
	assert.equal(uint(), 10);
	const n = uint(),
		dimensions = Array.from({length: n}, () => ({name: name(), count: uint()}));
	attributes();
	assert.equal(uint(), 11);
	const count = uint(),
		fields = new Map();
	for (let i = 0; i < count; i++) {
		const key = name(),
			nd = uint(),
			dims = Array.from({length: nd}, () => dimensions[uint()]);
		attributes();
		const type = uint(),
			length = uint(),
			offset = uint();
		assert.equal(length, Math.ceil((dims.reduce((v, d) => v * d.count, 1) * size(type)) / 4) * 4);
		assert.ok(offset + length <= bytes.length);
		fields.set(key, {dims, type, length, offset});
	}
	const value = (key, ...indices) => {
		const f = fields.get(key);
		assert.ok(f);
		assert.equal(indices.length, f.dims.length);
		let index = 0;
		indices.forEach((j, i) => {
			assert.ok(j >= 0 && j < f.dims[i].count);
			index = index * f.dims[i].count + j;
		});
		const p = f.offset + index * size(f.type);
		return f.type === 6 ? bytes.readDoubleBE(p) : f.type === 5 ? bytes.readFloatBE(p) : bytes.readInt32BE(p);
	};
	return {dimensions, fields, value};
}

/** Encode fixed-size CDF-1 fields for the installed scalar optical-table reader. */
export function writeCdf(dimensions, variables) {
	const uint = (n) => {
		const b = Buffer.alloc(4);
		b.writeUInt32BE(n);
		return b;
	};
	const pad = (b) => Buffer.concat([b, Buffer.alloc((4 - (b.length % 4)) % 4)]);
	const name = (s) => Buffer.concat([uint(Buffer.byteLength(s)), pad(Buffer.from(s))]);
	const names = Object.keys(dimensions);
	const dims = Buffer.concat([uint(10), uint(names.length), ...names.flatMap((s) => [name(s), uint(dimensions[s])])]);
	const attributes = Buffer.concat([uint(12), uint(1), name('version'), uint(4), uint(1), uint(20110101)]);
	const data = variables.map((v) => {
		assert.equal(
			v.values.length,
			v.dims.reduce((n, d) => n * dimensions[d], 1),
		);
		assert.ok([4, 5, 6].includes(v.type));
		const b = Buffer.alloc(v.values.length * (v.type === 6 ? 8 : 4));
		v.values.forEach((x, i) => {
			assert.ok(Number.isFinite(x));
			if (v.type === 6) b.writeDoubleBE(x, i * 8);
			else if (v.type === 5) b.writeFloatBE(x, i * 4);
			else b.writeInt32BE(x, i * 4);
		});
		return pad(b);
	});
	const header = (offset) => {
		let cursor = offset;
		return Buffer.concat([
			Buffer.from([67, 68, 70, 1]),
			uint(0),
			dims,
			attributes,
			uint(11),
			uint(variables.length),
			...variables.map((v, i) => {
				const b = Buffer.concat([
					name(v.name),
					uint(v.dims.length),
					...v.dims.map((d) => uint(names.indexOf(d))),
					uint(0),
					uint(0),
					uint(v.type),
					uint(data[i].length),
					uint(cursor),
				]);
				cursor += data[i].length;
				return b;
			}),
		]);
	};
	return Buffer.concat([header(header(0).length), ...data]);
}
