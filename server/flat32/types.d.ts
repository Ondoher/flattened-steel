/** App mount facts supplied by Polylith to the server router. */
type Flat32ServerApplication = {
	/** Effective mount, including composed deployment selection. */ getRouterRoot(): string;
};

/** Router capability consumed by the app's composition boundary. */
type Flat32RouterContribution = {
	/** Install this capability's transport endpoints after readiness. */
	routes(expressApplication: unknown, router: Flat32HttpRouter, application: Flat32ServerApplication): void;
};

/** HTTP ingress values consumed by the app's route adapters. */
type Flat32HttpRequest = {
	/** Decoded transport query; adapters validate supported keys and values. */ query: Record<string, unknown>;
	/** Decoded route captures, including wildcard capture zero. */ params: Record<string, string>;
};

/** Express response operations used by the adapters and stream piping. */
interface Flat32HttpResponse extends NodeJS.WritableStream {
	/** Whether the response body has already started. */ readonly headersSent: boolean;
	/** Close a partially transmitted response after a stream failure. */ destroy(): void;
	/** Set the HTTP response status. */ status(code: number): Flat32HttpResponse;
	/** Set explicit transport headers. */ set(headers: Record<string, string>): Flat32HttpResponse;
	/** Send complete JSON text or authenticated binary bytes. */ send(body: unknown): unknown;
}

/** Host continuation for unexpected transport/stream failures. */
type Flat32HttpNext = (error?: unknown) => void;

/** App-scoped route registration supplied by the host. */
type Flat32HttpRouter = {
	/** Register an app-relative GET handler. */ get(
		path: string,
		handler: (request: Flat32HttpRequest, response: Flat32HttpResponse, next: Flat32HttpNext) => unknown,
	): unknown;
};

/** Authenticated local file identity, private to package-serving owners. */
type Flat32PackageFile = {
	/** Real filesystem path retained inside server feature ownership. */ path: string;
	/** Exact file byte length. */ byteLength: number;
};

/** Open asset stream with transport-neutral content facts. */
type Flat32ServedStream = {
	/** Feature-owned readable stream; the adapter pipes it to the response. */ stream: Flat32AssetStream;
	/** Exact file byte length. */ byteLength: number;
	/** Media type derived from the admitted filename. */ contentType: string;
};

/** Readable asset resource released when its response closes. */
interface Flat32AssetStream extends NodeJS.ReadableStream {
	/** Release the file resource, including after client disconnection. */ destroy(): void;
}

/** Stellar package manifest admitted by the catalog feature. */
type Flat32StellarManifest = {
	/** Exact production package schema identity. */ schemaId: string;
	/** Exact selected catalog package identity. */ packageId: string;
	/** Retained artifact declarations keyed by source identity. */ artifacts?: Record<
		string,
		{
			/** Contained relative file path. */ path: string;
			/** Expected file byte length. */ byteLength: number;
		}
	>;
};
