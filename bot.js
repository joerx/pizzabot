'use strict'

const assert = require('assert')
const botkit = require('botkit')

assert(process.env.SLACK_BOT_TOKEN, 'SLACK_BOT_TOKEN is not set')

const ANY_MENTION = ['direct_mention', 'mention', 'direct_message']

const token = process.env.SLACK_BOT_TOKEN
const bot = botkit.slackbot({debug: true})

bot.spawn({token}).startRTM(err => {
  if (err) throw err
})

bot.hears('beer', ANY_MENTION, (bot, message) => {
  bot.reply(message, ':beer:')
})

bot.hears('pizza', ANY_MENTION, (bot, message) => {
  bot.startConversation(message, askForSize)
})

var pizzaOrder = []

function askForSize(res, conv) {
  conv.ask('Medium or large?', (res, conv) => {
    if (!res.text.match(/medium|large/)) {
      conv.say('Sorry, I did\'t get that')
      conv.repeat()
    } else {
      pizzaOrder.size = res.text.toLowerCase()
      askForCrust(null, conv)
    }
    conv.next()
  })
}

function askForCrust(res, conv) {
  conv.ask('Thin crust or thick crust?', (res, conv) => {
    if (/thin|thick/i.test(res.text)) {
      pizzaOrder.crust = res.text.toLowerCase()
      askForTopping(res, conv)
    } else {
      conv.say('Sorry, I didn\'t get that')
      conv.repeat()
    }
    conv.next()
  })
}

const TOPPINGS = ['salami', 'ham', 'veggie', 'salmon']
const UTTER_YES = /y|yes|ok|yep|yup|yeah/i
const UTTER_NO = /n|no|nope|nah/i

function askForTopping(res, conv) {
  conv.ask('What kind of topping would you like?', (res, conv) => {
    let topping = null
    let selection = enumerate(TOPPINGS.map(ucfirst))
    let regex = new RegExp(TOPPINGS.join('|'), 'i')
    if (!regex.test(res.text)) {
      conv.say(`I\'m sorry, ${res.text} is not available. We have ${selection}`)
      conv.repeat()
    } else {
      topping = res.text.match(regex)[0]
      conv.say(`${ucfirst(topping)} it is`)
      pizzaOrder.topping = topping
      askForExtraCheese(res, conv)
    }
    conv.next()
  })
}


function askForExtraCheese(res, conv) {
  conv.ask('Would you like extra cheese?', (res, conv) => {
    if (UTTER_YES.test(res.text)) {
      pizzaOrder.extraCheese = true
      confirmOrder(res, conv)
    } 
    else if (UTTER_NO.test(res.text)) {
      pizzaOrder.extraCheese = false
      confirmOrder(res, conv)
    }
    else {
      conv.say('Sorry, I didn\'t get that')
      conv.repeat()
    }
    conv.next()
  })
}

function ucfirst(str) {
  return str[0].toUpperCase() + str.substring(1, str.length)
}

function enumerate(terms, fillWord) {
  fillWord = fillWord || 'and'
  let last = terms[terms.length - 1]
  let list = terms.splice(0, terms.length - 1)
  return `${list.join(', ')} ${fillWord} ${last}`
}

function confirmOrder(res, conv) {
  conv.say([
    `You ordered a ${pizzaOrder.size} size Pizza ${ucfirst(pizzaOrder.topping)}`, 
    `with ${pizzaOrder.crust} crust`,
    `and ${pizzaOrder.extraCheese ? '' : 'no'} extra cheese.`
  ].join(' '))

  conv.ask('Is this correct?', (res, conv) => {
    if (UTTER_YES.test(res.text)) {
      conv.say('Thank you for your order!')
    } 
    else if (UTTER_NO.test(res.text)) {
      conv.say('Sorry about that! Please type \'pizza\' to start again')
    }
    else {
      conv.say('Sorry, I didn\'t get that')
      conv.repeat()
    }
    conv.next()
  }) 
}
