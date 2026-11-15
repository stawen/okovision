import type { Language } from './i18n.js';

const fr = {
	edit: 'Modifier', modified: 'Modifié', pending: 'Des modifications attendent leur enregistrement et leur application à la chaudière.',
	leave: 'Des modifications chaudière sont en attente. Quitter cette page ?',
	sensorError: 'Impossible de charger les limites du paramètre.', value: 'Nouvelle valeur', cancel: 'Annuler',
	validate: 'Valider', min: 'Minimum', max: 'Maximum', invalid: 'Valeur invalide ou hors limites.',
	increase: 'Augmenter la valeur', decrease: 'Diminuer la valeur',
	applied: 'Configuration enregistrée, appliquée et vérifiée sur la chaudière.',
	description: 'Description',
	save: 'Enregistrer et appliquer', saveHelp: 'L’enregistrement applique immédiatement les modifications à la chaudière.',
	intro: 'Consultez, rechargez ou supprimez les configurations enregistrées de la chaudière.',
	empty: 'Aucune configuration enregistrée.',
	view: 'Afficher', previewTitle: 'Configuration enregistrée', close: 'Fermer',
	load: 'Charger dans les réglages', delete: 'Supprimer', deleteConfirm: 'Seul l’enregistrement sera supprimé ; la chaudière ne sera pas modifiée.',
	loadConfirmTitle: 'Charger cette configuration ?', deleteConfirmTitle: 'Supprimer cette configuration ?',
	incomplete: 'Certains réglages sont indisponibles : l’enregistrement complet est impossible.',
	offline: 'Chaudière indisponible : les configurations enregistrées restent consultables.',
	databaseError: 'Impossible de charger les configurations enregistrées.',
	error: 'Opération impossible. Vérifiez les données et les journaux.',
	saveUncertain: 'Résultat de l’enregistrement et de la commande incertain : vérifiez la liste et la chaudière, puis rechargez les réglages avant toute nouvelle tentative.',
	savedApplyFailed: 'Configuration enregistrée, mais application à la chaudière échouée.',
	conflict: 'La valeur chaudière a changé depuis sa lecture. Rechargez les réglages avant de réessayer.',
	duplicate: 'Une configuration existe déjà à cette date et heure.',
	uncertain: 'Résultat de la commande incertain : vérifiez la chaudière et rechargez la page avant toute nouvelle tentative.',
	loaded: 'Configuration chargée dans les réglages, sans application à la chaudière.',
	loadedPartial: 'Configuration partielle : seuls les paramètres disponibles ont été chargés.',
	replaceConfirm: 'Remplacer les modifications en attente par cette configuration ?',
	loading: 'Opération en cours…'
};
const en: typeof fr = {
	edit: 'Edit', modified: 'Modified', pending: 'Changes are waiting to be saved and applied to the boiler.',
	leave: 'Boiler changes are pending. Leave this page?',
	sensorError: 'Unable to load the parameter limits.', value: 'New value', cancel: 'Cancel',
	validate: 'Confirm', min: 'Minimum', max: 'Maximum', invalid: 'Invalid value or outside the limits.',
	increase: 'Increase value', decrease: 'Decrease value',
	applied: 'Configuration saved, applied and verified on the boiler.',
	description: 'Description',
	save: 'Save and apply', saveHelp: 'Saving immediately applies the changes to the boiler.',
	intro: 'View, load or delete saved boiler configurations.',
	empty: 'No saved configurations.',
	view: 'View', previewTitle: 'Saved configuration', close: 'Close',
	load: 'Load into settings', delete: 'Delete', deleteConfirm: 'Only the saved configuration will be deleted; the boiler will not be changed.',
	loadConfirmTitle: 'Load this configuration?', deleteConfirmTitle: 'Delete this configuration?',
	incomplete: 'Some settings are unavailable: a complete configuration cannot be saved.',
	offline: 'Boiler unavailable: saved configurations can still be viewed.',
	databaseError: 'Unable to load saved configurations.',
	error: 'Operation failed. Check the data and server logs.',
	saveUncertain: 'The result of saving and the command is uncertain: check the list and boiler, then reload the settings before trying again.',
	savedApplyFailed: 'Configuration saved, but applying it to the boiler failed.',
	conflict: 'The boiler value changed since it was read. Reload the settings before retrying.',
	duplicate: 'A configuration already exists at this date and time.',
	uncertain: 'The command result is uncertain: check the boiler and reload the page before trying again.',
	loaded: 'Configuration loaded into settings without applying it to the boiler.',
	loadedPartial: 'Partial configuration: only available parameters were loaded.',
	replaceConfirm: 'Replace pending changes with this configuration?',
	loading: 'Operation in progress…'
};

export function boilerConfigurationText(language: Language): Record<keyof typeof fr, string> {
	return language === 'fr' ? fr : en;
}
