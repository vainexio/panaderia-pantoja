const {getPerms, noPerms, client} = require('../server.js');
const Discord = require('discord.js');
const {Client, Intents, MessageEmbed, MessageActionRow, MessageButton} = Discord;

const sendMsg = require('../functions/sendMessage.js')
const sendChannel = sendMsg.sendChannel
const sendUser = sendMsg.sendUser

const settings = require('../storage/settings_.js')
const {shop, emojis, colors, theme, status} = settings

const cmdHandler = require('../functions/commands.js')
const {getTemplate} = cmdHandler

const get = require('../functions/get.js')
const {getRandom, getChannel, getMember, getGuild} = get

const roles = require('../functions/roles.js')
const {getRole, addRole, removeRole, hasRole} = roles

module.exports = {
  makeTicket: async function (data) {
    //var author = message.author;
    let guild = await getGuild(data.guild.id)
    let member = await getMember(data.user.id,guild)
    if (await hasRole(member,['1094909481806205009'])) data.ticketName = data.ticketName.replace('ticket',data.user.username.replace(/ /g,''))
    let ch = null
    await data.guild.channels.create(data.ticketName, {
      type: "text", 
      parent: data.category,
      permissionOverwrites: [
        {
          id:  data.guild.roles.everyone, 
          deny: ['VIEW_CHANNEL'] 
        },
        {
          id: data.user.id, 
          allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY','ATTACH_FILES'],
        },
        {
          id: data.guild.roles.cache.find(r => r.id === data.support), 
          allow: ['VIEW_CHANNEL','SEND_MESSAGES','READ_MESSAGE_HISTORY'],
        },
      ],
    })
      .then(async channel => {
      ch = channel
      let ticketChannel = {
        id: channel.id,
        name: channel.name,
        panel: data.name,
        count: data.count,
        category: data.category,
        transcript: 'none',
        status: 'open',
      }
      data.doc.tickets.push(ticketChannel)
      await data.doc.save()
      
      let embed = new MessageEmbed()
      .setTitle(data.name)
      .setDescription("Welcome **"+data.user.username+"**! Any available <@&"+data.support+"> will assist you soon.\n\n"+data.context)
      .setColor(colors.yellow)
      .setFooter({text: 'Sloopie Tickets'})
      
      let row = new MessageActionRow().addComponents(
        new MessageButton().setCustomId('closedTicket-'+data.user.id).setStyle('SECONDARY').setLabel('Close').setEmoji('🔒'),
        //new MessageButton().setCustomId('transcript-ticket').setStyle('SECONDARY').setLabel('Save Transcript').setEmoji('<:S_letter:1092606891240198154>'),
      );
      let BotMsg = channel.send({ content: "<@"+data.user.id+"> - <@&"+data.support+"> Ticket opened ("+data.name+") *!*", embeds: [embed] , components: [row]})
      
      })
      .catch(async err => {
      let log = await getChannel('1047454193910284300')
      log.send('<@477729368622497803> Error creating tix for <@'+data.user.id+'>\n```diff\n- '+err+'```')
    });
    
    return ch;
}
};