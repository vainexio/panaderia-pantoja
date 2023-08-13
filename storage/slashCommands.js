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
module.exports = {
  register: false,
  deleteSlashes: [],
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
          "type": 10,
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
        {
          "name": 'note',
          "description": 'Extra notes',
          "type": 3,
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
              value: '<a:check:1054020736454492220> Order noted'
            },
            {
              name: 'submitted to supplier',
              value: '🚛 Order was submitted to our supplier',
            },
            {
              name: 'currently being processed',
              value: '<a:loading2:976650648600854538> Your order is currently being processed',
            },
            {
              name: 'order completed',
              value: '<a:check:1054020736454492220> Your order was completed',
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
    }
  ],
};
