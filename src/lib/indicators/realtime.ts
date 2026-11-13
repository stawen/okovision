import type { UiTextKey } from '../ui/i18n.js';

export interface RealtimeReading {
	value: string | number | null;
	unit: string;
}

export interface RealtimeData {
	circuit: number;
	updatedAt: number;
	readings: Record<string, RealtimeReading>;
}

export interface RealtimeIndicatorDefinition {
	id: string;
	labelKey: UiTextKey;
	tooltipKey?: UiTextKey;
	sensorName(circuit: number): string;
}

export interface RealtimeIndicatorSection {
	titleKey: UiTextKey;
	indicators: RealtimeIndicatorDefinition[];
}

const heatingSensor = (name: string) => (circuit: number) =>
	`CAPPL:LOCAL.hk[${circuit - 1}].${name}`;

export const realtimeSections: RealtimeIndicatorSection[] = [
	{
		titleKey: 'realtimeBurnerSection',
		indicators: [
			{
				id: 'averageBurnerRunTime',
				labelKey: 'realtimeAverageBurnerRunTime',
				tooltipKey: 'realtimeTipAverageBurnerRunTime',
				sensorName: () => 'CAPPL:FA[0].L_mittlere_laufzeit'
			},
			{
				id: 'burnerStarts',
				labelKey: 'realtimeBurnerStarts',
				tooltipKey: 'realtimeTipBurnerStarts',
				sensorName: () => 'CAPPL:FA[0].L_brennerstarts'
			},
			{
				id: 'burnerRunTime',
				labelKey: 'realtimeBurnerRunTime',
				tooltipKey: 'realtimeTipBurnerRunTime',
				sensorName: () => 'CAPPL:FA[0].L_brennerlaufzeit_anzeige'
			},
			{
				id: 'ignitionCount',
				labelKey: 'realtimeIgnitionCount',
				tooltipKey: 'realtimeTipIgnitionCount',
				sensorName: () => 'CAPPL:FA[0].L_anzahl_zuendung'
			}
		]
	},
	{
		titleKey: 'realtimeHeatingSection',
		indicators: [
			{
				id: 'comfortTemperature',
				labelKey: 'realtimeComfortTemperature',
				tooltipKey: 'realtimeTipComfortTemperature',
				sensorName: heatingSensor('raumtemp_heizen')
			},
			{
				id: 'reducedTemperature',
				labelKey: 'realtimeReducedTemperature',
				tooltipKey: 'realtimeTipReducedTemperature',
				sensorName: heatingSensor('raumtemp_absenken')
			},
			{
				id: 'heatingCurveSlope',
				labelKey: 'realtimeHeatingCurveSlope',
				tooltipKey: 'realtimeTipHeatingCurveSlope',
				sensorName: heatingSensor('heizkurve_steigung')
			},
			{
				id: 'heatingCurveFootpoint',
				labelKey: 'realtimeHeatingCurveFootpoint',
				tooltipKey: 'realtimeTipHeatingCurveFootpoint',
				sensorName: heatingSensor('heizkurve_fusspunkt')
			},
			{
				id: 'comfortHeatingLimit',
				labelKey: 'realtimeComfortHeatingLimit',
				tooltipKey: 'realtimeTipComfortHeatingLimit',
				sensorName: heatingSensor('heizgrenze_heizen')
			},
			{
				id: 'reducedHeatingLimit',
				labelKey: 'realtimeReducedHeatingLimit',
				tooltipKey: 'realtimeTipReducedHeatingLimit',
				sensorName: heatingSensor('heizgrenze_absenken')
			}
		]
	},
	{
		titleKey: 'realtimeRadiatorSection',
		indicators: [
			{
				id: 'flowTemperatureMax',
				labelKey: 'realtimeFlowTemperatureMax',
				tooltipKey: 'realtimeTipFlowTemperatureMax',
				sensorName: heatingSensor('vorlauftemp_max')
			},
			{
				id: 'flowTemperatureMin',
				labelKey: 'realtimeFlowTemperatureMin',
				tooltipKey: 'realtimeTipFlowTemperatureMin',
				sensorName: heatingSensor('vorlauftemp_min')
			},
			{
				id: 'flowTemperatureBoost',
				labelKey: 'realtimeFlowTemperatureBoost',
				tooltipKey: 'realtimeTipFlowTemperatureBoost',
				sensorName: heatingSensor('ueberhoehung')
			},
			{
				id: 'mixerOpenDuration',
				labelKey: 'realtimeMixerOpenDuration',
				tooltipKey: 'realtimeTipMixerOpenDuration',
				sensorName: heatingSensor('mischer_max_auf_zeit')
			},
			{
				id: 'mixerPauseDuration',
				labelKey: 'realtimeMixerPauseDuration',
				tooltipKey: 'realtimeTipMixerPauseDuration',
				sensorName: heatingSensor('mischer_max_aus_zeit')
			},
			{
				id: 'mixerCloseDuration',
				labelKey: 'realtimeMixerCloseDuration',
				tooltipKey: 'realtimeTipMixerCloseDuration',
				sensorName: heatingSensor('mischer_max_zu_zeit')
			},
			{
				id: 'sourceControlRange',
				labelKey: 'realtimeSourceControlRange',
				tooltipKey: 'realtimeTipSourceControlRange',
				sensorName: heatingSensor('mischer_regelbereich_quelle')
			},
			{
				id: 'flowControlRange',
				labelKey: 'realtimeFlowControlRange',
				tooltipKey: 'realtimeTipFlowControlRange',
				sensorName: heatingSensor('mischer_regelbereich_vorlauf')
			},
			{
				id: 'sourceTemperatureRise',
				labelKey: 'realtimeSourceTemperatureRise',
				tooltipKey: 'realtimeTipSourceTemperatureRise',
				sensorName: heatingSensor('quellentempverlauf_anstiegstemp')
			},
			{
				id: 'sourceTemperatureRange',
				labelKey: 'realtimeSourceTemperatureRange',
				tooltipKey: 'realtimeTipSourceTemperatureRange',
				sensorName: heatingSensor('quellentempverlauf_regelbereich')
			}
		]
	},
	{
		titleKey: 'realtimeBoilerSection',
		indicators: [
			{
				id: 'boilerTargetTemperature',
				labelKey: 'realtimeBoilerTargetTemperature',
				tooltipKey: 'realtimeTipBoilerTargetTemperature',
				sensorName: () => 'CAPPL:FA[0].pe_kesseltemperatur_soll'
			},
			{
				id: 'boilerShutdownTemperature',
				labelKey: 'realtimeBoilerShutdownTemperature',
				tooltipKey: 'realtimeTipBoilerShutdownTemperature',
				sensorName: () => 'CAPPL:FA[0].pe_abschalttemperatur'
			},
			{
				id: 'boilerStartHysteresis',
				labelKey: 'realtimeBoilerStartHysteresis',
				tooltipKey: 'realtimeTipBoilerStartHysteresis',
				sensorName: () => 'CAPPL:FA[0].pe_einschalthysterese_smart'
			},
			{
				id: 'boilerPower',
				labelKey: 'realtimeBoilerPower',
				tooltipKey: 'realtimeTipBoilerPower',
				sensorName: () => 'CAPPL:FA[0].pe_kesselleistung'
			}
		]
	}
];

const supportingIndicators: RealtimeIndicatorDefinition[] = [
	{
		id: 'controllerVersion',
		labelKey: 'realtimeControllerVersion',
		sensorName: () => 'CAPPL:LOCAL.touch[0].version'
	},
	{
		id: 'outsideTemperature',
		labelKey: 'outsideTemperature',
		sensorName: () => 'CAPPL:LOCAL.L_aussentemperatur_ist'
	},
	{
		id: 'roomTemperature',
		labelKey: 'roomTemperature',
		sensorName: (circuit) => `CAPPL:LOCAL.L_hk[${circuit - 1}].raumtemp_ist`
	},
	{
		id: 'roomSetpoint',
		labelKey: 'roomSetpoint',
		sensorName: (circuit) => `CAPPL:LOCAL.L_hk[${circuit - 1}].raumtemp_soll`
	}
];

export const realtimeIndicators = [
	...realtimeSections.flatMap((section) => section.indicators),
	...supportingIndicators
];

/** Produces the controller sensor identifiers for one-based heating circuit numbers. */
export function realtimeSensorNames(circuit: number): string[] {
	return realtimeIndicators.map((indicator) => indicator.sensorName(circuit));
}
