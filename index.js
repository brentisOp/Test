const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_PRESENCES,
        Discord.Intents.FLAGS.GUILD_MEMBERS
    ]
});

const config = require('./config.json');
const db = require('quick.db');

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if(newMember.guild.id !== config.server) return;
    if(!oldMember.premiumSince && newMember.premiumSince) {
        newMember.roles.add(config.role);

        db.set(newMember.id, Date.now())
    }

    if(oldMember.premiumSince && !newMember.premiumSince) {
        newMember.roles.remove(config.role);

        db.delete(newMember.id);
    }
})

client.on('ready', async() => {
    const guild = client.guilds.cache.get(config.server);

    setInterval(async() => {
    const results = (await db.fetchAll()).filter(({ data }) => Date.now() >= data + (config.time * 8.64e+7));

    for(const result of results) {
        const member = guild.members.cache.get(result.ID) || await guild.members.fetch(result.ID);

        await member.roles.remove(config.role);

        db.delete(member.id);
    }
    })
})

client.on('presenceUpdate', async(_old, presence) => {
    const { guild, member } = presence;
    

    if(guild.id !== config.server) return;


    const text = (presence.activities.find(activity => activity.type === 'CUSTOM') || {}).state || '';

    if(!text.length) return;

    const { role } = config;

    const status = config.text;

    if (!text.length) {
        if (member.roles.cache.has(role)) await member.roles.remove(role);
    } else if (text.includes(status)) {
        if (!member.roles.cache.has(role)) await member.roles.add(role);
    } else if (member.roles.cache.has(role)) { await member.roles.remove(role); }
})

client.login(config.token);
