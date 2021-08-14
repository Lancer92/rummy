
var socket = io();

const setVar = ([key, val]) => {
    globalThis[key] = val;
    let elem = document.getElementById(key);
    if (elem) {
        elem.value = val;
        elem.textContent = val;
    }
}

socket.on('setvar', setVar);
socket.on('connect', (data) => {
    console.log('connected :>> ', socket, data);
});
socket.on('gameData', d => console.log('gd', d))
const nameInput = document.getElementById('name');

socket.on('name', rarefy(name => name ? (nameInput.value = name) : socket.emit('name', nameInput.value)));
socket.on('reload', () => window.location.reload())

const playersSpan = document.getElementById('players');
socket.on('players', rarefy(players => playersSpan.textContent = players));

nameInput.addEventListener('input', e => {
    socket.emit('name', nameInput.value);
    // playersSpan.textContent = playersSpan.textContent.split(',').filter(v => v !== )
});