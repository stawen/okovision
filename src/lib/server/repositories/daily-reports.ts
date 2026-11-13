import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

interface GraphRow extends RowDataPacket {
	id: number;
	name: string;
	position: number;
}

interface SensorRow extends RowDataPacket {
	id: number;
	name: string;
}

interface AssociationRow extends RowDataPacket {
	sensorId: number;
	name: string;
	position: number;
	correctionEffect: string | null;
}

interface NextPositionRow extends RowDataPacket {
	nextPosition: number;
}

export interface DailyReportGraph {
	id: number;
	name: string;
	position: number;
}

export interface DailyReportSensor {
	id: number;
	name: string;
}

export interface DailyReportAssociation {
	sensorId: number;
	name: string;
	position: number;
	correctionEffect: string | null;
}

export type DailyReportErrorCode =
	| 'invalid-input'
	| 'duplicate-graph'
	| 'graph-not-found'
	| 'sensor-not-found'
	| 'duplicate-association'
	| 'association-not-found'
	| 'invalid-coefficient';

export class DailyReportError extends Error {
	constructor(readonly code: DailyReportErrorCode) {
		super(code);
	}
}

function requireGraphName(value: string): string {
	const name = value.trim();
	if (!name || Buffer.byteLength(name, 'utf8') > 255) {
		throw new DailyReportError('invalid-input');
	}
	return name;
}

function requireCoefficient(value: string): string {
	const normalized = value.trim().replace(',', '.');
	if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)
		|| !Number.isFinite(Number(normalized))) {
		throw new DailyReportError('invalid-coefficient');
	}
	return String(Number(normalized));
}

function requireId(value: number): number {
	if (!Number.isSafeInteger(value) || value <= 0) throw new DailyReportError('invalid-input');
	return value;
}

function requirePlacement(value: string): 'before' | 'after' {
	if (value !== 'before' && value !== 'after') throw new DailyReportError('invalid-input');
	return value;
}

function moveId(
	ids: number[],
	id: number,
	targetId: number,
	placement: 'before' | 'after',
	notFound: DailyReportErrorCode
): number[] {
	const sourceIndex = ids.indexOf(id);
	const targetIndex = ids.indexOf(targetId);
	if (sourceIndex < 0 || targetIndex < 0) throw new DailyReportError(notFound);
	if (sourceIndex === targetIndex) return ids;

	ids.splice(sourceIndex, 1);
	ids.splice(ids.indexOf(targetId) + (placement === 'after' ? 1 : 0), 0, id);
	return ids;
}

function orderUpdateSql(column: string, ids: number[], scopeColumn?: string) {
	const choices = ids.map(() => 'WHEN ? THEN ?').join(' ');
	const scopedWhere = scopeColumn ? ` AND ${scopeColumn} = ?` : '';
	return `UPDATE ${scopeColumn ? 'oko_asso_capteur_graphe' : 'oko_graphe'}
		SET position = CASE ${column} ${choices} ELSE position END
		WHERE ${column} IN (${ids.map(() => '?').join(', ')})${scopedWhere}`;
}

export function createDailyReportsRepository(db: Pick<Pool, 'execute'>) {
	async function getGraphs(): Promise<DailyReportGraph[]> {
		const [rows] = await db.execute<GraphRow[]>(
			'SELECT id, name, position FROM oko_graphe ORDER BY position, id'
		);
		return rows.map((row) => ({ id: row.id, name: row.name, position: row.position }));
	}

	async function getAssociations(graphId: number): Promise<DailyReportAssociation[]> {
		const [rows] = await db.execute<AssociationRow[]>(
			`SELECT sensor.id AS sensorId, sensor.name, association.position,
				association.correction_effect AS correctionEffect
			 FROM oko_asso_capteur_graphe AS association
			 INNER JOIN oko_capteur AS sensor ON sensor.id = association.oko_capteur_id
			 WHERE association.oko_graphe_id = ?
			 ORDER BY association.position, sensor.id`,
			[graphId]
		);
		return rows.map((row) => ({
			sensorId: row.sensorId,
			name: row.name,
			position: row.position,
			correctionEffect: row.correctionEffect
		}));
	}

	async function updateGraphOrder(ids: number[]): Promise<void> {
		if (!ids.length) return;
		await db.execute(
			orderUpdateSql('id', ids),
			[...ids.flatMap((id, index) => [id, index + 1]), ...ids]
		);
	}

	async function updateAssociationOrder(graphId: number, sensorIds: number[]): Promise<void> {
		if (!sensorIds.length) return;
		await db.execute(
			orderUpdateSql('oko_capteur_id', sensorIds, 'oko_graphe_id'),
			[
				...sensorIds.flatMap((id, index) => [id, index + 1]),
				...sensorIds,
				graphId
			]
		);
	}

	return {
		getGraphs,

		async getSensors(): Promise<DailyReportSensor[]> {
			const [rows] = await db.execute<SensorRow[]>(
				'SELECT id, name FROM oko_capteur ORDER BY id'
			);
			return rows.map((row) => ({ id: row.id, name: row.name }));
		},

		getAssociations,

		async createGraph(value: string): Promise<number> {
			const name = requireGraphName(value);
			const [existing] = await db.execute<GraphRow[]>(
				'SELECT id, name, position FROM oko_graphe WHERE name = ? LIMIT 1',
				[name]
			);
			if (existing.length) throw new DailyReportError('duplicate-graph');
			const [positions] = await db.execute<NextPositionRow[]>(
				'SELECT COALESCE(MAX(position), 0) + 1 AS nextPosition FROM oko_graphe'
			);
			const position = Number(positions[0]?.nextPosition);
			if (!Number.isSafeInteger(position) || position < 1) {
				throw new DailyReportError('invalid-input');
			}
			const [result] = await db.execute<ResultSetHeader>(
				'INSERT INTO oko_graphe (name, position) VALUES (?, ?)',
				[name, position]
			);
			const id = Number(result.insertId);
			if (!Number.isSafeInteger(id) || id < 1) throw new DailyReportError('invalid-input');
			return id;
		},

		async renameGraph(graphIdValue: number, value: string): Promise<void> {
			const graphId = requireId(graphIdValue);
			const name = requireGraphName(value);
			const [graphs] = await db.execute<GraphRow[]>(
				'SELECT id, name, position FROM oko_graphe WHERE id = ?',
				[graphId]
			);
			if (!graphs.length) throw new DailyReportError('graph-not-found');
			const [existing] = await db.execute<GraphRow[]>(
				'SELECT id, name, position FROM oko_graphe WHERE name = ? AND id <> ? LIMIT 1',
				[name, graphId]
			);
			if (existing.length) throw new DailyReportError('duplicate-graph');
			await db.execute('UPDATE oko_graphe SET name = ? WHERE id = ?', [name, graphId]);
		},

		async deleteGraph(graphIdValue: number): Promise<void> {
			const graphId = requireId(graphIdValue);
			const [result] = await db.execute<ResultSetHeader>(
				`DELETE graph, association
				 FROM oko_graphe AS graph
				 LEFT JOIN oko_asso_capteur_graphe AS association
					ON association.oko_graphe_id = graph.id
				 WHERE graph.id = ?`,
				[graphId]
			);
			if (!result.affectedRows) throw new DailyReportError('graph-not-found');
			const graphs = await getGraphs();
			await updateGraphOrder(graphs.map((graph) => graph.id));
		},

		async moveGraph(graphIdValue: number, direction: 'up' | 'down'): Promise<void> {
			const graphId = requireId(graphIdValue);
			const graphs = await getGraphs();
			const ids = graphs.map((graph) => graph.id);
			const index = ids.indexOf(graphId);
			if (index < 0) throw new DailyReportError('graph-not-found');
			const target = index + (direction === 'up' ? -1 : 1);
			if (target < 0 || target >= ids.length) return;
			[ids[index], ids[target]] = [ids[target], ids[index]];
			await updateGraphOrder(ids);
		},

		async reorderGraph(
			graphIdValue: number,
			targetGraphIdValue: number,
			placementValue: string
		): Promise<void> {
			const graphId = requireId(graphIdValue);
			const targetGraphId = requireId(targetGraphIdValue);
			const placement = requirePlacement(placementValue);
			const graphs = await getGraphs();
			const ids = moveId(graphs.map((graph) => graph.id), graphId, targetGraphId, placement, 'graph-not-found');
			await updateGraphOrder(ids);
		},

		async addAssociation(
			graphIdValue: number,
			sensorIdValue: number,
			coefficientValue: string
		): Promise<void> {
			const graphId = requireId(graphIdValue);
			const sensorId = requireId(sensorIdValue);
			const coefficient = requireCoefficient(coefficientValue);
			const [graphs] = await db.execute<GraphRow[]>(
				'SELECT id, name, position FROM oko_graphe WHERE id = ?',
				[graphId]
			);
			if (!graphs.length) throw new DailyReportError('graph-not-found');
			const [sensors] = await db.execute<SensorRow[]>(
				'SELECT id, name FROM oko_capteur WHERE id = ?',
				[sensorId]
			);
			if (!sensors.length) throw new DailyReportError('sensor-not-found');
			const [existing] = await db.execute<AssociationRow[]>(
				`SELECT sensor.id AS sensorId, sensor.name, association.position,
					association.correction_effect AS correctionEffect
				 FROM oko_asso_capteur_graphe AS association
				 INNER JOIN oko_capteur AS sensor ON sensor.id = association.oko_capteur_id
				 WHERE association.oko_graphe_id = ? AND association.oko_capteur_id = ?
				 LIMIT 1`,
				[graphId, sensorId]
			);
			if (existing.length) throw new DailyReportError('duplicate-association');
			const [positions] = await db.execute<NextPositionRow[]>(
				'SELECT COALESCE(MAX(position), 0) + 1 AS nextPosition FROM oko_asso_capteur_graphe WHERE oko_graphe_id = ?',
				[graphId]
			);
			const position = Number(positions[0]?.nextPosition);
			if (!Number.isSafeInteger(position) || position < 1) {
				throw new DailyReportError('invalid-input');
			}
			await db.execute(
				`INSERT INTO oko_asso_capteur_graphe
					(oko_graphe_id, oko_capteur_id, position, correction_effect) VALUES (?, ?, ?, ?)`,
				[graphId, sensorId, position, coefficient]
			);
		},

		async updateAssociation(
			graphIdValue: number,
			sensorIdValue: number,
			coefficientValue: string
		): Promise<void> {
			const graphId = requireId(graphIdValue);
			const sensorId = requireId(sensorIdValue);
			const coefficient = requireCoefficient(coefficientValue);
			const [rows] = await db.execute<AssociationRow[]>(
				`SELECT sensor.id AS sensorId, sensor.name, association.position,
					association.correction_effect AS correctionEffect
				 FROM oko_asso_capteur_graphe AS association
				 INNER JOIN oko_capteur AS sensor ON sensor.id = association.oko_capteur_id
				 WHERE association.oko_graphe_id = ? AND association.oko_capteur_id = ?`,
				[graphId, sensorId]
			);
			if (!rows.length) throw new DailyReportError('association-not-found');
			await db.execute(
				`UPDATE oko_asso_capteur_graphe SET correction_effect = ?
				 WHERE oko_graphe_id = ? AND oko_capteur_id = ?`,
				[coefficient, graphId, sensorId]
			);
		},

		async deleteAssociation(graphIdValue: number, sensorIdValue: number): Promise<void> {
			const graphId = requireId(graphIdValue);
			const sensorId = requireId(sensorIdValue);
			const associations = await getAssociations(graphId);
			const sensorIds = associations.map((association) => association.sensorId);
			if (!sensorIds.includes(sensorId)) throw new DailyReportError('association-not-found');
			const [result] = await db.execute<ResultSetHeader>(
				'DELETE FROM oko_asso_capteur_graphe WHERE oko_graphe_id = ? AND oko_capteur_id = ?',
				[graphId, sensorId]
			);
			if (!result.affectedRows) throw new DailyReportError('association-not-found');
			await updateAssociationOrder(graphId, sensorIds.filter((id) => id !== sensorId));
		},

		async moveAssociation(
			graphIdValue: number,
			sensorIdValue: number,
			direction: 'up' | 'down'
		): Promise<void> {
			const graphId = requireId(graphIdValue);
			const sensorId = requireId(sensorIdValue);
			const associations = await getAssociations(graphId);
			const ids = associations.map((association) => association.sensorId);
			const index = ids.indexOf(sensorId);
			if (index < 0) throw new DailyReportError('association-not-found');
			const target = index + (direction === 'up' ? -1 : 1);
			if (target < 0 || target >= ids.length) return;
			[ids[index], ids[target]] = [ids[target], ids[index]];
			await updateAssociationOrder(graphId, ids);
		},

		async reorderAssociation(
			graphIdValue: number,
			sensorIdValue: number,
			targetSensorIdValue: number,
			placementValue: string
		): Promise<void> {
			const graphId = requireId(graphIdValue);
			const sensorId = requireId(sensorIdValue);
			const targetSensorId = requireId(targetSensorIdValue);
			const placement = requirePlacement(placementValue);
			const associations = await getAssociations(graphId);
			const ids = moveId(
				associations.map((association) => association.sensorId),
				sensorId,
				targetSensorId,
				placement,
				'association-not-found'
			);
			await updateAssociationOrder(graphId, ids);
		}
	};
}
