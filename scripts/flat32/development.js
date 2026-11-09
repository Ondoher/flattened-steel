/**
 * Development-only entry to the installed Polylith CLI for Flat32 build, test and serving.
 */
if (process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production') {
	throw new Error('Flat32 is a local integration test bed and cannot run in production.');
}

process.env.NODE_ENV = 'development';
await import('polylith/bin/polylith.js');
