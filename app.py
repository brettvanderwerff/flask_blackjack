from flask import Flask, render_template, request
from flask_socketio import SocketIO, join_room
import blackjack


app = Flask(__name__)

app.config['SECRET_KEY'] ='secret'

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

def new_round():
    '''
    Starts a new round by clearing the previous rounds cards/buttons and sliding out the chips for the player
    to place a bet
    '''
    room = request.sid
    clear_previous_round()
    socketio.emit('slide_out_chips')
    socketio.emit('render_control', data=('dealbutton',), room=room)


@socketio.on('start_game')
def start_game():
    '''
    Starts the game when the user first connects by dropping the user in a room, making a game object,
    and starting a new round
    '''
    room = request.sid
    join_room(room)
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
def add_bet(bet_increment):
    '''
    Incrementally adds an individual bet to a players running bet total, broadcasts update to player
    If player does not have enough funds, the windows 95 error sound is played :)
    '''
    room = request.sid
    if has_funds(bet_increment):
        old_bet_total = GAMES[room].player.bet
        new_bet_total = old_bet_total + bet_increment
        GAMES[room].player.bet = new_bet_total
        socketio.emit('update_bet', new_bet_total, room=room)
        update_bank(bet_increment)
    else:
        socketio.emit('play_error', room=room)

def render_card(target_hand, card):
    '''
    Broadcasts a card to the hand of the target_hand (dealer or player)
    '''
    room = request.sid

    if card == 'back_of_card':
        socketio.emit('render_card', data=(target_hand, 'back_of_card.svg'), room=room)

    else:
        socketio.emit('render_card', data=(target_hand ,card.image_map), room=room)

def broadcast_position():
    '''Broadcasts the player/dealer position (bust, player/dealer count) after running the '''
    pass

def evaluate_table():
    '''Determines if player'''


@socketio.on('deal')
def deal():
    '''
    Draws two cards for each the player and dealer
    renders both cards for the player and one of the cards dealt to the dealer in addition to a face down card
    representing the hole card
    '''
    room = request.sid

    if GAMES[room].player.bet == 0:
        socketio.emit('min_bet_warning')

    else:
        for x in range(2):
            GAMES[room].draw_card('dealer')
            GAMES[room].draw_card('player')

        for card in GAMES[room].player.cards: # Render both player cards face up
            render_card('player-hand', card)

        render_card('dealer-hand', GAMES[room].dealer.cards[0]) # Render one face up and one face down card to the dealer
        render_card('dealer-hand', 'back_of_card')
        socketio.emit('slide_in_chips') # slide chip set back out of view
    evaluate_table()



if __name__ == '__main__':
    socketio.run(app, debug=True)