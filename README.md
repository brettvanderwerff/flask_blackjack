# flask_blackjack
A WIP socket.IO websocket based BlackJack game. The game was built primarily with JavaScript and Python

I am still working out some kinks but progress can be checked by running:

`pip install -r requirements.txt`

`$python app.py`

And navigating to: `http://127.0.0.1:5000`

The game has music and sound and relies on some basic JavaScript and CSS powered animations. 

There are a few basic game options that players can choose. At each round, players can choose to hit or stay after being dealt a hand. If Players stay, the dealer will hit until "soft" 17.


![](/readme_images/stay.gif)



Players can also choose to double their bet on the first round of play.


![](/readme_images/double.gif)
