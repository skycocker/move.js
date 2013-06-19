document.addEventListener("advance", nextMove, false);
window.addEventListener("hashchange", beginScenario, false);

var popup = "";
var drawControls = false,
    drawAll = true;

function nextMove() {
  controls.next();

  var currId = document.querySelector(".active").getAttribute("id");
  //document.getElementById(currId).appendChild(controlbox);
}

function beginScenario() {
  switch(location.hash) {
    case "#/thatsright":
      video.style.display = "none";
      popup = "Now place yourself in the green rectangle.";
      beginInstructions();
    break;
    case "#/youjustswitched":
      drawAll = false;
      output.style.display = "none";
    break;
  }
}

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

function beginInstructions() {
  setTimeout(function() {
    var area = ctx.getImageData(150, 0, 340, 480).data;
    var pixelsAll = 340*480;
    var pixelsFilled = 0;

    for(var i=0; i<area.length; i += 4) {
      if(area[i] == 0 && area[i+1] == 209 && area[i+2] == 56 && area[i+3] == 0.2) {
        ++pixelsFilled;
      }
    }

    if(pixelsFilled / pixelsAll < 0.9) {
      //human present
      popup = "That's right.";
      drawControls = true;
      explainControls();
    } else {
      popup = "We still can't find you.";
      beginInstructions();
    }
  }, 5000);
}

function explainControls() {
  setTimeout(function() {
    popup = "See this red box?"
    setTimeout(function() {
      popup = "Use your hand to push it off the screen.";
    }, 1000);
  }, 2000);
}
