let phaser;

let cards = {};
let cardsData = {};
let currentPlayer;

const config = {
    type: Phaser.AUTO,
    parent: 'phaser',
    width: 950,
    height: 520,
    scene: {
        preload() {
            phaser = this
            phaser.load.setBaseURL('http://labs.phaser.io');
            phaser.load.atlas('cards', 'assets/atlas/cards.png', 'assets/atlas/cards.json');
        },
        async create() {
            drawAreas()
            currentPlayer = gameData.player 
            if (+currentPlayer.slice(-1) > 2) {
                currentPlayer = 'player2';
                socket.emit('player', currentPlayer)
            }
            gameData.cards ? loadFrames(gameData.cards) : createFrames()
            bindHandlers()
            
        }
    }
};
const userArea = [config.height/2, 360]

// const DB = {};

socket.once('ready', () => {
    const game = new Phaser.Game(config);
})

const restartBtn = document.getElementById('restart');


function createFrames() {
    console.log('createFrames');
    frames = phaser.textures.get('cards').getFrameNames().filter(name => name !== 'back');
    frames.push(...frames);
    frames.sort(() => Math.random() > 0.5 ? 1 : -1)

    let x = 30
    let y = 40
    let owner = currentPlayer = 'player1';

    for (let i = 0; i < frames.length; i++) {
        if (i===7 || i===21) x = 30, y += 80
        else if (i === 14) owner = 'player2', x = 30, y = 40 + userArea[0]
        else if (i === 28) owner = 'coloda', x = userArea[1] + 30, y = userArea[0] - 0

        let image = phaser.add.image(x, y, 'cards', i < 14 ? frames[i] : 'back')
        
        image.setInteractive();
        
        image.setData('id', i)
        image.setData('card', frames[i])
        image.setScale(0.4);

        owner.includes('player') && owner !== currentPlayer || phaser.input.setDraggable(image);

        if (i < 28) x += 30 // user zones
        else x += 0.1, y += 0.1 // main coloda

        cards[i] = image;
        cardsData[i] = {
            id: i,
            x: image.x,
            y: image.y,
            name: image.getData('card'),
            owner
        }
    }

    socket.emit('cards', cardsData);
    socket.emit('player', 'player1');
}

function loadFrames(cardsInfo) {
    console.log('loadFrames, current player: ', currentPlayer, 'cardsInfo', cardsInfo);
    for (let i = 0; i < 53*2; i++) {
        let {x,y, name, owner} = cardsInfo[i];
        let canDrag = [currentPlayer, 'table', 'coloda'].includes(owner);
        let canSee = [currentPlayer, 'table'].includes(owner);
        let image = phaser.add.image(x, y, 'cards', canSee ? name : 'back');

        
        image.setInteractive()
        image.setData('id', i)
        image.setData('card', name)
        image.setScale(0.4);

        canDrag && phaser.input.setDraggable(image);
        
        cards[i] = image;
    }
}

function bindHandlers () {
    phaser.input.on('dragstart', (pointer, gameObject) => {
        phaser.children.bringToTop(gameObject);
    });

    phaser.input.on('dragend', (pointer, gameObject) => {
        console.log('pointer, gameObject :>> ', pointer, gameObject);
        if (gameObject.frame.name === 'back') {
            gameObject.setTexture('cards', gameObject.getData('card'));
        }
        socket.emit('card', {
            id: gameObject.getData('id'),
            owner: gameObject.x < userArea[1] ? currentPlayer : 'table'
        });
    });

    socket.on('card', ({ owner, id }) => {
        phaser.children.bringToTop(cards[id]);

        if (owner !== 'table') return;
        
        cards[id].setTexture('cards', cards[id].getData('card'))
        phaser.input.setDraggable(cards[id])
    });

    phaser.input.on('drag', rarefy((pointer, gameObject, x, y) => {
        gameObject.x = x;
        gameObject.y = y;

        socket.emit('drag', {
            x, y, id: gameObject.getData('id')
        })
    }));
    phaser.input.on('dragenter', console.log);
    phaser.input.on('dragleave', console.log);
    socket.on('drag', rarefy(({ x, y, id }) => {
        cards[id].x = x, cards[id].y = y
    }));

    restartBtn.addEventListener('click', () => {
        socket.emit('restart');
    })
}

function drawAreas() {
    const [h, w] = userArea;
    var graphics = phaser.add.graphics({ lineStyle: { width: 1, color: 0xaa0000 } });
    var rect = new Phaser.Geom.Rectangle()
    
    rect.width = w
    rect.height = config.height/2
    
    graphics.strokeRectShape(rect);

    rect.y = config.height/2

    graphics.strokeRectShape(rect);
}