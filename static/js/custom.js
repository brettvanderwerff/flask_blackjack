// Starts playing backgound music when the player loads the page

/*
window.onload = function() {

    song = loopMusic()

    setTimeout(song.play(), 1000) // Needed to trick autoplay blockage by chrome

    }
*/


var socket = io.connect('http://127.0.0.1:5000')


// upon player connection, start the game
socket.on('connect', function(){

    socket.emit('start_game')


})

// deactivates chip in chip box from being clicked on

socket.on('deactivate_chips', function() {

    var chips = document.getElementsByClassName('rounded')

    for (var i = 0; i < chips.length; i++) {

        chips[i].style.pointerEvents = 'none'
        chips[i].style.opacity = 0.3

    }

    var bet_header = document.getElementById('bet-header')
    bet_header.innerText = 'Your Bet is Placed!'

})

// activates chip in chip box, allowing chips to be clicked on

socket.on('activate_chips', function() {

    var chips = document.getElementsByClassName('rounded')

    for (var i = 0; i < chips.length; i++) {

        chips[i].style.pointerEvents = 'auto'
        chips[i].style.opacity = 'initial'
        console.log(chips[i].opacity)

    }

    var bet_header = document.getElementById('bet-header')
    bet_header.innerText = 'Place Your Bet!'

})

// clears the left over cards, notification images (if they exist), and control panel buttons from a previous round

socket.on('clear_previous_round', function() {

    clearDiv('button-container')
    clearDiv('dealer-hand')
    clearDiv('player-hand')

    if (document.getElementById("notification-image") != null) {

        clearImg()

    }

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

        if (args[i] == 'newroundbutton') {

            newRoundButton()

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

// shows notification image in middle of screen for if player busted, won etc

socket.on('show_notification', function(notification) {

    var img = document.createElement('img')
    img.id = "notification-image"
    img.src = "static/images/notifications/" + notification + ".png"
    document.getElementsByTagName('body')[0].appendChild(img)


})

// toggle music pause when clicking audio button

toggleMusic = function(song) {

    var elem = document.getElementById('audio')

    if (elem.style.opacity == .3) {

        elem.style.opacity = 1
        song.play()

    }

    else {

        elem.style.opacity = .3
        song.pause()

    }


}

// play error sound

errorAudio = function() {

    var myAudio = new Audio('/static/audio/error.mp3')
    myAudio.play()

}

// play deal card sound

dealCardAudio = function() {

    var myAudio = new Audio('/static/audio/deal.wav')
    myAudio.play()

}

// play poker chip sound

chipAudio = function() {

    var myAudio = new Audio('/static/audio/chip.mp3')
    myAudio.play()

}

// Loops music

loopMusic = function() {

    var song = new Audio('/static/audio/music.mp3')
    song.loop = true
    return song

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

// removes an image from the body (used for removing notification images)

function clearImg() {

    var body = document.getElementsByTagName('body')[0]
    var img = document.getElementById("notification-image")
    body.removeChild(img)

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

// makes a new round button for the control panel

function newRoundButton() {

    makeButton('New Round', 'newroundbutton', function() { socket.emit('new_round') } )

}

// makes a stay button for the control panel

function stayButton() {

    makeButton('Stay', 'staybutton', function() { socket.emit('stay') } )

}





