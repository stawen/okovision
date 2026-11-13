export type BoilerImportErrorCode =
	| 'configuration'
	| 'connection'
	| 'response'
	| 'file-not-found'
	| 'mapping'
	| 'database';

export class BoilerImportError extends Error {
	constructor(readonly code: BoilerImportErrorCode, cause?: unknown) {
		super(code, cause === undefined ? undefined : { cause });
		this.name = 'BoilerImportError';
	}
}
