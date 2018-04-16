# PS2 Scrims Script

![Overlay Example](https://i.imgur.com/qPJZbIN.png)
_Disclaimer: 90% of this code was created by **Dylan C** (DylanNZ), **Jared H** (MonoNZ) and **Richard H** (Dalordish). I'm only responsible for the updated point rules and the streaming overlay._

## Running A Match

### Installation

1. Make sure you have the latest [node.js](https://nodejs.org/en/) installed. This application requires at least Node 7.6.0 to run.

2. Run `install.bat`. When prompted, enter a password. **Remember this password**, as you'll need it to run any matches.

   Alternatively navigate to the folder where the sccript's located, then

   ```sh $
   npm install
   ```

3. You will need to create 2 javascript files: ``api_key.js`` and ``password.js``. There are templates of both to show you what they should look like.

Unless you want to change your password, you only need to complete the above steps once.

### Starting The Script

**IMPORTANT:** You need to restart the script *BEFORE **EVERY** MATCH*, regardless of how the match ended or if the script terminated with an error. Failing to do so may result in subsequent matches being scored incorrectly and other undesirable effects.

3. Run ``start.bat``. Alternatively, run the following from the command line: 

   ```sh $
   node bin/www
   ```

   If the script started up successfully, you should see a message like this in opened terminal window:

   ```sh $
   Starting server...
   Connect to website @ localhost:3010
   ```

### Setting Up A Match

4. In the browser of your choice, navigate to <http://localhost:3010/admin>.

   _You should see a screen with these forms on the left_ ![admin view](https://i.imgur.com/LwUQHlH.png)

5. Fill out each of the fields, then enter your password in the ``Password`` field and press track. You will be taken to <http://localhost:3010/>, which is the address of the match overlay.

   | Admin Field | Use     | Default   |
   |:------------|---------|-----------|
   |Team 1 Tag   | Left team's outfit tag  | *none* |
   |Team 2 Tag   | Right teams' outfit tag | *none* |
   |Round Length (seconds) | Length of each round, in seconds | 900 (15 minutes) |
   |Event Title  | Text to display above the center scoreboard | PS2 IvI Scrims |
   |Password     | The password you chose during installation | *none* |

## Other Admin Fields

#### Stop Match

 This will end the current round by setting the timer to 0 seconds. You can start a new round of the same match using the Second Round form without any unexpected issues. If you want to restart the round/match or reset scores, however, *you need to restart the script*.

#### Second Round

After a previous round has ended - or if you stopped the round using Stop Match - use this form to start the next round of the same match. Despite the sections name, you can start more rounds than just the second. As the parenthetical says, though, make sure to only use this after the current round has ended (the timer is at zero).

## Streaning Overlay Setup - OBS

1. In your streaming scene, add a new BrowserSource source and set to URL to ``http://localhost:3010/``.

2. Set the ``Width`` and ``Height`` to the full width of your monitor, and clear out the ``CSS`` box.
   I don't really know what impact ``FPS`` has on the overlay, but you should be fine leaving it at 30. 

3. Check the ``Refresh browser when scene becomes active`` box at the bottom of the Properties window.

4. Click ``OK`` to save the source, then make sure it's visible and positioned above your Planetside 2 source. 

   _The Properties for your BrowserSource should look something like this_   
   ![BrowserSource Properties](https://i.imgur.com/P9TFin3.png)


## Credits

Created by FCLM - DylanNZ, Mononz, Dalordish   
Overlay support added by Chirtle (aka ChirtleLovesDolls)

