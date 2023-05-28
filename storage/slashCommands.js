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
          "name": 'item',
          "description": 'Item Name',
          "type": 3,
          "required": false,
        },
        {
        "name": 'keyword',
        "description": 'Drop a specific item in stock that contains the keyword',
        "type": 3,
        "required": false,
        },
      ]
    },
    {
      "name": "stocks",
      "type": 1,
      "description": "Shows a list of available stocks",
    }
  ],
};
