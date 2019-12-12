import express from 'express';
import pg from 'pg';
import config from '../config';
import apiRoute from './routes/api';
import { SQLTableStatements } from '../db/models/models';
import bodyParser from 'body-parser';

const PORT = config.api && config.api.api_port ? config.api.api_port : 5000;

export const pgClient : pg.Client = new pg.Client({
    user: config.user,
    host: config.host,
    database: config.database,
    password: config.password,
    port: config.port
});

function initializeTables() {
    return new Promise(async (resolve, reject) => {
        await pgClient.query("SET TIME ZONE 'EST'");
        await pgClient.query(`CREATE TABLE IF NOT EXISTS ${SQLTableStatements.ChillMatch}`);
        await pgClient.query(`CREATE TABLE IF NOT EXISTS ${SQLTableStatements.ChillNumericMetric}`);
        await pgClient.query(`CREATE TABLE IF NOT EXISTS ${SQLTableStatements.ChillUser}`);
        await pgClient.query(`CREATE TABLE IF NOT EXISTS ${SQLTableStatements.MsgoMatchInfo}`);

        resolve();
    });
}

async function register() {
    // Connect to database using PG client
    await new Promise(async (resolve, reject) => {
        try {
            await pgClient.connect();
            await initializeTables();
            resolve();
        } catch(e) {
            console.error(e);
            reject(e);
        }
    });

    const app : express.Application = express();

    app.use(bodyParser.json());

    app.use('/api', apiRoute);

    app.listen(PORT, () => console.log(`Empire API running on PORT ${PORT}`));
}

export default register;