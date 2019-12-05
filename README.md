# Empire
API server and Discord Bot feeder for Team Empire. Serves statistics of players to clients.


# Setup
1. Clone the repository.
```
git clone https://github.com/ThatOneTqnk/Empire.git empire
cd empire
```

2. Install dependencies.
```
npm install
```

3. Create Discord bot at https://discordapp.com/developers/applications/. Add a public bot user and save the token for the configuration.

4. Setup a PostgreSQL database. This is required for the API.

5. Create configuration in `src/config.ts`. Example configuration:
```ts
const config : any = {
    "user": "DATABASE_USER",
    "host": "DATABASE_HOST",
    "database": "DATABASE_NAME",
    "password": "DATABASE_PASSWORD",
    "port": 3000,

    "api": {
        "api_port": 5000,
        "api_base": "http://localhost:5000",
        "api_token": "API_TOKEN"
    },

    "discord": {
        "message_header": "ARBITRARY",
        "discord_token": "DISCORD_BOT_TOKEN",
        "request_authors": ["235088799074484224"]
    }
};

export default config;
```


6. Run application in developer mode. Uses `nodemon` for live changes.
```
npm run dev
```