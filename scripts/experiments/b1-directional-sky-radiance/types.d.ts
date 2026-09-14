/** Incoming quadrature selection for the independent production B1 profile.
 * - **"production-68"** - Reflection-completed production F68 quadrature and Q30 view.
 * - **"ordinary-fibonacci-34"** - Ordinary F34 diagnostic quadrature.
 * - **"bruneton-angular-288"** - Bruneton angular grid with 288 directions.
 * - **"bruneton-angular-392"** - Bruneton angular grid with 392 directions.
 * - **"bruneton-angular-512"** - Bruneton angular grid with 512 directions.
 * - **"paired-fibonacci-272"** - Paired Fibonacci diagnostic with 272 directions.
 * - **"paired-fibonacci-544"** - Paired Fibonacci diagnostic with 544 directions.
 * - **"reflection-completed-ordinary-68"** - Reflected ordinary Fibonacci diagnostic with 68 directions.
 * - **"reflection-completed-136"** - Reflection-completed diagnostic with 136 directions.
 */
type B1IncomingDirectionVariant =
	| 'production-68'
	| 'ordinary-fibonacci-34'
	| 'bruneton-angular-288'
	| 'bruneton-angular-392'
	| 'bruneton-angular-512'
	| 'paired-fibonacci-272'
	| 'paired-fibonacci-544'
	| 'reflection-completed-ordinary-68'
	| 'reflection-completed-136';

/** Production B1 profile construction options; defaults retain the original Native48/F68/Direct40/N4 profile.
 * Native51 changes only the explicit altitude construction nodes and their dependent geometry identity.
 */
type B1ProductionProfileOptions = Readonly<{
	/** Local EDT capture time on the registered 2013-05-27 measurement day. */
	time: string;
	/** Measured solar azimuth fit in degrees in the benchmark's horizontal frame. */
	fittedAzimuthDegrees: number;
	/** Maximum cumulative scattering order; default four. */
	maximumScatteringOrder?: Algorithm32ExecutionScatteringOrder;
	/** Incoming quadrature; default production F68. Other choices retain their existing Q40 diagnostic view. */
	incomingDirectionVariant?: B1IncomingDirectionVariant;
	/** Explicit altitude construction selection; omission retains the original Native48 profile identity. */
	positionDomain?: SphericalNativePositionDomainSelection;
}>;
