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
document.body.appendChild(video);

var width = video.width,
    height = video.height;

var staticDump = document.createElement("canvas");
    staticDump.width = width;
    staticDump.height = height;
var staticCtx = staticDump.getContext("2d");

var output = document.querySelector("#movejs-workspace"),
    ctx = output.getContext("2d");

var controlbox = document.querySelector(".movejs-controlbox"),
    controlboxCtx = controlbox.getContext("2d");
    
var buffer = new Uint8Array(width * height);

//popup text
var popup = "";
function displayPopup() {
  ctx.beginPath();
  if(popup.length >= 40) {
    ctx.font = "34px sans-serif";
  } else {
    ctx.font = "48px sans-serif";
  }
  ctx.fillStyle = "#356E00";
  ctx.textAlign = 'center';
  ctx.fillText(popup, 320, 50);
  ctx.closePath();
}

//boxSlide event
var boxSlide = new CustomEvent (
  "boxSlide", {
    bubbles: true,
    cancelable: true
  }
);

//ball object
function Ball(x, y, armed) {
  this.x = x;
  this.y = y;
  this.r = 10;
  this.d = this.r * 2; //diameter
  this.armed = armed;
  this.opacity = 0;
  this.color = "rgba(204, 0, 71, " + this.opacity + ")";
}

Ball.prototype.arm = function() {
  this.armed = true;
  this.color = "rgba(204, 0, 71, 1)";
};

Ball.prototype.disarm = function() {
  this.armed = false;
  this.color = "#00E335";
};

Ball.prototype.redraw = function(surface) {
  surface.fillStyle = this.color;
  surface.beginPath();
  surface.arc(this.x, this.y, this.r, Math.PI*2, false);
  surface.closePath();
  surface.fill();
};

Ball.prototype.checkCollision = function(surface) {
  var right = surface.getImageData(this.x + this.r + 1, this.y - this.r - 1, 1, this.d).data;

  for(var i=0; i<right.length; i+=4) {
    if(right[i] == 0 && right[i+1] == 170 && right[i+2] == 242) {
      if(this.x > 0 + this.r + 1) {
        this.x -= 1;
      }
    }
  }
};

Ball.prototype.step = function(surface) {
  this.checkCollision(surface);

    if(this.armed) {
      if(this.opacity < 1) {
        this.opacity += 0.1;
        this.color = "rgba(204, 0, 71, " + this.opacity + ")";
      }
      if(this.x < 30) {
        document.dispatchEvent(boxSlide);
        this.disarm();
      }
    } else {
      if(this.x < 75) {
        this.x += 5;
      }
      if(this.x >= 75) {
        this.arm();
      }
    }
};
//

//box object
function Box(x, width, armed) {
  this.x = x;
  this.width = width;
  this.armed = armed;
  this.opacity = 0;
  this.color = "rgba(204, 0, 71, " + this.opacity + ")";
}

Box.prototype.redraw = function(surface) {
  surface.beginPath();
  surface.fillStyle = this.color;
  surface.fillRect(this.x, 0, this.width, 480);
  surface.closePath();
};

Box.prototype.arm = function() {
  this.armed = true;
  this.color = "#CC0047";
};

Box.prototype.disarm = function() {
  this.armed = false;
  this.color = "#00E335";
};

Box.prototype.checkCollision = function(surface) {
  var right = surface.getImageData(this.x + this.width, 0, 1, 480).data;

  for(var i=0; i<right.length; i += 4) {
    if(right[i] == 0 && right[i+1] == 170 && right[i+2] == 242) {
      if(this.width > 0) {
        this.width -= 0.3;
      }
    }
  }
};

Box.prototype.step = function(surface) {
  this.checkCollision(surface);

  if(this.armed) {
    if(this.opacity < 1) {
      this.opacity += 0.1;
      this.color = "rgba(204, 0, 71, " + this.opacity + ")";
    }
    if(this.width < 60) {
      this.disarm();
      document.dispatchEvent(boxSlide);
    }
  } else {
    if(this.width >= 99) {
      this.arm();
    } else {
      this.width += 10;
    }
  }
};
//

var boxLeft = new Box(0, 100, true);

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
    document.querySelector(".movejs-cameraAdjustIn").value += 100/12;
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
  }, 6000);
}

function draw() {
  var frame = readFrame(ctx);
  
  if(frame) {
    markLightnessChanges(frame.data);
    ctx.putImageData(frame, 0, 0);

    markAreas(ctx);
    
    if(drawControls) {
      boxLeft.redraw(ctx);
    }
    
    var tocopy = ctx.getImageData(0, 140, 150, 200);
    controlboxCtx.putImageData(tocopy, 0, 0);
    
    if(drawControls) {
      boxLeft.step(ctx);
    }
    displayPopup();
  }

  requestAnimationFrame(draw);
}

function markAreas(onto) {
  onto.fillStyle = "#1BAFE0";
  onto.fillRect(150, 0, 10, 480);
  onto.fillRect(490, 0, 10, 480);

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
  var limitY = height;
  if(!drawAll) {
    var limitX = 150;
  } else {
    var limitX = width;
  }

  for(var y=0; y<limitY; ++y) {
    for(var x=0; x<limitX; ++x) {
      var rawOffset = y * width + x;
      var index = rawOffset * 4;
      
      var current = lightnessValue(data[index], data[index+1], data[index+2]);

      data[index] = 0;
      data[index + 1] = 170;
      data[index + 2] = 242;

      data[index + 3] = 255 * lightnessHasChanged(rawOffset, current);
    }
  }
}

function lightnessHasChanged(index, value) {
  return Math.abs(value - buffer[index]) >= 15;
}

function lightnessValue(r, g, b) {
  return ( Math.min(r, g, b) + Math.max(r, g, b) ) / 255 * 50;
}
