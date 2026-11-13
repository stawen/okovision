import { getAppLanguage } from './language.ts';

const fr = {
	installationConfigInvalid: 'Configuration de l’installation invalide ou inaccessible.',
	dailyIndicatorsFailed: 'Impossible de charger les indicateurs journaliers.',
	dailyChartsFailed: 'Impossible de charger les graphiques journaliers.',
	dailyReportsFailed: 'Impossible de gérer les rapports journaliers.',
	seasonsFailed: 'Impossible de gérer les saisons.',
	siloEventsFailed: 'Impossible de gérer les événements de silo.',
	historyFailed: 'Impossible de charger les données historiques.',
	boilerReadFailed: 'Impossible de récupérer les mesures chaudière.',
	ashtrayStatusFailed: 'Impossible de charger le suivi du cendrier.',
	loginFailed: 'Impossible de traiter la connexion membre.',
	loginRejected: 'Identifiants de connexion refusés.',
	loginRateLimited: 'Limite de tentatives de connexion atteinte.',
	sessionCapacityExceeded: 'Capacité maximale des sessions atteinte.',
	databaseCheckSucceeded: 'Connexion à la base réussie (SELECT 1).',
	databaseCheckFailed: 'Échec de la connexion à la base.',
	invalidInstallationConfig: 'La configuration de l’installation doit être un objet JSON.',
	invalidConfigKeys: (keys: string) => `Les clés de configuration doivent être en camelCase : ${keys}.`,
	invalidPelletWeight: 'poidsPellet doit être un nombre positif en grammes par minute.',
	invalidAshtray: 'ashtray doit être un nombre positif en kilogrammes.',
	invalidSurface: 'surfaceMaison doit être un nombre positif en mètres carrés.',
	invalidSilo: 'hasSilo doit valoir 0 ou 1.',
	invalidSiloSize: 'siloSize doit être un nombre positif en kilogrammes.',
	stockStatusFailed: 'Impossible de charger le stock de pellets.',
	stockNoResult: 'La requête de stock n’a pas renvoyé de résultat.',
	invalidAshtrayConsumption: 'Consommation du cendrier invalide dans la base.',
	ashtrayNoResult: 'La requête de suivi du cendrier n’a pas renvoyé de résultat.',
	invalidTimezone: 'timezone doit être un fuseau horaire IANA.',
	boilerAddressInvalid: 'chaudiere doit être un hôte ou un hôte suivi d’un port valide.',
	boilerConfigInvalid: 'Adresse de chaudière absente ou invalide dans config.json.',
	boilerCredentialsUnavailable: 'Identifiants chaudière absents ou invalides dans la ligne admin.',
	boilerCredentialsLoadFailed: 'Impossible de lire les identifiants chaudière en base.',
	boilerConnectionFailed: 'Chaudière injoignable ou authentification refusée.',
	boilerResponseInvalid: 'Réponse de la chaudière invalide.',
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
	invalidIndicatorRange: 'Plage horaire invalide pour les indicateurs.',
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
	dailyChartsFailed: 'Unable to load daily charts.',
	dailyReportsFailed: 'Unable to manage daily reports.',
	seasonsFailed: 'Unable to manage seasons.',
	siloEventsFailed: 'Unable to manage silo events.',
	historyFailed: 'Unable to load historical data.',
	boilerReadFailed: 'Unable to retrieve boiler readings.',
	ashtrayStatusFailed: 'Unable to load ashtray tracking.',
	loginFailed: 'Unable to process member sign-in.',
	loginRejected: 'Sign-in credentials rejected.',
	loginRateLimited: 'Sign-in attempt limit reached.',
	sessionCapacityExceeded: 'Session capacity exceeded.',
	databaseCheckSucceeded: 'Database connection successful (SELECT 1).',
	databaseCheckFailed: 'Database connection failed.',
	invalidInstallationConfig: 'The installation configuration must be a JSON object.',
	invalidConfigKeys: (keys) => `Configuration keys must be camelCase: ${keys}.`,
	invalidPelletWeight: 'poidsPellet must be a positive number in grams per minute.',
	invalidAshtray: 'ashtray must be a positive number in kilograms.',
	invalidSurface: 'surfaceMaison must be a positive number in square metres.',
	invalidSilo: 'hasSilo must be 0 or 1.',
	invalidSiloSize: 'siloSize must be a positive number in kilograms.',
	stockStatusFailed: 'Unable to load pellet stock.',
	stockNoResult: 'The stock query returned no result.',
	invalidAshtrayConsumption: 'Invalid ashtray consumption in the database.',
	ashtrayNoResult: 'The ashtray tracking query returned no result.',
	invalidTimezone: 'timezone must be an IANA time zone.',
	boilerAddressInvalid: 'chaudiere must be a host or a host with a valid port.',
	boilerConfigInvalid: 'Boiler address is missing or invalid in config.json.',
	boilerCredentialsUnavailable: 'Boiler credentials are missing or invalid in the admin row.',
	boilerCredentialsLoadFailed: 'Unable to read boiler credentials from the database.',
	boilerConnectionFailed: 'Boiler is unreachable or authentication was rejected.',
	boilerResponseInvalid: 'Invalid response from the boiler.',
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
	invalidIndicatorRange: 'Invalid time range for indicators.',
	duplicateSensor: (type) => `Multiple sensors of type ${type}.`,
	invalidSensorColumn: (type) => `Invalid column for sensor ${type}.`,
	missingSensorColumn: (type) => `Missing column for sensor ${type}.`,
	indicatorsNoResult: 'The indicators query returned no result.'
};

export function getMessages(): Translations {
	return getAppLanguage() === 'fr' ? fr : en;
}
export type LogMessageKey =
	| 'loginFailed'
	| 'loginRejected'
	| 'loginRateLimited'
	| 'installationConfigInvalid'
	| 'dailyIndicatorsFailed'
	| 'dailyChartsFailed'
	| 'dailyReportsFailed'
	| 'seasonsFailed'
	| 'siloEventsFailed'
	| 'historyFailed'
	| 'boilerReadFailed'
	| 'stockStatusFailed'
	| 'ashtrayStatusFailed'
	| 'databaseCheckSucceeded'
	| 'databaseCheckFailed';
