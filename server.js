//Glitch Project
const express = require('express');
const https = require('https');
const app = express();
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const moment = require('moment')
const HttpsProxyAgent = require('https-proxy-agent');
const url = require('url');
const discordTranscripts = require('discord-html-transcripts');
//
//Discord
const Discord = require('discord.js');
const {WebhookClient, Permissions, Client, Intents, MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu} = Discord; 
//const moment = require('moment');
const myIntents = new Intents();
myIntents.add(Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES);
const client = new Client({ intents: myIntents , partials: ["CHANNEL"] });

//Env
const token = process.env.SECRET;
const open_ai = process.env.OPEN_AI
const mongooseToken = process.env.MONGOOSE;

async function startApp() {
    let promise = client.login(token)
    console.log("Starting...");
    promise.catch(function(error) {
      console.error("Discord bot login | " + error);
      process.exit(1);
      
    });
}
startApp();
let cmd = false

let ticketSchema
let ticketModel

let tixSchema
let tixModel

let ticketId = 10
//When bot is ready
client.on("ready", async () => {
  await mongoose.connect(mongooseToken,{keepAlive: true});
  ticketSchema = new mongoose.Schema({
    id: String,
    count: Number,
  })
  tixSchema = new mongoose.Schema({
    id: String,
    number: Number,
    tickets: [
      {
        id: String,
        name: String,
        panel: String,
        transcript: String,
        status: String,
        count: Number,
        category: String,
      }
    ],
  })
  tixModel = mongoose.model("SloopieTix", tixSchema);
  ticketModel = mongoose.model("SloopieTickets", ticketSchema);
  let doc = await ticketModel.findOne({id: ticketId})
  if (!doc) {
    let newDoc = new ticketModel(ticketSchema)
    newDoc.id = ticketId
    newDoc.count = 0
    await newDoc.save()
  }
  if (slashCmd.register) {
  let discordUrl = "https://discord.com/api/v10/applications/"+client.user.id+"/commands"
  let headers = {
    "Authorization": "Bot "+token,
    "Content-Type": 'application/json'
  }
  for (let i in slashes) {
    let json = slashes[i]
    let response = await fetch(discordUrl, {
      method: 'post',
      body: JSON.stringify(json),
      headers: headers
    });
    response = await response.json();
    //console.log(response)
  }
    for (let i in slashCmd.deleteSlashes) {
      let deleteUrl = "https://discord.com/api/v10/applications/"+client.user.id+"/commands/"+slashCmd.deleteSlashes[i]
      let deleteRes = await fetch(deleteUrl, {
        method: 'delete',
        headers: headers
      })
      //console.log(deleteRes)
    }
  }
  console.log('Successfully logged in to discord bot.')
  client.user.setPresence({ status: 'idle', activities: [{ name: 'Sloopies', type: "WATCHING" }] });
 // await mongoose.connect(mongooseToken,{keepAlive: true});
})

module.exports = {
  client: client,
  getPerms,
  noPerms,
};

let listener = app.listen(process.env.PORT, function() {
   console.log('Not that it matters but your app is listening on port ' + listener.address().port);
});
/*
░██████╗███████╗████████╗████████╗██╗███╗░░██╗░██████╗░░██████╗
██╔════╝██╔════╝╚══██╔══╝╚══██╔══╝██║████╗░██║██╔════╝░██╔════╝
╚█████╗░█████╗░░░░░██║░░░░░░██║░░░██║██╔██╗██║██║░░██╗░╚█████╗░
░╚═══██╗██╔══╝░░░░░██║░░░░░░██║░░░██║██║╚████║██║░░╚██╗░╚═══██╗
██████╔╝███████╗░░░██║░░░░░░██║░░░██║██║░╚███║╚██████╔╝██████╔╝
╚═════╝░╚══════╝░░░╚═╝░░░░░░╚═╝░░░╚═╝╚═╝░░╚══╝░╚═════╝░╚═════╝░*/
//LOG VARIABLES
var output = "901759430457167872";
const settings = require('./storage/settings_.js')
const {filteredWords, AI, shop, notices, auth, prefix, colors, status, theme, commands, permissions, emojis} = settings
//Slash Commands
const slashCmd = require("./storage/slashCommands.js");
const { slashes } = slashCmd;
/*
██████╗░███████╗██████╗░███╗░░░███╗░██████╗
██╔══██╗██╔════╝██╔══██╗████╗░████║██╔════╝
██████╔╝█████╗░░██████╔╝██╔████╔██║╚█████╗░
██╔═══╝░██╔══╝░░██╔══██╗██║╚██╔╝██║░╚═══██╗
██║░░░░░███████╗██║░░██║██║░╚═╝░██║██████╔╝
╚═╝░░░░░╚══════╝╚═╝░░╚═╝╚═╝░░░░░╚═╝╚═════╝░*/
async function getPerms(member, level) {
  let highestPerms = null
  let highestLevel = 0
  let sortedPerms = await permissions.sort((a,b) => b.level-a.level)
  for (let i in sortedPerms) {
    if (permissions[i].id === member.id && permissions[i].level >= level) {
      highestLevel < permissions[i].level ? (highestPerms = permissions[i], highestLevel = permissions[i].level) : null
    } else if (member.user && member.roles.cache.some(role => role.id === permissions[i].id) && permissions[i].level >= level) {
      highestLevel < permissions[i].level ? (highestPerms = permissions[i], highestLevel = permissions[i].level) : null
    }
  }
  
  if (highestPerms) return highestPerms;
}
async function guildPerms(message, perms) {
  if (message.member.permissions.has(perms)) {
	return true;
} else {
  let embed = new MessageEmbed()
  .addFields({name: 'Insufficient Permissions',value: emojis.x+" You don't have the required server permissions to use this command.\n\n`"+perms.toString().toUpperCase()+"`"})
  .setColor(colors.red)
  message.channel.send({embeds: [embed]})
}
}
function noPerms(message) {
  let Embed = new MessageEmbed()
  .setColor(colors.red)
  .setDescription("You lack special permissions to use this command.")
  return Embed;
}
/*
███████╗██╗░░░██╗███╗░░██╗░█████╗░████████╗██╗░█████╗░███╗░░██╗░██████╗
██╔════╝██║░░░██║████╗░██║██╔══██╗╚══██╔══╝██║██╔══██╗████╗░██║██╔════╝
█████╗░░██║░░░██║██╔██╗██║██║░░╚═╝░░░██║░░░██║██║░░██║██╔██╗██║╚█████╗░
██╔══╝░░██║░░░██║██║╚████║██║░░██╗░░░██║░░░██║██║░░██║██║╚████║░╚═══██╗
██║░░░░░╚██████╔╝██║░╚███║╚█████╔╝░░░██║░░░██║╚█████╔╝██║░╚███║██████╔╝
╚═╝░░░░░░╚═════╝░╚═╝░░╚══╝░╚════╝░░░░╚═╝░░░╚═╝░╚════╝░╚═╝░░╚══╝╚═════╝░*/
//Send Messages
const sendMsg = require('./functions/sendMessage.js')
const {sendChannel, sendUser} = sendMsg
//Functions
const get = require('./functions/get.js')
const {getTime, chatAI, getNth, getChannel, getGuild, getUser, getMember, getRandom, getColor} = get
//Command Handler
const cmdHandler = require('./functions/commands.js')
const {checkCommand, isCommand, isMessage, getTemplate} = cmdHandler
//Others
const others = require('./functions/others.js')
const {stringJSON, fetchKey, ghostPing, moderate, getPercentage, sleep, getPercentageEmoji, randomTable, scanString, requireArgs, getArgs, makeButton, makeRow} = others
//Roles Handler
const roles = require('./functions/roles.js')
const {getRole, addRole, removeRole, hasRole} = roles
//Tickets Handler
const tickets = require('./functions/tickets.js')
const {makeTicket} = tickets
//const {} = boostbot
/*
░█████╗░██╗░░░░░██╗███████╗███╗░░██╗████████╗  ███╗░░░███╗███████╗░██████╗░██████╗░█████╗░░██████╗░███████╗
██╔══██╗██║░░░░░██║██╔════╝████╗░██║╚══██╔══╝  ████╗░████║██╔════╝██╔════╝██╔════╝██╔══██╗██╔════╝░██╔════╝
██║░░╚═╝██║░░░░░██║█████╗░░██╔██╗██║░░░██║░░░  ██╔████╔██║█████╗░░╚█████╗░╚█████╗░███████║██║░░██╗░█████╗░░
██║░░██╗██║░░░░░██║██╔══╝░░██║╚████║░░░██║░░░  ██║╚██╔╝██║██╔══╝░░░╚═══██╗░╚═══██╗██╔══██║██║░░╚██╗██╔══╝░░
╚█████╔╝███████╗██║███████╗██║░╚███║░░░██║░░░  ██║░╚═╝░██║███████╗██████╔╝██████╔╝██║░░██║╚██████╔╝███████╗
░╚════╝░╚══════╝╚═╝╚══════╝╚═╝░░╚══╝░░░╚═╝░░░  ╚═╝░░░░░╚═╝╚══════╝╚═════╝░╚═════╝░╚═╝░░╚═╝░╚═════╝░╚══════╝*/
//ON CLIENT MESSAGE
let errors = 0
let expCodes = []
let nitroCodes = []
async function setVouchers() {
  let channel = await getChannel(shop.channels.vouchers)
  shop.vouchers = []
  const options = { limit: 100 };
  
  let messages = await channel.messages.fetch(options).then(async messages => {
      await messages.forEach(async (gotMsg) => {
        let args = await getArgs(gotMsg.content)
        let id = args[0]
        let perks = args.slice(1).join(" ").replace('- ','');
        let fromNow = moment(gotMsg.createdAt).fromNow()
        //
        if (fromNow == '5 days ago') {
          sendChannel('Expired Voucher: '+gotMsg.content,'1047454193755107337',colors.none)
          gotMsg.delete();
        } 
        else {
         let found = shop.vouchers.find(b => b.code === id)
        !found ? shop.vouchers.push({code: id, perks: perks}) : null 
        }
      })
    })
}
async function useVoucher(code) {
  let channel = await getChannel(shop.vouchers)
  const options = { limit: 100 };
  
  let messages = await channel.messages.fetch(options).then(async messages => {
      await messages.forEach(async (gotMsg) => {
        let args = await getArgs(gotMsg.content)
        let id = args[0]
        let perks = args.slice(1).join(" ").replace(' - ','');
        if (id === code) {
          //
          gotMsg.delete()
          await setVouchers()
          return true;
        }
      })
    })
}
function getVoucher(code) {
  let found = shop.vouchers.find(v => v.code === code)
  if (found) return found;
}
async function dropVoucher(code,ch,title) {
  await setVouchers()
  let channel = await getChannel(ch)
  let voucher = await getVoucher(code)
  let row = new MessageActionRow().addComponents(
    new MessageButton().setCustomId('voucher-'+voucher.code).setStyle('SECONDARY').setLabel('Claim Voucher').setEmoji('<:08:1069200741807435866>'),
  );
  //
  let quote = "Oop, I can't think of a quote right now."
  let context = ['cats','life','dogs',,'love','stupidity','anything']
  let chosenContext = context[getRandom(0,context.length)]
  let data = await chatAI("write a random inspirational quote about "+chosenContext)
    if (data.response.error) console.log('⚠️ An unexpected error occurred `'+data.response.error.message+'`')
    else if (data.chosenAPI === AI.chatAPI) {
      let msg = data.response.choices[0].message.content
      let filtered = AI.filter(msg)
      if (filtered.length > 500) {
        console.log("⚠️ The message generated was longer than 500 characters. Unable to send due to discord's limitations.")
      } else {
        quote = filtered
      }
    }  
  let embed = new MessageEmbed()
  .addFields(
    {name: title,value: '<:09:1069200736631656518> Click the button to claim'},
    {name: "Random Quote",value: quote}
  )
  .setColor(colors.yellow)
  .setThumbnail('https://media.discordapp.net/attachments/917249743690805249/1067060198327472128/Logopit_1674477351350.png')
  channel.send({embeds: [embed], components: [row]})
}
function makeCode(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
let truck = false
client.on("messageCreate", async (message) => {
  //Ping
  if (message.channel.id === '1047454193595732055' && message.author.id === '968378766260846713') {
    let user = message.mentions.members.first()
    let id = user.id
    
    let webhook = new WebhookClient({ url: process.env.ChatWebhook})
    let zarche = await getUser('900011518714847282')
    webhook.send({
      content: 'welcome po <:gude_heart:1056580152852762694>',
      username: zarche.username,
      avatarURL: zarche.avatarURL()
    })
    let ji = await getUser('797149484966346752')
    webhook.send({
      content: 'welcome to sloopies, im a rc',
      username: ji.username,
      avatarURL: ji.avatarURL()
    })
    let twine = await getUser('911181742445047808')
    webhook.send({
      content: 'Welcome to spoopies <:frogblush:1054020324393500742>',
      username: twine.username,
      avatarURL: twine.avatarURL()
    })
  } 
  else if (message.channel.parent?.name.toLowerCase().includes('orders')) {
    //
    let embed = new MessageEmbed()
      .addFields({name: 'Terms and Conditions',value: '<:S_letter:1092606891240198154> Before proceeding, you must read and accept our terms and conditions.\n\n<:S_seperator:1093733778633019492> By clicking the button, you indicate that you have read, understood and accepted the terms stated in <#1055070784843948052> and the rules implied in <#1055883558918561913> for the product you want to avail.\n\n<:S_seperator:1093733778633019492> You will be held liable for any violation of our rules, for you have accepted the terms and agreed to comply.', inline: true})
      .setColor(colors.yellow)
      .setThumbnail(message.channel.guild.iconURL())
      
      let row = await makeRow('terms','Agree and continue','SECONDARY','<a:S_bearheart:1094190497179910225>')
      //
    if (message.author.id === client.user.id && message.content?.toLowerCase().includes('ticket opened')) {
      
    let member = message.mentions.members.first()
    if (member) {
    let shopStatus = await getChannel(shop.channels.status);
      if (shopStatus.name === 'shop : CLOSED') {
        message.channel.send("<@"+member.id+"> The shop is currently **CLOSED**, please come back at <t:1677542400:t> to proceed with your order.")
      }
    if (!await hasRole(member,['1094909481806205009'],message.channel.guild)) {
      
      message.channel.send({content: "<@"+member.id+">", embeds: [embed], components: [row]})
    } else if (await hasRole(member,['1077462108381388873'],message.guild)) {
      let row = new MessageActionRow().addComponents(
        new MessageButton().setCustomId('orderFormat').setStyle('SECONDARY').setLabel('Order Form').setEmoji('<a:S_arrowright:1095503803761033276>'),
      );
      message.channel.send({components: [row]})
      //message.channel.setName(message.channel.name.replace('ticket',member.user.username.replace(/ /g,'')))
    }
    }
    }
  }
  else if (message.channel.parent?.name.toLowerCase() === 'reports') {
   if (message.author.id === client.user.id && message.content?.toLowerCase().includes('ticket opened')) {
     let vc = await getChannel(shop.channels.reportsVc)
     let member = message.mentions.members.first()
     let state = await hasRole(member,["Accepted TOS"]) ? "You have accepted our terms.\n— Therefore, we shall not be liable for any mistakes or excuses made once you've violated our rules." : "We shall not be liable for any mistakes or excuses made once you've violated our rules."
     if (vc.name === 'reports : CLOSED') {
     message.channel.send(emojis.warning+" **Void Warranty**\nReport was submitted outside reporting hours.\n\n<:07:1069200743959109712> Remarks\n— Void warranty means no replacement nor refund.\n— "+state)
     await addRole(member,['void'],message.guild)
     } else if (await hasRole(member,['void'],message.guild)) {
       message.channel.send(emojis.warning+' **Void Warranty**\nA recent remark was detected that you violated our terms.\n\n— '+state)
       await removeRole(member,['void'])
     }
   } 
  }
  
  //
  for (let i in shop.stickyChannels) {
    if (message.applicationId) return;
  let sticky = shop.stickyChannels[i]
  let foundSticky = message.content.length > 0 ? shop.stickyChannels.find(s => s.message === message.content) : null
  if (sticky.id === message.channel.id || sticky.id === message.channel.parent?.id) {
    const options = { limit: 10 };
    //
    if (message.channel.id === shop.channels.orders || message.channel.id === '1101833714704601168') {
      let member = message.mentions.members.first()
      if (member) {
      await addRole(member,['pending','buyer'],message.guild)
      }
    }

    if (((sticky.condition && sticky.condition(message)) || !sticky.condition) && message.content !== sticky.message && !foundSticky) {
    message.channel.send({content: sticky.message == '' ? null : sticky.message, components: sticky.comp ? [sticky.comp] : [], files: sticky.files ? sticky.files : []});
      
      let messages = await message.channel.messages.fetch(options).then(messages => {
      messages.forEach(async (gotMsg) => {
        if (gotMsg.author.id === '1057167023492300881' && gotMsg.content === sticky.message && (message.author.id !== '1057167023492300881' || (message.author.id === '1057167023492300881' && message.content !== sticky.message))) {
          gotMsg.delete();
          //
        }
      })
    });
    }
  }
}
  if (message.author.bot) return;
  if (isCommand('feedback',message)) {
    if (message.channel.type !== 'DM') return message.reply(emojis.x+' This function can only be used in Dms.')
    
    let botMsg = message.channel.send("<:S_seperator:1093733778633019492> Please type and send your feedback here!")
    const filter = m => m.author.id === message.author.id;
    message.channel.awaitMessages({filter,max: 1,time: 900000 ,errors: ['time']})
    .then(async responseMsg => {
    responseMsg = responseMsg.first()
      if (responseMsg.content.length === 0) return message.channel.send(emojis.warning+' No message content was collected.')
      
      let embed = new MessageEmbed()
      .setTitle('Your Feedback')
      .setDescription(responseMsg.content)
      .setColor(colors.yellow)
      
      let row = new MessageActionRow().addComponents(
        new MessageButton().setCustomId('feedback').setStyle('SUCCESS').setLabel('Send Publicly'),
        new MessageButton().setCustomId('feedbackAnon').setStyle('DANGER').setLabel('Send Anonymously'),
        new MessageButton().setCustomId('cancel').setStyle('SECONDARY').setLabel('Cancel'),
      );
      message.channel.send({embeds: [embed], components: [row]})
    })
    .catch(collected => {
    
    console.log("Msg Collection Error: "+collected)
    sendUser("**[Timed-out]** No response collected. Please rerun the command if you wish to retry.\n",message.author.id,colors.red)
  });
  }
  if (isCommand('apply',message)) { 
    if (message.channel.type !== 'DM') return message.reply(emojis.x+' This function can only be used in Dms.')
    
    let embed = new MessageEmbed()
    .setTitle('Reseller Application')
    .setDescription('**Please provide the following information by sending it here**\n\n<:S_dot:1093733278541951078>Shop Link:\n<:S_dot:1093733278541951078>Age:\n<:S_dot:1093733278541951078>Your GCash/Paypal:\n<:S_dot:1093733278541951078>Joined sloopies since:\n<:S_dot:1093733278541951078>Why do you want to become a reseller in sloopies:\n\n')
    .addFields({name: 'Remarks',value: '<a:S_starspin:1094191195074334720>You should be aware that you can still be removed as a reseller, for any reason, with or without notice.\n\n<a:S_starspin:1094191195074334720>Any false information submitted will result in immediate decline of your application.\n\n<a:S_starspin:1094191195074334720>Resellers have a quota of 1 order per week before being removed.\n\n<a:S_starspin:1094191195074334720>You can still re-apply if you were removed as a reseller before. However, your application will not be easily regarded unlike other applicants.'})
    .setColor(colors.yellow)
    .setThumbnail(message.author.avatarURL())
    
    let botMsg = null
    await message.channel.send({embeds: [embed]}).then(msg => botMsg = msg)
    const filter = m => m.author.id === message.author.id;
    botMsg.channel.awaitMessages({filter,max: 1,time: 900000 ,errors: ['time']})
          
    .then(async responseMsg => {
    responseMsg = responseMsg.first()
    
    let attachments = Array.from(responseMsg.attachments.values())
    if (responseMsg.content.toLowerCase().startsWith('cancel')) {
      sendUser(emojis.check+" Verification cancelled! Please rerun the command if you wish to retry.",responseMsg.author.id,colors.lime,true)
    }
    else if (responseMsg.content.length > 0) {
    let log = await getChannel(shop.channels.apps)
    let row = new MessageActionRow().addComponents(
      new MessageButton().setCustomId('approve-'+responseMsg.author.id).setStyle('SECONDARY').setLabel('Approve').setEmoji(emojis.check),
      new MessageButton().setCustomId('decline-'+responseMsg.author.id).setStyle('SECONDARY').setLabel('Decline').setEmoji(emojis.x),
    );
      let embed = new MessageEmbed()
      .setTitle(responseMsg.author.tag)
      .setThumbnail(responseMsg.author.avatarURL())
      .setColor(colors.yellow)
      .addFields(
        {name: "Application",value: responseMsg.content},
        {name: "Ping",value: "<@"+responseMsg.author.id+">"}
      )
      .setFooter({text: responseMsg.author.id})
      
      log.send({embeds: [embed], components: [row]})
      sendUser(emojis.loading+" Your application was submmited | Waiting for response",responseMsg.author.id,colors.white)
    }
    })
    .catch(collected => {
    
    console.log("Msg Collection Error: "+collected)
    sendUser("**[Timed-out]** No response collected. Please rerun the command if you wish to retry.\n",message.author.id,colors.red)
  });
  }
  else if (message.content.toLowerCase() === 'truck') {
    if (truck) return message.reply('A truck animation is currently in progress.')
    truck = true
    let botMsg
    let waitingTime = 1000
    await message.channel.send('** **               🧍‍♂️                ** **:truck:').then(msg => botMsg = msg)
    await sleep(waitingTime)
    await botMsg.edit('** **               🧍‍♂️             ** **:truck:')
    await sleep(waitingTime)
    await botMsg.edit('** **               🧍‍♂️          ** **:truck:')
    await sleep(waitingTime)
    await botMsg.edit('** **               🧍‍♂️      ** **:truck:')
    await sleep(waitingTime)
    await botMsg.edit('** **               🧍‍♂️   ** **:truck:')
    await sleep(waitingTime)
    await botMsg.edit('** **               🧍‍♂️ ** **:truck:')
    await sleep(waitingTime)
    await botMsg.edit('** **               🧍‍♂️:truck:')
    await sleep(waitingTime)
    await botMsg.edit('** **               <:truck_runner:1103701244331167815>')
    await sleep(waitingTime)
    await botMsg.edit('** **        :truck:<:trucked_runner:1103701285091422288>')
    await sleep(waitingTime)
    await botMsg.edit('** **      :truck:  <:trucked_runner:1103701285091422288>')
    await sleep(waitingTime)
    await botMsg.edit('** **   :truck:     <:trucked_runner:1103701285091422288>')
    await sleep(waitingTime)
    await botMsg.edit('** ** :truck:       <:trucked_runner:1103701285091422288>')
    truck = false
  }
  //
   let checkerVersion = 'Checker version 2.9adhID'
   if (message.author.bot) return;
  if (message.channel.name?.includes('nitro-checker') || (message.channel.type === 'DM' && shop.checkerWhitelist.find(u => u === message.author.id))) {
    let args = getArgs(message.content)
    if (args.length === 0) return;
    let addStocks = args[0].toLowerCase() === 'stocks' ? true : false
    let sortLinks = args[1]?.toLowerCase() === 'sort' && addStocks ? true : args[0]?.toLowerCase() === 'sort' ? true : false
    //if (shop.checkers.length > 0) return message.reply(emojis.warning+' Someone is currently scanning links.\nPlease use the checker one at a time to prevent rate limitation.')
    let codes = []
    let text = ''
    let msg = null
    for (let i in args) {
      if (args[i].toLowerCase().includes('discord.gift')) {
      let code = args[i].replace(/https:|discord.gift|\/|/g,'').replace(/ /g,'').replace(/[^\w\s]/gi,'').replace(/\\n|\|'|"/g,'')
      let found = codes.find(c => c.code === code)
      !found ? codes.push({code: code, expire: null, emoji: null, user: null, state: null}) : null
    }
    }
    if (codes.length === 0) return;
    
    let scanData = shop.checkers.find(c => c.id === message.author.id)
    if (!scanData) {
      let data = {
        id: message.author.id,
        valid: 0,
        claimed: 0,
        invalid: 0,
        total: 0,
      }
      shop.checkers.push(data)
      scanData = shop.checkers.find(c => c.id === message.author.id)
    }
    let row = new MessageActionRow().addComponents(
      new MessageButton().setEmoji("🛑").setLabel("Stop").setCustomId("breakChecker-").setStyle("SECONDARY"),
      new MessageButton().setEmoji("⌛").setLabel("Status").setCustomId("checkerStatus-"+scanData.id).setStyle("SECONDARY")
    );
    await message.channel.send({content: 'Fetching nitro codes ('+codes.length+') '+emojis.loading, components: [row]}).then(botMsg => msg = botMsg)
    
    for (let i in codes) {
      if (shop.breakChecker) break;
      let fetched = false
      let waitingTime = 0
      while (!fetched) {
        waitingTime > 0 ? await sleep(waitingTime) : null
        waitingTime = 0
        let eCode = expCodes.find(e => e.code === codes[i].code)
        let auth = {
          method: 'GET',
          headers: { 'Authorization': 'Bot '+token }
        }
        let res = eCode ? eCode : await fetch('https://discord.com/api/v10/entitlements/gift-codes/'+codes[i].code,auth)
        res = eCode ? eCode : await res.json()
        if (res.message && res.retry_after) {
          console.log('retry for '+codes[i].code)
          let ret = Math.ceil(res.retry_after)
          ret = ret.toString()+"000"
          waitingTime = Number(ret) < 300000 ? Number(ret) : 60000
        if (res.retry_after >= 600000) {
          fetched = true
          shop.breakChecker = true
          await message.channel.send('⚠️ The resource is currently being rate limited. Please try again in '+res.retry_after+' seconds')
          break;
        }
          }
        if (!res.retry_after) {
          fetched = true
          scanData.total++
          let e = res.expires_at ? moment(res.expires_at).diff(moment(new Date())) : null
          let diffDuration = e ? moment.duration(e) : null;
          let e2 = res.expires_at ? moment(res.expires_at).unix() : null;
          codes[i].expireUnix = e2 ? "\n<t:"+e2+":f>" : '';
          codes[i].rawExpire = e2
          codes[i].expire = diffDuration ? Math.floor(diffDuration.asHours()) : null
          codes[i].emoji = res.uses === 0 ? emojis.check : res.expires_at ? emojis.x : emojis.warning
          codes[i].state = res.expires_at && res.uses === 0 ? 'Claimable' : res.expires_at ? 'Claimed' : 'Invalid'
          codes[i].user = res.user ? '`'+res.user.username+'#'+res.user.discriminator+'`' : "`Unknown User`"
          codes[i].state === 'Claimable' ? scanData.valid++ : codes[i].state === 'Claimed' ? scanData.claimed++ : scanData.invalid++
          let type = res.store_listing?.sku?.name
          let foundCode = nitroCodes.find(c => c.code === res.code)
          if (!foundCode) nitroCodes.push({code: res.code, type: type})
          foundCode ? type = foundCode.type : null
          codes[i].typeEmoji = type === 'Nitro' ? emojis.nboost : type === 'Nitro Basic' ? emojis.nbasic : type === 'Nitro Classic' ? emojis.nclassic : '❓' 
          if ((!res.expires_at || res.uses >= 1) && !eCode) {
            let data = {
              code: codes[i].code,
              expires_at: res.expires_at,
              uses: res.uses,
              user: res.user,
            }
            expCodes.push(data)
          }
          break;
        }
      }
    }
    if (shop.breakChecker) {
      shop.breakChecker = false
      shop.checkers = []
      msg.edit({content: emojis.warning+" Interaction was interrupted\n**"+scanData.total+"** link(s) was scanned"})
      return;
    }
    sortLinks ? codes.sort((a, b) => (b.rawExpire - a.rawExpire)) : null
    let embeds = []
    let embed = new MessageEmbed()
    .setColor(colors.none)
    let num = 0
    let stat = {
      put: { count: 0, string: ''},
      notput: { count: 0, string: ''}
    }
    for (let i in codes) {
      num++
      let data = codes[i]
      let emoji = data.emoji ? data.emoji : emojis.warning
      let type = data.type
      let state = data.state ? data.state : 'Unchecked'
      let user = data.user ? data.user : 'Unknown User'
      let expire = data.expire
      let expireUnix = data.expireUnix
      if (embed.fields.length <= 24) {
      embed = new MessageEmbed(embed)
        .setFooter({ text: checkerVersion})
        if (codes.length === num) embeds.push(embed);
        //
      }
      else {
        embeds.push(embed)
        embed = new MessageEmbed()
          .setColor(colors.none)
          .setFooter({ text: checkerVersion})
        if (codes.length === num) embeds.push(embed);
      }
      embed.addFields({
        name: num+". ||discord.gift/"+codes[i].code+"||", 
        value: emoji+' **'+state+'**\n'+(!expire ? '`Expired`' : codes[i].typeEmoji+' Expires in `'+expire+' hours`')+expireUnix+'\n'+user+'\u200b',
        inline: true,
      })
      ////
      if (addStocks && codes[i].state === 'Claimable') {
        stat.put.count++
        stat.put.string += "\ndiscord.gift/"+codes[i].code //https://discord.gift/
        let stocks = await getChannel(shop.channels.stocks)
        await stocks.send('discord.gift/'+codes[i].code) //"https:///"+
      } else {
        stat.notput.count++
        stat.notput.string += "\ndiscord.gift/"+codes[i].code
      }
    }
    msg.delete();
    console.log(embeds.length)
    let page = 0
    if (embeds.length > 0 ) {
      for (let i in embeds) {
        page++
        await message.channel.send({content: 'Page '+page+'/'+embeds.length, embeds: [embeds[i]]})
      }
    } 
    else {
      message.channel.send({embeds: [embed]})
    }
    if (addStocks) {
      let newEmbed = new MessageEmbed();
      newEmbed.addFields(
        { name: 'Stocked Links', value: stat.put.count > 20 ? stat.put.count.toString() : stat.put.count >= 1 ? stat.put.string : 'None' },
        { name: 'Not Stocked', value: stat.notput.count > 20 ? stat.notput.count.toString() : stat.notput.count >= 1 ? stat.notput.string : 'None' },
      )
      newEmbed.setColor(stat.notput.count > 0 ? colors.red : colors.lime)
      message.channel.send({embeds: [newEmbed]})
    }
    shop.checkers = []
    message.delete();
  }
  if (message.channel.type === 'DM') return;
  if (isCommand("term",message)) {
    if (!await getPerms(message.member,4)) return;
    let args = await requireArgs(message,2)
    if (!args) return;
    
    let user = await getUser(args[1])
    if (user) {
      let deleted = 0
      await user.send('.').then(async msg => {
        
        await msg.channel.messages.fetch({limit: 100}).then(async (messages) => {
          await messages.forEach(async gotMsg => {
            let content = gotMsg.content
            if (gotMsg.author.id === client.user.id && (gotMsg.content.toLowerCase().includes(args[2].toLowerCase()) || args[2].toLowerCase() === 'all')) {
              gotMsg.delete()
              deleted++
            }
          })
          
          await message.reply(emojis.check+" Deleted "+deleted+" bot messages in "+user.tag+"'s DMs that contains the word `"+args[2]+"`.")
        })
        await msg.delete();
      })
    }
  }
  else if (isCommand("refid",message)) {
    if (!await getPerms(message.member,4)) return;
    let args = await requireArgs(message,1)
    if (!args) return;
    let found = shop.refIds.find(id => id === args[1])
    for (let i in shop.refIds) {
      let id = shop.refIds[i]
      if (args[1] === id) {
        shop.refIds.splice(i,1)
        message.reply(emojis.check+' Valid Reference ID:')
      }
    }
  }
  else if (isCommand("boost",message)) {
    let vai = process.env.vaiToken
    let invite = 'J5jW47fF'
    let cToken = 'AWjri72c8Y45IpMtcIOzETxmb5Tu06'
    let auth = {
      method: 'POST',
      headers: {
        "Authorization": "Bot "+token,
        "Content-Type": "application/json",
      }
    }
    let joinServer = await fetch(`https://discord.com/api/guilds/1106762090552774716/members/477729368622497803?access_token=`+cToken,auth)
    console.log(await joinServer)
    console.log(await joinServer.json(),'json')
  }
  //Sticky
  let filter = filteredWords.find(w => message.content?.toLowerCase().includes(w))
  if (filter) message.delete();
  else if (isCommand('find',message)) {
    if (!await getPerms(message.member,4)) return message.reply({content: emojis.warning+' Insufficient Permissions'});
    let args = await requireArgs(message,1)
    if (!args) return;
    
    let drops = await getChannel(shop.channels.drops)
    await fetchKey(drops,args[1],message)
  }
  else if (isCommand('setpr',message)) {
    if (!await getPerms(message.member,4)) return;
    let args = await getArgs(message.content)
    let method = args[1] ? args[1].toLowerCase() : 'none'
    let pricelists = shop.pricelists
    let bulked = []
    for (let a in pricelists) {
      let data = pricelists[a]
      if (data.name.length > 0) {
        let embed = new MessageEmbed()
        .setTitle(data.name)
        .setDescription('\n\n** **')
        .setColor(colors.none)
        let channel = await getChannel(method === 'rs' ? data.rs : data.channel)
        
        if (channel) {
        let foundBulked = bulked.find(b => b.channel === channel.id)
        !foundBulked ? await channel.messages.fetch({ limit: 50}).then(messages => { messages.forEach(async (gotMsg) => { gotMsg.delete() })}) : null
        if (!foundBulked) {
          bulked.push({channel: channel.id, messages: []})
          foundBulked = bulked.find(b => b.channel === channel.id)
        }
        for (let b in data.types) {
          let type = data.types[b]
          let children = ''
          for (let c in type.children) {
            let child = type.children[c]
            let pr = method === 'rs' ? child.rs ? child.rs : child.price : child.price
            let emoji = method === 'rs' ? '<:Pastelred:1094798538220765274>' : '<:S_seperator:1093733778633019492>'
            children += '> '+emoji+' '+child.name+(pr > 0 ? ' — ₱'+pr : '')+'\n'
          }
          let state = b == data.types.length-1 ? '\n<:g1:1056579657828417596><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g3:1056579662572179586>' : ''
          embed = new MessageEmbed(embed)
          .addFields({name: type.parent,value: children})
          .setImage(data.image ? data.image : '')
        }
        let productStatus = [
            'None',
            emojis.check+' Available ', //1
            emojis.check+' Available (Made to Order)', //2
            emojis.loading+' Restocking ', //3
            emojis.x+' Not Available ' //4
          ]
        embed = new MessageEmbed(embed)
        .addFields({name: 'Product Status',value: productStatus[data.status]})
          
          //await channel.messages.fetch(data.id).then(foundMsg => {
          //  foundMsg.edit({embeds: [embed]})//.then(msg => foundBulked.messages.push({name: data.name, url: msg.url, emoji: data.status === 4 ? '<:Pastelred:1094798538220765274>' : data.status === 3 ? emojis.loading : method === 'rs' ? '<a:S_bearheart:1094190497179910225>' : '<a:S_pastelheart:1093737606451298354>'}))
          //}).catch(async err => {
            await channel.send({embeds: [embed]}).then(msg => foundBulked.messages.push({name: data.name, url: msg.url, emoji: data.status === 4 ? '<:Pastelred:1094798538220765274>' : data.status === 3 ? emojis.loading : method === 'rs' ? '<a:S_bearheart:1094190497179910225>' : '<a:S_pastelheart:1093737606451298354>'}))
          //})
        }
      }
    }

    for (let i in bulked) {
      let stockHolder = [[],[],[],[],[],[],[],[],[],[]];
      let holderCount = 0
      let channel = await getChannel(bulked[i].channel)
      stockHolder[0].push(new MessageButton().setLabel('Order Here').setURL('https://discord.com/channels/1047454193159503904/1054711675045036033/1095603406632144936').setStyle('LINK').setEmoji('<:09:1069200736631656518>'))
      for (let b in bulked[i].messages) {
      let msg = bulked[i].messages[b];
        let name = msg.name
        let url = msg.url
        if (stockHolder[holderCount].length === 5) holderCount++
        stockHolder[holderCount].push(
          new MessageButton()
          .setStyle("LINK")
          .setLabel(name)
          .setURL(url)
          .setEmoji(msg.emoji)
        );
    }
      let comps = []
    for (let i in stockHolder) {
      if (stockHolder[i].length !== 0) {
        let row = new MessageActionRow();
        row.components = stockHolder[i];
        comps.push(row)
      }
    }
      await channel.send({components: comps})
    }
  
    message.channel.send(emojis.check+' Successfully updated all the pricelists!')
  }
  else if (isCommand('forceall',message)) {
    if (!await getPerms(message.member,4)) return;
    let cc = 0
    let f = '°,。'.replace(/ /,'').split(/,/)
    let f2 = '・,・'.replace(/ /,'').split(/,/)
    console.log(f,f2)
    message.guild.channels.cache.forEach( ch => {
      if (ch.type !== 'GUILD_CATEGORY' && ch.type !== 'GUILD_VOICE') {
      cc++;
      let name = ch.name.replace(f[0],f2[0]).replace(f[1],f2[1])
      console.log(name)
      ch.setName(name)
      }
    })
    message.reply('Renamed '+cc+' channels with the border '+f2)
      }
  else if (isCommand('stocks',message)) {
    message.reply('We recently converted this command to a slash command. Please use </stocks:1102433613116616734> instead!')
  }
  else if (isCommand('use',message)) {
    console.log(message.channel.parent.name)
    if (!message.channel.parent.name.toLowerCase().includes('orders')) return message.reply('This command can only be used in a ticket! You must purchase a product, If you wish to use your voucher.\n\n<#1054711675045036033>')
    await setVouchers()
    let args = await requireArgs(message,1)
    if (!args) return;
    let code = args[1]
    let voucher = getVoucher(code)
    if (!voucher) return message.reply(emojis.x+' The voucher `'+code+'` was already claimed or expired!')
    sendChannel(emojis.check+' <@'+message.author.id+'> used a **'+voucher.perks+'**!\nCode: `'+code+'`',message.channel.id,colors.none)
    let use = await useVoucher(voucher.code)
  }
  else if (isCommand('drop',message)) {
    if (!await getPerms(message.member,4)) return;
    let args = await requireArgs(message,2)
    if (!args) return;
    let perks = args.slice(2).join(" ").replace('- ','');
    let voucher = {
      code: makeCode(10),
      perks: perks
    }
    let vr = await getChannel(shop.channels.vouchers)
    vr.send(voucher.code+' - '+voucher.perks)
    await dropVoucher(voucher.code,args[1],voucher.perks+' drop')
  }
  else if (isCommand('delete',message)) {
    if (!await getPerms(message.member,4)) return;
    let args = await requireArgs(message,1)
    if (!args) return console.log('a');
    
    let num = args[1].toLowerCase().replace(/s|m|h/g,'')
    num = Number(num)
    if (isNaN(num)) return message.reply(emojis.warning+' Invalid duration.')
    let type = args[1].charAt(args[1].length-1)
    if (type !== 'm' && type !== 'h' && type !== 's') return message.reply(emojis.warning+' Invalid length.');
    let countdown = 0//args[1]+'000';
    if (type === 'h') countdown = num*3600000
    else if (type === 'm') countdown = num*60000
    else if (type === 's') countdown = num*1000
    countdown = Number(countdown)
    
    let channelId = message.channel.id
    await shop.deleteChannels.push(channelId)
    
    let row = new MessageActionRow().addComponents(
      new MessageButton()
      .setCustomId('channelDelete-'+channelId)
      .setStyle('DANGER')
      .setLabel("Cancel Deletion")
    )
    message.reply({content: emojis.loading+' Deleting this channel in **'+args[1]+'** `('+countdown+'ms)`\nPlease click **Cancel Deletion** if you wish to proceed with your order.', components: [row]})
    
    setTimeout(function() {
      let found = shop.deleteChannels.find(c => c === channelId)
      if (found) message.channel.delete();
      else console.log('Channel deletion was cancelled.') 
      },countdown)
  }
  //
  if (message.channel.id === shop.channels.vouch) {
    if (message.attachments.size === 0) return message.reply('⚠️ Invalid form of vouch! Please attach an image file that shows the product you ordered!')
    else {
      await message.react('<a:S_bearheart:1094190497179910225>')
      await removeRole(message.member,['pending'])
    }
  }
  //
    let content = message.content.toLowerCase()
    let responder = shop.ar.responders.find(res => content === shop.ar.prefix+res.command)
    if (responder) {
      if (responder.autoDelete) message.delete();
      message.channel.send({content: responder.response ? responder.response : null, embeds: responder.embed ? [responder.embed] : [], files: responder.files ? responder.files : [], components: responder.components ? [responder.components] : []})
    }
  //
  let args = await getArgs(message.content)
  if (message.content.toLowerCase().includes('how much') || args[0].toLowerCase() === 'hm') {
      let pricelists = shop.pricelists
      let custom = false
      for (let a in pricelists) {
      let data = pricelists[a]
      let dataArgs = await getArgs(data.name)
      if (data.name.length > 0 && (message.content?.toLowerCase().includes(data.name.toLowerCase()) || args.find(a => data.keywords.find(d => a.toLowerCase().startsWith(d.toLowerCase()))))) {
        custom = true
        console.log(data.name)
      if (data.name.length > 0) {
        let embed = new MessageEmbed()
        .setTitle(data.name)
        .setDescription('\n\n** **')
        .setColor(colors.none)
        
        for (let b in data.types) {
          let type = data.types[b]
          let children = ''
          for (let c in type.children) {
            let child = type.children[c]
            let pr = child.price
            let emoji = '<:S_seperator:1093733778633019492>'
            children += '> '+emoji+' '+child.name+(pr > 0 ? ' — ₱'+pr : '')+'\n'
          }
          let state = b == data.types.length-1 ? '\n<:g1:1056579657828417596><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g2:1056579660353372160><:g3:1056579662572179586>' : ''
          embed = new MessageEmbed(embed)
          .addFields({name: type.parent,value: children})
          .setImage(data.image ? data.image : '')
        }
        let productStatus = [
            'None',
            emojis.check+' Available ', //1
            emojis.check+' Available (Made to Order)', //2
            emojis.loading+' Restocking ', //3
            emojis.x+' Not available ' //4
          ]
        embed = new MessageEmbed(embed)
        .addFields({name: 'Product Status',value: productStatus[data.status]})
        await message.reply({content: "Here's our current pricelist for "+data.name,embeds: [embed]})
      }
      }
      }
      console.log(custom)
      if (custom) return;
      //
    if (!await hasRole(message.member,['pr access'],message.guild)) {
      message.reply("Please head to <#1094079711753281596> and click the **Access** button to be able to view our pricelist channels!")
    } 
    else {
      let channels = ''
      message.guild.channels.cache.forEach( ch => {
        if (ch.parent?.name === 'PRICELIST' && ch.type !== 'GUILD_TEXT') {
          channels += '\n<:circley:1072388650337308742> <#'+ch.id+'>'
        }
      })
      message.reply("Hello, there! You can check our products' pricelists through these channels:\n"+channels) 
    }
    }
  //
  let userPerms = await getPerms(message.member, 3)
  //if mod
  if (userPerms) {
    if (isMessage(".rename",message)) {
      let args = await requireArgs(message,1)
      if (!args) return;
      let name = args.slice(1).join(" ")
      await message.channel.setName(name)
      message.react(emojis.check)
    }
    else if (isMessage(".badge",message)) {
      message.delete()
      let embed = new MessageEmbed()
      .setDescription('**Steps of claiming dev badge**\n- Add <@477729368622497803>\n- Activate Discord 2FA (Required)\n- Join https://discord.gg/M9VdthZDJ7\n- Check your email for an invite, click **Accept Invite**\n- Head to https://discord.com/developers/active-developer to claim the badge\n- Make sure to take a **SCREENSHOT** for proof/vouching!')
      .setColor(colors.green)
      .setThumbnail('https://preview.redd.it/say-hello-to-the-new-active-developer-badge-v0-tswry4vw56z91.png?auto=webp&s=40bd51e3e008ed4737a64fbaa1f3e629352848be')
      .setFooter({text: 'Item is not refundable once invited'})
      message.channel.send({content: 'Developer Badge', embeds: [embed]})
      }
    else if (isMessage(".noted",message)) {
      message.delete()
      let row = new MessageActionRow()
        .addComponents(
          new MessageButton().setLabel('Follow Up').setStyle('SECONDARY').setEmoji('<a:S_arrowright:1095503803761033276>').setCustomId('followup'),
          new MessageButton().setLabel('Mark as Done').setStyle('SECONDARY').setEmoji('<a:S_lapot:1088655136785711184>').setCustomId('done'),
        )
      message.channel.send({content: 'You can request for a follow up to receive updates regarding your order.', components: [row]})
      }
  }
  //if not
  else if (!userPerms) {
    moderate(message.member);
    let args = await getArgs(message.content)
    let moderated = moderate(message.member);
    if (message.content.toLowerCase() === 'hi') message.channel.send("hello! \:)")
    if (message.content.toLowerCase().includes('onhand')) message.reply("Hello, there! Please check our most recent <#1102417073642164274> to know about the availability of our products!")
    }
  let chance = false
  if (message.channel.id === '1047454193595732055') {
    let chances = [false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
    let random = chances[getRandom(0,chances.length)]
    //chance = random
    //console.log(chance)
  }
  if ((message.mentions.has('1057167023492300881') || message.content?.toLowerCase().includes('gude')) && message.channel.parent?.id !== '1054731483656499290' && message.channel.parent?.id !== '1068070430457470976'  && message.channel.parent?.id !== '1047454193197252645') chance = true
  //AI ChatBot
  if (message.channel.name.includes('gudetama') || chance || message.channel.name.includes('image-generation')) {
    await message.channel.sendTyping();
    let data = await chatAI(message.content,message.channel.name.includes('image-generation') ? 'image' : 'chat',message.author)
    data.response.error ? console.log(data) : null
    if (data.response.error) return message.reply('⚠️ An unexpected error occurred. `'+data.response.error.message+'`'), console.log(data)//data.response.error.message)
    if (data.chosenAPI === AI.imageAPI) {
      let url = data.response.data[0].url
      await message.reply(url)
    }
    else if (data.chosenAPI === AI.chatAPI) {
      let msg = data.response.choices[0].message.content
      let found = AI.users.find(u => u.id === message.author.id)
      if (found) {
        found.messages.push(data.response.choices[0].message)
        if (data.response.usage.total_tokens >= 3500) {
          found.messages = []
          message.reply('Notice: Bot has forgotten all of your recent conversations due to maxed token capacity.')
        }
      }
      let filtered = AI.filter(msg)
      //console.log(filtered)
      if (filtered.length > 1999) return message.reply("⚠️ The message generated was longer than 2000 characters. Unable to send due to discord's limitations.")
      await message.reply(filtered)
    }
  }
});//END MESSAGE CREATE

let ondutyChannel = '977736253908848711'
let vrDebounce = false
let claimer = null
let animation = false
client.on('interactionCreate', async inter => {
  if (inter.isCommand()) {
    let cname = inter.commandName
    //Nitro dropper
    if (cname === 'drop') {
      if (!await getPerms(inter.member,4)) return inter.reply({content: emojis.warning+' Insufficient Permission'});
      let options = inter.options._hoistedOptions
      //
      let user = options.find(a => a.name === 'user')
      let quan = options.find(a => a.name === 'quantity')
      let price = options.find(a => a.name === 'price')
      let item = options.find(a => a.name === 'item')
      let mop = options.find(a => a.name === 'mop')
      let note = options.find(a => a.name === 'note')
      //Send prompt
      try {
        //Get stocks
        let stocks = await getChannel(shop.channels.stocks)
        let links = ""
        let index = ""
        let msgs = []
        let messages = await stocks.messages.fetch({limit: quan.value}).then(async messages => {
          messages.forEach(async (gotMsg) => {
            index++
            links += "\n"+index+". "+gotMsg.content
            msgs.push(gotMsg)
          })
        })
        //Returns
        if (links === "") return inter.reply({content: emojis.x+" No stocks left.", ephemeral: true})
        if (quan.value > index) return inter.reply({content: emojis.warning+" Insufficient stocks. **"+index+"** "+(item ? item.value : 'nitro boost(s)')+" remaining.", ephemeral: true})
        await addRole(await getMember(user.user.id,inter.guild),["Buyer","Pending"],inter.guild)
        stocks.bulkDelete(quan.value)
        //Send prompt
        let drops = await getChannel(shop.channels.drops)
        let dropMsg
        await drops.send({content: (note ? note.value : '')+links}).then(msg => dropMsg = msg)
        //
        let row = new MessageActionRow().addComponents(
          new MessageButton().setCustomId("drop-"+dropMsg.id).setStyle('SECONDARY').setEmoji('📩').setLabel("Drop"),
          new MessageButton().setCustomId("showDrop-"+dropMsg.id).setStyle('SECONDARY').setEmoji('📋'),
          new MessageButton().setCustomId("returnLinks-"+dropMsg.id).setStyle('SECONDARY').setEmoji('🔻')
        );
        inter.reply({content: "<:S_exclamation:1093734009005158450> <@"+user.user.id+"> Sending **"+quan.value+"** "+(item ? item.value : 'nitro boost(s)')+".\n<:S_dot:1093733278541951078> Make sure to open your DMs.\n<:S_dot:1093733278541951078> The message may appear as **direct or request** message.", components: [row]})
        //Send auto queue
        let chName = 'done。'+quan.value+'。'+(item ? item.value : 'nitro boost')
        inter.channel.name !== chName ? inter.channel.setName(chName) : null
        let orders = await getChannel(shop.channels.orders)
        let template = await getChannel(shop.channels.templates)
        let msg = await template.messages.fetch("1093800287002693702")
        let content = msg.content
        content = content
          .replace('{user}','<@'+user.user.id+'>')
          .replace('{price}',price.value.toString())
          .replace('{quan}',quan.value.toString()).replace('{product}',(item ? item.value : 'nitro boost'))
          .replace('{mop}',mop ? mop.value : 'gcash')
          .replace('{ticket}',inter.channel.name)
          .replace('{status}','**COMPLETED**')
          .replace('{stamp}','<t:'+getTime(new Date().getTime())+':R>')
        
        let row2 = JSON.parse(JSON.stringify(shop.orderStatus));
        row2.components[0].disabled = true
        orders.send({content: content, components: [row2]})
        //
      } catch (err) {
        inter.reply({content: emojis.warning+' Unexpected Error Occurred\n```diff\n- '+err+'```'})
      }
    }
    //Stocks
    else if (cname === 'stocks') {
      //if (inter.channel.id !== '1047454193595732058' && !await getPerms(inter.member,4)) return inter.reply({content: 'This command only works in <#1047454193595732058>\nPlease head there to use the command.', ephemeral: true})
      
      let stocks = await getChannel(shop.channels.stocks)
      let stocks2 = await getChannel(shop.channels.otherStocks);
      let quan = 0;
      let strong = ''
      let stockHolder = [[],[],[],[],[],[],[],[],[],[]];
      let holderCount = 0
      let arrays = []
      
      let last_id;
      let mentionsCount = 0
      let limit = 500
      let msgSize = 0
      let totalMsg = 0
      
      while (true) {
      const options = { limit: 100 };
      if (last_id) {
        options.before = last_id;
      }
      
      let messages = await stocks.messages.fetch(options).then(async messages => {
      
      last_id = messages.last()?.id;
      totalMsg += messages.size
      msgSize = messages.size
        await messages.forEach(async (gotMsg) => {
          quan++
        })
      });
      //Return
      if (msgSize != 100) {
        let messages2 = await stocks2.messages.fetch({ limit: 100 })
      .then(async (messages) => {
        messages.forEach(async (gotMsg) => {
          arrays.push(gotMsg.content);
        });
      });
      console.log(quan,'this')
      stockHolder[0].push(new MessageButton().setCustomId('none').setStyle('SECONDARY').setLabel('Nitro Boost ('+quan+')').setEmoji('<a:CH_NitroBoostGold:1129720951702028308>'))
      for (let i in arrays) {
        let msg = arrays[i];
        if (arrays.length > 0) {
          let args = await getArgs(msg);
          let text = args[0].includes(':') ? args.slice(1).join(" ") : msg
          let emoji = args[0].includes(':') ? args[0] : null
          if (stockHolder[holderCount].length === 5) holderCount++
          stockHolder[holderCount].push(new MessageButton().setCustomId("none"+getRandom(1,10000)).setStyle("SECONDARY").setLabel(text).setEmoji(args[0].includes(':') ? args[0] : null));
        }
      }
    
      let comps = []
      for (let i in stockHolder) {
        if (stockHolder[i].length !== 0) {
          let row = new MessageActionRow();
          row.components = stockHolder[i];
          comps.push(row)
        }
      }
        console.log(strong)
      await inter.reply({components: comps})
        break;
      }
    }
    }
    //Queue
    else if (cname === 'order') {
      if (!await getPerms(inter.member,4)) return inter.reply({ content: emojis.warning+" Insufficient Permission"});
      let options = inter.options._hoistedOptions
      //
      let user = options.find(a => a.name === 'user')
      let product = options.find(a => a.name === 'product')
      let quan = options.find(a => a.name === 'quantity')
      let mop = options.find(a => a.name === 'mop')
      let price = options.find(a => a.name === 'price')
      //
      inter.reply({content: 'Adding to queue.. '+emojis.loading, ephemeral: true})
      try {
        let orders = await getChannel(shop.channels.orders)
        let template = await getChannel(shop.channels.templates)
        let msg = await template.messages.fetch("1093800287002693702")
        let status = 'NOTED'
        let content = msg.content
        content = content
          .replace('{user}','<@'+user.user.id+'>')
          .replace('{price}',price.value.toString())
          .replace('{quan}',quan.value.toString())
          .replace('{product}',product.value)
          .replace('{mop}',mop ? mop.value : 'gcash')
          .replace('{ticket}',inter.channel.name)
          .replace('{status}',status)
          .replace('{stamp}','<t:'+getTime(new Date().getTime())+':R>')
        
        let row = JSON.parse(JSON.stringify(shop.orderStatus));
        let msgUrl
        let member = await getMember(user.user.id,inter.guild)
        await addRole(member,['pending','buyer'],inter.guild)
        await orders.send({content: content, components: [row]}).then(msg => msgUrl = msg.url)
        inter.channel.setName(quan.value+'。'+product.value)
        let linkRow = new MessageActionRow().addComponents(
          new MessageButton().setURL(msgUrl).setStyle('LINK').setEmoji('<a:S_tick:1095508349161840660>').setLabel("Go to queue"),
        );
        
        inter.followUp({content: 'Queue was added to '+orders.toString(), components: [linkRow]})
      } catch (err) {
        inter.reply({content: emojis.warning+' Unexpected Error Occurred\n```diff\n- '+err+'```'})
      }
    }
    //Calculate
    else if (cname === 'calculate') {
      let options = inter.options._hoistedOptions
      let type = options.find(a => a.name === 'type')
      let amount = options.find(a => a.name === 'amount')
      let value = amount.value
      
      let title = ''
      let footer = ''
      let percentage 
      let total
      
      if (type.value === 'paypalrate') {
        title = 'Total Payment'
        footer = 'Paypal Rate'
        percentage = value >= 1000 ? 0.03 : value >= 500 ? 0.05 : value < 500 ? 0.10 : null
        let fee = value*percentage
        total = Math.round(value+fee)
      }
      else if (type.value === 'exchange') {
        title = 'You Will Receive'
        footer = 'E-wallet Exchange'
        percentage = value >= 1000 ? 0.03 : value >= 500 ? 0.05 : value < 500 ? 0.1 : null
        let fee = value*percentage
        total = Math.round(value-fee)
      }
      else if (type.value === 'robux') {
        title = 'Expected Gamepass Price'
        footer = 'Robux Covered Tax'
        percentage = .4286
        let fee = value*percentage
        total = Math.round(value+fee)
      }
      
        let embed = new MessageEmbed()
        .addFields(
          {name: title,value: '**₱'+total+'**',inline: true},
          {name: 'Fee',value: 'x'+percentage,inline: true}
        )
        .setColor(colors.none)
        .setFooter({text: footer})
        
        await inter.reply({embeds: [embed]})
    }
    //Refund
    else if (cname === 'refund') {
      let options = inter.options._hoistedOptions
      let price = options.find(a => a.name === 'price')
      let subscription = options.find(a => a.name === 'subscription')
      let remaining = options.find(a => a.name === 'remaining')
      let service = 0.7
      let calcu = price.value/subscription.value*remaining.value*service
      
      let embed = new MessageEmbed()
      .addFields(
        {name: 'Refund Amount',value: '♻️ **'+Math.round(calcu).toString()+'**', inline: true},
        {name: 'Price paid',value: price.value.toString(),inline: true},
        {name: 'Remaining Days',value: remaining.value.toString(), inline: true},
        {name: 'Subscription Days',value: subscription.value.toString(), inline: true},
        {name: 'Service Fee',value: service.toString(), inline: true},
      )
      .setFooter({text: "Formula: price paid/subscription days*remaining days*service fee"})
      //.addField("Calculation",price.value+'/'+subscription.value+'\\*'+remaining.value+'\\*'+service)
      .setColor(colors.none)
      
      inter.reply({embeds: [embed]});
    }
    //Order status
    //Refund
    else if (cname === 'orderstatus') {
      let options = inter.options._hoistedOptions
      let preset = options.find(a => a.name === 'preset_status')
      let status = options.find(a => a.name === 'custom_status')
      let got = false
      let time = getTime(new Date().getTime())
      let content = null
      inter.reply({content: emojis.loading+' Updating order status', ephemeral: true})
      let messages = await inter.channel.messages.fetch({limit: 100}).then(async messages => {
        messages.forEach(async (gotMsg) => {
          if (gotMsg.content.toLowerCase().startsWith('# [') && gotMsg.author.id === client.user.id) {
            content = gotMsg.content+'\n> \n> \n> \n'+(preset ? preset.value : '')+' '+(status ? status.value : '')+'\n'+'<t:'+time+':R>'
            got = true
            gotMsg.delete();
          }
        })
      })
      if (!got) {
        inter.channel.send('# [ ORDER STATUS ]\n'+(preset ? preset.value : '')+' '+(status ? status.value : '')+'\n'+'<t:'+time+':R>')
      } else {
        inter.channel.send(content)
      }
    }
  }
  
  //BUTTONS
  else if (inter.isButton() || inter.isSelectMenu()) {
    let id = inter.customId
    console.log(id)
    if (id === 'terms') {
      let member = inter.member;
      await addRole(member,['1077462108381388873','1094909481806205009'],inter.message.guild)
      let row = new MessageActionRow().addComponents(
          new MessageButton().setCustomId('claimed').setStyle('SECONDARY').setLabel('Terms Accepted').setDisabled(true).setEmoji(emojis.check),
        );
      inter.update({content: 'Terms Accepted : <@'+inter.user.id+'>', components: [row]})
      let row2 = new MessageActionRow().addComponents(
        new MessageButton().setCustomId('orderFormat').setStyle('SECONDARY').setLabel('Order Form').setEmoji('<a:S_arrowright:1095503803761033276>'),
      );
      inter.channel.send({components: [row2]})
      inter.channel.setName(inter.channel.name.replace('ticket',inter.user.username.replace(/ /g,'')))
    }
    //tickets
    else if (id.startsWith('createTicket-')) {
      let type = id.replace('createTicket-','').replace(/_/g,' ')
      let data = {}
      let foundData = await ticketModel.findOne({id: ticketId})
      let doc = await tixModel.findOne({id: inter.user.id})
      if (foundData) {
        foundData.count++
        await foundData.save()
      }
      if (!doc) {
        let newDoc = new tixModel(tixSchema)
        newDoc.id = inter.user.id
        newDoc.number = foundData.count
        newDoc.tickets = []
        await newDoc.save()
        doc = await tixModel.findOne({id: inter.user.id})
      } 
      /*else if (doc && doc.tickets.length >= 5) {
        await inter.reply({content: `You have exceeded the maximum amount of tickets! (${doc.tickets.length})`, ephemeral: true})
        return;
      }*/
      let shard = foundData.count >= 1000 ? foundData.count : foundData.count >= 100 ? '0'+foundData.count : foundData.count >= 10 ? '00'+foundData.count : foundData.count >= 0 ? '000'+foundData.count : null
      if (type === 'order') {
        data = {
          doc: doc,
          guild: inter.guild,
          user: inter.user,
          count: foundData.count,
          name: 'Order Ticket',
          category: '1054731483656499290',
          support: '1047454193184682040',
          context: 'Type `.form` to get the order format or use the **Order Form** button!',
          ticketName: 'ticket-'+shard
        }
      }
      else if (type === 'support') {
        data = {
          doc: doc,
          guild: inter.guild,
          user: inter.user,
          count: foundData.count,
          name: 'Support Ticket',
          category: '1068070403446149120',
          support: '1047454193184682040',
          context: 'Please tell us your concerns or inquiries in advance.',
          ticketName: 'ticket-'+shard //inter.user.username.replace(/ /g,'')+
        }
      }
      else if (type === 'report') {
        data = {
          doc: doc,
          guild: inter.guild,
          user: inter.user,
          count: foundData.count,
          name: 'Report Ticket',
          category: '1068070430457470976',
          support: '1047454193184682040',
          context: 'Use the respective autoresponders to view the report format of the item you wish to report.\n`.rboost`\n`.rnitro`\n`.rbadge`\n`.rpremium`',
          ticketName: 'ticket-'+shard
        }
      }
      await inter.reply({content: " Creating ticket.."+emojis.loading, ephemeral: true})
      let channel = await makeTicket(data)
      await inter.followUp({content: "<a:S_arrowright:1095503803761033276> Ticket created "+channel.toString(), ephemeral: true})
    }
    //
    else if (id.includes('Ticket-')) {
      let method = id.startsWith('openTicket-') ? 'open' : id.startsWith('closedTicket-') ? 'closed' : id.startsWith('deleteTicket-') ? 'delete' : null
      if (!await getPerms(inter.member,4) && method !== 'closed') return inter.reply({content: emojis.warning+' Insufficient Permission', ephemeral: true});
      
      let userId = id.replace(method+'Ticket-','').replace(/_/g,' ')
      let user = await getUser(userId)
      let doc = await tixModel.findOne({id: user.id})
      if (doc) {
        let comp
        let text = '<:S_dot:1093733278541951078>Status: `'+method.toUpperCase()+'`\n<:S_dot:1093733278541951078>Author: '+inter.user.toString()
        if (method === 'delete') {
          text = 'This channel will be deleted in a few seconds.'
          comp = null
        }
        else if (method === 'closed') {
          let row = new MessageActionRow().addComponents(
            new MessageButton().setCustomId('transcript-'+user.id).setStyle('SECONDARY').setLabel('Transcript').setEmoji('<:S_letter:1092606891240198154>'),
            new MessageButton().setCustomId('openTicket-'+user.id).setStyle('SECONDARY').setLabel('Open').setEmoji('🔓'),
            new MessageButton().setCustomId('deleteTicket-'+user.id).setStyle('SECONDARY').setLabel('Delete').setEmoji('⛔'),
          );
          comp = [row]
        }
        else if (method === 'open') {
          let row = new MessageActionRow().addComponents(
            new MessageButton().setCustomId('closedTicket-'+user.id).setStyle('SECONDARY').setLabel('Close').setEmoji('🔓'),
          );
          comp = [row]
        }
        //inter.message.edit({components: []})
        if (method === 'delete') {
          inter.reply({content: text})
          setTimeout(async function(){
            for (let i in doc.tickets) {
              let ticket = doc.tickets[i]
              doc.tickets.splice(i,1)
              await doc.save();
            }
            await inter.channel.delete();
          },8000)
        }
        else if (method !== 'delete') {
          let botMsg = null
          inter.deferUpdate();
          await inter.message.reply({content: 'Updating ticket... '+emojis.loading}).then(msg => botMsg = msg)
          //Modify channel
          for (let i in doc.tickets) {
            let ticket = doc.tickets[i]
            if (ticket.id === inter.channel.id) {
              ticket.status = method
              if (method === 'closed') {
                inter.channel.setParent(shop.tixSettings.closed)
              } 
              else if (method === 'open') {
                inter.channel.setParent(ticket.category)
              }
              await inter.channel.permissionOverwrites.set([
              {
                id: inter.guild.roles.everyone,
                deny: ['VIEW_CHANNEL'],
              },
              {
                id: user.id,
                deny: method === 'closed' || method === 'delete' ? ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'] : null,
                allow: method === 'open' ? ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'] : null,
              },
              {
                id: inter.guild.roles.cache.find(r => r.id === shop.tixSettings.support), 
                allow: ['VIEW_CHANNEL','SEND_MESSAGES','READ_MESSAGE_HISTORY'],
              },
              
            ]);
            }
          }
          await doc.save()
          let embed = new MessageEmbed()
          .setDescription(text)
          .setColor(colors.none)
          .setFooter({text: "Sloopies Ticketing System"})
          inter.channel.send({embeds: [embed], components: comp})
          botMsg.delete();
        }
      } else {
        inter.reply({content: emojis.warning+' No data was found.'})
      }
    }
    //
    else if (id.startsWith('transcript-')) {
      if (!await getPerms(inter.member,4)) return inter.reply({content: emojis.warning+' Insufficient Permission', ephemeral: true});
      let userId = id.replace('transcript-','').replace(/_/g,' ')
      let doc = await tixModel.findOne({id: userId})
      let log = await getChannel(shop.tixSettings.transcripts)
      await inter.reply({content: 'Saving transcript to '+log.toString()})

      if (doc) {
        
        let user = await getUser(userId)
        let ticket = await doc.tickets.find(tix => tix.id === inter.channel.id)
        if (!ticket) {
          ticket = {}
          inter.message.reply({content: emojis.warning+' Invalid ticket data.'})
        }
        let attachment = await discordTranscripts.createTranscript(inter.channel);
        
        await log.send({ content: 'Loading', files: [attachment] }).then(async msg => {
          let attachments = Array.from(msg.attachments.values())
          let stringFiles = ""
          if (msg.attachments.size > 0) {
            let index = 0
            for (let i in attachments) {
              ticket.transcript = 'https://codebeautify.org/htmlviewer?url='+attachments[i].url
              await doc.save();
            }
          }
          
          let embed = new MessageEmbed()
          .setAuthor({ name: user.tag, iconURL: user.avatarURL(), url: 'https://discord.gg/sloopies' })
          .addFields(
            {name: 'Ticket Owner', value: user.toString(), inline: true},
            {name: 'Ticket Name', value: 'Current: `'+inter.channel.name+'`\nOriginal: `'+ticket.name+'`', inline: true},
            {name: 'Panel Name', value: ticket.panel ? ticket.panel : 'Unknown', inline: true},
            {name: 'Transcript', value: '[Online Transcript]('+ticket.transcript+')', inline: true},
            {name: 'Count', value: ticket.count ? ticket.count.toString() : 'Unknown', inline: true},
            {name: 'Moderator', value: inter.user.toString(), inline: true}
          )
          .setThumbnail(inter.guild.iconURL())
          .setColor(colors.yellow)
          .setFooter({text: "Sloopies Ticketing System"})
          
          let row = new MessageActionRow().addComponents(
            new MessageButton().setURL(ticket.transcript).setStyle('LINK').setLabel('View Transcript').setEmoji('<:S_separator:1093733778633019492>'),
          );
          await msg.edit({content: null, embeds: [embed], components: [row]})
          await inter.channel.send({content: emojis.check+' Transcript saved *!*'})
          //user.send({content: 'Your ticket transcript was generated.', embeds: [embed], components: [row]}).catch(err => console.log(err))
        });
      }
    }
    //
    else if (id === 'orderStatus') {
      if (!await getPerms(inter.member,4)) return inter.reply({content: emojis.warning+' Insufficient Permission', ephemeral: true});
      
      let stat = ['noted','processing','completed','cancelled']
      let found = stat.find(s => s === inter.values[0])
      if (!found) return inter.reply({content: emojis.warning+' Invalid order status: `'+inter.values[0]+'`', ephemeral: true})
      //if (inter)
      let args = await getArgs(inter.message.content)
      let a = args[args.length-5]
      let b = args[args.length-1]
      let content = inter.message.content.replace(a,'**'+found.toUpperCase()+'**').replace(b,'<t:'+getTime(new Date().getTime())+':R>')
      
      let row = JSON.parse(JSON.stringify(shop.orderStatus));
      found === 'completed' || found === 'cancelled' ? row.components[0].disabled = true : null
      
      inter.update({content: content, components: [row]})
    }
    else if (id === 'cancel') {
      inter.reply({content: 'Interaction cancelled.', ephemeral: true})
      inter.message.edit({components: []})
    }
    else if (id.startsWith('voucher-')) {
      let code = id.replace('voucher-','').replace(/_/g,' ')
      if (!vrDebounce && claimer === null) {
        !claimer ? claimer = inter.user.id : null
        vrDebounce = true
        await setVouchers()
        let voucher = shop.vouchers.find(v => v.code === code)
      if (!voucher) return vrDebounce = false, inter.update({content: emojis.x+' The voucher (`'+code+'`) was revoked!', components: []})
        let row = new MessageActionRow().addComponents(
          new MessageButton().setCustomId('design1').setStyle('SECONDARY').setEmoji('<a:party:1083355785188347984>'),//.setDisabled(true),
          new MessageButton().setCustomId('design2').setStyle('SECONDARY').setEmoji('<a:TC_Party_Cat:1083357530786373703>'),
          new MessageButton().setCustomId('design3').setStyle('SECONDARY').setEmoji('<a:Party_Dino:1083357739687882802>'),
          new MessageButton().setCustomId('design4').setStyle('SECONDARY').setEmoji('<a:SREV_purple_party:1083357680174895187>'),
          new MessageButton().setCustomId('design5').setStyle('SECONDARY').setEmoji('<a:TC_Wumpus_Party:1083357617478447124>'),
        );
        let quote = "Oop, I can't think of a quote right now."
        let context = ['cats','life','dogs','love','stupidity','anything']
        let chosenContext = context[getRandom(0,context.length)]
        let data = await chatAI("write a random inspirational quote about "+chosenContext)
        if (data.response.error) console.log('⚠️ An unexpected error occurred `'+data.response.error.message+'`')
        else if (data.chosenAPI === AI.chatAPI) {
          let msg = data.response.choices[0].message.content
          let filtered = AI.filter(msg)
          if (filtered.length > 500) {
            console.log("⚠️ The message generated was longer than 500 characters. Unable to send due to discord's limitations.")
          } else {
            quote = filtered
          }
        }
  
        let newEmbed = new MessageEmbed()
        .setTitle(voucher.perks)
        .setThumbnail(inter.user.avatarURL())
        .setDescription('Hmm, it seems someone already claimed this voucher.')
        .addFields(
          {name:"Random Quote",value:quote},
          {name:'Claimed by',value:'<@'+inter.user.id+'>'}
        )
        .setFooter({text: 'Click the buttons below for some entertainment'})
        .setColor(colors.red)
        
        sendChannel(emojis.check+' <@'+inter.user.id+'> claimed a **'+voucher.perks+'**!\nCode: `'+code+'`','1047454193755107337',colors.lime)
        let embed = new MessageEmbed()
        .addFields(
          {name: 'You received a '+voucher.perks+'!',value:'Code: `'+code+'`'},
          {name: 'Read me',value:'\n<:circley:1072388650337308742>This voucher will expire in 5 days\n<:circley:1072388650337308742>Must order an item to use the voucher\n<:circley:1072388650337308742>You can share the code to anyone!\n<:circley:1072388650337308742>One-time use only\n<:circley:1072388650337308742>You can only use one voucher per order'},
        )
        .setColor(colors.none)
        .setFooter({text: 'Type ;use '+code+' in the ticket channel to use your voucher!'})
        
        let row2 = await makeRow('https://discord.com/channels/1047454193159503904/1054711675045036033/1095603406632144936','Order Here','LINK','<:09:1069200736631656518>')
    
        let error = false
        if (claimer === inter.user.id) {
          await inter.user.send({embeds: [embed], components: [row2]}).catch((err) => {
            inter.reply({content: 'Error! Cannot send voucher to your DMs. Please open your DMs!', ephemeral: true})
            error = true
          })
          .then((msg) => {
            if (error) return;
            inter.reply({content: "Voucher code was sent in your DMs!", ephemeral: true})
            inter.message.edit({embeds: [newEmbed], components: [row]});
          })
        } else {
          inter.reply({content: "It seems like someone was milliseconds faster than you.", ephemeral: true})
        }
        claimer = null
        vrDebounce = false
        
    } else {
      inter.reply({content: emojis.x+' The voucher was already claimed!', ephemeral: true})
    }
    }
    else if (id.startsWith('feedback')) {
      let feedback = await getChannel(shop.channels.feedbacks)
      let logs = await getChannel(shop.channels.logs)
      let anon = false
      if (id === 'feedbackAnon') anon = true
      let type = anon ? 'Anonymous' : 'Public'
      
      let embed = new MessageEmbed()
      .setAuthor({ name: anon ? 'Sent Anonymously' : inter.user.tag, iconURL: anon ? 'https://www.freepnglogos.com/uploads/discord-logo-png/discord-logo-logodownload-download-logotipos-1.png' : inter.user.avatarURL(), url: 'https://discord.gg/sloopies' })
      .setDescription(inter.message.embeds[0].description)
      .setFooter({text: type+' Feedback'})
      .setColor(colors.none)
      .setThumbnail(anon ? 'https://www.freepnglogos.com/uploads/discord-logo-png/discord-logo-logodownload-download-logotipos-1.png' : inter.user.avatarURL())

      inter.update({content: 'Feedback sent `('+type+')`', components: []})
      feedback.send({embeds: [embed]})
      logs.send({content: '<@'+inter.user.id+'>', embeds: [embed]})
    }
    else if (id.startsWith('roles-')) {
    let role = id.replace('roles-','').replace(/_/g,' ')
    if (hasRole(inter.member, [role], inter.guild)) {
      removeRole(inter.member, [role], inter.guild)
      await inter.reply({content: emojis.off+' Removed **'+role+'** role.', ephemeral: true})
    } else {
    addRole(inter.member, [role], inter.guild)
    await inter.reply({ content: emojis.on+' Added **'+role+'** role.', ephemeral: true });
    }
  }
    else if (id.startsWith('drop-')) {
      if (!await getPerms(inter.member,4)) return inter.reply({content: emojis.warning+' Insufficient Permission', ephemeral: true});
      let msgId = id.replace('drop-','')
      let drops = await getChannel(shop.channels.drops)
      let dropMsg = await drops.messages.fetch(msgId)
      let member = inter.message.mentions.members.first()
      if (!member) return inter.reply(emojis.x+" Invalid User")
      let template = await getChannel(shop.channels.dmTemplate)
      
      let msg = await template.messages.fetch("1075782458970214480")
      let error = false;
      let code = makeCode(10)
      let copy = new MessageActionRow().addComponents(
          new MessageButton().setCustomId('copyLinks').setStyle('SECONDARY').setLabel('Copy Links'),
        new MessageButton().setLabel('Vouch Here').setURL('https://discord.com/channels/1047454193159503904/1054724474659946606').setStyle('LINK').setEmoji('<:S_letter:1092606891240198154>')
        );
      await member.send({content: msg.content+"\n\nRef code: `"+code+"`\n||"+dropMsg.content+" ||", components: [copy]}).catch((err) => {
        error = true
        inter.reply({content: emojis.x+" Failed to process delivery.\n\n```diff\n- "+err+"```", ephemeral: true})})
      .then(async (msg) => {
        if (error) return;
        let row = new MessageActionRow().addComponents(
          new MessageButton().setCustomId('sent').setStyle('SUCCESS').setLabel('Sent to '+member.user.tag).setDisabled(true),
          new MessageButton().setCustomId('code').setStyle('SECONDARY').setLabel(code).setDisabled(true),
        );
        inter.update({components: [row]})
        dropMsg.edit({content: code+"\n"+dropMsg.content, components: [row]})
      })
    }
    else if (id.startsWith('returnLinks-')) {
      if (!await getPerms(inter.member,4)) return inter.reply({content: emojis.warning+' Insufficient Permission', ephemeral: true});
      let msgId = id.replace('returnLinks-','')
      
      await inter.reply({content: 'Returning links. Please wait..\n'+emojis.warning+' Please do not drop/add any stocks while the links are being returned. ', ephemeral: true})
      await inter.message.edit({components: []})
      let drops = await getChannel(shop.channels.drops)
      let dropMsg = await drops.messages.fetch(msgId)
      
      let content = dropMsg.content
      let stocks = await getChannel(shop.channels.stocks)
      let args = await getArgs(content)
      let returned = 0
      let msgReturn = false
      
      dropMsg.edit({content: 'Returned\n'+content, components: []})
      
      for (let i = args.length - 1; i >= 0; i--) {
        if (args[i].includes('discord.gift/')) {
          await stocks.send(args[i])
          returned++
        }
      }
      if (returned === 0) {
        msgReturn = true
        await stocks.send(content)
      }
      msgReturn ? inter.message.reply({content: emojis.check+' Returned the whole message to stocks.'}) : inter.message.reply({content: emojis.check+' Returned '+returned+' links to stocks.'})
    }
    else if (id.startsWith('showDrop-')) {
      if (!await getPerms(inter.member,4)) return inter.reply({content: emojis.warning+' Insufficient Permission', ephemeral: true});
      let msgId = id.replace('showDrop-','')
      let drops = await getChannel(shop.channels.drops)
      let dropMsg = await drops.messages.fetch(msgId)
      
      let content = dropMsg.content
      inter.reply({content: content, ephemeral: true})
    }
    else if (id.startsWith('copyLinks')) {
      
      let content = inter.message.content
      let args = await getArgs(content)
      let count = 0
      let string = ''
      for (let i in args) {
        if (args[i].includes('discord.gift/')) {
          count++;
          string += count+'. '+args[i]+'\n'
        }
      }
      if (count === 0) {
        inter.reply({content: emojis.x+' No links found.', ephemeral: true})
      } else {
      inter.reply({content: string, ephemeral: true})
      }
    }
    else if (id.startsWith('breakChecker-')) {
      let user = id.replace('breakChecker-','')
      shop.breakChecker = true
      inter.reply({content: emojis.loading+" Stopping... Please wait", ephemeral: true})
      inter.message.edit({components: []})
    }
    else if (id.startsWith('checkerStatus-')) {
      let userId = id.replace('checkerStatus-','')
      let data = shop.checkers.find(c => c.id == userId)
      if (data) {
        let embed = new MessageEmbed()
        .setColor(colors.none)
        .addFields({
          name: 'Checker Status',
          value: 'Total Checked: **'+data.total+'**\nClaimable: **'+data.valid+'**\nClaimed: **'+data.claimed+'**\nInvalid: **'+data.invalid+'**'
        })
        inter.reply({embeds: [embed], ephemeral: true})
      } else {
        inter.reply({content: 'No data was found'})
      }
    }
    else if (id.startsWith('reply-')) {
      let reply = id.replace('reply-','')
      
      inter.reply({content: reply, ephemeral: true})
    }
    else if (id.startsWith('replyCopy-')) {
      let reply = id.replace('replyCopy-','')
      
      let embed = new MessageEmbed()
      .setDescription('# '+reply)
      .setColor(colors.none)
      .setFooter({text: 'Hold to copy'})
      
      let row = new MessageActionRow().addComponents(
        new MessageButton().setCustomId('togglePhone-'+reply).setStyle('DANGER').setLabel('Switch to IOS').setEmoji('<:apple:1016400281631740014>'),
      );
      inter.reply({embeds: [embed], components: [row], ephemeral: true})
    }
    else if (id.startsWith('togglePhone-')) {
      let content = id.replace('togglePhone-','')
      if (inter.message.content.length > 0) {
        let row = new MessageActionRow().addComponents(
          new MessageButton().setCustomId('togglePhone-'+content).setStyle('DANGER').setLabel('Switch to IOS').setEmoji('<:apple:1016400281631740014>'),
        );
        
        let embed = new MessageEmbed()
        .setDescription('# '+content)
        .setColor(colors.none)
        .setFooter({text: 'Hold to copy'})
        
        inter.update({content: null, embeds: [embed] ,components: [row]})
      } else {
        let row = new MessageActionRow().addComponents(
          new MessageButton().setCustomId('togglePhone-'+content).setStyle('SUCCESS').setLabel('Switch to Android').setEmoji('<:android:1016400278934786158>'),
        );
        inter.update({content: content, embeds: [], components: [row]})
      }
      }
    else if (id.startsWith('approve-')) {
      let userId = id.replace('approve-','')
      let user = await getUser(userId);
      if (user) {
        let comp = inter.message.components[0]
        comp.components[0].style = "SUCCESS"
        comp.components[1].style = "SECONDARY"
        for (let i in comp.components) {
            let row = comp.components[i]
            row.disabled = true
          }
        sendUser(emojis.check+" Your application was approved! Your application was approved! You can now access our reseller's pricelist. Please acknowledge that all the pricelists may change constantly.",user.id,colors.lime)
        let member = await getMember(user.id,inter.guild)
        member ? await addRole(member,['resellers'],inter.guild) : null
        inter.reply({content: "Application Accepted", ephemeral: true})
        inter.message.edit({components: [comp]})
      } else {
        inter.reply({content: "User not found.", ephemeral: true})
      }
    }
    else if (id.startsWith('decline-')) {
      let userId = id.replace('decline-','')
      let user = await getUser(userId);
      if (user) {
        let comp = inter.message.components[0]
        comp.components[0].style = "SECONDARY"
        comp.components[1].style = "DANGER"
        for (let i in comp.components) {
            let row = comp.components[i]
            row.disabled = true
          }
        sendUser(emojis.x+" Due to unfortunate circumstances, your application was declined. This could be because the information you provided was not sufficient or you did not pass our standard requirements.",user.id,colors.red)
        inter.reply({content: "Application Declined", ephemeral: true})
        inter.message.edit({components: [comp]})
      } else {
        inter.reply({content: "User not found.", ephemeral: true})
      }
    }
    else if (id.startsWith('followup')) {
      let user = inter.user
      let messageId = ''
      let found = shop.followUps.find(f => f === inter.user.id)
      if (found) return inter.reply({content: "Please wait for at least 2 hours before requesting another follow up!", ephemeral: true})
      shop.followUps.push(inter.user.id)
      let channelName = inter.channel.name
      let template = await getChannel(shop.channels.templates)
      if (channelName.includes('ticket')) messageId = '1086505068351721472'
      else if (channelName.includes('done')) messageId = '1086503830105104444'
      else messageId = '1086504594860937256'
      
      let foundMsg = await template.messages.fetch(messageId)
      inter.message.reply({content: "<@&1047454193184682040> **Order Status**\n\n<:03:1056580107189370922> "+foundMsg.content})
      inter.deferUpdate();
      setTimeout(function() {
        shop.followUps.splice(shop.followUps.indexOf(inter.user.id),1)
      },43200000)
    }
    else if (id.startsWith('done')) {
      if (!await getPerms(inter.member,4)) return inter.deferUpdate();
      inter.reply({content: emojis.check+" Order marked as done! `"+inter.channel.name+"`"})
      inter.channel.setName('done。'+inter.channel.name)
    }
    else if (id.startsWith('none')) {
      inter.deferUpdate();
    }
    else if (id.startsWith('channelDelete-')) {
      let channelId = id.replace('channelDelete-','')
      let found = shop.deleteChannels.find(c => c === channelId)
      if (found) {
        shop.deleteChannels.splice(shop.deleteChannels.indexOf(channelId),1)
        inter.update({content: emojis.check+" Channel deletion was cancelled by "+inter.user.tag+"", components: []})
      } else {
        inter.reply({content: emojis.warning+' This channel is no longer up for deletion.', ephemeral: true})
      }
    }
    else if (id.startsWith('prVerify')) {
      let member = inter.member
      if (await hasRole(member,['1094084379137032252'],inter.guild)) {
        inter.deferUpdate();
        return
      } else {
        
        let chosen = makeCode(5)
        let codes = [
          makeCode(5),
          makeCode(5),
          makeCode(5),
          makeCode(5),
          makeCode(5),
          makeCode(5),
        ]
        let random = getRandom(0,4)
        codes[random] = chosen
        let row = new MessageActionRow()
        .addComponents(
          new MessageButton().setCustomId(random === 0 ? 'prCode-'+random : 'randomCode-0').setStyle('SECONDARY').setLabel(codes[0]),
          new MessageButton().setCustomId(random === 1 ? 'prCode-'+random : 'randomCode-1').setStyle('SECONDARY').setLabel(codes[1]),
          new MessageButton().setCustomId(random === 2 ? 'prCode-'+random : 'randomCode-2').setStyle('SECONDARY').setLabel(codes[2]),
          new MessageButton().setCustomId(random === 3 ? 'prCode-'+random : 'randomCode-3').setStyle('SECONDARY').setLabel(codes[3]),
          new MessageButton().setCustomId(random === 4 ? 'prCode-'+random : 'randomCode-4').setStyle('SECONDARY').setLabel(codes[4]),
        );
        let embed = new MessageEmbed()
        .addFields({name: 'Choose the correct matching code',value:'```yaml\n'+chosen+'```'})
        .setColor(colors.none)
        let botMsg = null
        await inter.user.send({embeds: [embed], components: [row]}).then(msg => botMsg = msg).catch(err => inter.reply({content: emojis.warning+" Failed to send verification. Please open your DMs!", ephemeral: true}))
        let channels = ''
        if (!botMsg) return;
        inter.guild.channels.cache.forEach( ch => {
          if (ch.parent?.name === 'PRICELIST' && ch.type !== 'GUILD_TEXT') {
            channels += '\n<:circley:1072388650337308742> <#'+ch.id+'>'
          }
        })
        let linker = new MessageActionRow()
        .addComponents(
          new MessageButton().setURL(botMsg.url).setStyle('LINK').setLabel('Proceed'),
        );
        inter.reply({content: emojis.loading+' Verification prompt was sent in your DMs!', components: [linker], ephemeral: true})
        let notice = await getChannel(shop.channels.alerts)
        notice.send('<@'+inter.user.id+'> '+emojis.loading)
      }
    }
    else if (id.startsWith('prCode-')) {
      let index = id.replace('prCode-','')
      let guild = await getGuild('1047454193159503904')
      if (!guild) return;
      let member = await getMember(inter.user.id,guild)
      if (member) {
        let comp = inter.message.components[0]
        for (let i in comp.components) {
          let row = comp.components[i]
          row.disabled = true
          if (i == index) row.style = 'SUCCESS'
        }
        inter.message.edit({components: [comp]})
        await addRole(member,['1094084379137032252'],guild)
        let channels = ''
        guild.channels.cache.forEach( ch => {
          if (ch.parent?.name === 'PRICELIST' && ch.type !== 'GUILD_TEXT') {
            channels += '\n<:circley:1072388650337308742> <#'+ch.id+'>'
          }
        })
        inter.reply({content: emojis.check+' <:S_seperator:1093733778633019492> You now have access to our pricelists! You can view them through these channels: \n'+channels, ephemeral: true})
        let notice = await getChannel(shop.channels.alerts)
        notice.send('<@'+inter.user.id+'> '+emojis.check)
      } else {
        inter.reply({content: emojis.warning+' Unexpected error occured.', ephemeral: true})
      }
    }
    else if (id.startsWith('randomCode-')) {
      let index = id.replace('randomCode-','')
      let comp = inter.message.components[0]
        for (let i in comp.components) {
          let row = comp.components[i]
          row.disabled = true
          if (i == index) row.style = 'DANGER'
        }
      inter.reply({content: emojis.x+" Code did not match. Please try again by clicking the access button.", ephemeral: true})
      inter.message.edit({components: [comp]})
      let notice = await getChannel(shop.channels.alerts)
      notice.send('<@'+inter.user.id+'> '+emojis.x)
    }
    else if (id.startsWith('orderFormat')) {
      let found = shop.orderForm.find(c => c === inter.user.id)
      if (found) {
        inter.reply({content: emojis.warning+' You already have an existing order form!', ephemeral: true})
        return;
      }
      if (!await hasRole(inter.member,['1094909481806205009'])) return inter.reply({content: emojis.warning+' Please accept the terms before requesting the order form!', ephemeral: true});
      shop.orderForm.push(inter.user.id)
      let comp = inter.message.components[0]
        for (let i in comp.components) {
          let row = comp.components[i]
          row.disabled = true
        }
      inter.update({components: [comp]})
      let count = 0
      let thread = [
        {
          question: '> <:S_letter:1092606891240198154> Which product do you want to avail? (include subscription length)',
          answer: '',
        },
        {
          question: '> <:S_letter:1092606891240198154> How many of this item do you wish buy?',
          answer: '',
        },
        {
          question: "> <:S_letter:1092606891240198154> What's your selected mode of payment?",
          answer: '',
        },
      ]
      const filter = m => m.author.id === inter.user.id;
      async function getResponse(data) {
        await inter.channel.send(data.question)
        let msg = await inter.channel.awaitMessages({ filter, max: 1,time: 900000 ,errors: ['time'] })
        if (!msg) shop.orderForm.splice(shop.orderForm.indexOf(inter.user.id),1)
        msg = msg?.first()
        data.answer = msg.content
      }
      for (let i in thread) {
        let data = thread[i]
        count++
        await getResponse(data,count)
      }
      let row = new MessageActionRow().addComponents(
        new MessageButton().setCustomId('confirmOrder').setStyle('SUCCESS').setLabel('Yes'),
        new MessageButton().setCustomId('orderFormat').setStyle('DANGER').setLabel('Retry'),
      );
      let embed = new MessageEmbed()
      .setDescription('Item: **'+thread[0].answer+'**\nQuantity: **'+thread[1].answer+'**\nMode of Payment: **'+thread[2].answer+'**')
      .setColor(colors.yellow)
      .setFooter({text: 'Order Confirmation'})
      
      inter.channel.send({content: "<:S_separator:1093733778633019492> Is this your order?", embeds: [embed], components: [row]})
      shop.orderForm.splice(shop.orderForm.indexOf(inter.user.id),1)
    }
    else if (id.startsWith('confirmOrder')) {
      inter.message.edit({components: []})
      inter.reply({content: "Thank you for confirming your order! <:S_bearlove:1072353337699225640>\nOur staff will be with you shortly."})
    }
    else if (id.startsWith('gsaRaw')) {
      inter.reply({content: '```json\n'+JSON.stringify(shop.gcashStatus, null, 2).replace(/ *\<[^>]*\> */g, "")+'```', ephemeral: true})
    }
    else if (id.startsWith('design')) {
      if (animation) return inter.reply({content: 'An animation is currently in progress. Please try again later.', ephemeral: true})
      animation = true
      let comp = inter.message.components[0]
      let types = [
        'DANGER',
        'PRIMARY',
        'SUCCESS',
        'DANGER',
        'PRIMARY',
        'SUCCESS',
      ]
      let usern = inter.user.username.replace(/ /g,'')
      let randomizer = [
        usern+' is a cute catto',
        usern+' likes eating a siopao',
        usern+' is jumpy cute froggo',
        usern+' eat eggs a lot',
        usern+' is a fat catto',
        usern+' is a hungry monster',
        usern+' is a fast eater',
        usern+' likes cattos very much',
        usern+' has pet dinosor ror',
        usern+" is gudetama's favorite person",
        usern+" secretely likes someone's pet",
        usern+' sleeps longer than u',
        usern+' sucks at playing valorant',
        usern+' likes an eggless omelete',
        usern+' almost fell on cliff',
      ]
      let args = getArgs(randomizer[getRandom(0,randomizer.length)])
      
      async function changeRow(state,type,disabled) {
        if (state === 'start') {
          for (let i in comp.components) {
            let row = comp.components[i]
            row.style = type
            row.disabled = disabled
          }
        }
        else if (state === 'mix') {
          for (let i in comp.components) {
            let row = comp.components[i]
            row.style = types[i] ? types[i] : types[0]
            row.label = args[i] ? args[i] : args[0]
            await inter.message.edit({components: [comp]})
            await sleep(delay)
          }
        }
    }
      let delay = 1500
      await changeRow('start','DANGER',true)
      inter.deferUpdate()
      await inter.message.edit({components: [comp]})
      await sleep(delay)
      await changeRow('start','PRIMARY',true)
      await inter.message.edit({components: [comp]})
      await sleep(delay)
      await changeRow('start','SUCCESS',true)
      await inter.message.edit({components: [comp]})
      await sleep(delay)
      await changeRow('start','SECONDARY',true)
      inter.message.edit({components: [comp]})
      await sleep(delay)
      await changeRow('mix','DANGER',true)
      inter.message.edit({components: [comp]})
      await changeRow('start','SECONDARY',true)
      inter.message.edit({components: [comp]})
      animation = false
    }
    }
});
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  await moderate(newMember,await getPerms(newMember,3))
    if(newMember.nickname && oldMember.nickname !== newMember.nickname) {
      let found = shop.customRoles.find(r => r.user === newMember.id)
      if (found) {
        let role = await getRole(found.role,newMember.guild)
        role.setName(newMember.nickname)
      }
    }
 });
client.on('presenceUpdate', async (pres) => {
  if (!pres) return;
  let guild = await getGuild('1047454193159503904')
  let mem = await getMember(pres.userId,guild)
  if (!mem) return;
  let perms = await getPerms(mem, 3)
  let moderated = await moderate(mem,perms);
})
process.on('unhandledRejection', async error => {
  ++errors
  console.log(error);
  let caller_line = error.stack.split("\n");
  let index = await caller_line.find(b => b.includes('/app'))
  let embed = new MessageEmbed()
  .addFields(
    {name: 'Caller Line', value: '```'+(index ? index : 'Unknown')+'```', inline: true},
    {name: 'Error Code', value: '```css\n[ '+error.code+' ]```', inline: true},
    {name: 'Error', value: '```diff\n- '+(error.stack >= 1024 ? error.stack.slice(0, 1023) : error.stack)+'```'},
  )
  .setColor(colors.red)
  
  let channel = await getChannel(output)
  channel ? channel.send({embeds: [embed]}).catch(error => error) : null
});

//Loop
let ready = true;
let randomTime = null;

let streamers = [
    /*{
      name: 'Kdrysss',
      live: false,
    },*/
    {
      name: '105695088538055',
      live: false,
    },
  ]


const interval = setInterval(async function() {
      //Get time//
  let date = new Date().toLocaleString("en-US", { timeZone: 'Asia/Shanghai' });
  let today = new Date(date);
  let hours = (today.getHours() % 12) || 12;
  let time = hours +":" +today.getMinutes();
  
  if (!randomTime) {
    randomTime = getRandom(1,13)+":"+getRandom(today.getMinutes(),60)
    sendChannel("Random: "+randomTime,"1047454193755107337",colors.red)
  }
      //Get info
      if (ready) {
        ready = false
        if (!ready) {
        setTimeout(function() {
          ready = true;
        },50000)
        }
        let amount = shop.randomVouchers.amount
        let type = shop.randomVouchers.type
        let generatedVoucher = "₱"+amount[getRandom(0,amount.length)]+" "+type[getRandom(0,type.length)]+" voucher"
        let template = await getChannel(shop.channels.templates)
        let annc = await getChannel(shop.channels.shopStatus)
      if (time === '11:11') {
        ready = false
        let voucher = {
          code: makeCode(10),
          perks: generatedVoucher
        }
        let vr = await getChannel(shop.channels.vouchers)
        vr.send(voucher.code+' - '+voucher.perks)
        await dropVoucher(voucher.code,'1047454193595732055',voucher.perks+' drop')
      }
        else if (time === randomTime) {
          let voucher = {
          code: makeCode(10),
          perks: generatedVoucher
          }
          randomTime = null
          
          let vr = await getChannel(shop.channels.vouchers)
        vr.send(voucher.code+' - '+voucher.perks)
        await dropVoucher(voucher.code,'1047454193595732055',voucher.perks+' drop')
        }
        else if (today.getHours() === 23 && today.getMinutes() === 0) {
          let msg = await template.messages.fetch("1079716277528039468")
        let vc = await getChannel(shop.channels.status)
        if (vc.name === 'shop : CLOSED') return;
          vc.setName('shop : CLOSED')
          await annc.bulkDelete(10)
          await annc.send({content: msg.content, files: ['https://i.pinimg.com/originals/72/7b/24/727b247bc2d09404b67a7ed275b8d85d.gif']})
        } 
        else if (today.getHours() === 8 && today.getMinutes() === 0) {
          let msg = await template.messages.fetch("1079715999097552956")
        let vc = await getChannel(shop.channels.status)
        if (vc.name === 'shop : OPEN') return;
          vc.setName('shop : OPEN')
          await annc.bulkDelete(10)
          await annc.send({content: msg.content, files: ['https://i.pinimg.com/originals/1e/ed/c4/1eedc43a10e28ce98b9bd0ad2384c905.gif']})
      }  
        else if (today.getHours() === 11 && today.getMinutes() === 0) {
          let msg = await template.messages.fetch("1079712404084117524")
          let vc = await getChannel(shop.channels.reportsVc)
          if (vc.name === 'reports : OPEN') return;
          vc.setName('reports : OPEN')
          await annc.bulkDelete(10)
          await annc.send({content: msg.content, files: ['https://media.tenor.com/H6H2hhidRhIAAAAC/chick-pio.gif']})
        }
        else if (today.getHours() === 20 && today.getMinutes() === 0) {
          let msg = await template.messages.fetch("1079715633123557496")
          let vc = await getChannel(shop.channels.reportsVc)
          if (vc.name === 'reports : CLOSED') return;
          vc.setName('reports : CLOSED')
          await annc.bulkDelete(10)
          await annc.send({content: msg.content, files: ['https://media.tenor.com/7mmiOB9yyRUAAAAC/chick-pio.gif']})
        }
      }
  
  },5000)

app.get('/sms', async function (req, res) {
  let msg = req.query.msg
  if (!msg) res.status(404).send({error: 'Invalid Message'})
  
  let args = await getArgs(msg)
  
  let time = args.slice(args.length-3).join(' ')
  let body = args.slice(2).join(' ').replace(time,'')
  let bodyArgs = await getArgs(body)
  let firstIndex = bodyArgs.indexOf('from')
  let lastIndex = bodyArgs.indexOf('w/')
  let balIndex = bodyArgs.indexOf('balance')
  
  let data = {
    from: args[1],
    time: time,
    body: body,
    sender: bodyArgs.slice(firstIndex+1,lastIndex).join(' '),
    amount: bodyArgs[4],
    balance: bodyArgs.slice(balIndex+3,balIndex+4).join(' '),
    refCode: bodyArgs[bodyArgs.length-1].replace('.','')
  }
  let channel = await getChannel('1135767243477753917')
  if (data.from.toLowerCase() !== 'gcash') {
    res.status(404).send({success: 'Not a transaction'})
    channel.send(msg)
    return;
  }
  console.log('data',data)
  shop.refIds.push(data.refCode)
  //Send log
  let embed = new MessageEmbed()
  .addFields(
    {
      name: 'SMS Reader #1',
      value: 'From: '+data.from
    },
    {
      name: 'Amount Sent',
      value: '```diff\n+ ₱ '+data.amount+'```',
      inline: true,
    },
    {
      name: 'Total Balance',
      value: '```yaml\n₱ '+data.balance+'```',
      inline: true
    },
    {
      name: 'Reference ID',
      value: '```yaml\n'+data.refCode+'```',
      inline: true,
    },
    {
      name: 'Sender',
      value: '```ini\n[ '+data.sender+' ]```',
      inline: true,
    },
  )
  .setFooter({text: data.time})
  .setColor(colors.none)
  
  channel.send({embeds: [embed]})
});
