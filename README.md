move.js
=======

Event library for your body moves :)

**Check out the [live demo](http://skycocker.github.io/move.js)**

Usage
-----

1. Include move.js somewhere in your html
2. Set drawControls and drawAll variables either to true or false:

        var drawControls = true;

   will make the red control box appear on the .controlBox canvas

        var drawAll = false;

   will stop detecting movement everywhere beside the .controlBox canvas - you probably want it right after your user knows what to do, because it will be a huge relief for his CPU.
3. Invoke
        
        initMoves();

   anywhere you want to start tracking user's movement. It will ask for permission to access his camera(if he has one).
4. Set event handler for boxSlide:

        document.addEventListener("boxSlide", yourCallback, false);
        
        function yourCallback() {
          //do something when user slides the box
        }

And that's pretty much it. The whole thing is still in deep development, so keep in mind it will be extended further within days. Also, feel free to send me your own ideas and pull requests :)
