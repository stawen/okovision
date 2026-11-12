import type { Pool, RowDataPacket } from 'mysql2/promise';
import { getMessages } from '../messages.ts';

interface GraphRow extends RowDataPacket {
	id: number;
	name: string;
}

interface AssociationRow extends RowDataPacket {
	graphId: number;
	sensorId: number;
	name: string;
	column_oko: number;
	correctionEffect: string | null;
}

interface ColumnRow extends RowDataPacket {
	Field: string;
}

type ReadingRow = RowDataPacket & {
	timestamp: number;
};

interface AnnotationRow extends RowDataPacket {
	timestamp: number;
	description: string;
}

interface SampleCountRow extends RowDataPacket {
	sampleCount: number;
}

export interface DailyChartSeries {
	name: string;
	data: [number, number][];
}

export interface DailyChart {
	id: number;
	name: string;
	series: DailyChartSeries[];
}

export interface DailyChartsResult {
	graphs: DailyChart[];
	annotations: { timestamp: number; description: string }[];
	sampleCount: number;
}

export function createDailyChartsRepository(db: Pick<Pool, 'execute' | 'query'>) {
	return {
		async getDailyCharts(day: string): Promise<DailyChartsResult> {
			const messages = getMessages();
			const [graphRows] = await db.execute<GraphRow[]>(
				'SELECT id, name FROM oko_graphe ORDER BY position, id'
			);
			const graphs = graphRows.map((graph) => ({
				id: graph.id,
				name: graph.name,
				series: [] as DailyChartSeries[]
			}));
			if (graphs.length === 0) return { graphs, annotations: [], sampleCount: 0 };

			const graphById = new Map(graphs.map((graph) => [graph.id, graph]));
			const placeholders = graphs.map(() => '?').join(', ');
			const [associations] = await db.execute<AssociationRow[]>(
				`SELECT association.oko_graphe_id AS graphId, sensor.id AS sensorId, sensor.name, sensor.column_oko, association.correction_effect AS correctionEffect
				 FROM oko_asso_capteur_graphe AS association
				 INNER JOIN oko_capteur AS sensor ON sensor.id = association.oko_capteur_id
				 WHERE association.oko_graphe_id IN (${placeholders})
				 ORDER BY association.oko_graphe_id, association.position`,
				graphs.map((graph) => graph.id)
			);

			let sampleCount: number;
			if (associations.length > 0) {
				const [columns] = await db.query<ColumnRow[]>('SHOW COLUMNS FROM oko_historique_full');
				const existingColumns = new Set(columns.map((column) => column.Field));
				const expressions: string[] = [];
				const parameters: (number | string)[] = [];
				const seriesByAlias = new Map<string, DailyChartSeries>();

				for (const [index, association] of associations.entries()) {
					if (!Number.isSafeInteger(association.column_oko) || association.column_oko < 0) {
						throw new Error(messages.invalidSensorColumn(association.name));
					}
					const column = `col_${association.column_oko}`;
					if (!existingColumns.has(column)) {
						throw new Error(messages.missingSensorColumn(association.name));
					}
					const correctionText = association.correctionEffect;
					const correction = Number(correctionText);
					if (!correctionText?.trim() || !Number.isFinite(correction)) {
						throw new Error(messages.invalidIndicator);
					}

					const graph = graphById.get(association.graphId);
					if (!graph) throw new Error(messages.invalidIndicator);
					const alias = `series_${index}`;
					const series = { name: association.name, data: [] as [number, number][] };
					graph.series.push(series);
					seriesByAlias.set(alias, series);
					expressions.push(`ROUND(\`${column}\` * ?, 2) AS \`${alias}\``);
					parameters.push(correction);
				}

				const [rows] = await db.execute<ReadingRow[]>(
					`SELECT timestamp * 1000 AS timestamp, ${expressions.join(', ')}
					 FROM oko_historique_full WHERE jour = ? ORDER BY timestamp`,
					[...parameters, day]
				);
				sampleCount = rows.length;
				for (const row of rows) {
					const timestamp = Number(row.timestamp);
					if (!Number.isFinite(timestamp)) throw new Error(messages.invalidIndicator);
					for (const [alias, series] of seriesByAlias) {
						const value: unknown = row[alias];
						if (value === null) continue;
						const numericValue = Number(value);
						if (!Number.isFinite(numericValue)) throw new Error(messages.invalidIndicator);
						series.data.push([timestamp, numericValue]);
					}
				}
			} else {
				const [rows] = await db.execute<SampleCountRow[]>(
					'SELECT COUNT(*) AS sampleCount FROM oko_historique_full WHERE jour = ?',
					[day]
				);
				sampleCount = Number(rows[0]?.sampleCount ?? 0);
				if (!Number.isSafeInteger(sampleCount) || sampleCount < 0) {
					throw new Error(messages.invalidIndicator);
				}
			}

			const [annotationRows] = await db.execute<AnnotationRow[]>(
				"SELECT timestamp * 1000 AS timestamp, description FROM oko_boiler WHERE DATE_FORMAT(FROM_UNIXTIME(timestamp), '%Y-%m-%d') = ? ORDER BY timestamp",
				[day]
			);
			const annotations = annotationRows.map((annotation) => {
				const timestamp = Number(annotation.timestamp);
				if (!Number.isFinite(timestamp)) throw new Error(messages.invalidIndicator);
				return { timestamp, description: annotation.description };
			});

			return { graphs, annotations, sampleCount };
		}
	};
}
