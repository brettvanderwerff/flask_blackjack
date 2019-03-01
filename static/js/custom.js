// Starts playing background music when the player loads the page

window.onload = function() {

    song = loopMusic()

    setTimeout(song.play(), 1000) // Needed to trick autoplay blockage by chrome

}



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

    }

    var bet_header = document.getElementById('bet-header')
    bet_header.innerText = 'Place Your Bet!'

})

// clears the left over cards, notification images (if they exist), and control panel buttons from a previous round

socket.on('clear_previous_round', function() {

    clearDiv('dealer-hands')
    clearDiv('player-hands')
    clearDiv('player-controls')
    clearDiv('player-bets')
    clearDiv('player-counts')
    clearDiv('dealer-counts')
    clearDiv('win-notification-container')
    clearDiv('game-button-container')

})

// makes a button for starting a new game

socket.on('start_game', function() {

    var parent = document.getElementById('game-button-container')
    var button_container = addDiv('game-button-container')
    var button = document.createElement("button")
    button.onclick = function() { socket.emit('start_game')}
    button.className = "btn btn-primary control-button"
    button.innerText = 'New Game'
    button.style = "margin-top: 10px;"
    button_container.appendChild(button)
    document.getElementById('game-button-container').appendChild(button_container)

})



// renders buttons for control panel, clears button-container of existing buttons first

socket.on('render_hand_control', function(...args) {

    var hand_id = args[0]

    var complete_hand_id = 'player-control-' + hand_id

    clearDiv(complete_hand_id)

    for (i = 1; i < args.length; i++) {

        if (args[i] == 'dealbutton') {

            dealButton(hand_id)

        }

        if (args[i] == 'hitbutton') {

            hitButton(hand_id)

        }

        if (args[i] == 'staybutton') {

            stayButton(hand_id)

        }

        if (args[i] == 'newroundbutton') {

            newRoundButton(hand_id)

        }

        if (args[i] == 'doublebutton') {

            doubleButton(hand_id)

        }

        if (args[i] == 'splitbutton') {

            splitButton(hand_id)

        }

    }


})


// renders the running total for the dealer and the player

socket.on('update_totals', function(target, hand_id, total) {

    if (target == 'dealer') {

        var dealer_total_elem = document.getElementById('dealer-count-1-total')
        dealer_total_elem.innerText = total

    }

    if (target == 'player') {

        var complete_hand_id = 'player-count-' + hand_id + '-total'
        var player_total_elem = document.getElementById(complete_hand_id)
        player_total_elem.innerText = total

    }


})

// button that allows the player to play another round when pressed

socket.on('play_again', function() {

    var parent = document.getElementById('game-button-container')
    var button_container = addDiv('game-button-container')
    var button = document.createElement("button")
    button.onclick = function() { socket.emit('new_round')}
    button.className = "btn btn-primary control-button"
    button.innerText = 'Play Again'
    button.style = "margin-top: 10px;"
    button_container.appendChild(button)
    document.getElementById('game-button-container').appendChild(button_container)

})


// broadcasts an update in the players' total bet

socket.on('update_bet', function(new_bet_total, hand_id) {

    var complete_hand_id = 'player-bet-' + hand_id + '-total'
    var elem = document.getElementById(complete_hand_id)
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
    var parent = addDiv('win-notification-container')
    img.id = "notification-image"
    img.width = 125
    img.height = 125
    img.src = "static/images/notifications/" + notification + ".png"
    parent.appendChild(img)
    document.getElementById('win-notification-container').appendChild(parent)

})

// places bust notification in place of a hand of cards

socket.on('bust_notification', function(target_hand, hand_id) {

    var img = document.createElement('img')
    img.className = "notification-image"
    img.src = "static/images/notifications/busted.png"
    img.width = 175
    img.height = 75
    var complete_hand_id = target_hand + '-hand-' + hand_id
    var parent = document.getElementById(complete_hand_id)
    parent.appendChild(img)

})


// adds a new hand to the player-hand container

socket.on('add_hand', function(target_hand) {

    var target_hand_sliced = target_hand.slice(0,6)
    var target = target_hand_sliced + '-hands'
    var new_hand = addDiv(target)
    new_hand.id = target_hand
    new_hand.className = "col text-center align-self-center hand"

})

// adds a new bet container below a player's hand

socket.on('add_bet_container', function(hand_id) {

    var new_bet = addDiv('player-bets')
    new_bet.id = 'player-bet-' + hand_id
    new_bet.className = "col text-center"
    var bet_total = addDiv(new_bet.id)
    bet_total.className = 'bet-circle'
    bet_total.id = 'player-bet-' +  hand_id + '-total'
    bet_total.innerText = "$0"


})

// adds a new player or dealer  count container above a player's hand also adds a label for the count container

socket.on('add_count_container', function(hand_id, target) {

    var new_count = addDiv(target + '-counts')
    new_count.id = target + '-count-' + hand_id
    new_count.className = "col text-center"
    var count_total = addDiv(new_count.id)
    count_total.className = 'count-circle'
    count_total.id = target + '-count-' +  hand_id + '-total'
    count_total.innerText = "0"
    count_label = addSpan(new_count.id)
    count_label.className = 'count-title'
    if (target == 'player') {

        count_label.innerText = 'Hand Total'

    } else {

        count_label.innerText = 'Dealer Total'

    }



})

// add a new player controls container below a players hand

socket.on('add_controls_container', function(hand_id) {

    var new_controls = addDiv('player-controls')
    new_controls.id = 'player-control-' + hand_id
    new_controls.className = "col text-center"

})

// transitions one of the players card from one hand to the next upon a split
socket.on('transition_card', function() {

    var player_hand_1 = document.getElementById('player-hand-1')
    var last_card = player_hand_1.lastChild

    var player_hand_2 = document.getElementById('player-hand-2')
    player_hand_2.appendChild(last_card)




})

//clears all the buttons under a given hand

socket.on('clear_controls', function(hand_id) {

    var complete_hand_id = 'player-control-' + hand_id
    clearDiv(complete_hand_id)

})

//clears all cards in a given hand

socket.on('clear_cards', function(target_hand, hand_id) {

    var complete_hand_id = target_hand + '-hand-' + hand_id
    clearDiv(complete_hand_id)

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

function makeButton(hand_id, label, id, onclick) {

    var complete_hand_id = 'player-control-' + hand_id
    var button_container = document.getElementById(complete_hand_id)
    var div = document.createElement('div')
    div.className = 'control-button'
    var button = document.createElement("button")
    button.innerText = label
    button.onclick = onclick
    button.className = "btn btn-primary control-button"
    button.id = id
    div.appendChild(button)
    button_container.appendChild(div)

}

// makes a deal button for the control panel

function dealButton(hand_id) {

    makeButton(hand_id,'Deal', 'dealbutton', function() { socket.emit('deal_first_round') } )

}


// adds a child div to a parent

function addDiv(parent_div) {

    var parent = document.getElementById(parent_div)
    var child = document.createElement('div')
    parent.appendChild(child)
    return child

}

//adds a child span to a parent

function addSpan(parent_div) {

    var parent = document.getElementById(parent_div)
    var child = document.createElement('span')
    parent.appendChild(child)
    return child

}


// makes a hit button for the control panel

function hitButton(hand_id) {

    makeButton(hand_id,'Hit', 'hitbutton', function() {

        socket.emit('deactivate_double', hand_id)
        socket.emit('hit', 'player-hand', hand_id)


    })

}

// makes a new round button for the control panel

function newRoundButton(hand_id) {

    makeButton(hand_id,'New Round', 'newroundbutton', function() { socket.emit('new_round') } )

}

// makes a stay button for the control panel

function stayButton(hand_id) {

    makeButton(hand_id, 'Stay', 'staybutton', function() { socket.emit('stay', hand_id) } )

}

// gets a bet for a players hand from the DOM

function getCurrentBet(hand_id) {

    var complete_hand_id = 'player-bet-' + hand_id + '-total'
    var current_bet = document.getElementById(complete_hand_id)
    var bet_increment_string = current_bet.innerText.slice(1)
    var bet_increment_int = parseInt(bet_increment_string, 10)

    return bet_increment_int

}

// removes a child element from the parent

function removeChildFromParent(child_id) {

    var child = document.getElementById(child_id)
    child.parentNode.removeChild(child)

}

/*
makes a double bet button for the control panel, allows the user to double their current bet, then deletes the double
button and hits the player with another card then player stays
*/
function doubleButton(hand_id) {


    makeButton(hand_id,'Double Bet', 'doublebutton', function() {

        bet_increment = getCurrentBet(hand_id)
        socket.emit('add_bet', bet_increment, hand_id)
        chipAudio()
        removeChildFromParent('doublebutton')
        socket.emit('double', hand_id)
        socket.emit('deactivate_double', hand_id)

        })

}

// makes a button giving the player the option to split. Removes the split button upon clicking

function splitButton(hand_id) {

    makeButton(hand_id,'Split', 'splitbutton', function() {

        socket.emit('split')
        removeChildFromParent('splitbutton')

    })

}

// adds an element to a parent div

function addElem(parent_id, element) {

    var parent = document.getElementById(parent_id)
    var child = document.createElement(element)
    parent.appendChild(child)
    return child
}











