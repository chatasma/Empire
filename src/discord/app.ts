import Discord, { Client } from 'discord.js';
import config from '../config';
import { protocolRequest } from '../protocol/protocol';

const client : Client = new Client();

function register() {
    if (config.discord == null || config.discord.discord_token == null) {
        console.error("No token specified");
        return;
    }

    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    const requestAuthors : string[] = config.discord.request_authors ? config.discord.request_authors : [];

    client.on('message', async (msg: Discord.Message) => {
         if (msg.author.id === client.user.id || !msg.author.bot || !requestAuthors.includes(msg.author.id)) return;
         const content : string = msg.cleanContent;
         if (!content.includes(`<${config.discord.message_header} REQUEST>`)) return;
         const requestContent : string = content.split('```')[1].replace(/(?:\r\n|\r|\n)/g, '');
         const protocolID : number = parseInt(requestContent.split(' ')[0]);
         
         const splitRequest = requestContent.split(' ');
         splitRequest.shift();

         const params : string = splitRequest.join('');
         let orderedParams : string[] = params.split(',');

         orderedParams = orderedParams.map((val : string) => {
             return val.trim();
         });

         let protocolResponse;
         try {
             protocolResponse = await protocolRequest(protocolID, orderedParams);
         } catch (e) {
             protocolResponse = e;
         }
         
         msg.channel.send(`\`\`\`json\n${JSON.stringify(protocolResponse)}\`\`\``);
    });

    client.login(config.discord.discord_token);
}

export default register;