import { loadServerEnvironment } from './environment.ts';

const fr = {
	installationConfigInvalid: 'Configuration de l’installation invalide ou inaccessible.',
	dailyIndicatorsFailed: 'Impossible de charger les indicateurs journaliers.',
	databaseCheckSucceeded: 'Connexion à la base réussie (SELECT 1).',
	databaseCheckFailed: 'Échec de la connexion à la base.',
	unknownError: 'Erreur inconnue.',
	invalidDay: 'La date demandée est invalide.',
	invalidOrFutureDay: 'La date demandée est invalide ou future.',
	invalidDirection: 'Direction invalide.',
	invalidInstallationConfig: 'La configuration de l’installation doit être un objet JSON.',
	invalidPelletWeight: 'poids_pellet doit être un nombre positif en grammes par minute.',
	invalidTimezone: 'timezone doit être un fuseau horaire IANA.',
	dbAddressRequired: 'DB_ADRESSE est obligatoire.',
	dbAddressInvalid: 'DB_ADRESSE doit contenir un hôte et, éventuellement, un port valide.',
	dbAddressHostOnly: 'DB_ADRESSE doit contenir uniquement un hôte et, éventuellement, un port.',
	dbPortInvalid: 'Le port de DB_ADRESSE doit être compris entre 1 et 65535.',
	dbNameAndUserRequired: 'DB_NAME et DB_USER sont obligatoires.',
	dbPasswordConflict: 'Utiliser DB_PASSWORD ou DB_PASSWORD_FILE, pas les deux.',
	dbPasswordRequired: 'DB_PASSWORD ou DB_PASSWORD_FILE est obligatoire.',
	dbTlsModeInvalid: 'DB_TLS_MODE doit valoir verify ou disabled.',
	dbTlsCaConflict: 'DB_TLS_CA_FILE ne peut pas être utilisé avec DB_TLS_MODE=disabled.',
	invalidIndicator: 'Valeur d’indicateur invalide dans la base.',
	duplicateSensor: (type: string) => `Plusieurs capteurs de type ${type}.`,
	invalidSensorColumn: (type: string) => `Colonne invalide pour le capteur ${type}.`,
	missingSensorColumn: (type: string) => `Colonne absente pour le capteur ${type}.`,
	indicatorsNoResult: 'La requête d’indicateurs n’a pas renvoyé de résultat.'
} as const;

type Translations = {
	[K in keyof typeof fr]: (typeof fr)[K] extends (...args: infer Args) => string
		? (...args: Args) => string
		: string;
};

const en: Translations = {
	installationConfigInvalid: 'Installation configuration is invalid or inaccessible.',
	dailyIndicatorsFailed: 'Unable to load daily indicators.',
	databaseCheckSucceeded: 'Database connection successful (SELECT 1).',
	databaseCheckFailed: 'Database connection failed.',
	unknownError: 'Unknown error.',
	invalidDay: 'The requested date is invalid.',
	invalidOrFutureDay: 'The requested date is invalid or in the future.',
	invalidDirection: 'Invalid direction.',
	invalidInstallationConfig: 'The installation configuration must be a JSON object.',
	invalidPelletWeight: 'poids_pellet must be a positive number in grams per minute.',
	invalidTimezone: 'timezone must be an IANA time zone.',
	dbAddressRequired: 'DB_ADRESSE is required.',
	dbAddressInvalid: 'DB_ADRESSE must contain a host and, optionally, a valid port.',
	dbAddressHostOnly: 'DB_ADRESSE must contain only a host and, optionally, a port.',
	dbPortInvalid: 'The port in DB_ADRESSE must be between 1 and 65535.',
	dbNameAndUserRequired: 'DB_NAME and DB_USER are required.',
	dbPasswordConflict: 'Use either DB_PASSWORD or DB_PASSWORD_FILE, not both.',
	dbPasswordRequired: 'DB_PASSWORD or DB_PASSWORD_FILE is required.',
	dbTlsModeInvalid: 'DB_TLS_MODE must be verify or disabled.',
	dbTlsCaConflict: 'DB_TLS_CA_FILE cannot be used with DB_TLS_MODE=disabled.',
	invalidIndicator: 'Invalid indicator value in the database.',
	duplicateSensor: (type) => `Multiple sensors of type ${type}.`,
	invalidSensorColumn: (type) => `Invalid column for sensor ${type}.`,
	missingSensorColumn: (type) => `Missing column for sensor ${type}.`,
	indicatorsNoResult: 'The indicators query returned no result.'
};

export function getMessages(): Translations {
	loadServerEnvironment();
	const language = process.env.APP_LANG?.trim().toUpperCase() ?? 'FR';
	if (language === 'FR') return fr;
	if (language === 'EN') return en;
	throw new Error('APP_LANG doit être FR ou EN / APP_LANG must be FR or EN.');
}
export type LogMessageKey = {
	[K in keyof typeof fr]: (typeof fr)[K] extends string ? K : never
}[keyof typeof fr];
