# Testing

Use this topic for repository-wide testing principles and for the current test
toolchain baseline.

## Main Document

- [Testing](testing.md)

The testing standard separates durable expectations from the repository's
three current execution surfaces: standalone Node Jasmine, standalone
Karma/Jasmine/Chrome for real renderer behavior, and the separate Polylith
application-test scaffold. Tooling commands and generated paths may change;
the behavioral and quality contracts should remain stable.
