const fs = require('fs');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const { Client } = require('whatsapp-web.js');
const SESSION_FILE_PATH = './session.json';
const keys = require('./config');

let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionCfg = require(SESSION_FILE_PATH);
}

const client = new Client({
  puppeteer: { headless: true },
  session: sessionCfg,
});

client.on('qr', (qr) => {
  // NOTE: This event will not be fired if a session is specified.
  console.log('QR RECEIVED', qr);
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', (session) => {
  console.log('AUTHENTICATED', session);
  sessionCfg = session;
  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
    if (err) {
      console.error(err);
    }
  });
});

client.on('auth_failure', (msg) => {
  // Fired if session restore was unsuccessfull
  console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
  console.log('READY');
});

client.on('message', (msg) => {
  const fetchHero = (heroName) => {
    axios
      .get(
        `https://gateway.marvel.com:443/v1/public/characters?name=${heroName}&ts=${keys.ts}&apikey=${keys.apiKey}&hash=${keys.hash}`,
      )
      .then((res) => {
        const { name, description } = res.data.data.results[0];
        msg.reply(`Herói: ${name}\nDescrição: ${description}`);
      })
      .catch((error) => {
        console.log(error, 'error');
        msg.reply('Desculpe, algum erro aconteceu ou esse herói não existe.');
      });
  };
  const fetchPokemon = (pokeName) => {
    axios
      .get(`https://pokeapi.co/api/v2/pokemon/${pokeName}`)
      .then((res) => {
        const { name, id } = res.data;
        msg.reply(`Nome do pokémon nº${id}: ${name}`);
      })
      .catch((error) => {
        console.log(error, 'error');
        msg.reply('Desculpe, algum erro aconteceu ou esse pokémon não existe.');
      });
  };

  if (msg.body == 'oi') {
    msg.reply(
      'Olá, seja bem-vindo ao TDC Chatbot. Digite **!heroi nomeDoHeroi** para informações de heróis da Marvel. \nDigite **!pokemon nomeDoPokemon** para informações de pokemon.',
    );
  } else if (msg.body.startsWith('!heroi')) {
    fetchHero(msg.body.slice(7));
  } else if (msg.body.startsWith('!pokemon')) {
    fetchPokemon(msg.body.slice(9));
  } else {
    msg.reply('Desculpe, eu não entendi o que você quer.');
  }
});

client.initialize();
