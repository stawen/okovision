import type { Language } from './i18n.ts';
import type { ConfigurationParameter } from '../configuration.ts';

const fr = {
	title: 'Post-installation',
	intro: 'Configurez votre installation. Les paramètres sont enregistrés en base dans oko_configuration, et non dans config.json.',
	install: 'La table oko_capteur est absente. La validation installera le schéma avec setup/install.sql.',
	partial: 'Base partiellement initialisée : l’installation forcée supprime et recrée les tables historiques visées par setup/install.sql. Sauvegardez la base avant de continuer.',
	configure: 'Le schéma historique est présent. Seule la configuration sera ajoutée ou complétée, sans réinstaller les tables existantes.',
	login: 'Connexion administrateur existant',
	password: 'Nouveau mot de passe du compte admin (12 caractères minimum)',
	confirm: 'Confirmer le mot de passe',
	force: 'J’ai sauvegardé la base et je confirme la réinstallation destructive.',
	forceWord: 'Saisir INSTALLER pour confirmer',
	save: 'Installer et enregistrer',
	saveConfig: 'Enregistrer la configuration',
	yes: 'Oui',
	no: 'Non',
	note: 'Les champs numériques utilisent le point décimal. La collecte est désactivée par défaut. La lecture temps réel utilise le compte standard de la chaudière, indépendamment du compte admin OkoVision. sendToWeb est conservé mais son envoi n’est pas encore porté. APP_LANG reste la langue de l’interface.',
	invalid: 'Vérifiez les valeurs : poids et surface positifs, fuseau IANA valide, capacité si silo, et mot de passe confirmé pour une installation.',
	limited: 'Trop de tentatives. Réessayez plus tard.',
	unavailable: 'Configuration indisponible. Consultez les journaux serveur avant de réessayer ; une installation SQL interrompue peut être partielle.',
	busy: 'Une installation est déjà en cours. Réessayez plus tard.',
	forceRequired: 'La base contient déjà des tables. La confirmation explicite de réinstallation est obligatoire.',
	complete: 'L’installation est déjà configurée.',
	required: 'Terminez la post-installation sur /setup avant d’utiliser cette fonction.',
	fields: {
		chaudiere: 'Adresse chaudière (hôte[:port], sans http://)',
		tcRef: 'Température de référence (°C)',
		poidsPellet: 'Débit de granulés (g/min) *',
		surfaceMaison: 'Surface de la maison (m²) *',
		getDataFromChaudiere: 'Activer la collecte automatique',
		timezone: 'Fuseau horaire IANA *',
		sendToWeb: 'Envoi vers le Web (non porté)',
		hasSilo: 'Silo présent',
		siloSize: 'Capacité du silo (kg)',
		ashtray: 'Seuil du cendrier (kg)',
		lang: 'Langue historique'
	} satisfies Record<ConfigurationParameter, string>
};

const en: typeof fr = {
	title: 'Post-installation',
	intro: 'Configure your installation. Settings are saved in oko_configuration in the database, not in config.json.',
	install: 'oko_capteur is missing. Submitting will install the schema using setup/install.sql.',
	partial: 'Partially initialized database: forced installation drops and recreates the legacy tables targeted by setup/install.sql. Back up the database before continuing.',
	configure: 'The legacy schema exists. Only configuration will be added or completed; existing tables will not be reinstalled.',
	login: 'Existing administrator sign-in',
	password: 'New admin password (at least 12 characters)',
	confirm: 'Confirm password',
	force: 'I backed up the database and confirm the destructive reinstallation.',
	forceWord: 'Type INSTALLER to confirm',
	save: 'Install and save',
	saveConfig: 'Save configuration',
	yes: 'Yes',
	no: 'No',
	note: 'Use decimal points for numeric fields. Collection is disabled by default. Real-time readings use the standard boiler account, independently of the OkoVision admin account. sendToWeb is retained but sending has not been migrated. APP_LANG still selects the interface language.',
	invalid: 'Check the values: positive weight and surface, valid IANA timezone, capacity if a silo exists, and a confirmed password for installation.',
	limited: 'Too many attempts. Try again later.',
	unavailable: 'Setup unavailable. Check server logs before retrying; an interrupted SQL installation may be partial.',
	busy: 'Another installation is in progress. Try again later.',
	forceRequired: 'The database already contains tables. Explicit reinstallation confirmation is required.',
	complete: 'The installation is already configured.',
	required: 'Complete post-installation at /setup before using this feature.',
	fields: {
		chaudiere: 'Boiler address (host[:port], without http://)',
		tcRef: 'Reference temperature (°C)',
		poidsPellet: 'Pellet flow (g/min) *',
		surfaceMaison: 'House surface (m²) *',
		getDataFromChaudiere: 'Enable automatic collection',
		timezone: 'IANA timezone *',
		sendToWeb: 'Web upload (not migrated)',
		hasSilo: 'Silo present',
		siloSize: 'Silo capacity (kg)',
		ashtray: 'Ashtray threshold (kg)',
		lang: 'Legacy language'
	}
};

export function setupMessages(language: Language) {
	return language === 'fr' ? fr : en;
}
