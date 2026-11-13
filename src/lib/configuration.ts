export const configurationParameters = [
	'chaudiere', 'tcRef', 'poidsPellet', 'surfaceMaison', 'getDataFromChaudiere',
	'timezone', 'sendToWeb', 'hasSilo', 'siloSize', 'ashtray', 'lang'
] as const;

export type ConfigurationParameter = typeof configurationParameters[number];
export type ConfigurationValues = Record<ConfigurationParameter, string>;
