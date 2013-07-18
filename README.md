move.js
=======

Control your device with your body movement

**Check out the [live demo](http://skycocker.github.io/move.js)**

Usage
-----

1. Include move.js somewhere in your html

        <script src="move.js"></script>
        
2. Initialize it by executing `init()` method on it

        movejs.init()
            
    
3. The `init()` method takes 7 optional arguments (feel free to skip to step 4 already): 
  * `output [string]` - id of the canvas element you want the output to be displayed on (defaults to "move")
  * `width [integer]` - width of the image captured from the camera (defaults to 640 which is current biggest possibility)
  * `height [integer]` - height of the image captured from the camera (defaults to 480 which is current biggest possibility)
  * `humanFill [property array object]` - color you want the detected objects to be filled with (defaults to { r: 0, g: 170, b: 242 }, which gives kind of light blue)
  * `step [function]` - callback executed everytime a frame is rendered. Consider it something like a game loop - you can use it to draw something on your output canvas and/or detect its collision with human. This one does not default to anything, but you still don't have to provide it
  * `limitX [integer]` - number of X axis pixels checked for motion. Useful if you want to improve performance and need just some part of the area checked for movement (defaults to width)
  * `limitY [integer]` - same as above for Y axis (defaults to height)
  
  So, with no params specified, `movejs.init()` behaves the same as
        
        movejs.init("move", 640, 480, { r: 0, g: 170, b: 242 }, null, 640, 480)
        
        
4. When `init()` is called, user will be prompted for permission to access the camera. At this point you should tell him to move off the visiblity area of his camera. Then move.js waits 4 seconds for the camera to adjust and dispatches `"readyToMove"` event once it's done. Then the user can return to his position. Motion will be detected and marked from now on.

        document.addEventListener("readyToMove", function() { alert('moving objects will be marked on the canvas!') }, false)

And that's pretty much it. Feel free to send improvements and have fun! :)
