export const configurationParameters = [
	'chaudiere', 'tcRef', 'poidsPellet', 'surfaceMaison', 'timezone',
	'hasSilo', 'siloSize', 'ashtray'
] as const;

export type ConfigurationParameter = typeof configurationParameters[number];
export type ConfigurationValues = Record<ConfigurationParameter, string>;
