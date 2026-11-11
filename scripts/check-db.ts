import { checkDatabaseConnection } from '../src/lib/server/database.ts';

try {
	await checkDatabaseConnection(process.env);
	console.log('Connexion à la base réussie (SELECT 1).');
} catch (error) {
	const message = error instanceof Error ? error.message : 'Erreur inconnue.';
	console.error(`Échec de la connexion à la base : ${message}`);
	process.exitCode = 1;
}
