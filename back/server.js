
const _ = require('lodash');
const fs = require('fs');

const redisUrl = '192.168.99.100:32769'
const mongoUrl = '192.168.99.100:32768'
const delay = ms => new Promise(done => setTimeout(done, ms))

const express = require('express');
const session = require('express-session')({
    secret: 'hehe',
    resave: false,
    saveUninitialized: true,
})  

const app = express();
const httpServer = require("http").createServer(app);

const io = require("socket.io")(httpServer, {});

let players = [];

globalThis.activeSessions = {};
globalThis.gameData = {};
globalThis.playerId = 0;

app.set('view engine', 'pug')
app.use(express.static('front'));
app.use(session);
io.use((socket, next) => {
    session(socket.request, {}, next);
});
app.use((req, res, next) => {
    req.session.name || (req.session.name= `Cat ${Math.random().toString().slice(2)}`);
    next();
});

app.get('/', function(req, res) {

    res.render('card', req.session);
});
app.get('/waiting', function(req, res) {
    res.render('waiting');
});
app.get('/io', (req, res) => {
    console.log('io :>> ', io.engine.clients);
    res.json(io.engine.clients)
})
app.get('/sess', (req, res) => {
    console.log('session :>> ', req.session);
    res.json({ session })
})

httpServer.listen(3131, () => console.log('started'));

const ioClientHandlers = {
    // game process
    drag(client, data) { 
        client.broadcast.emit('drag', data)
        Object.assign(gameData.cards[data.id], data);
    },
    card(client, data) {
        client.broadcast.emit('card', data)
        Object.assign(gameData.cards[data.id], data)
    },

    restart(client, data) { 
        delete gameData.cards
        client.emit('reload');
        delay(1000).then(() => client.broadcast.emit('reload'));
    },
    disconnect(client) {
        client.broadcast.emit('players');
        delete activeSessions[client.request.session.id]
    },

    // change name
    name(client, _name) {
        client.request.session.name = _name
        client.request.session.save()
        
        client.emit('setvar', ['players', Object.values(activeSessions).map(({name}) => name).join()])
        client.broadcast.emit('setvar', ['players', Object.values(activeSessions).map(({name}) => name).join()])
    },
    player(client, player) {
        console.log('player :>> ', player);
        client.request.session.player = player;
        client.request.session.save()
    },

    // game init
    cards(client, cards) {
        gameData.cards = cards;
    }
};

// WORK WITH SOCKET CLIENT
io.on('connection', client => {
    const {session} = client.request;

    activeSessions[session.id] = session;

    session.player = 'player' + Math.round(Math.random()+1);
    // session.player || (session.player = 'player' + players.length);

    client.emit('setvar', ['players', Object.values(activeSessions).map(({name}) => name).join()])
    client.broadcast.emit('setvar', ['players', Object.values(activeSessions).map(({name}) => name).join()])

    Object.entries(ioClientHandlers).forEach(([name,fn]) => client.on(name, data => fn(client, data)));

    client.emit('setvar', ['gameData', Object.assign({ player: session.player }, gameData)])
    client.emit('ready')
});

io.on('error', err => {
    console.log('err', err);
});
