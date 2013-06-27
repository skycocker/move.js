window.requestAnimationFrame = window.requestAnimationFrame ||
                               window.msRequestAnimationFrame ||
                               window.mozRequestAnimationFrame ||
                               window.webkitRequestAnimationFrame;

navigator.getMedia = navigator.getUserMedia ||
                     navigator.webkitGetUserMedia ||
                     navigator.mozGetUserMedia ||
                     navigator.msGetUserMedia;

var video = document.createElement("video");
video.width = 640;
video.height = 480;
video.style.display = "none";
document.body.appendChild(video);

var width = video.width,
    height = video.height;

var staticDump = document.createElement("canvas");
    staticDump.width = width;
    staticDump.height = height;
var staticCtx = staticDump.getContext("2d");
    //vertical flip
    staticCtx.translate(width, 0);
    staticCtx.scale(-1, 1);

var output = document.querySelector("#movejs-workspace"),
    ctx = output.getContext("2d");
    //vertical flip
    ctx.translate(width, 0);
    ctx.scale(-1, 1);

var buffer = new Uint8Array(width * height);

var isLittleEndian = null;

var valueR = 0,
    valueG = 170,
    valueB = 242;

function initMoves() {
  navigator.getMedia({ video: true }, startStream, logError);
}

function startStream(stream) {
  video.src = URL.createObjectURL(stream);
  video.play();
  
  requestAnimationFrame(drawStatic);
}

function logError(error) {
  console.log("error: " + error);
}

function drawStatic() {
  setInterval(function() {
    document.querySelector(".movejs-cameraAdjustIn").value += 100 / 8;
  }, 500);
  
  setTimeout(function() {
    var staticFrame = readFrame(staticCtx);
    
    if(staticFrame) {
      staticCtx.putImageData(staticFrame, 0, 0);
      setupBuffer(staticFrame.data);
      
      setTimeout(function() {
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
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    //draw game frame
    game.step();
    //...aaand flip back
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }

  requestAnimationFrame(draw);
}

function markAreas(onto) {
  onto.fillStyle = "rgba(0, 209, 56, 0.2)";
  onto.fillRect(160, 0, 330, 480);
}

function readFrame(onto) {
  try {
    onto.drawImage(video, 0, 0, width, height);
  } catch(e) {
    return null;
  }
  
  return onto.getImageData(0, 0, width, height);
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
  
  var limitY = height;
  if(!drawAll) {
    var limitX = 150;
  } else {
    var limitX = width;
  }
  
  if(isLittleEndian) {
    for(var y=0; y<limitY; ++y) {
      for(var x=0; x<limitX; ++x) {
        var rawOffset = y * width + x;
        var index = rawOffset * 4;
        
        var current = lightnessValue(data[index], data[index+1], data[index+2]);
        
        outData[rawOffset] = 
            (255 * lightnessHasChanged(rawOffset, current) << 24) | //a
            (valueB << 16) |                                        //b
            (valueG << 8) |                                         //g
            valueR;
      }
    }
  } else {
    for(var y=0; y<limitY; ++y) {
      for(var x=0; x<limitX; ++x) {
        var rawOffset = y * width + x;
        var index = rawOffset * 4;
        
        var current = lightnessValue(data[index], data[index+1], data[index+2]);
        
        outData[rawOffset] = 
            (0 << 24) |                                     //r
            (170 << 16) |                                   //g
            (242 << 8) |                                    //b
            255 * lightnessHasChanged(rawOffset, current);  //a
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
