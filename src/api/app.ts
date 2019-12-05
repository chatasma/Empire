import express from 'express';
import pg from 'pg';
import config from '../config';
import apiRoute from './routes/api'

const PORT = config.api_port ? config.api_port : 5000;

export const pgClient : pg.Client = new pg.Client({
    user: config.user,
    host: config.host,
    database: config.database,
    password: config.password,
    port: config.port
});

function initializeTables() {
    return new Promise(async (resolve, reject) => {
        await pgClient.query("CREATE TABLE IF NOT EXISTS ChillStats(id SERIAL PRIMARY KEY, msgo_wins INT DEFAULT 0)");
        await pgClient.query("CREATE TABLE IF NOT EXISTS ChillUser(uuid CHAR(36) PRIMARY KEY, stats integer REFERENCES ChillStats)");
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

    app.use('/api', apiRoute);

    app.listen(PORT, () => console.log(`Empire API running on PORT ${PORT}`));
}



export default register;