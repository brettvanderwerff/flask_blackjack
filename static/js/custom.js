var socket = io.connect('http://127.0.0.1:5000')


// upon player connection, start the game
socket.on('connect', function(){

    socket.emit('start_game')


})

// clears the left over cards and control panel buttons from a previous round

socket.on('clear_previous_round', function() {

    clearDiv('button-container')
    clearDiv('dealer-hand')
    clearDiv('player-hand')

})

// renders buttons for control panel, clears button-container of existing buttons first

socket.on('render_control', function(...args) {

    clearDiv('button-container')

    for (i = 0; i < args.length; i++) {

        if (args[i] == 'dealbutton') {

            dealButton()

        }

        if (args[i] == 'hitbutton') {

            hitButton()

        }

        if (args[i] == 'staybutton') {

            stayButton()

        }

    }


})

// slide out animation for the chips set

socket.on('slide_out_chips', function() {

    var elem = document.getElementById('chips')
    elem.style.transition = "right 1s linear 0s"
    elem.style.right = "0px"


})


// renders the running total for the dealer and the player

socket.on('update_totals', function(player_total, dealer_total) {

    var player_total_elem = document.getElementById('player-total');
    player_total_elem.innerText = player_total

    var dealer_total_elem = document.getElementById('dealer-total');
    dealer_total_elem.innerText = dealer_total

})

// slide in animation for chip set

socket.on('slide_in_chips', function() {

    var elem = document.getElementById('chips');
    elem.style.transition = "right 1s linear 0s";
    elem.style.right = "-500px";

})


// broadcasts an update in the players' total bet

socket.on('update_bet', function(new_bet_total) {

    var elem = document.getElementById("bet")
    elem.innerText = '$' + new_bet_total

})

// broadcasts an update in the players' total bank roll

socket.on('update_bank', function(new_bank_total) {

    var elem = document.getElementById("bank-roll")
    elem.innerText = '$' + new_bank_total

})

// flashes a min bet required modal, no easy way to do this in vanilla javascript :(

socket.on('min_bet_warning', function() {

    errorAudio()
    $("#minBet").modal()

})

// flips dealer hole card in the dealers hand

socket.on('flip_hole', function(image_map) {

    var hole_card = document.getElementById('hole-card')
    hole_card.src = '/static/images/cards/' + image_map

    dealCardAudio()

})

// play error sound

socket.on('play_error', function() {

    errorAudio()

})




// Renders a card in the hand of the target_hand (dealer or player)

socket.on('render_card', function(target_hand, image_map) {

    var hand = document.getElementById(target_hand)
    var new_card = document.createElement('img')

    if (image_map == 'back_of_card.svg') {

        new_card.id = 'hole-card' // set special id for hold card so it can be flipped later

    }

    new_card.src = '/static/images/cards/' + image_map
    new_card.className = 'play-card'
    new_card.width = 112
    new_card.height = 162
    hand.appendChild(new_card)
    setTimeout(function() {

       new_card.style.transition = "left .5s linear 0s"
       new_card.style.left = "0px"}, 0)
    dealCardAudio()

})

// play error sound

errorAudio = function() {

    myAudio = new Audio('/static/audio/error.mp3')
    myAudio.play()

}

// play deal card sound

dealCardAudio = function() {

    myAudio = new Audio('/static/audio/deal.wav')
    myAudio.play()

}

// play poker chip sound

chipAudio = function() {

    myAudio = new Audio('/static/audio/chip.mp3')
    myAudio.play()

}

// Loops music

loopMusic = function() {

    myAudio = new Audio('/static/audio/music.mp3');
    myAudio.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
    }, false);
    myAudio.play();

}

// play card shuffle sound

shuffleAudio = function() {

    myAudio = new Audio('/static/audio/shuffle.wav')
    myAudio.play()

}


// recursively clears all the contents of a parent div

function clearDiv(parent_div) {

    var parent = document.getElementById(parent_div)

    while (parent.firstChild) {
        parent.removeChild(parent.firstChild)
    }

}

// makes a button for the button-container of the control panel

function makeButton(label, id, onclick) {

    var button_container = document.getElementById('button-container')
    var div = document.createElement('span')
    div.className = 'control-button'
    var button = document.createElement("button")
    button.innerText = label
    button.onclick = onclick
    button.className = "btn btn-primary"
    button.id = id
    div.appendChild(button)
    button_container.appendChild(div)

}

// makes a deal button for the control panel

function dealButton() {

    makeButton('Deal', 'dealbutton', function() { socket.emit('deal') } )

}

// makes a hit button for the control panel

function hitButton() {

    makeButton('Hit', 'hitbutton', function() { socket.emit('hit', 'player-hand') } )

}

// makes a stay button for the control panel

function stayButton() {

    makeButton('Stay', 'staybutton', function() { socket.emit('stay') } )

}





