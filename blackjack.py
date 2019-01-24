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

class Hand():
    def __init__(self, id):
        self.cards = []
        self.id = id
        self.total = 0
        self.bust = False
        self.door_value = None
        self.bet = 0

    def __check_bust(self):
        '''
        Updates the bust attribute to True if the total attribute exceeds 21
        '''
        if self.total > 21:
            self.bust = True

    def __update_door_value(self):
        '''
        Updates door value for the face value of the the first card in the hand.
        This is the "door card" for the dealer in the first round
        '''
        self.door_value = self.cards[0].value

    def __update_total(self, card):
        '''
        Recalculates the total attribute to include a new card. If the card is an ace it counts as 11 or 1 points,
        whichever does not make the player bust
        '''
        if card.face == 'ace':

            if (self.total + card.value) > 21:
                self.total += 1
            else:
                self.total += 11
        else:
            self.total += card.value

    def add_card(self, card):
        '''Adds a card to the hand'''
        self.cards.append(card)
        self.__update_total(card)
        self.__update_door_value()
        self.__check_bust()






class Player:
    '''
    Represents a blackjack player
    '''

    def __init__(self):
        self.hands = {}
        self.total = 0
        self.bust = False
        self.bank = 1000

    def can_split(self):
        '''
        Determine if the first two cards dealt to the player are the same. If they are the same, the player
        will be given the option to split
        '''
        return True if len(set([card.value for card in self.hands[0]])) == 1 else False

    def split(self):
        '''
        Splits the players hand
        '''
        pass

    def add_hand(self, hand_id):
        '''Adds a hand to the player object'''
        hand_key = hand_id
        self.hands[hand_key] = Hand(hand_id)




class Dealer(Player):
    '''
    Represents the dealer, inherits from the "Player" class.
    '''

    def __init__(self):
        super().__init__()
        self.hands = {1 : Hand(1)}


class Game():
    '''
    Represents the blackjack game.
    '''

    def __init__(self, Dealer, Deck, Player):

        self.deck = Deck().cards
        self.player = Player()
        self.dealer = Dealer()
        self.round = 0

    def draw_card(self, target, hand_id):
        '''
        Draws a card from the deck and adds it to either the dealer or player (the target)
        '''
        card_draw = random.choice(self.deck)
        self.deck.remove(card_draw)

        if target == 'player':
            self.player.hands[hand_id].add_card(card_draw)

        elif target == 'dealer':
            self.dealer.hands[hand_id].add_card(card_draw)

        return card_draw


