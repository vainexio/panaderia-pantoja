//const others = require('../functions/others.js')
const Discord = require('discord.js');
const {Client, Intents, MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu} = Discord;
let colors = {
  red: "#ea3737",
  blue: "#1200ff",
  green: "#00c554",
  yellow: "#fff4a1",
  orange: "#ff6300",
  purple: "#b200ff",
  pink: "#ff00d6",
  cyan: "#00feff",
  black: "#000000",
  white: "#ffffff",
  lime: "#7ebb82",
  none: "#2B2D31",
}
let emojis = {
  gude_cheer: '<:gude_cheer:1056588910794387466>',
  gude_smile: '<:gude_smile:1056580031536697424>',
  //
  check: '<a:check:969936488739512340>',
  x: '<a:Xmark:969401924736651284>',
  loading: '<a:loading2:976650648600854538>',
  warning: '<a:S_error:1095504279042805820>',
  online: '<:online_:1004014930959286342>',
  idle: '<:Idle_:1004014897417424938>',
  dnd: '<:dnd_:1004017480613773422>',
  offline: '<:offline_:1004015005282340916>',
  on: '<:on:1107664866484953178>',
  off: '<:off:1107664839372964010>',
  
  nboost: '<a:nitroboost:1057999297787985960>',
  nbasic: '<a:nitroclassic:1078248284881174528>',
  nclassic: '<:nitroclassic:1054725614319439962>',
}
let keys = [
  'basic',
  'netflix',
  'nf',
  'spoti',
  'nitro',
  'nb',
  'swc',
  'robux',
  'pending',
  'prem',
  'comm',
  'noted',
  'sb',
  'badge',
  'db',
  'vp',
  'valorant',
  'canva',
]
module.exports = {
  shop: {
    refIds: ['8011217281725'],
    checkerWhitelist: [
      '801532638284218378',
      '477729368622497803',
      '942708350167158794', //Mysticvern
      '681104262599671847', //zae
      '1134302377952956508', //ekn
      '1067861698402340934', //hora
      '1036487171185582111', //vix
    ],
    apiCheckers: [],
    orderForm: [],
    tixSettings: {
      support: '1047454193184682040',
      transcripts: '1054713463739531304',
      closed: '1055288190669443072',
    },
    
    gcashStatus: null,
    breakChecker: false,
    orderStatus: new MessageActionRow().addComponents(
          new MessageSelectMenu().setCustomId('orderStatus').setPlaceholder('Update Order Status').addOptions([
            {label: 'Noted',description: 'Change Order Status',value: 'noted', emoji: '<a:S_diamond:1093738450156535859>'},
            {label: 'Processing',description: 'Change Order Status',value: 'processing', emoji: '<a:S_bearheart:1094190497179910225>'},
            {label: 'Completed',description: 'Change Order Status',value: 'completed', emoji: '<a:S_checkmark:1095303661648892006>'},
            {label: 'Cancelled',description: 'Change Order Status',value: 'cancelled', emoji: '<:S_exclamation:1093734009005158450>'},
          ]),
        ),
    channels: {
      smsReader: '1135767243477753917',
      checker: '1060779928506880040',
      gcash: '1105332833079267460',
      announcements: '1102417073642164274',
      status: '1054766857552396419', //vc
      reportsVc: '1079713500731015209', //c
      vouch: '1054724474659946606',
      stocks: '1054929031881035789',
      otherStocks: '1080087813032263690',
      orders: '1054731027240726528',
      templates: '1079712339122720768',
      shopStatus: '1121979133346451506',
      vouchers: '1066945318060556378',
      financeLogs: '1100456798932185138',
      feedbacks: '1094975726127685726',
      logs: '1060786672201105419',
      dmTemplate: '1075782410509226095',
      alerts: '1047454193755107337',
      apps: '1085504963955916810',
      drops: '1129348861756973127',
    },
    pricelists: [
      /*{
        //Category
        name: 'Crunchyroll',
        keywords: ['crunchy','crunchyroll'],
        channel: '1054989652416798750',
        status: 2,
        id: '1096319567866904646',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1094077236161818664/Logopit_1680918569709.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Mega Fan',
            children: [
              //
              { name: '1 month', price: 60 },
              { name: '3 months', price: 100 },
              { name: '6 months', price: 140 },
              { name: '8 months', price: 170 },
              { name: '12 months', price: 200 },
              //
            ],
          },
          //
        ],
      },
      {
        //Category
        name: 'HBO GO',
        keywords: ['hbo','hbo go'],
        channel: '1054989652416798750',
        status: 2,
        id: '',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1105784399028559933/Logopit_1683709776330.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Monthly',
            children: [
              //
              { name: '1 month shared', price: 80 },
              { name: '1 month solo acc', price: 350 },
              //
            ],
          },
          //
        ],
      },*/
      {
        //Category
        name: 'Developer Badge',
        keywords: ['dev','badge','db'],
        channel: '1057249812656955514',
        rs: '1078708594188496987',
        status: 1,
        id: '1096319569771118612',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1094077237004865556/Logopit_1680918616490.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Monthly',
            children: [
              //
              { name: '1 month', price: 20, rs: 15 },
              { name: '2 months', price: 25, rs: 20 },
              { name: '3 months', price: 30, rs: 25  },
              { name: '4 months', price: 40, rs: 35 },
              //
            ],
          },
          {
            parent: 'Permanent',
            children: [
              //
              { name: 'Permanent', price: 80, rs: 70 },
              { name: 'Lifetime warranty until patched', price: 0 },
              //
            ],
          },
          {
            parent: '\u200b',
            children: [
              //
              { name: 'Via developer team invite', price: 0 },
              //
            ],
          },
          //
        ],
      },
      {
        //Category
        name: 'E-Wallet Exchange',
        keywords: ['exchange','paypal to gcash'],
        channel: '1072434004873195540',
        status: 4,
        id: '1096319572614860810',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1094077237348794368/Logopit_1680918656290.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Paypal to GCash',
            children: [
              //
              { name: '₱499 below — 10% deduction', price: 0 },
              { name: '₱500 above — 5% deduction', price: 0 },
              { name: '₱1,000 above — 3% deduction', price: 0 },
              //
            ],
          },
          //
        ],
      },
      {
        //Category
        name: 'Bot Commission',
        keywords: ['bot comms','comms','stocks dropper','dropper'],
        channel: '1081107027054571550',
        status: 2,
        id: '1096319574284193842',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1094077237592076389/Logopit_1680918672598.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Nitro stocks dropper',
            children: [
              //
              { name: 'Uncovered hosting', price: 300 },
              { name: 'Covered hosting', price: 500 },
              { name: 'Features:\n+ </drop:1102423261914091530> command\n+ </stocks:1102433613116616734> command\n+ nitro links checker (not constantly updated)\n\u200b'}
              //
            ],
          },
          {
            parent: 'Nitro links checker',
            children: [
              //
              { name: 'Monthly', price: 30 },
              { name: 'Features:\n+ Can scan 50 links per second\n+ Shows difference between valid, calimed and invalid links\n+ Shows accurate expiration (date & time) of links\n+ Fool proof (avoids scanning duplicated links)\n\u200b'}
              //
            ],
          },
          {
            parent: 'Custom Commission',
            children: [
              //
              { name: 'Allows you to choose freely from anything you want your bot function. The price may range depending on the proposed functionality.', price: 0 },
              //
            ],
          },
          {
            parent: 'Uncovered Hosting',
            children: [
              //
              { name: 'This indicates that your bot will not be online, unless you are too. You will have to keep your device turned on, alongside the project website of the bot.', price: 0 },
              //
            ],
          },
          {
            parent: 'Covered Hosting',
            children: [
              //
              { name: 'All discord bots require paid hosting services (if not manually hosted) to stay up and working.', price: 0 },
              { name: 'Covered hosting keeps your bot alive 24/7.', price: 0 },
              //
            ],
          },
          //
        ],
      },
      /*{
        //Category
        name: 'Server Boosting',
        keywords: ['sb','boosting','boost'],
        channel: '1054720561277841438',
        rs: '1078708432091226112',
        status: 4,
        id: '1096319576331014155',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1094077185905676309/Logopit_1680918458337.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: '3 Months',
            children: [
              //
              { name: '2 server boosts', price: 50, rs: 0 },
              { name: '8 server boosts', price: 140, rs: 0 },
              { name: '14 server boosts', price: 190, rs: 0 },
              //
            ],
          },
          {
            parent: 'Lifetime Boosts',
            children: [
              //
              { name: '2 server boosts', price: 400, rs: 300 },
              { name: '8 server boosts', price: 700, rs: 600 },
              { name: '14 server boosts', price: 1000, rs: 1000 },
              //
            ],
          },
          
          //
        ],
      },
      {
        //Category
        name: 'Disney+',
        keywords: ['disney'],
        channel: '1054989652416798750',
        status: 4,
        id: '1096319578482671646',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1094077236413468672/Logopit_1680918581099.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Shared Acc',
            children: [
              //
              { name: '1 month', price: 90, rs: 0 },
              //
            ],
          },
          {
            parent: 'Solo Profile',
            children: [
              //
              { name: '1 month', price: 120, rs: 0 },
              //
            ],
          },
          //
        ],
      },*/
      {
        //Category
        name: 'Canva',
        keywords: ['canva'],
        channel: '1054989652416798750',
        status: 2,
        id: '1096319578482671646',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1104012111346151494/Logopit_1683287379481.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Canva Pro',
            children: [
              //
              { name: '1 month', price: 25, rs: 0 },
              { name: '2 months', price: 40, rs: 0 },
              { name: '3 months', price: 50, rs: 0 },
              { name: '12 months', price: 120, rs: 0 },
              //
            ],
          },
          //
        ],
      },
      {
        //Category
        name: 'Discord Nitro',
        lowest: 125,
        keywords: ['nitro','nitor','nb','basic','classic'],
        channel: '1054720561277841438',
        rs: '1078708432091226112',
        status: 1,
        id: '1096319579787116544',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1094077186127970414/Logopit_1680918484757.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Monthly Subscription',
            children: [
              //
              { name: 'Nitro Basic (MTO)', price: 60, rs: 0 },
              { name: 'Nitro Boost', price: 120, rs: 125 },
              //
            ],
          },
          {
            parent: 'Yearly Subscription',
            children: [
              //
              { name: 'Nitro Basic (Not avail)', price: 0 },
              { name: 'Nitro Boost (MTO)', price: 1000},
              //
            ],
          },
          //
        ],
      },
      {
        //Category
        name: 'Steam',
        keywords: ['swc','steam'],
        channel: '1054989628765122571',
        status: 4,
        id: '1096319581393535036',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1094077185125535844/Logopit_1680918431372.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Steam Wallet Codes',
            children: [
              //
              { name: '50 swc', price: 50 },
              { name: '100 swc', price: 100 },
              { name: '200 swc', price: 200 },
              { name: '300 swc', price: 297 },
              { name: '500 swc', price: 495 },
              { name: '1000 swc', price: 985 },
              //
            ],
          },
          //
        ],
      },
      {
        //Category
        name: 'Genshin Impact',
        keywords: ['genesis crystals','genshin','welkin'],
        channel: '1054989628765122571',
        status: 2,
        id: '1096319582240788490',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1094077185406550136/Logopit_1680918406428.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Genesis Crystals',
            children: [
              //
              { name: '60 gc', price: 47 },
              { name: '330 gc', price: 230 },
              { name: '1090 gc', price: 695 },
              { name: '2240 gc', price: 1365 },
              { name: '3880 gc', price: 2375 },
              //
            ],
          },
          //
        ],
      },
      {
        //Category
        name: 'Robux',
        keywords: ['roblox','robux','rbx'],
        channel: '1054989628765122571',
        rs: '1078710810806853704',
        status: 2,
        id: '1096319583121584208',
        image: "https://media.discordapp.net/attachments/1093391705753002064/1094077237839532123/Logopit_1680918693719.png?width=1440&height=360",
        types: [
          //Types
          {
            parent: 'Via Gamepass',
            children: [
              //
              { name: '100  Robux', price: 80, rs: 0 },
              { name: '200  Robux', price: 100, rs: 0 },
              { name: '500 Robux', price: 230, rs: 0 },
              { name: '700 Robux', price: 250, rs: 0 },
              { name: '1000 Robux', price: 310, rs: 0 },
              //
            ],
          },
          {
            parent: '\u200b',
            children: [
              //
              { name: 'Covered tax', price: 0 },
              //
            ],
          },
          //
        ],
      },
      {
        //Category
        name: 'Spotify',
        keywords: ['spoti','spotify'],
        channel: '1054989652416798750',
        status: 4,
        id: '1096319564662448198',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1094077186379624478/Logopit_1680918508558.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Solo',
            children: [
              //
              { name: '1 month', price: 30 },
              { name: '2 months', price: 40 },
              { name: '3 months', price: 50 },
              { name: '4 months', price: 70 },
              { name: '6 months', price: 110 },
              { name: '12 months', price: 130 },
              //
            ],
          },
          {
            parent: '\u200b',
            children: [
              //
              { name: '+₱15 if own account', price: 0 },
              //
            ],
          },
          //
        ],
      },
      {
        //Category
        name: 'Youtube',
        keywords: ['yt','youtube'],
        channel: '1054989652416798750',
        status: 2,
        id: '1096319565606174800',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1094077235713028126/Logopit_1680918525501.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Via Invite',
            children: [
              //
              { name: '1 month', price: 15 },
              //
            ],
          },
          {
            parent: 'Solo',
            children: [
              //
              { name: '1 month', price: 30 },
              { name: '4 months', price: 60 },
              { name: '6 months', price: 99 },
              //
            ],
          },
          //
        ],
      },
      {
        //Category
        name: 'Netflix',
        keywords: ['nf','netflix','netplix'],
        channel: '1054989652416798750',
        status: 2,
        id: '1096319566902218813',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1094077235939512320/Logopit_1680918539369.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Shared Profile',
            children: [
              //
              { name: '1 month', price: 90 },
              { name: '3 months', price: 180 },
              //
            ],
          },
          {
            parent: 'Solo Profile',
            children: [
              //
              { name: '1 month', price: 120 },
              { name: '3 months', price: 230 },
              //
            ],
          },
          {
            parent: 'Solo Account',
            children: [
              //
              { name: '1 month', price: 410 },
              { name: '3 months', price: 1200 },
              //
            ],
          },
          //
        ],
      },
      {
        //Category
        name: 'Valorant',
        keywords: ['vp','valorant','balo'],
        channel: '1054989628765122571',
        status: 2,
        id: '1096319584514080859',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1094077185666592768/Logopit_1680918349259.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Valorant Points',
            children: [
              //
              { name: '125 vp', price: 50 },
              { name: '380 vp', price: 150 },
              { name: '790 vp', price: 285 },
              { name: '1650 vp', price: 560 },
              { name: '2850 vp', price: 910 },
              { name: '5800 vp', price: 1880 },
              //
            ],
          },
          //
        ],
      },
      {
        //Category
        name: 'Vyper VPN',
        keywords: ['vyper'],
        channel: '1094056028938698833',
        status: 2,
        id: '1096319586640609280',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1094077236648345710/Logopit_1680918601382.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Shared',
            children: [
              //
              { name: '1 month', price: 40 },
              { name: '2 months', price: 55 },
              //
            ],
          },
          //
        ],
      },
      {
        //Category
        name: 'Windscribe VPN',
        keywords: ['windscribe','wind'],
        channel: '1094056028938698833',
        status: 4,
        id: '',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1105784399875813496/Logopit_1683709883410.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Solo',
            children: [
              //
              { name: '1 month', price: 240 },
              { name: '3 months', price: 310 },
              { name: '12 months', price: 680 },
              //
            ],
          },
          //
        ],
      },
      {
        //Category
        name: 'Express VPN',
        keywords: ['express'],
        channel: '1094056028938698833',
        status: 2,
        id: '',
        image: 'https://media.discordapp.net/attachments/1093391705753002064/1105784399636733982/Logopit_1683709898945.png?width=1440&height=360',
        types: [
          //Types
          {
            parent: 'Shared',
            children: [
              //
              { name: '1 month', price: 65 },
              //
            ],
          },
          //
          {
            parent: 'Solo',
            children: [
              //
              { name: '1 month', price: 95 },
              //
            ],
          },
          //
        ],
      },
      //
    ],
    ar: {
      prefix: '.',
      responders: [
        {
          command: 'form',
          response: null,
          components: new MessageActionRow().addComponents(
            new MessageButton().setCustomId('orderFormat').setStyle('SECONDARY').setLabel('Order Form').setEmoji('<a:S_arrowright:1095503803761033276>'),
          ),
          autoDelete: true,
        },
        {
          command: 'rpremium',
          response: '• premium purchased:\n• subscription:\n• original email:\n• replacement email:\n• working pass:\n• shared/solo/fh:\n• date availed :\n• date reported:\n• days used:\n• remaining days:\n• price paid:\n• issue & screenshot of issue:\n• screenshot of vouch with proof of login:',
          autoDelete: false,
        },
        {
          command: 'rboost',
          response: '• Permanent invite link (The one you sent in your order):\n• How many boosts:\n• Date bought:\n• Days used:\n• Vouch link/screenshot:\n• Issue & proof of issue:',
          autoDelete: false,
        },
        {
          command: 'rbadge',
          response: '• User who claimed the badge:\n• Duration:\n• Vouch link/screenshot;',
          autoDelete: false,
        },
        {
          command: 'rnitro',
          response: '• nitro link:\n• user who claimed the nitro:\n• revoked email from discord (click "to me" in the email to confirm that the email is connected with your acc):\n• screenshot of the email connected to your discord account:\n• date availed:\n• remaining days:\n• screenshot/link of vouch:\n• Ref code:\n\nMake sure that the screenshot you send is exactly similar (not cropped) to the example below:',
          files: [{attachment: 'https://media.discordapp.net/attachments/1093391705753002064/1096677816168353962/Untitled_design_8.png?width=662&height=662',name: 'file.png'}],
          autoDelete: false,
        },
        {
          command: 'rate',
          response: '**Paypal Rate** <:07:1069200743959109712>\n\n₱499 below = 10%\n₱500 above = 7%\n₱1,000 above = 3%',
          autoDelete: true,
        },
        {
          command: 'boost',
          response: '<a:Nitro:1054725579192160306> **Server Boosting**\n— Send **permanent** invite link of the server (not vanity).\n— The server must have a boost announcement channel (see attachments below)\n— This will be required once you vouch and report.\n—Do not forget your invite link.\n\n**Void warranty if:**\n— Invite link is not permanent or was removed.\n— Did not have a **system messages channel** for boosters.\n— The channel **is not** PUBLICLY visible.',
          files: [{attachment: 'https://media.discordapp.net/attachments/1093391705753002064/1093391789223850044/image.png?width=1135&height=527',name: 'file.png'},{attachment: 'https://media.discordapp.net/attachments/1093391705753002064/1093391724249878560/image.png?width=791&height=117',name: 'file.png'}],
          autoDelete: true,
        },
        {
          command: 'robux',
          response: '• Gamepass/Shirt Link:\n• Amount:',
          autoDelete: true,
        },
        {
          command: 'valorant',
          response: '<:mark:1056579773989650543>Riot ID:',
          autoDelete: true,
        },
        {
          command: 'gcash4',
          response: '<a:MoneyFlash:1054781743355396186> GCASH\n— **0906 412 6440**\n— **LE•••N K•• F.**\n\n— Send screenshot of receipt here',
          components: new MessageActionRow().addComponents(new MessageButton().setCustomId('replyCopy-09064126440').setStyle('SECONDARY').setEmoji('📱').setLabel("Copy Paste")),
          autoDelete: true,
        },
        {
          command: 'gcash',
          response: '<a:MoneyFlash:1054781743355396186> GCASH\n— **0966 208 4534**\n— **EL•A I.**\n\n— Send the Reference ID here',
          components: new MessageActionRow().addComponents(new MessageButton().setCustomId('replyCopy-09662084534').setStyle('SECONDARY').setEmoji('📱<a:s_notes:1096412847522717696>').setLabel("Copy Paste")),
          autoDelete: true,
        },
        {
          command: 'gcash2',
          response: '<a:MoneyFlash:1054781743355396186> GCASH\n— **0945 326 3549**\n— **I^^ PA••O I.**\n\n— Send screenshot of receipt here',
          components: new MessageActionRow().addComponents(new MessageButton().setCustomId('replyCopy-09453263549').setStyle('SECONDARY').setEmoji('📱').setLabel("Copy Paste")),
          autoDelete: true,
        },
        {
          command: 'gcash3',
          response: '<a:MoneyFlash:1054781743355396186> GCASH\n— **0945 986 8489**\n—**RA^^L I.**\n\n— Send screenshot of receipt here',
          components: new MessageActionRow().addComponents(new MessageButton().setCustomId('replyCopy-09459868489').setStyle('SECONDARY').setEmoji('📱').setLabel("Copy Paste")),
          autoDelete: true,
        },
        {
          command: 'paypal',
          response: '<a:MoneyFlash:1054781743355396186> Paypal (w/ fee)\n— Link: https://paypal.me/marcoplaton\n— Email: narcshin3@gmail.com\n— Please make sure to set the payment type to **friends and family**!\n\n— Send screenshot of receipt here',
          autoDelete: true,
        },
        {
          command: '1s213213123',
          response: '',
          autoDelete: true,
        },
        {
          command: 'qwe3w2313',
          response: '',
          autoDelete: true,
        },
      ]
    },
    customRoles: [
      {
        user: '482603796371865603', //mimi
        role: '1070267838922752060',
      },
    ],
    randomVouchers: {
      amount: [1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,6,7,8,9,10],
      type: [
        "dev badge",
        "game creds",
        "premium",
        "global",
        "nitro",
      ]
    },
    stickyChannels: [
      {
        id: '1094975726127685726',
        message: "<a:S_bearheart:1094190497179910225> Type `;feedback` on <@1057167023492300881>'s DMs to submit a feedback."
      },
      {
        id: '1081107027054571550',
        message: '<:S_letter:1092606891240198154> **Stocks dropper showcase**',
        files: ['https://cdn.discordapp.com/attachments/1101501538293252136/1102772107424833536/2023-05-02_09-39-15.mp4']
      },
      {
        id: '1047454193595732049',
        message: '<a:nitroboost:1057999297787985960> **Server Booster Perks**\n<:S_dot:1093733278541951078> ₱5 discount on certain products\n<:S_dot:1093733278541951078> Image/Gif perms in <#1047454193595732055> \n<:S_dot:1093733278541951078> **Sloopier** role\n<:S_dot:1093733278541951078> **Sloopiest** role (2x boost)\n<:S_dot:1093733278541951078> 2x giveaway entries',
      },
      {
        id: '1054724474659946606',
        message: '<a:catpet:1054020868650578081> __**Vouch here!**__\n\n• Send any message of acknowledgement\n• Send screenshot of your purchase\n\n<:mark:1056579773989650543> **Void warranty if:**\n• no vouch/improper vouch\n• no screenshot/proof of login\n• did not vouch within 12 hours\n• reference code is not visible',
      },
      {
        id: '0',
        message: '<:gude1:1056579657828417596> — Noted\n<:gude2:1056579660353372160> — Processing\n<:gude3:1056579662572179586> — Completed',
      },
      {
        id: '1055030500508569620',
        message: '<:gude1:1056579657828417596> — Noted\n<:gude2:1056579660353372160> — Ready to claim\n<:gude3:1056579662572179586> — Claimed',
      },
      {
        id: '1101833714704601168',
        message: '<:gude1:1056579657828417596> — Noted\n<:gude2:1056579660353372160> — Fixing\n<:gude3:1056579662572179586> — Fixed',
      },
      {
        id: '0',
        message: '',
        comp: new MessageActionRow()
        .addComponents(
          new MessageButton().setLabel('Order Here').setURL('https://discord.com/channels/1047454193159503904/1054711675045036033/1095603406632144936').setStyle('LINK').setEmoji('<:09:1069200736631656518>')
        ),
      },
      {
        id: '1054711675045036033',
        message: 'Click the button below to create a ticket!\n\nOrder — Availing products\nSupport — General concerns and inquiries\nReport — Reporting revoked products',
        comp: new MessageActionRow()
        .addComponents(
          new MessageButton().setLabel('Create Order').setCustomId('createTicket-order').setStyle('SECONDARY').setEmoji('<a:S_bearheart:1094190497179910225>'),
          new MessageButton().setLabel('Support Ticket').setCustomId('createTicket-support').setStyle('SECONDARY').setEmoji('<a:S_pastelheart:1093737606451298354> '),
          new MessageButton().setLabel('Submit Report').setCustomId('createTicket-report').setStyle('SECONDARY').setEmoji('<:S_exclamation:1093734009005158450>')
        ),
      },
      {
        id: '0',
        message: "You will no longer need to accept the consent form in your ticket once you click this button.",
        comp: new MessageActionRow()
        .addComponents(
          new MessageButton().setLabel('New TOS').setCustomId('terms101').setStyle('SECONDARY').setEmoji('<:S_exclamation:1093734009005158450>')
        ),
      },
      {
        id: '1102417073642164274',
        message: '',
        order: true,
        comp: new MessageActionRow()
        .addComponents(
          new MessageButton().setLabel('Order Here').setURL('https://discord.com/channels/1047454193159503904/1054711675045036033/1095603406632144936').setStyle('LINK').setEmoji('<:09:1069200736631656518>')
        )
      },
      {
        id: '0',
        message: '**Notification Roles** <:07:1069200743959109712>',
        roles: true,
        comp: null,
      },
      {
        id: '0',
        message: '**Notification Roles** <:07:1069200743959109712>',
        roles: true,
        comp: null,
      },
      {
        id: '1054731483656499290', //
        message: '',
        condition: message => keys.find(k => message.channel.name.includes(k) && !message.channel.name.includes('done')),
        comp: new MessageActionRow()
        .addComponents(
          //new MessageButton().setLabel('Follow Up').setStyle('SECONDARY').setEmoji('<a:S_arrowright:1095503803761033276>').setCustomId('followup'),
          new MessageButton().setLabel('Mark as Done').setStyle('SECONDARY').setEmoji('<a:S_lapot:1088655136785711184>').setCustomId('done'),
        ),
      },
      {
        id: '1047454193197252644',
        message: '*Pick your age*',
        comp: new MessageActionRow()
        .addComponents(
          new MessageButton().setLabel('13-15').setStyle('DANGER').setEmoji('🐣').setCustomId('roles-13-15'),
          new MessageButton().setLabel('16-18').setStyle('DANGER').setEmoji('🐥').setCustomId('roles-16-18'),
          new MessageButton().setLabel('19-21').setStyle('DANGER').setEmoji('🐔').setCustomId('roles-19-21'),
          new MessageButton().setLabel('22+').setStyle('DANGER').setEmoji('🍗').setCustomId('roles-22+')
        ),
      },
      {
        id: '1047454193197252644',
        message: '*Pick which games you play*',
        comp: new MessageActionRow()
        .addComponents(
          new MessageButton().setLabel('Minecraft').setStyle('SECONDARY').setEmoji('🎮').setCustomId('roles-Minecraft'),
          new MessageButton().setLabel('Valorant').setStyle('SECONDARY').setEmoji('🎮').setCustomId('roles-Valorant'),
          new MessageButton().setLabel('Roblox').setStyle('SECONDARY').setEmoji('🎮').setCustomId('roles-Roblox'),
          new MessageButton().setLabel('Genshin').setStyle('SECONDARY').setEmoji('🎮').setCustomId('roles-Genshin'),
          new MessageButton().setLabel('COD').setStyle('SECONDARY').setEmoji('🎮').setCustomId('roles-COD')
        ),
      },
      {
        id: '1047454193197252644',
        message: '*Pick which games you play (2)*',
        comp: new MessageActionRow()
        .addComponents(
          new MessageButton().setLabel('CSGO').setStyle('SECONDARY').setEmoji('🎮').setCustomId('roles-CSGO'),
          new MessageButton().setLabel('DOTA').setStyle('SECONDARY').setEmoji('🎮').setCustomId('roles-DOTA'),
          new MessageButton().setLabel('Overwatch').setStyle('SECONDARY').setEmoji('🎮').setCustomId('roles-Overwatch'),
          new MessageButton().setLabel('LOL').setStyle('SECONDARY').setEmoji('🎮').setCustomId('roles-LOL'),
          new MessageButton().setLabel('Mobile Legends').setStyle('SECONDARY').setEmoji('🎮').setCustomId('roles-Mobile_Legends')
        ),
      },
      {
        id: '1047454193197252644',
        message: '*Pick your pronouns*',
        comp: new MessageActionRow()
        .addComponents(
          new MessageButton().setLabel('He/Him').setStyle('SECONDARY').setEmoji('♂️').setCustomId('roles-He/Him'),
          new MessageButton().setLabel('She/Her').setStyle('SECONDARY').setEmoji('♀️').setCustomId('roles-She/Her'),
          new MessageButton().setLabel('They/Them').setStyle('SECONDARY').setEmoji('👥').setCustomId('roles-They/Them'),
        ),
      },
      {
        id: '1047454193197252644',
        message: '*Pick which notifications you want to get*',
        comp: new MessageActionRow()
        .addComponents(
          new MessageButton().setLabel('Announcements').setStyle('SECONDARY').setEmoji('🔔').setCustomId('roles-Announcement'),
          new MessageButton().setLabel('Stocks').setStyle('SECONDARY').setEmoji('🔔').setCustomId('roles-Stocks'),
          new MessageButton().setLabel('Shop Status').setStyle('SECONDARY').setEmoji('🔔').setCustomId('roles-Shop_Status')
        ),
      },
      {
        id: '1121979133346451506',
        message: 'Click the button to gain the **Shop Status** role and get notified when the shop opens or closes!',
        comp: new MessageActionRow()
        .addComponents(
          new MessageButton().setLabel('Shop Status').setStyle('SECONDARY').setEmoji('🔔').setCustomId('roles-Shop_Status')
        ),
      },
      {
        id: '1105332833079267460',
        message: 'Click the button to gain the **GCash Status** role and get notified when the gcash service advisory releases an update!',
        comp: new MessageActionRow()
        .addComponents(
          new MessageButton().setLabel('GCash Status').setStyle('SECONDARY').setEmoji('🔔').setCustomId('roles-GCash_Status')
          ),
      },
      {
        id: '1047454193197252644',
        message: '*Pick your language*',
        comp: new MessageActionRow()
        .addComponents(
          new MessageButton().setLabel('Filipino').setStyle('SECONDARY').setEmoji('🇵🇭').setCustomId('roles-Pipino'),
          new MessageButton().setLabel('English').setStyle('SECONDARY').setEmoji('🌐').setCustomId('roles-English'),
        ),
      },
    ],
    deleteChannels: [],
    checkers: [],
    vouchers: [],
    scanner: [],
    followUps: [],
  },
  interExpire: 300000,
  auth: {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer '+process.env.COC,
      'Content-Type': 'application/json'
    }
  },
  commands: [
    {
      Command: "stocks",
      Template: "",
      Alias: ['stock','stoc','sto'],
      Category: "Misc",
      Desc: 'Shows the list of available stocks',
      ex: [''],
      level: 0,
    },
    {
      Command: "nitro",
      Template: "<user> <amount> [payment] [item]",
      Alias: [],
      Category: "Handler",
      Desc: 'Drops nitro boost to a user',
      ex: ['nitro @user 10','nitro @user 10 paypal','nitro @user 10 gcash 1yr nitro boost'],
      level: 4,
    },
    {
      Command: "drop",
      Template: "<channel> <voucher>",
      Alias: [],
      Category: "Handler",
      Desc: 'Drops a voucher in a specific channel',
      ex: ['nitro @channel ₱5 voucher','nitro @channel ₱10 premium voucher'],
      level: 4,
    },
    {
      Command: "rate",
      Template: "<amount>",
      Alias: [],
      Category: "Handler",
      Desc: 'Calculates the fee for paypal buyers',
      ex: ['rate 509','rate 69.23'],
      level: 4,
    },
    {
      Command: "exchange",
      Template: "<amount>",
      Alias: ['ex'],
      Category: "Handler",
      Desc: 'Calculates the amount to receive in e-wallet exchange',
      ex: ['ex 509','exchange 69.23'],
      level: 4,
    },
    {
      Command: "use",
      Template: "<voucher>",
      Alias: [],
      Category: "Misc",
      Desc: 'Use a voucher',
      ex: ['use KJnHhJb'],
      level: 0,
    },
    {
      Command: "cmds",
      Template: "[command]",
      Alias: ['cmd','help'],
      Category: "Misc",
      Desc: 'Shows the list of available commands',
      ex: ['cmds stocks','cmds use'],
      level: 0,
    },
    {
      Command: "stat",
      Template: "<category> <stat>",
      Alias: [],
      Category: "Misc",
      Desc: 'Changes the product status\n\n1 — Avail\n2 — Avail (MTO)\n3 — Restocking\n4 — Not avail',
      ex: ['stat nitro 1','stat spotify 2'],
      level: 0,
    },
    {
      Command: "setpr",
      Template: "<type>",
      Alias: [],
      Category: "Misc",
      Desc: 'Updates the pricelist',
      ex: ['setpr rs','setpr all'],
      level: 0,
    },
  ],
  permissions: [
    {
      id: "920903240617451581", //collateral
      level: 5,
    },
    {
      id: "1047454193184682040", //collateral
      level: 3,
    },
    {
      id: "1047454193184682040", //sloopie mod
      level: 4,
    },
    {
      id: "1047454193197252639",
      level: 5,
    },
    {
      id: '1060780494909870230',
      level: 5
    },
    {
      id: '1109338607170367548', //backup server admin
      level: 5,
    }
  ],
  botlog: '901759430457167872',
  prefix: ';',
  filteredWords: [],
  AI: {
    modelCount: 0,
    users: [],
    filter: function(string) {
      string = string.replace('As an AI language model, ','')
      string = string.replace(' As an AI language model, ','')
      string = string.replace('an AI language model','gudetama')
      string = string.replace('OpenAI','Sloopies')
      string = string.replace('ChatGPT','Gudetama')
      return string;
    },
    chatAPI: 'https://api.openai.com/v1/chat/completions',
    imageAPI: 'https://api.openai.com/v1/images/generations',
    models: [
      "gpt-3.5-turbo",
      //'gpt-3.5-turbo-0301',
      'gpt-3.5-turbo-0613',
      'gpt-3.5-turbo-16k',
      'gpt-3.5-turbo-16k-0613',
    ]//  
  },
  colors: colors,
  theme: colors.none,
  emojis: emojis,
};