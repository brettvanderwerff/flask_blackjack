# flask_blackjack
A WIP socket.IO websocket based BlackJack game. The game was built primarily with JavaScript and Python

I am still working out some kinks but progress can be checked by cloning the repo and running:

1. `$pip install -r requirements.txt`

2. `$python app.py`

3. Open browser and navigate to: `http://127.0.0.1:5000`

4. Turn on your speakers, the game has music and sound effects. 

## Hitting and Staying

At each round, players can choose to hit or stay after being dealt a hand. If Players stay, the dealer will hit until "soft" 17.

![](/readme_images/stay.gif)

## Doubling Down

Players can also choose to double their bet on the first round of play.


![](/readme_images/double.gif)
