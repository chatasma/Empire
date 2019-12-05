import express from 'express';
import pg from 'pg';
import config from './config';
import apiRoute from './routes/api'


// Create PG client instance
const client : pg.Client = new pg.Client({
    user: config.user,
    host: config.host,
    database: config.database,
    password: config.password,
    port: config.port
});

// Connect to database using PG client
(async () => {
    try {
        await client.connect();
    } catch(e) {
        console.log(e);
    }
})();

const app : express.Application = express();

app.use('/api', apiRoute);

app.listen(5000, () => console.log('Server running'));

export { client as pgClient };