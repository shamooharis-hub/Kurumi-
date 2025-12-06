const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@adiwajshing/baileys')
const P = require('pino')
const fs = require('fs')
const qrcode = require('qrcode-terminal')

const config = require('./config.json')
const { BOT_NAME, OWNER_NUMBER, WELCOME_MESSAGE, COMMAND_PREFIX } = config

const { state, saveState } = useSingleFileAuthState('./session.json')

async function startBot() {
    const { version } = await fetchLatestBaileysVersion()
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        version
    })

    sock.ev.on('creds.update', saveState)

    sock.ev.on('messages.upsert', async m => {
        if (!m.messages) return
        const msg = m.messages[0]
        if (!msg.message) return

        const from = msg.key.remoteJid
        const sender = msg.key.participant || msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text
        if (!text) return

        // Auto welcome for new members
        if (msg.message?.protocolMessage?.type === 1) { // someone added
            await sock.sendMessage(from, { text: WELCOME_MESSAGE })
        }

        // Commands
        if (text.startsWith(COMMAND_PREFIX)) {
            const args = text.slice(1).trim().split(/ +/g)
            const cmd = args.shift().toLowerCase()

            if (cmd === 'hug') {
                await sock.sendMessage(from, { text: `*${BOT_NAME} hugs* @${sender.split('@')[0]} 🤗`, mentions: [sender] })
            } else if (cmd === 'truth') {
                const truths = [
                    "Kurumi says: You can’t escape me 💀",
                    "Kurumi whispers your secret 😈",
                    "Kurumi dares you!"
                ]
                await sock.sendMessage(from, { text: truths[Math.floor(Math.random() * truths.length)] })
            } else if (cmd === 'dare') {
                const dares = [
                    "Kurumi dares you to sing 💀",
                    "Kurumi dares you to post a meme 😈"
                ]
                await sock.sendMessage(from, { text: dares[Math.floor(Math.random() * dares.length)] })
            } else if (cmd === 'play') {
                const song = args.join(' ')
                if (!song) return sock.sendMessage(from, { text: 'Type a song name! Example: .play despacito' })
                await sock.sendMessage(from, { text: `Kurumi is searching for: ${song} 💀` })
            }
        }
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            if ((lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
                startBot()
            }
        } else if(connection === 'open') {
            console.log(`${BOT_NAME} is online!`)
        }
    })
}

startBot()
