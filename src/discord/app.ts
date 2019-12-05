import Discord, { Client } from 'discord.js';
import config from '../config';

const client : Client = new Client();

function register() {
    if (config.discord_token == null) {
        console.error("No token specified");
        return;
    }

    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    client.login(config.discord_token);
}

export default register;