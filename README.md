# flask_blackjack
A WIP socket.IO websocket based BlackJack game. The game was built primarily with JavaScript and Python. Check out the gifs below to see the game in action :)

## Setup

1. Clone the repo

2. `$pip install -r requirements.txt`

3. `$python app.py`

4. Open browser and navigate to: `http://127.0.0.1:5000`

5. Turn on your speakers, the game has music and sound effects. 

## Hitting and Staying

At each round, players can choose to hit or stay after being dealt a hand. If Players stay, the dealer will hit until "soft" 17.

![](/readme_images/stay.gif)

## Doubling Down

Players can also choose to double their bet on the first round of play.

![](/readme_images/double.gif)

## Splitting

If a player is dealt a pair, they will have the option to split their hand in two.

![](/readme_images/split.gif)

## Bug Reports

This is an early development hobby project. There are some bugs still. If you play the game and notice a bug, please raise an issue. :)




