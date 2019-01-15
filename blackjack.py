import random

class Deck():
    '''
    Represents a deck of 52 cards.
    '''

    def __init__(self):
        class Card():
            '''
            Represents and individual card of a deck with attributes of a face (or number), suit, and value.
            '''

            def __init__(self, suit, value, face):
                self.suit = suit
                self.value = value
                self.face = face
                self.image_map = str(self.face) + "_of_" + self.suit + '.svg'

        self.suits = ['clubs', 'spades', 'hearts', 'diamonds']
        self.faces = ['jack', 'queen', 'king']
        self.number_cards = [Card(suit, value, value) for value in range(2, 11) for suit in self.suits]
        self.face_cards = [Card(suit, 10, face) for face in self.faces for suit in self.suits]
        self.ace_cards = [Card(suit, 11, 'ace') for suit in self.suits]
        self.cards = self.face_cards + self.number_cards + self.ace_cards


class Player:
    '''
    Represents a blackjack player
    '''

    def __init__(self):
        self.cards = []
        self.total = 0
        self.bust = False
        self.bet = 0
        self.bank = 100



class Dealer(Player):
    '''
    Represents the dealer, inherits from the "Player" class.
    '''

    def __init__(self):
        super().__init__()



class Game():
    '''
    Represents the blackjack game.
    '''

    def __init__(self, Dealer, Deck, Player):

        self.deck = Deck().cards
        self.player = Player()
        self.dealer = Dealer()

    def draw_card(self, target):
        '''
        Draws a card from the deck and adds it to either the dealer or player (the target)
        '''
        card_draw = random.choice(self.deck)
        self.deck.remove(card_draw)

        if target == 'player':
            self.player.cards.append(card_draw)

        elif target == 'dealer':
            self.dealer.cards.append(card_draw)

        return card_draw



