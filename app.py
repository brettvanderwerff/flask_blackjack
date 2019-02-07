from flask import Flask, render_template, request
from flask_socketio import SocketIO, join_room
import blackjack
import time

app = Flask(__name__)

app.config['SECRET_KEY'] = 'secret'

socketio = SocketIO(app)

GAMES = {}


@app.route('/')
def index():
    return render_template('index.html')


def clear_previous_round():
    '''
    Clears the previous rounds cards/buttons
    '''
    room = request.sid
    socketio.emit('clear_previous_round', room=room)


@socketio.on('new_round')
def new_round():
    '''
    Starts a new round by clearing the previous rounds cards/buttons and sliding out the chips for the player
    to place a bet
    '''
    room = request.sid
    clear_previous_round()
    socketio.emit('activate_chips', room=room)
    socketio.emit('add_bet_container', 1, room=room)
    socketio.emit('add_count_container', data=(1,'player'), room=room)
    socketio.emit('add_count_container', data=(1, 'dealer'), room=room)
    socketio.emit('add_controls_container', 1, room=room)
    add_hand_to_dom('player', 1)
    GAMES[room].player.hands[1].active = True
    socketio.emit('render_hand_control', data=(1, 'dealbutton',), room=room)


@socketio.on('start_game')
def start_game():
    '''
    Starts the game when the user first connects by dropping the user in a room, making a game object,
    and starting a new round
    '''
    room = request.sid
    join_room(room)
    socketio.emit('start_music', room=room)
    GAMES[room] = blackjack.Game(blackjack.Dealer, blackjack.Deck, blackjack.Player)
    new_round()


def update_bank(bet_increment):
    '''
    Subtracts a total bet from the players bank roll and broadcasts the bank roll change to the user
    '''
    room = request.sid
    old_bank_total = GAMES[room].player.bank
    new_bank_total = old_bank_total - bet_increment
    GAMES[room].player.bank = new_bank_total
    socketio.emit('update_bank', new_bank_total, room=room)


def has_funds(bet_increment):
    '''
    Return True if player has the appropriate funds to place a bet, else returns False
    '''
    room = request.sid
    return True if GAMES[room].player.bank - bet_increment >= 0 else False


@socketio.on('add_bet')
def add_bet(bet_increment, hand_id):
    '''
    Incrementally adds an individual bet to a players running bet total for a given hand, broadcasts update to player
    If player does not have enough funds, the windows 95 error sound is played :)
    '''
    room = request.sid
    if has_funds(bet_increment):
        old_bet_total = GAMES[room].player.hands[hand_id].bet
        new_bet_total = old_bet_total + bet_increment
        GAMES[room].player.hands[hand_id].bet = new_bet_total
        socketio.emit('update_bet', data=(new_bet_total, hand_id), room=room)
        update_bank(bet_increment)
    else:
        socketio.emit('play_error', room=room)


@socketio.on('split')
def split():
    '''
    Splits the players hand. Makes new DOM elements for the bet container, count container, and the hand cards.
    '''
    room = request.sid
    socketio.emit('add_bet_container', 2, room=room)
    socketio.emit('add_count_container', data=(2,'player'), room=room)
    socketio.emit('add_controls_container', 2, room=room)
    add_hand_to_dom('player', 2)
    GAMES[room].player.split_cards()
    socketio.emit('transition_card')
    hit('player-hand', 1)
    hit('player-hand', 2)


def render_card(target, card, hand_id):
    '''
    Broadcasts a card to the hand of the target_hand (dealer or player)
    '''
    target_hand = target + '-' + str(hand_id)
    room = request.sid
    if card == 'back_of_card':
        socketio.emit('render_card', data=(target_hand, 'back_of_card.svg'), room=room)

    else:
        socketio.emit('render_card', data=(target_hand, card.image_map), room=room)


def end_round():
    '''Determines who wins the round, exchanges bet money accordingly.'''
    room = request.sid
    socketio.emit('render_hand_control', data=('newroundbutton',), room=room)
    pass


def player_win():
    '''Determines the amount of bet each player wins for each hand'''
    room = request.sid
    for hand_id, hand in enumerate(GAMES[room].player.hands, 1):
        if not GAMES[room].player.hands[hand_id].bust:
            GAMES[room].player.bank += GAMES[room].player.hands[hand_id].bet
    socketio.emit('show_notification', 'player_wins', room=room)
    if GAMES[room].player.bank > 0:
        socketio.emit('play_again')
    else:
        print('game over')


def dealer_win():
    '''
    Handles the dealer winning
    '''
    room = request.sid
    for hand_id in GAMES[room].player.hands:
        GAMES[room].player.bank -= GAMES[room].player.hands[hand_id].bet

    socketio.emit('show_notification', 'dealer_wins', room=room)
    if GAMES[room].player.bank > 0:
        socketio.emit('play_again')
    else:
        print('game over')

def push():
    '''
    Handle the event where the dealer and the player tie
    '''
    socketio.emit('show_notification', 'push')


def determine_win():
    '''
    Determines if the player or the dealer wins the games
    '''
    room = request.sid
    if GAMES[room].dealer.hands[1].bust:
        player_win()
    else:
        for hand_id in GAMES[room].player.hands:
            if GAMES[room].player.hands[hand_id].total > GAMES[room].dealer.hands[1].total:
                player_win()
                return

        player_hand_totals = [hand.total for hand in GAMES[room].player.hands.values()]

        if all(GAMES[room].dealer.hands[1].total > total for total in player_hand_totals):
            dealer_win()


def render_dealer():
    '''renders dealer card values, triggers bust notification etc'''
    room = request.sid
    if GAMES[room].round == 1:
        socketio.emit('update_totals', data=('dealer', 1, GAMES[room].dealer.hands[1].door_value), room=room)
    else:
        socketio.emit('update_totals', data=('dealer', 1, GAMES[room].dealer.hands[1].total), room=room)
    if GAMES[room].dealer.hands[1].bust:
        socketio.emit('bust_notification', data=('dealer', 1), room=room)

def evaluate_player():
    '''Determines play flow based on the players position'''
    room = request.sid
    for hand_id, hand in enumerate(GAMES[room].player.hands, 1):
        if GAMES[room].player.hands[hand_id].bust:
            try:
                next_hand = hand_id + 1
                GAMES[room].player.hands[next_hand].active = True
                render_table()
            except:
                dealer_turn()

def render_player():
    '''renders dealer card values, triggers bust notification etc'''
    room = request.sid
    for hand_id, hand in enumerate(GAMES[room].player.hands, 1):
        socketio.emit('update_totals', data=('player', hand_id, GAMES[room].player.hands[hand_id].total), room=room)
        socketio.emit('update_bet', data=(GAMES[room].player.hands[hand_id].bet, hand_id), room=room)

        if GAMES[room].player.hands[hand_id].bust:
            socketio.emit('bust_notification', data=('player', hand_id), room=room)
            socketio.emit('clear_controls', hand_id, room=room)

        elif GAMES[room].player.hands[hand_id].active:

            if GAMES[room].round == 1:
                socketio.emit('render_hand_control',
                              data=(hand_id, 'hitbutton', 'splitbutton', 'staybutton', 'doublebutton'),
                              room=room)

            elif GAMES[room].player.hands[hand_id].can_double:
                socketio.emit('render_hand_control',
                              data=(hand_id, 'hitbutton', 'staybutton', 'doublebutton'),
                              room=room)

            else:
                socketio.emit('render_hand_control',
                              data=(hand_id, 'hitbutton', 'staybutton'),
                              room=room)


def render_table():
    '''
    Determines if player is bust, able to split, double etc.
    Broadcasts the player/dealer position to the table (bust, player/dealer count). Renders the control buttons
    accordingly
    '''
    room = request.sid
    render_dealer()
    render_player()
    GAMES[room].round += 1


@socketio.on('deactivate_double')
def deactivate_double(hand_id):
    '''inactivate the player's option to double their bet (happens after they hit a hand)'''
    room = request.sid
    GAMES[room].player.hands[hand_id].can_double = False


def add_hand_to_dom(target, hand_id):
    '''
    manipulates DOM to add a new player hand, also updates game object to reflect the new hand
    '''
    target_hand = target + '-hand-' + str(hand_id)
    room = request.sid
    getattr(GAMES[room], target).add_hand(hand_id)
    socketio.emit('add_hand', target_hand, room=room)


def player_first_round():
    '''
    Handles dealing cards to the player on the first round
    '''
    room = request.sid
    for x in range(2):
        player_card = GAMES[room].draw_card('player', 1)
        render_card('player-hand', player_card, 1)


def dealer_first_round():
    '''
    Handles dealing cards to the dealer on the first round
    '''
    room = request.sid
    add_hand_to_dom('dealer', 1)
    dealer_card = GAMES[room].draw_card('dealer', 1)  # one face up card for dealer
    render_card('dealer-hand', dealer_card, 1)
    GAMES[room].draw_card('dealer', 1)
    render_card('dealer-hand', 'back_of_card', 1)  # and one hole card


@socketio.on('deal_first_round')
def deal_first_round():
    '''
    Deals the first round. Draws two cards for each the player and dealer renders both cards for the player and one
    of the cards dealt to the dealer in addition to a face down card representing the hole card
    '''
    room = request.sid

    if GAMES[room].player.hands[1].bet == 0:
        socketio.emit('min_bet_warning', room=room)

    else:
        player_first_round()
        dealer_first_round()
        socketio.emit('deactivate_chips', room=room)
        render_table()


@socketio.on('hit')
def hit(target_hand, hand_id):
    '''
    Hits target hand (dealer or player) by drawing a card and adding it to that hand
    '''
    room = request.sid
    if target_hand == 'player-hand':
        player_card = GAMES[room].draw_card('player', hand_id)
        render_card('player-hand', player_card, hand_id)
        evaluate_player()

    else:
        dealer_card = GAMES[room].draw_card('dealer', 1)
        render_card('dealer-hand', dealer_card, 1)
    render_table()


def dealer_turn():
    '''
    Takes the dealers turn
    '''
    room = request.sid
    hole_card = GAMES[room].dealer.get_hole_card()
    socketio.emit('flip_hole', hole_card.image_map, room=room)
    if sum([hand.bust for hand in GAMES[room].player.hands.values()]) == len(GAMES[room].player.hands):
        render_table()
        dealer_win()
    else:
        if 'ace' in [card.face for card in GAMES[room].dealer.hands[1].cards]:
            while GAMES[room].dealer.hands[1].total <= 17:
                hit('dealer', 1)

        else:
            while GAMES[room].dealer.hands[1].total < 17:
                hit('dealer', 1)
        render_table()
        determine_win()

@socketio.on('stay')
def stay(hand_id):
    '''
    Triggers the dealer to take his turn
    '''
    room = request.sid
    GAMES[room].player.hands[hand_id].active = False
    socketio.emit('clear_controls', hand_id, room=room)
    try:
        next_hand = hand_id + 1
        GAMES[room].player.hands[next_hand].active = True
        render_table()
    except:
        dealer_turn()

if __name__ == '__main__':
    socketio.run(app, debug=True)
