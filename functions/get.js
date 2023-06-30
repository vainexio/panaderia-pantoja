const fetch = require('node-fetch');

const client = require('../server.js').client;
const Discord = require('discord.js');
const {Client, Intents, MessageEmbed, MessageActionRow, MessageButton} = Discord;

const settings = require('../storage/settings_.js')
const colors = settings.colors

const {AI, shop, notices, auth, prefix, status, theme, commands, permissions, emojis, timeout, rateLimit, assets, townhallData, leagueData} = settings
const open_ai = process.env.OPEN_AI

module.exports = {
  getTime: function(stamp) {
    return Math.floor(new Date(stamp).getTime()/1000.0);
  },
  chatAI: async function(content,type,user) {
    let data = {}
    let messages = [];
    let msgData = {"role": "user", "content": content}
    messages.push(msgData)
    if (user) {
      let found = AI.users.find(u => u.id === user.id)
      if (found) {
        console.log(found,found.messages)
        for (let i in found.messages) {
          let msg = found.messages[i]
          messages.push(msg)
        }
        found.messages.push(msgData)
      } else {
        console.log('not found')
        AI.users.push({id: user.id, messages: [msgData]})
      }
    }
    let chosenAPI = null
    if (content.toLowerCase().includes('show me') || type === 'image') {
      chosenAPI = AI.imageAPI
      data = {
        "prompt": content,
        "n": 1,
        "size": "1024x1024"//"1024x1024"
      }
    } else {
      console.log(messages)
      chosenAPI = AI.chatAPI
      data = {
        "model": AI.model,//,
        "messages": messages,
      }
    }
    let auth = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer '+open_ai,//'Bearer ,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
      }
    
    let response = await fetch(chosenAPI,auth)
    response = await response.json()
    return {response, chosenAPI: chosenAPI};
  },
  getNth: function (value) {
    value = value.toString()

    let end = value[value.length-1]
    let mid = value[value.length-2]
    let nth = mid !== '1' ? end === '1' ? 'st' : end === '2' ? 'nd' : end === '3' ? 'rd' : 'th' : 'th'
    
    return value+nth
  },
  getChannel: async function (id) {
  id = id ? id.replace(/<|#|>/g,'') : 0
  let channel = !isNaN(id) ? await client.channels.cache.get(id) : null
  return channel;
},
  //Get Guild
  getGuild: async function (id) {
  let guild = await client.guilds.cache.get(id);
  return guild;
},
  //Get Users
  getUser: async function (id) {
  id = id ? id.replace(/<|@|>/g,'') : 0
  let user = !isNaN(id) ? await client.users.fetch(id).catch(error => console.log('Unknown User: '+id)) : null
  return user;
},
  //Get members
  getMember: async function (id, guild) {
  id = id ? id.replace(/<|@|>/g,'') : 0
  let user = !isNaN(id) ? await guild.members.cache.get(id) : null
  return user;
},
  //Get random
  getRandom: function (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
},
  //Get color
  getColor: async function getColor(string) {
  let color = colors[string.toLowerCase()]
  if (color) return color;
},
};