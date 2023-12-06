/*
SUB_COMMAND - 1
SUB_COMMAND_GROUP - 2
STRING - 3
INTEGER - 4
BOOLEAN - 5
USER - 6
CHANNEL - 7
ROLE - 8
MENTIONABLE - 9
NUMBER - 10
ATTACHMENT - 11
*/

const settings = require('../storage/settings_.js')
const {shop, emojis, colors, theme, status} = settings

module.exports = {
  register: true,
  deleteSlashes: ['1174898700338864138'],
  slashes: [
    {
      "name": "drop",
      "type": 1,
      "description": "Drops an item to a user",
      "options": [
        {
          "name": 'user',
          "description": 'Recipient',
          "type": 6,
          "required": true,
        },
        {
          "name": 'quantity',
          "description": 'Amount to send',
          "type": 4,
          "required": true,
        },
        {
          "name": 'price',
          "description": 'Price paid',
          "type": 4,
          "required": true,
        },
        {
          "name": 'item',
          "description": 'Item name',
          "type": 3,
          "choices": [
            {
              name: 'nitro boost',
              value: 'Nitro Boost'
            },
            {
              name: 'nitro basic',
              value: 'Nitro Basic'
            },
            {
              name: 'other',
              value: 'Other'
            },
          ],
          "required": true,
        },
        {
          "name": 'note',
          "description": 'Extra notes',
          "type": 3,
          "required": false,
        },
        {
          "name": 'stop_queue',
          "description": 'Prevents bot from sending queue',
          "type": 5,
          "required": false,
        },
        {
          "name": 'mop',
          "description": 'Mode of Payment',
          "type": 3,
          "choices": [
            {
              name: 'gcash',
              value: 'gcash'
            },
            {
              name: 'paypal',
              value: 'paypal'
            },
          ],
          "required": false,
        },
      ]
    },
    {
      "name": "stocks",
      "type": 1,
      "description": "Shows a list of available stocks",
    },
    {
      "name": "resend",
      "type": 1,
      "description": "Resend a message through the bot",
      "options": [
        {
          "name": 'msg_ids',
          "description": 'Message IDs',
          "type": 3,
          "required": false,
        },
      ]
    },
    {
      "name": "orderstatus",
      "type": 1,
      "description": "Update order status",
      "options": [
        {
          "name": 'preset_status',
          "description": 'Preset order status',
          "type": 3,
          "choices": [
            {
              name: 'order noted',
              value: '<a:qqWhtShk_CuteClap:1138849011965624320> Order noted'
            },
            {
              name: 'submitted to supplier',
              value: '🚛 Order was submitted to our supplier',
            },
            {
              name: 'currently being processed',
              value: emojis.loading+' Your order is currently being processed',
            },
            {
              name: 'order completed',
              value: emojis.check+' Your order was completed',
            },
          ],
          "required": false,
        },
        {
          "name": 'custom_status',
          "description": 'Custom order status',
          "type": 3,
          "required": false,
        },
      ]
    },
    {
      "name": "order",
      "type": 1,
      "description": "Sends an order queue",
      "options": [
        {
          "name": 'user',
          "description": 'Recipient',
          "type": 6,
          "required": true,
        },
        {
          "name": 'product',
          "description": 'Product name',
          "type": 3,
          "required": false,
        },
        {
          "name": 'quantity',
          "description": 'Amount ordered',
          "type": 10,
          "required": true,
        },
        {
          "name": 'mop',
          "description": 'Mode of Payment',
          "type": 3,
          "choices": [
            {
              name: 'GCash',
              value: 'gcash'
            },
            {
              name: 'Robux',
              value: 'robux'
            },
            {
              name: 'Paypal',
              value: 'paypal'
            },
          ],
          "required": true,
        },
        {
          "name": 'price',
          "description": 'Price paid',
          "type": 4,
          "required": true,
        },
      ]
    },
  ],
};
