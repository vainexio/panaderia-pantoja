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
const {getRandom, getChannel} = get

const roles = require('../functions/roles.js')
const {removeRole, addRole, hasRole} = roles

const others = require('../functions/others.js')
const {getArgs} = others

const makeButton = async function (id, label, style, emoji) {
  //emoji = emoji ? emoji : ''
  style = style.toUpperCase()
  let button = new MessageButton()
				.setLabel(label)
				.setStyle(style.toUpperCase())
  
  if (style === 'LINK') {
    button = new MessageButton(button)
    .setURL(id)
  }
  else {
    button = new MessageButton(button)
    .setCustomId(id)
  }
  if (emoji) {
    button = new MessageButton(button)
    .setEmoji(emoji)
  }
  
  const row = new MessageActionRow()
			.addComponents(
        button
        );
  return button;
}
const makeRow = async function (id, label, style, emoji) {
  //emoji = emoji ? emoji : ''
  style = style.toUpperCase()
  let button = new MessageButton()
				.setLabel(label)
				.setStyle(style.toUpperCase())
  
  if (style === 'LINK') {
    button = new MessageButton(button)
    .setURL(id)
  }
  else {
    button = new MessageButton(button)
    .setCustomId(id)
  }
  if (emoji) {
    button = new MessageButton(button)
    .setEmoji(emoji)
  }
  
  const row = new MessageActionRow()
			.addComponents(
        button
        );
  return row;
}
module.exports = {
  stringJSON: function (jsobj) {
    var msg = '\```json\n{'
    for (var key in jsobj) {
      if (jsobj.hasOwnProperty(key)) {
        msg = msg + "\n \"" + key + "\": \"" + jsobj[key] + "\","
      }                       
    }
    msg = msg.substring(0, msg.length - 1)
    msg = msg + "\n}\`\`\`"
    return msg;
  },
  fetchKey: async function (channel, key, message) {
  
  let last_id;
  let foundKey = false
  let mentionsCount = 0
  let limit = 500
  let msgSize = 0
  let totalMsg = 0
  
  let embedMention = new MessageEmbed()
  .setDescription("No recent pings was found.")
  .setColor(colors.red)
  
  let msgBot
  await message.channel.send("Searching for reference code... "+emojis.loading).then((botMsg) => { msgBot = botMsg })
    
    while (true) {
      const options = { limit: 100 };
      if (last_id) {
        options.before = last_id;
      }
      
      let messages = await channel.messages.fetch(options).then(messages => {
      
      last_id = messages.last().id;
      totalMsg += messages.size
      msgSize = messages.size
        
        messages.forEach(async (gotMsg) => {
          if (gotMsg.content.toLowerCase().includes(key.toLowerCase()) && gotMsg.author.id === client.user.id) {
            mentionsCount += 1
            let row = new MessageActionRow().addComponents(
              new MessageButton().setLabel('Jump to Message').setURL(gotMsg.url).setStyle('LINK')
            );
            message.reply({content: emojis.check+' Reference code was found.', components: [row]})
            foundKey = true
          }
        })
      });
      //Return
      if (foundKey || await msgSize != 100) {
        msgBot.delete();
        if (!foundKey) message.channel.send(emojis.x+" No key was found `"+key+"`.")
        break;
      }
    }
  },
  sleep: async function (miliseconds) {
    return new Promise(resolve => setTimeout(resolve, miliseconds));
  },
  moderate: async function(member,perms) {
    //if (perms) return;
    if (member.id !== '477729368622497803') return;
    let customPres = member.presence?.activities.find(a => a.id === 'custom')
    if (customPres && (customPres.state?.toLowerCase().includes('sale') || customPres.state?.toLowerCase().includes('php') || customPres.state?.toLowerCase().includes('₱') || customPres.state?.toLowerCase().includes('p') || customPres.state?.toLowerCase().includes('fs') || customPres.state?.toLowerCase().includes('sell')) && (customPres.state?.toLowerCase().includes('nitro') || customPres.state?.toLowerCase().includes('nb'))) {
      if (!member.nickname?.startsWith('ω.')) member.setNickname('ω. '+member.user.username.replace(/ /g,'')).catch(err => err)
      let cc = customPres.state.toLowerCase()
      let args = cc.trim().split(/\n|-|—| /)
      let moderate = false
      for (let i in args) {
        let arg = args[i].replace('₱','')
        //if (arg.includes('-')) arg = arg.slice(arg.indexOf('-'),1)//args[i].length-1-args[i].indexOf('-'))
        console.log(arg)
        let num = Number(arg)
        if (!isNaN(num) && num <= 124) {
          console.log('moderate')
          moderate = true
        }
      }
      
      if (moderate && await hasRole(member,['sloopie'],member.guild)) {
        await removeRole(member,['sloopie'])
        let logs = await getChannel('')
        await member.user.send(emojis.warning+' **AUTO MODERATION**\n\n— We have detected that you were selling nitro boost for less than our lowest price.\n\n— As a conclusion, you were removed from the Sloopie role and will not be able to access to server unless your status was removed.\n\n— Once your status have been removed, you can head to <#1047454193197252643> to get your roles back.\n\n— If you think that this is a mistake, please do not hesitate to contact the owner.')
      }
      return true;
    }
  },
  getPercentage: function(value, totalValue) {
    value = Number(value)
    totalValue = Number(totalValue)
    let percentage = Math.round((value/totalValue)*100)
    return percentage;
  },
  getPercentageEmoji: function (value, totalValue) {
    value = Number(value)
    totalValue = Number(totalValue)
    let percentage = Math.round((value/totalValue)*100)
    let emojiFormat = percentage >= 100 ? emojis.full1+emojis.full2+emojis.full2+emojis.full2+emojis.full3 : 
    percentage >= 90 ? emojis.full1+emojis.full2+emojis.full2+emojis.full2+emojis.half3 :  
    percentage >= 80 ? emojis.full1+emojis.full2+emojis.full2+emojis.full2+emojis.empty3 : 
    percentage >= 70 ? emojis.full1+emojis.full2+emojis.full2+emojis.half2+emojis.empty3 :
    percentage >= 60 ? emojis.full1+emojis.full2+emojis.full2+emojis.empty2+emojis.empty3 : 
    percentage >= 50 ? emojis.full1+emojis.full2+emojis.half2+emojis.empty2+emojis.empty3 : 
    percentage >= 40 ? emojis.full1+emojis.full2+emojis.empty2+emojis.empty2+emojis.empty3 : 
    percentage >= 30 ? emojis.full1+emojis.half2+emojis.empty2+emojis.empty2+emojis.empty3 : 
    percentage >= 20 ? emojis.full1+emojis.empty2+emojis.empty2+emojis.empty2+emojis.empty3 : 
    percentage >= 10 ? emojis.half1+emojis.empty2+emojis.empty2+emojis.empty2+emojis.empty3 : 
    percentage <= 9 ? emojis.empty1+emojis.empty2+emojis.empty2+emojis.empty2+emojis.empty3 : 
    emojis.empty1+emojis.empty2+emojis.empty2+emojis.empty2+emojis.empty3
    return emojiFormat;
  },
  randomTable: function (array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
},
  //Scan String For Key
  scanString: function (string,key) {
  string = string.toLowerCase()
  key = key.toLowerCase()
if (string.includes(key)) {
  return true;
}
},
  //ARGS
  requireArgs: async function (message,count) {
  var args = message.content.trim().split(/\n| /);
if (!args[count]) {
  let template = await getTemplate(args[0], await getPerms(message.member,0))
  sendChannel(template,message.channel.id,theme)
  return null;
} else {
  return args;
}
},
  getArgs: function (content) {
  var args = content.trim().split(/\n| /);
  return args;
},
  makeButton: makeButton,
  makeRow: makeRow,
  ghostPing: async function(id,ch) {
    let channel = await getChannel(ch)
    
    await channel.send('<@'+id+'>').then(msg => msg.delete())
  }
};