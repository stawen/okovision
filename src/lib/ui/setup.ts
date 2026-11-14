import type { Language } from './i18n.ts';
import type { ConfigurationParameter } from '../configuration.ts';

const fr = {
	title: 'Post-installation',
	install: 'La table oko_capteur est absente. La validation installera le schéma avec setup/install.sql.',
	partial: 'Base partiellement initialisée : l’installation forcée supprime et recrée les tables historiques visées par setup/install.sql. Sauvegardez la base avant de continuer.',
	configure: 'Le schéma historique est présent. Seule la configuration sera ajoutée ou complétée, sans réinstaller les tables existantes.',
	password: 'Nouveau mot de passe du compte admin (12 caractères minimum)',
	confirm: 'Confirmer le mot de passe',
	passwordPlaceholder: '12 caractères minimum',
	confirmPlaceholder: 'Répétez le mot de passe',
	force: 'J’ai sauvegardé la base et je confirme la réinstallation destructive.',
	forceWord: 'Saisir INSTALLER pour confirmer',
	forceWordPlaceholder: 'INSTALLER',
	save: 'Installer et enregistrer',
	saveConfig: 'Enregistrer la configuration',
	settingsSaved: 'Les paramètres ont été enregistrés.',
	settingsInvalid: 'Vérifiez les valeurs saisies : adresse chaudière, températures, nombres positifs et fuseau horaire valides.',
	settingsSaveFailed: 'Impossible d’enregistrer les paramètres. Consultez les journaux du serveur.',
	settingsUnavailable: 'Impossible de charger les paramètres. Consultez les journaux du serveur.',
	settingsForbidden: 'L’accès à ces paramètres est réservé aux administrateurs.',
	yes: 'Oui',
	no: 'Non',
	invalid: 'Vérifiez les valeurs : adresse et température de chaudière valides, poids et surface positifs, fuseau IANA valide, capacité si silo, et mot de passe confirmé pour une installation.',
	limited: 'Trop de tentatives. Réessayez plus tard.',
	unavailable: 'Configuration indisponible. Consultez les journaux serveur avant de réessayer ; une installation SQL interrompue peut être partielle.',
	busy: 'Une installation est déjà en cours. Réessayez plus tard.',
	forceRequired: 'La base contient déjà des tables. La confirmation explicite de réinstallation est obligatoire.',
	complete: 'L’installation est déjà configurée.',
	required: 'Terminez la post-installation sur /setup avant d’utiliser cette fonction.',
	examples: {
		chaudiere: '192.168.1.23',
		tcRef: '20',
		poidsPellet: '150',
		surfaceMaison: '120',
		timezone: 'Europe/Paris',
		hasSilo: '',
		siloSize: '6000',
		ashtray: '1000'
	} satisfies Record<ConfigurationParameter, string>,
	fields: {
		chaudiere: 'Adresse chaudière (hôte[:port], sans http://) *',
		tcRef: 'Température de référence (°C) *',
		poidsPellet: 'Débit de granulés (g/min) *',
		surfaceMaison: 'Surface de la maison (m²) *',
		timezone: 'Fuseau horaire IANA *',
		hasSilo: 'Silo présent',
		siloSize: 'Capacité du silo (kg)',
		ashtray: 'Seuil du cendrier (kg)'
	} satisfies Record<ConfigurationParameter, string>
};

const en: typeof fr = {
	title: 'Post-installation',
	install: 'oko_capteur is missing. Submitting will install the schema using setup/install.sql.',
	partial: 'Partially initialized database: forced installation drops and recreates the legacy tables targeted by setup/install.sql. Back up the database before continuing.',
	configure: 'The legacy schema exists. Only configuration will be added or completed; existing tables will not be reinstalled.',
	password: 'New admin password (at least 12 characters)',
	confirm: 'Confirm password',
	passwordPlaceholder: 'At least 12 characters',
	confirmPlaceholder: 'Re-enter the password',
	force: 'I backed up the database and confirm the destructive reinstallation.',
	forceWord: 'Type INSTALLER to confirm',
	forceWordPlaceholder: 'INSTALLER',
	save: 'Install and save',
	saveConfig: 'Save configuration',
	settingsSaved: 'Settings have been saved.',
	settingsInvalid: 'Check the submitted values: valid boiler address, temperatures, positive numbers and time zone.',
	settingsSaveFailed: 'Unable to save settings. Check the server logs.',
	settingsUnavailable: 'Unable to load settings. Check the server logs.',
	settingsForbidden: 'These settings are restricted to administrators.',
	yes: 'Yes',
	no: 'No',
	invalid: 'Check the values: valid boiler address and reference temperature, positive weight and surface, valid IANA timezone, capacity if a silo exists, and a confirmed password for installation.',
	limited: 'Too many attempts. Try again later.',
	unavailable: 'Setup unavailable. Check server logs before retrying; an interrupted SQL installation may be partial.',
	busy: 'Another installation is in progress. Try again later.',
	forceRequired: 'The database already contains tables. Explicit reinstallation confirmation is required.',
	complete: 'The installation is already configured.',
	required: 'Complete post-installation at /setup before using this feature.',
	examples: {
		chaudiere: '192.168.1.23',
		tcRef: '20',
		poidsPellet: '150',
		surfaceMaison: '120',
		timezone: 'Europe/Paris',
		hasSilo: '',
		siloSize: '6000',
		ashtray: '1000'
	},
	fields: {
		chaudiere: 'Boiler address (host[:port], without http://) *',
		tcRef: 'Reference temperature (°C) *',
		poidsPellet: 'Pellet flow (g/min) *',
		surfaceMaison: 'House surface (m²) *',
		timezone: 'IANA timezone *',
		hasSilo: 'Silo present',
		siloSize: 'Silo capacity (kg)',
		ashtray: 'Ashtray threshold (kg)'
	}
};

export function setupMessages(language: Language) {
	return language === 'fr' ? fr : en;
}
