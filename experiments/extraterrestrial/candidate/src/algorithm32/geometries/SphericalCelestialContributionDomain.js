import DistanceMath from '../utils/DistanceMath.js';
import VectorMath from '../utils/VectorMath.js';
import { normalizeDirection } from './geometryCoordinates.js';
import { CelestialContributionCacheController } from '../caches/celestial/CelestialContributionCacheController.js';

const FAMILY_ID = 'spherical-sun-stars-radial-v1';
const QUERY_CONTRACT_VERSION = 'spherical-celestial-query-v1';
const FINGERPRINT_VERSION = 'fnv1a64-canonical-json-v1';

function requireObject(value, label) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError(`${label} must be an object.`);
	}
	return value;
}

function requireIdentifier(value, label) {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new TypeError(`${label} must be a nonempty string.`);
	}
	return value;
}

function requireFinite(value, label) {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new TypeError(`${label} must be finite.`);
	}
	return value;
}

function freeze(value) {
	if (value && typeof value === 'object' && !Object.isFrozen(value)) {
		for (const child of Object.values(value)) {
			freeze(child);
		}
		Object.freeze(value);
	}
	return value;
}

function canonical(value) {
	if (Array.isArray(value)) {
		return value.map(canonical);
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
	}
	if (typeof value === 'number' && !Number.isFinite(value)) {
		throw new TypeError('Fingerprint input must contain only finite numbers.');
	}
	return value;
}

function fingerprint(value) {
	const text = JSON.stringify(canonical(value));
	let hash = 0xcbf29ce484222325n;
	for (const codePoint of text) {
		hash ^= BigInt(codePoint.codePointAt(0));
		hash = BigInt.asUintN(64, hash * 0x100000001b3n);
	}
	return `${FINGERPRINT_VERSION}:${hash.toString(16).padStart(16, '0')}`;
}

function matrix3(value, label) {
	if (!Array.isArray(value) || value.length !== 3 || value.some((row) => !Array.isArray(row) || row.length !== 3 || row.some((item) => !Number.isFinite(item)))) {
		throw new TypeError(`${label} must be a finite 3x3 matrix.`);
	}
	return value.map((row) => [...row]);
}

function matrixVector(matrix, vector) {
	return [
		matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
		matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
		matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2],
	];
}

function orderedNodes(value, minimum, maximum, label) {
	if (!Array.isArray(value) || value.length < 2) {
		throw new RangeError(`${label} must contain at least two nodes.`);
	}
	const nodes = value.map((node, index) => requireFinite(node, `${label}[${index}]`));
	if (nodes[0] !== minimum || nodes[nodes.length - 1] !== maximum || nodes.some((node, index) => node < minimum || node > maximum || (index > 0 && node <= nodes[index - 1]))) {
		throw new RangeError(`${label} must be strictly increasing and include both domain endpoints.`);
	}
	return nodes;
}

function bracket(nodes, value) {
	const tolerance = 128 * Number.EPSILON * Math.max(1, Math.abs(value), Math.abs(nodes[0]), Math.abs(nodes[nodes.length - 1]));
	if (value < nodes[0] - tolerance || value > nodes[nodes.length - 1] + tolerance) {
		return null;
	}
	for (let index = 0; index < nodes.length; index += 1) {
		if (Math.abs(nodes[index] - value) <= tolerance) return { indices: [index], weights: [1] };
	}
	let upper = 1;
	while (nodes[upper] < value) {
		upper += 1;
	}
	const lower = upper - 1;
	const weight = (value - nodes[lower]) / (nodes[upper] - nodes[lower]);
	return { indices: [lower, upper], weights: [1 - weight, weight] };
}

function readEpoch(value, expectedTimeScale, label) {
	const epoch = requireObject(value, label);
	if (epoch.units !== 'seconds' || epoch.timeScale !== expectedTimeScale) {
		throw new RangeError(`${label} must use the declared seconds time scale.`);
	}
	return freeze({ value: requireFinite(epoch.value, `${label}.value`), units: 'seconds', timeScale: expectedTimeScale });
}

function equalEpoch(left, right) {
	return left.value === right.value && left.units === right.units && left.timeScale === right.timeScale;
}

function diskFraction(elevationRadians, angularRadiusRadians) {
	if (elevationRadians >= angularRadiusRadians) return 1;
	if (elevationRadians <= -angularRadiusRadians) return 0;
	const normalized = elevationRadians / angularRadiusRadians;
	return (Math.acos(-normalized) + normalized * Math.sqrt(Math.max(0, 1 - normalized ** 2))) / Math.PI;
}

/** Geometry-owned first-family celestial transforms and `(h, u)` stencils. */
export default class SphericalCelestialContributionDomain {
	constructor(configuration) {
		const config = requireObject(configuration, 'Celestial contribution domain configuration');
		const groundRadiusMeters = DistanceMath.toMeters(config.bottomRadius);
		const topRadiusMeters = DistanceMath.toMeters(config.topRadius);
		if (!(groundRadiusMeters > 0) || !(topRadiusMeters > groundRadiusMeters)) {
			throw new RangeError('Celestial contribution domain requires concentric positive radii.');
		}
		const height = topRadiusMeters - groundRadiusMeters;
		const frames = requireObject(config.frames ?? {}, 'celestialContributionDomain.frames');
		this._configuration = freeze({
			familyId: config.familyId ?? FAMILY_ID,
			queryContractVersion: config.queryContractVersion ?? QUERY_CONTRACT_VERSION,
			groundRadiusMeters,
			topRadiusMeters,
			altitudeNodes: orderedNodes(config.altitudeNodes ?? [0, height], 0, height, 'celestialContributionDomain.altitudeNodes'),
			uNodes: orderedNodes(config.uNodes ?? [0, 1], 0, 1, 'celestialContributionDomain.uNodes'),
			frames: {
				celestialFrameId: requireIdentifier(frames.celestialFrameId ?? 'celestial-rh-v1', 'celestial frame id'),
				bodyFrameId: requireIdentifier(frames.bodyFrameId ?? 'body-fixed-rh-v1', 'body frame id'),
				modelFrameId: requireIdentifier(frames.modelFrameId ?? 'model-rh-v1', 'model frame id'),
				modelFromBody: matrix3(frames.modelFromBody ?? [[1, 0, 0], [0, 1, 0], [0, 0, 1]], 'modelFromBody'),
			},
			transformVersion: requireIdentifier(config.transformVersion ?? 'spherical-celestial-transform-v1', 'transformVersion'),
			pathSampleCount: Number.isSafeInteger(config.pathSampleCount ?? 32)
				&& (config.pathSampleCount ?? 32) >= 2
				? (config.pathSampleCount ?? 32)
				: (() => { throw new RangeError('celestialContributionDomain.pathSampleCount must be an integer of at least two.'); })(),
			horizonPolicy: 'analytic-concentric-sphere-v1',
		});
	}

	describe() {
		const config = this._configuration;
		return freeze({
			familyId: config.familyId,
			queryContractVersion: config.queryContractVersion,
			coordinateAxes: ['h', 'u'],
			altitudeNodesMeters: [...config.altitudeNodes],
			uNodes: [...config.uNodes],
			groundRadiusMeters: config.groundRadiusMeters,
			topRadiusMeters: config.topRadiusMeters,
			frames: config.frames,
			transformVersion: config.transformVersion,
			horizonPolicy: config.horizonPolicy,
		});
	}

	resolveCelestialSourcePlacement(sourceDefinition, placementState, observationState) {
		const source = requireObject(sourceDefinition, 'sourceDefinition');
		const placement = requireObject(placementState, 'placementState');
		const observation = this._normalizeObservation(observationState);
		const contract = requireObject(source.placementProviderContract, 'sourceDefinition.placementProviderContract');
		const sourceId = requireIdentifier(source.sourceId, 'sourceDefinition.sourceId');
		const sourceKind = source.sourceKind;
		if (sourceKind !== 'point' && sourceKind !== 'extended') throw new RangeError('sourceDefinition.sourceKind is unsupported.');
		if (source.placementKind !== 'infinite-direction' && source.placementKind !== 'distant-direction') throw new RangeError('sourceDefinition.placementKind is unsupported.');
		if (source.depth !== 'infinite' || placement.sourceId !== sourceId || placement.frameId !== contract.frameId || placement.frameId !== observation.celestialFrameId || placement.originConvention !== contract.originConvention || placement.directionConvention !== 'receiver-to-source' || contract.directionConvention !== 'receiver-to-source') {
			throw new RangeError('Celestial placement does not match its static named-frame contract.');
		}
		const epoch = readEpoch(placement.epoch, contract.timeScale, 'placementState.epoch');
		if (!equalEpoch(epoch, observation.epoch) || contract.frameId !== this._configuration.frames.celestialFrameId) {
			throw new RangeError('Celestial placement epoch or frame is incompatible with observation state.');
		}
		if (placement.placementProviderContractFingerprint !== source.placementProviderContractFingerprint) {
			throw new RangeError('Celestial placement provider contract fingerprint differs from source definition.');
		}
		const celestialDirection = normalizeDirection(placement.direction, 'placementState.direction');
		const bodyDirection = normalizeDirection(matrixVector(observation.bodyFromCelestial, celestialDirection), 'body-frame direction');
		const modelDirection = normalizeDirection(matrixVector(this._configuration.frames.modelFromBody, bodyDirection), 'model-frame direction');
		const support = this._resolveSupport(source, observation.receiverPositionModelMeters, modelDirection);
		return freeze({
			sourceId,
			sourceKind,
			sourceDefinitionFingerprint: requireIdentifier(source.sourceDefinitionFingerprint, 'sourceDefinition.sourceDefinitionFingerprint'),
			placementStateFingerprint: requireIdentifier(placement.placementStateFingerprint, 'placementState.placementStateFingerprint'),
			receiverPositionModelMeters: observation.receiverPositionModelMeters,
			directionToSourceModel: modelDirection,
			depth: 'infinite',
			angularSupport: support,
			transformFingerprint: fingerprint({ transformVersion: this._configuration.transformVersion, frames: this._configuration.frames, bodyFromCelestial: observation.bodyFromCelestial, epoch }),
		});
	}

	resolveCelestialBuildSample(fieldCoordinate, sourceRecord) {
		const coordinate = requireObject(fieldCoordinate, 'fieldCoordinate');
		const h = requireFinite(coordinate.h, 'fieldCoordinate.h');
		const u = requireFinite(coordinate.u, 'fieldCoordinate.u');
		if (bracket(this._configuration.altitudeNodes, h) === null || bracket(this._configuration.uNodes, u) === null) throw new RangeError('Build coordinate is outside the declared celestial domain.');
		const radius = this._configuration.groundRadiusMeters + h;
		const muHorizon = this._muHorizon(h);
		const mu = muHorizon + u * (1 - muHorizon);
		const tangent = Math.sqrt(Math.max(0, 1 - mu * mu));
		const direction = normalizeDirection([tangent, 0, mu], 'build directionToSource');
		const receiver = [0, 0, radius];
		return freeze({
			receiverPositionModelMeters: receiver,
			directionToSourceModel: direction,
			atmospherePath: this._topAtmospherePath(receiver, direction),
			stableVisibility: mu < muHorizon ? 'ground-horizon' : 'clear',
			sourceId: sourceRecord?.sourceId ?? null,
		});
	}

	resolveCelestialReceiverStencil(receiver) {
		const position = this._position(receiver, 'receiver');
		const h = this._normalizeAltitude(
			VectorMath.length(position) - this._configuration.groundRadiusMeters,
		);
		const hStencil = bracket(this._configuration.altitudeNodes, h);
		if (hStencil === null) return freeze({ classification: 'out-of-domain', contribution: 'zero', diagnostic: 'receiver altitude is outside the declared celestial domain.' });
		return freeze({ classification: 'valid', h, hStencil, receiverPositionModelMeters: position });
	}

	resolveCelestialDirectionStencil(receiver, directionToSource) {
		const receiverStencil = this.resolveCelestialReceiverStencil(receiver);
		if (receiverStencil.classification !== 'valid') return receiverStencil;
		const direction = normalizeDirection(directionToSource, 'directionToSource');
		const up = normalizeDirection(receiverStencil.receiverPositionModelMeters, 'receiver local up');
		const mu = VectorMath.dot(up, direction);
		const muHorizon = this._muHorizon(receiverStencil.h);
		if (mu < muHorizon) return freeze({ classification: 'ground-horizon', contribution: 'zero', h: receiverStencil.h, mu, muHorizon });
		const u = (mu - muHorizon) / (1 - muHorizon);
		const uStencil = bracket(this._configuration.uNodes, u);
		if (uStencil === null) return freeze({ classification: 'out-of-domain', contribution: 'zero', diagnostic: 'horizon-normalized coordinate is outside the declared celestial domain.' });
		return freeze({ classification: 'clear', h: receiverStencil.h, u, mu, muHorizon, hStencil: receiverStencil.hStencil, uStencil });
	}

	prepareCelestialContributionQuery(generationDescriptor, sourceDefinitions, placementStates, observationState) {
		const generation = requireObject(generationDescriptor, 'generationDescriptor');
		const sourceList = Array.isArray(sourceDefinitions) ? sourceDefinitions : (() => { throw new TypeError('sourceDefinitions must be an array.'); })();
		const placements = Array.isArray(placementStates) ? placementStates : (() => { throw new TypeError('placementStates must be an array.'); })();
		const observation = this._normalizeObservation(observationState);
		const definitions = new Map(sourceList.map((source) => [source.sourceId, source]));
		if (definitions.size !== sourceList.length || placements.length !== sourceList.length) throw new RangeError('Query requires exactly one unique placement for every static source definition.');
		const resolved = placements.map((placement) => {
			const source = definitions.get(placement?.sourceId);
			if (!source) throw new RangeError('Placement references an unknown source definition.');
			return this.resolveCelestialSourcePlacement(source, placement, observationState);
		}).sort((left, right) => left.sourceId.localeCompare(right.sourceId));
		const pointMembers = resolved.filter((entry) => entry.sourceKind === 'point').map((entry) => freeze({ ...entry, stencil: this.resolveCelestialDirectionStencil(entry.receiverPositionModelMeters, entry.directionToSourceModel) }));
		const sun = resolved.filter((entry) => entry.sourceKind === 'extended');
		if (sun.length !== 1) throw new RangeError('The first family requires exactly one distant extended Sun source.');
		const queryStateFingerprint = fingerprint({ generationId: generation.generationId, runtimeCompatibilityFingerprint: generation.runtimeCompatibilityFingerprint, epoch: observation.epoch, geographicReceiver: observation.geographicReceiver, placements: resolved.map((entry) => ({ sourceId: entry.sourceId, placementStateFingerprint: entry.placementStateFingerprint, transformFingerprint: entry.transformFingerprint })) });
		return freeze({
			generationId: requireIdentifier(generation.generationId, 'generationDescriptor.generationId'),
			runtimeCompatibilityFingerprint: requireIdentifier(generation.runtimeCompatibilityFingerprint, 'generationDescriptor.runtimeCompatibilityFingerprint'),
			queryStateFingerprint,
			receiverPositionModelMeters: observation.receiverPositionModelMeters,
			observationTransformFingerprint: fingerprint({ bodyFromCelestial: observation.bodyFromCelestial, geographicReceiver: observation.geographicReceiver, epoch: observation.epoch }),
			receiverStencilState: this.resolveCelestialReceiverStencil(observation.receiverPositionModelMeters),
			layerQueries: freeze({ starField: { members: pointMembers }, sun: { ...sun[0], stencil: this.resolveCelestialDirectionStencil(sun[0].receiverPositionModelMeters, sun[0].directionToSourceModel) } }),
		});
	}

	createCelestialContributionCacheController({ backend, scheduler = null } = {}) {
		return new CelestialContributionCacheController({
			geometry: { describeCelestialContributionDomain: () => this.describe() },
			backend,
			scheduler,
		});
	}

	_normalizeObservation(value) {
		const observation = requireObject(value, 'observationState');
		if (observation.celestialFrameId !== this._configuration.frames.celestialFrameId || observation.bodyFrameId !== this._configuration.frames.bodyFrameId || observation.modelFrameId !== this._configuration.frames.modelFrameId) throw new RangeError('Observation state frame identities are incompatible with geometry.');
		const epoch = readEpoch(observation.epoch, observation.timeScale, 'observationState.epoch');
		const receiver = requireObject(observation.geographicReceiver, 'observationState.geographicReceiver');
		const latitudeRadians = requireFinite(receiver.latitudeRadians, 'geographicReceiver.latitudeRadians');
		const longitudeRadians = requireFinite(receiver.longitudeRadians, 'geographicReceiver.longitudeRadians');
		if (latitudeRadians < -Math.PI / 2 || latitudeRadians > Math.PI / 2) throw new RangeError('geographicReceiver.latitudeRadians is outside [-pi/2, pi/2].');
		const altitudeMeters = DistanceMath.toMeters(receiver.altitude);
		const radius = this._configuration.groundRadiusMeters + altitudeMeters;
		const bodyPosition = [radius * Math.cos(latitudeRadians) * Math.cos(longitudeRadians), radius * Math.cos(latitudeRadians) * Math.sin(longitudeRadians), radius * Math.sin(latitudeRadians)];
		return freeze({
			celestialFrameId: observation.celestialFrameId,
			bodyFrameId: observation.bodyFrameId,
			modelFrameId: observation.modelFrameId,
			epoch,
			bodyFromCelestial: matrix3(observation.bodyFromCelestial, 'observationState.bodyFromCelestial'),
			geographicReceiver: { latitudeRadians, longitudeRadians, altitudeMeters },
			receiverPositionModelMeters: matrixVector(this._configuration.frames.modelFromBody, bodyPosition),
		});
	}

	_position(value, label) {
		if (Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)) return [...value];
		if (value?.coordinates) return DistanceMath.toMetersPosition(value);
		throw new TypeError(`${label} must be a model-meter tuple or Position.`);
	}

	_muHorizon(h) {
		const radius = this._configuration.groundRadiusMeters + h;
		return -Math.sqrt(Math.max(0, 1 - (this._configuration.groundRadiusMeters / radius) ** 2));
	}

	_normalizeAltitude(h) {
		const maximum = this._configuration.topRadiusMeters
			- this._configuration.groundRadiusMeters;
		const tolerance = 64 * Number.EPSILON
			* Math.max(1, this._configuration.groundRadiusMeters);
		if (h < 0 && h >= -tolerance) return 0;
		if (h > maximum && h <= maximum + tolerance) return maximum;
		return h;
	}

	_topAtmospherePath(receiver, direction) {
		const radius = VectorMath.length(receiver);
		const mu = VectorMath.dot(receiver, direction) / radius;
		const top = this._configuration.topRadiusMeters;
		const distance = -radius * mu + Math.sqrt(Math.max(0, radius * radius * (mu * mu - 1) + top * top));
		const samples = [];
		for (let index = 0; index <= this._configuration.pathSampleCount; index += 1) {
			const fraction = index / this._configuration.pathSampleCount;
			const position = [
				receiver[0] + direction[0] * distance * fraction,
				receiver[1] + direction[1] * distance * fraction,
				receiver[2] + direction[2] * distance * fraction,
			];
			const altitudeMeters = this._normalizeAltitude(
				VectorMath.length(position) - this._configuration.groundRadiusMeters,
			);
			samples.push({
				atmosphereCoordinate: { altitude: { value: altitudeMeters, units: 'meters' } },
				measure: { value: (distance / this._configuration.pathSampleCount) * (index === 0 || index === this._configuration.pathSampleCount ? 0.5 : 1), units: 'meters' },
			});
		}
		return freeze({ terminus: 'top-atmosphere', lengthMeters: distance, blockedByGround: false, samples });
	}

	_resolveSupport(source, receiver, direction) {
		if (source.sourceKind === 'point') return null;
		const support = requireObject(source.support, 'sourceDefinition.support');
		if (support.kind !== 'uniform-disk') throw new RangeError('The first family supports only a uniform-disk distant Sun.');
		const angularRadiusRadians = requireFinite(support.angularRadiusRadians, 'sourceDefinition.support.angularRadiusRadians');
		if (!(angularRadiusRadians > 0 && angularRadiusRadians < Math.PI / 2)) throw new RangeError('Uniform-disk angular radius must be in (0, pi/2).');
		const receiverPosition = this._position(receiver, 'support receiver');
		const h = this._normalizeAltitude(
			VectorMath.length(receiverPosition) - this._configuration.groundRadiusMeters,
		);
		const mu = VectorMath.dot(normalizeDirection(receiverPosition, 'support local up'), direction);
		const elevationRadians = Math.asin(Math.max(-1, Math.min(1, mu))) - Math.asin(this._muHorizon(h));
		const visibleFraction = diskFraction(elevationRadians, angularRadiusRadians);
		return freeze({ kind: 'uniform-disk', angularRadiusRadians, classification: visibleFraction === 1 ? 'full' : visibleFraction === 0 ? 'empty' : 'partial', visibleFraction });
	}
}
