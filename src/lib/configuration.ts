export const configurationParameters = [
	'chaudiere', 'tcRef', 'poidsPellet', 'surfaceMaison', 'timezone',
	'hasSilo', 'siloSize', 'ashtray', 'pciPellet', 'rendementChaudiere'
] as const;

export type ConfigurationParameter = typeof configurationParameters[number];
export type ConfigurationValues = Record<ConfigurationParameter, string>;

export const energyConfigurationDefaults = {
	pciPellet: '4.90',
	rendementChaudiere: '89.50'
} as const;
