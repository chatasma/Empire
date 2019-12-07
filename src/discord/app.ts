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
         if (msg.author.id === client.user.id || !requestAuthors.includes(msg.author.id)) return;
         const content : string = msg.cleanContent;
         if (!content.includes(`<${config.discord.message_header} REQUEST>`)) return;
         const requestContent : string = content.split('```')[1].replace(/(?:\r\n|\r|\n)/g, '');
         const protocolID : number = parseInt(requestContent.split(' ')[0]);
         
         const splitRequest = requestContent.split(' ');
         splitRequest.shift();

         const params : string = splitRequest.join('');
         const preSerializedParams : (string|string[])[] | null = serializeStringIntoParams(params);
         if (preSerializedParams == null) {
             msg.channel.send("Invalid parameters");
             return;
         }
         const serializedParams = <(string|string[])[]> preSerializedParams;

         let protocolResponse;
         try {
             protocolResponse = await protocolRequest(protocolID, serializedParams);
         } catch (e) {
             protocolResponse = e;
         }
         
         msg.channel.send(`\`\`\`${JSON.stringify(protocolResponse)}\`\`\``);
    });

    client.login(config.discord.discord_token);
}


// hacky asf
function serializeStringIntoParams(inStr : string) : (string|string[])[] | null {
    const lmao = `{content: [${inStr}]}`;
    try {
        const parseParams = JSON.parse(lmao);
        return parseParams;
    } catch(e) {
        return null;
    }
}

export default register;