#!/usr/bin/env node

import {createHash} from 'node:crypto';

import {loadKiderDataset} from '../../experiments/b1-directional-sky-radiance/benchmark.js';
import {
	BRUNETON_OZONE_B1_CANDIDATE_LABEL,
	BRUNETON_OZONE_B1_FIBONACCI34_CANDIDATE_LABEL,
	BRUNETON_OZONE_B1_FIBONACCI34_PROFILE_FAMILY,
	BRUNETON_OZONE_B1_PHYSICAL_PROFILE_ID,
	BRUNETON_OZONE_B1_PROFILE_FAMILY,
	createBrunetonProductionProfile,
} from './BrunetonOzoneB1Profile.js';
import {OzoneB1ProductionGpuHost} from './OzoneB1ProductionGpuHost.js';

const VARIANTS = Object.freeze([
	{
		id: 'reflection-completed-ordinary-68',
		domainId: 'b1-reflection-completed-ordinary-fibonacci-68-v1',
		directionCount: 68,
		profileFamily: BRUNETON_OZONE_B1_PROFILE_FAMILY,
		candidateLabel: BRUNETON_OZONE_B1_CANDIDATE_LABEL,
	},
	{
		id: 'ordinary-fibonacci-34',
		domainId: 'algorithm32-fibonacci-34-incoming-v1',
		directionCount: 34,
		profileFamily: BRUNETON_OZONE_B1_FIBONACCI34_PROFILE_FAMILY,
		candidateLabel: BRUNETON_OZONE_B1_FIBONACCI34_CANDIDATE_LABEL,
	},
]);

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function sha256(text) {
	return createHash('sha256').update(text).digest('hex');
}

function assertHostDocument(document, variant) {
	requireCondition(
		document.includes(`const configuredIncomingDirectionVariant = ${JSON.stringify(variant.id)};`),
		`${variant.id}: browser entry does not embed the exact configured variant.`,
	);
	requireCondition(
		document.includes('globalThis.algorithm32B1OzoneProfilePresence'),
		`${variant.id}: browser entry omits the profile-presence control.`,
	);
	requireCondition(
		document.includes('request.incomingDirectionVariant !== configuredIncomingDirectionVariant'),
		`${variant.id}: browser entry omits the request-variant guard.`,
	);
}

function main() {
	const dataset = loadKiderDataset();
	const profiles = [];
	for (const variant of VARIANTS) {
		const conditionProfiles = dataset.conditions.map((condition) =>
			createBrunetonProductionProfile({
				time: condition.time,
				fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
				maximumScatteringOrder: 4,
				incomingDirectionVariant: variant.id,
			}),
		);
		requireCondition(conditionProfiles.length === 17, `${variant.id}: incomplete B1 profile set.`);
		for (const profile of conditionProfiles) {
			requireCondition(
				profile.models.atmosphere.constants.ozoneAbsorptionEnabled === true,
				`${profile.id}: ozone is disabled.`,
			);
			requireCondition(
				profile.domains.incomingDirections.id === variant.domainId
					&& profile.domains.incomingDirections.directionCount === variant.directionCount,
				`${profile.id}: incoming-direction controls differ from ${variant.id}.`,
			);
			requireCondition(
				profile.domains.positions.count === 48
					&& profile.domains.outgoingDirections.directionCount === 4374
					&& profile.numerical.viewPath.intervalCount === 40
					&& profile.numerical.sourcePathTransmittance.intervalCount === 20
					&& profile.numerical.cacheConstruction.transportIntervalCount === 40
					&& profile.numerical.cacheConstruction.maximumScatteringOrder === 4,
				`${profile.id}: fixed B1 numerical controls changed.`,
			);
			requireCondition(
				/^sha256:[0-9a-f]{64}$/u.test(profile.contentHash),
				`${profile.id}: invalid profile content hash.`,
			);
		}
		profiles.push({
			variant: variant.id,
			domainId: variant.domainId,
			directionCount: variant.directionCount,
			profileFamily: variant.profileFamily,
			candidateLabel: variant.candidateLabel,
			conditionCount: conditionProfiles.length,
			firstProfileContentHash: conditionProfiles[0].contentHash,
			lastProfileContentHash: conditionProfiles.at(-1).contentHash,
		});
	}

	const defaultHost = new OzoneB1ProductionGpuHost();
	const explicitF68Host = new OzoneB1ProductionGpuHost({
		incomingDirectionVariant: VARIANTS[0].id,
	});
	const f34Host = new OzoneB1ProductionGpuHost({
		incomingDirectionVariant: VARIANTS[1].id,
	});
	const defaultDocument = defaultHost._entryDocument();
	const explicitF68Document = explicitF68Host._entryDocument();
	const f34Document = f34Host._entryDocument();
	requireCondition(
		defaultDocument === explicitF68Document,
		'Default ozone host no longer preserves explicit F68 behavior.',
	);
	assertHostDocument(defaultDocument, VARIANTS[0]);
	assertHostDocument(f34Document, VARIANTS[1]);
	requireCondition(
		!f34Document.includes(VARIANTS[0].id),
		'F34 browser entry retains the F68 probe variant.',
	);

	for (const construct of [
		() => createBrunetonProductionProfile({
			time: '10:15',
			fittedAzimuthDegrees: 0,
			maximumScatteringOrder: 4,
			incomingDirectionVariant: 'production-68',
		}),
		() => new OzoneB1ProductionGpuHost({incomingDirectionVariant: 'production-68'}),
	]) {
		let rejected = false;
		try {
			construct();
		} catch (error) {
			rejected = error instanceof RangeError;
		}
		requireCondition(rejected, 'Unsupported ozone B1 variant was accepted.');
	}

	process.stdout.write(`${JSON.stringify({
		schemaId: 'contained-b1-ozone-profile-host-audit-v1',
		status: 'passed',
		physicalProfileId: BRUNETON_OZONE_B1_PHYSICAL_PROFILE_ID,
		profiles,
		hosts: {
			defaultVariant: VARIANTS[0].id,
			defaultDocumentSha256: sha256(defaultDocument),
			fibonacci34Variant: VARIANTS[1].id,
			fibonacci34DocumentSha256: sha256(f34Document),
		},
	}, null, 2)}\n`);
}

main();
