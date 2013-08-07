/*
move.js - control your device with your body movement
url/latest source: https://github.com/skycocker/move.js

Copyright 2013 Michał Siwek
Released under the terms of GNU General Public License (version 3 or later) (http://www.gnu.org/licenses/gpl.txt)
*/

(function(window, document, navigator) {
  window.requestAnimationFrame = window.requestAnimationFrame ||
                                 window.msRequestAnimationFrame ||
                                 window.mozRequestAnimationFrame ||
                                 window.webkitRequestAnimationFrame;
  
  navigator.getUserMedia = navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia;

  var video = document.createElement("video");
  
  var staticDump = document.createElement("canvas"),
      staticCtx = staticDump.getContext("2d");

  var output = null,
      ctx = null;

  var buffer = null;
  var isLittleEndian = null;

  var readyToMove = new CustomEvent(
    "readyToMove", {
      bubbles: true,
      cancelable: true
    }
  );

  function Move() {
    this.init = function(output, width, height, humanFill, step, limitX, limitY) {
      this.width = width || 640;
      this.height = height || 480;
      this.humanFill = humanFill || { r: 0, g: 170, b: 242 };
      this.step = step;
      this.limitX = this.width;
      this.limitY = this.height;
      
      var outputId = output || "move";
      output = document.querySelector("#" + outputId),
      ctx = output.getContext("2d");
      
      video.width = staticDump.width = output.width = this.width;
      video.height = staticDump.height = output.height = this.height;

      //vertical flip
      staticCtx.translate(this.width, 0);
      staticCtx.scale(-1, 1);

      ctx.translate(this.width, 0);
      ctx.scale(-1, 1);
      //

      buffer = new Uint8Array(this.width * this.height);

      navigator.getUserMedia({ video: true }, startStream, logError);
    }
  }

  var move = window.movejs = new Move();

  function startStream(stream) {
    video.src = URL.createObjectURL(stream);
    video.play();

    requestAnimationFrame(drawStatic);
  }

  function logError(error) {
    console.log("error: " + error);
  }

  function drawStatic() {
    setTimeout(function() {
      var staticFrame = readFrame(staticCtx);

      if(staticFrame) {
        staticCtx.putImageData(staticFrame, 0, 0);
        setupBuffer(staticFrame.data);

        setTimeout(function() {
          document.dispatchEvent(readyToMove);
          requestAnimationFrame(draw);
        }, 1000);
      } else {
        requestAnimationFrame(drawStatic);
      }
    }, 3000);
  }

  function draw() {
    var frame = readFrame(ctx);

    if(frame) {
      markLightnessChanges(frame.data);
      ctx.putImageData(frame, 0, 0);

      //flip for a second...
      ctx.translate(move.width, 0);
      ctx.scale(-1, 1);
      //execute external callback
      if(move.step) move.step();
      //...aaand flip back
      ctx.translate(move.width, 0);
      ctx.scale(-1, 1);
    }

    requestAnimationFrame(draw);
  }

  function readFrame(onto) {
    try {
      onto.drawImage(video, 0, 0, move.width, move.height);
    } catch(e) {
      return null;
    }

    return onto.getImageData(0, 0, move.width, move.height);
  }

  function setupBuffer(data) {
    for(var i=0, j=0; i<buffer.length; i++, j+=4) {
      buffer[i] = lightnessValue(data[j], data[j+1], data[j+2]);
    }
  }

  function markLightnessChanges(data) {
    var buf = new ArrayBuffer(data.length);
    var buf8 = new Uint8ClampedArray(buf);
    var outData = new Uint32Array(buf);

    if(isLittleEndian == null) {
      outData[1] = 0x0a0b0c0d;
      if(buf[4] === 0x0a && buf[5] === 0x0b && buf[6] === 0x0c && buf[7] === 0x0d) {
        isLittleEndian = false;
      } else {
        isLittleEndian = true;
      }
    }

    if(isLittleEndian) {
      for(var y=0; y<move.limitY; ++y) {
        for(var x=0; x<move.limitX; ++x) {
          var rawOffset = y * move.width + x;
          var index = rawOffset * 4;

          var current = lightnessValue(data[index], data[index+1], data[index+2]);

					if(move.humanFill.natural) {
						move.humanFill.r = data[index];
						move.humanFill.g = data[index+1];
						move.humanFill.b = data[index+2];
					}

          outData[rawOffset] =
              (255 * lightnessHasChanged(rawOffset, current) << 24) | //a
              (move.humanFill.b << 16) |                              //b
              (move.humanFill.g << 8) |                               //g
              move.humanFill.r;                                       //r
        }
      }
    } else {
      for(var y=0; y<move.limitY; ++y) {
        for(var x=0; x<move.limitX; ++x) {
          var rawOffset = y * move.width + x;
          var index = rawOffset * 4;

          var current = lightnessValue(data[index], data[index+1], data[index+2]);
					
					if(move.humanFill.natural) {
						move.humanFill.r = data[index];
						move.humanFill.g = data[index+1];
						move.humanFill.b = data[index+2];
					}
          
					outData[rawOffset] =
              (move.humanFill.r << 24) |                     //r
              (move.humanFill.g << 16) |                     //g
              (move.humanFill.b << 8) |                      //b
              255 * lightnessHasChanged(rawOffset, current); //a
        }
      }
    }

    data.set(buf8);
  }

  function lightnessHasChanged(index, value) {
    return qAbs(value - buffer[index]) >= 15;
  }

  function lightnessValue(r, g, b) {
    return ( Math.min(r, g, b) + Math.max(r, g, b) ) / 255 * 50;
  }

  function qAbs(number) {
    return (number ^ (number >> 31)) - (number >> 31);
  }
})(window, document, navigator)
