
let gBoard = new Array(3);
let gBoardScore = undefined;
let gRows = 5;
let gColumns = 5;
let gMisere = false;
let gAI = -1;

let gPlaying = 1;
let gCursorX = undefined;
let gCursorY = undefined;
let gMessage = '';
let gAIPlaying = false;
let gSettingLastTouchTime = -1;
let gCheatMode = false;

onload = _ => {
  initialize();
  initBoard();
  windowResized();
  drawCanvas();
};

function getPlayableMoves(board = undefined, playing = undefined) {
  let result = [];
  if (board == undefined) {
    board = gBoard;
  }
  if (playing == undefined) {
    playing = gPlaying;
  }
  if (playing % 2 == 1) {
    for (let x = 0; x < gColumns; x++) {
      for (let y = 0; y < gRows - 1; y++) {
        if (board[x][y] == 0 && board[x][y + 1] == 0) {
          result.push({x: x, y: y});
        }
      }
    }
  } else {
    for (let x = 0; x < gColumns - 1; x++) {
      for (let y = 0; y < gRows; y++) {
        if (board[x][y] == 0 && board[x + 1][y] == 0) {
          result.push({x: x, y: y});
        }
      }
    }
  }
  return result;
}

function initialize() {
  window.addEventListener('resize', windowResized);
  document.getElementById('rows').addEventListener('change', rowsChanged);
  document.getElementById('columns').addEventListener('change', columnsChanged);
  document.getElementById('ai').addEventListener('change', aiChanged);
  document.getElementById('misere').addEventListener('change', misereChanged);
  document.getElementById('canvas').addEventListener('mousemove', mouseMoveOnCanvas);
  document.getElementById('canvas').addEventListener('mousedown', mouseDownOnCanvas);
  document.getElementById('reset').addEventListener('click', resetClicked);
  document.getElementById('settings').addEventListener('mousedown', mouseDownOnSettings);
  document.getElementById('settings').addEventListener('touchstart', mouseDownOnSettings);
  document.getElementById('button_cheat_mode').addEventListener('click', cheatModeClicked);
  document.addEventListener('keydown', keyPressed);
}

function initBoard() {
  gBoard = new Array(gColumns);
  gBoardScore = new Array(gColumns);
  for (let x = 0; x <= gColumns; x++) {
    gBoard[x] = new Array(gRows);
    gBoardScore[x] = new Array(gRows);
    for (let y = 0; y <= gRows; y++) {
      gBoard[x][y] = 0;
      gBoardScore[x][y] = 0;
    }
  }
  gPlaying = 1;
  gMessage = '';
  gAIPlaying = false;
}

function keyPressed() {
  var keyCode = event.keyCode;
}

function rowsChanged(event) {
  gRows = parseInt(event.target.value);
  initBoard();
  drawCanvas();
  if (gCheatMode) {
      updateScore();
  }
  if (gAI >= 0 && gPlaying % 2 == gAI) {
    playAIAsync();
  }
}

function columnsChanged(event) {
  gColumns = parseInt(event.target.value);
  initBoard();
  if (gCheatMode) {
      updateScore();
  }
  drawCanvas();
  if (gAI >= 0 && gPlaying % 2 == gAI) {
    playAIAsync();
  }
}

function aiChanged() {
  gAI = event.target.value;
  initBoard();
  if (gCheatMode) {
      updateScore();
  }
  drawCanvas();
  if (gAI >= 0 && gPlaying % 2 == gAI) {
    playAIAsync();
  }
}

function misereChanged() {
  gMisere = event.target.checked;
  initBoard();
  if (gCheatMode) {
      updateScore();
  }
  drawCanvas();
  if (gAI >= 0 && gPlaying % 2 == gAI) {
    playAIAsync();
  }
}

function resetClicked(event) {
  initBoard();
  if (gCheatMode) {
      updateScore();
  }
  drawCanvas();
  if (gAI >= 0 && gPlaying % 2 == gAI) {
    playAIAsync();
  }
}

function playAIAsync() {
  gAIPlaying = true;
  gMessage = "COM is thinking...";
  drawCanvas();
  requestAnimationFrame(_ => {
    setTimeout(_ => {
      playAI();
      gAIPlaying = false;
      if (gPlaying > 0) {
        gMessage = "";
      }
      drawCanvas();
    }, 1);
  });
}

function playAI() {
  let playableMoves = getPlayableMoves();
  if (playableMoves != undefined && playableMoves.length > 0) {
    let index = 0;
    // let index = Math.floor(Math.random() * playableMoves.length);
    let tmpBoard = new Array(gColumns);
    for (let x = 0; x <= gColumns; x++) {
      tmpBoard[x] = new Array(gRows);
      for (let y = 0; y <= gRows; y++) {
        tmpBoard[x][y] = gBoard[x][y];
      }
    }

    let maxPlayableMovesCount = -gRows * gColumns * 2;
    let maxPlayableMovesIndices = [];
    for (let i = 0; i < playableMoves.length; i++) {
      for (let x = 0; x <= gColumns; x++) {
        for (let y = 0; y <= gRows; y++) {
          tmpBoard[x][y] = gBoard[x][y];
        }
      }
      playAtBoard(playableMoves[i].x, playableMoves[i].y, tmpBoard, gPlaying);
      let positivePlayableMovesCount = getPlayableMoves(tmpBoard, gPlaying).length;
      let negativePlayableMovesCount = getPlayableMoves(tmpBoard, gPlaying + 1).length;
      if (gMisere) {
        positivePlayableMovesCount *= -1;
        negativePlayableMovesCount *= -1;
      }
      let playableMovesCount = positivePlayableMovesCount - negativePlayableMovesCount;
      if (playableMovesCount > maxPlayableMovesCount) {
        maxPlayableMovesCount = playableMovesCount;
        maxPlayableMovesIndices = [i];
      } else if (playableMovesCount == maxPlayableMovesCount) {
        maxPlayableMovesIndices.push(i);
      }
    }

    let i = Math.floor(Math.random() * maxPlayableMovesIndices.length);
    playAt(playableMoves[maxPlayableMovesIndices[i]].x, playableMoves[maxPlayableMovesIndices[i]].y);
  }
}

function mouseMoveOnCanvas(event) {
  let canvas = document.getElementById('canvas');
  let xy = getXYFromMousePosition(event.clientX, event.clientY, canvas.width, canvas.height, gColumns + 2, gRows + 2);
  let x0, y0, x1, y1;
  gCursorX = xy.x;
  gCursorY = xy.y;
  if (gPlaying % 2 == 1) {
    x0 = Math.floor(gCursorX);
    y0 = Math.floor(gCursorY - 0.5);
    x1 = x0;
    y1 = y0 + 1;
  } else {
    x0 = Math.floor(gCursorX - 0.5);
    y0 = Math.floor(gCursorY);
    x1 = x0 + 1;
    y1 = y0;
  }
  if (x0 < 0 || y0 < 0 || x0 >= gColumns || y0 >= gRows) {
    gCursorX = undefined;
    gCursorY = undefined;
    drawCanvas();
    return;
  }
  if (x1 < 0 || y1 < 0 || x1 >= gColumns || y1 >= gRows) {
    gCursorX = undefined;
    gCursorY = undefined;
    drawCanvas();
    return;
  }
  if (gBoard[x0][y0] != 0 || gBoard[x1][y1] != 0) {
    gCursorX = undefined;
    gCursorY = undefined;
    drawCanvas();
    return;
  }
  drawCanvas();
}

function mouseDownOnCanvas(event) {
  let canvas = document.getElementById('canvas');
  let xy = getXYFromMousePosition(event.clientX, event.clientY, canvas.width, canvas.height, gColumns + 2, gRows + 2);

  if (gPlaying < 0) {
     return;
  }
  if (gCursorX != undefined && gCursorY != undefined) {
    if (gPlaying % 2 == 1) {
      let x = Math.floor(gCursorX);
      let y = Math.floor(gCursorY - 0.5);
      playAt(x, y);
    } else {
      let x = Math.floor(gCursorX - 0.5);
      let y = Math.floor(gCursorY);
      playAt(x, y);
    }
  }

  drawCanvas();
}

function playAtBoard(x, y, board, playing) {
  let played = false;
  if (playing % 2 == 1) {
    if (x >= 0 && x < gColumns && y >= 0 && y < gRows - 1) {
      board[x][y] = 1;
      board[x][y + 1] = 1;
      played = true;
    }
  } else {
    if (x >= 0 && x < gColumns - 1 && y >= 0 && y < gRows) {
      board[x][y] = 2;
      board[x + 1][y] = 2;
      played = true;
    }
  }
  return played;
}

function playAt(x, y) {
  let played = playAtBoard(x, y, gBoard, gPlaying);

  if (played) {
    gPlaying++;
    let playableMoves = getPlayableMoves();
    if (playableMoves != undefined && playableMoves.length == 0) {
      // window.alert("Game.");
      let winner = "";
      if (gMisere) {
        if (gPlaying % 2 == 0) {
          winner = "Second player";
        } else {
          winner = "First player"
        }
        if (gPlaying % 2 == gAI) {
          winner += " (COM)";
        }
      } else {
        if (gPlaying % 2 == 1) {
          winner = "Second player";
        } else {
          winner = "First player"
        }
        if (gPlaying % 2 == 1 - gAI) {
          winner += " (COM)";
        }
      }
      gMessage = winner + " wins!";
      gPlaying = -1;
    }
    gCursorX = undefined;
    gCursorY = undefined;
    drawCanvas();
    if (gCheatMode) {
        updateScore();
    }
    if (gPlaying != 0) {
      if (gAI >= 0 && gPlaying % 2 == gAI) {
        playAIAsync();
      }
    }
  }
  return played;
}

function windowResized() {
  let canvas = document.getElementById('canvas');
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;
  canvas.width = width;
  canvas.height = height;
  drawCanvas();
}

function drawCanvas() {
  let canvas = document.getElementById('canvas');
  let settings = document.getElementById('settings');
  let width = canvas.width;
  let height = canvas.height;
  let unit;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  let boardUnits = getBoardUnits(width, height, gColumns + 2, gRows + 2);
  let lineWidth = boardUnits.unit / 36;
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = "#000000";
  for (let x = 0; x <= gColumns; x++) {
    for (let y = 0; y <= gRows; y++) {
      let xy = getXYFromBoardUnits(boardUnits, x + 1, y + 1);
      if (gBoard[x][y] == 1) {
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(xy.x, xy.y, boardUnits.unit, boardUnits.unit);
      } else if (gBoard[x][y] == 2) {
        ctx.fillStyle = "#0000FF";
        ctx.fillRect(xy.x, xy.y, boardUnits.unit, boardUnits.unit);
      }
    }
  }
  if (gCheatMode && gBoardScore != undefined) {
    if (gPlaying % 2 == 0) {
      for (let x = 0; x < gColumns - 1; x++) {
        for (let y = 0; y < gRows; y++) {
          let xy = getXYFromBoardUnits(boardUnits, x + 2, y + 1.65);
          let score = gBoardScore[x][y];
          if (score == undefined){
            continue;
          }
          if (score > 0) {
            ctx.fillStyle = "#A8A8FF";
          } else if (score < 0) {
            ctx.fillStyle = "#FFA8A8";
          } else {
            ctx.fillStyle = "#A8A8A8";
          }
          ctx.font = "" + (boardUnits.unit * 2 / 7) + "px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(score, xy.x, xy.y); 
        }
      }
    } else {
      for (let x = 0; x < gColumns; x++) {
        for (let y = 0; y < gRows - 1; y++) {
          let xy = getXYFromBoardUnits(boardUnits, x + 1.5, y + 2.15);
          let score = gBoardScore[x][y];
          if (score == undefined){
            continue;
          }
          if (score > 0) {
            ctx.fillStyle = "#FFA8A8";
          } else if (score < 0) {
            ctx.fillStyle = "#A8A8FF";
          } else {
            ctx.fillStyle = "#A8A8A8";
          }
          ctx.font = "" + (boardUnits.unit * 2 / 7) + "px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(score, xy.x, xy.y); 
        }
      }
    }
  }
  for (let x = 0; x <= gColumns; x++) {
    let xy1 = getXYFromBoardUnits(boardUnits, x + 1, 1);
    let xy2 = getXYFromBoardUnits(boardUnits, x + 1, gRows + 1);
    ctx.beginPath();
    ctx.moveTo(xy1.x, xy1.y);
    ctx.lineTo(xy2.x, xy2.y);
    ctx.stroke();
  }
  for (let y = 0; y <= gRows; y++) {
    let xy1 = getXYFromBoardUnits(boardUnits, 1, y + 1);
    let xy2 = getXYFromBoardUnits(boardUnits, gColumns + 1, y + 1);
    ctx.beginPath();
    ctx.moveTo(xy1.x, xy1.y);
    ctx.lineTo(xy2.x, xy2.y);
    ctx.stroke();
  }

  if (gCursorX != undefined && gCursorY != undefined && gAIPlaying == false && gPlaying > 0) {
    if (gPlaying % 2 == 1) {
      let x = Math.floor(gCursorX + 1);
      let y = Math.floor(gCursorY + 0.5);
      let xy = getXYFromBoardUnits(boardUnits, x, y);
      ctx.fillStyle = "#FF000080";
      ctx.fillRect(xy.x + lineWidth, xy.y + lineWidth, boardUnits.unit - lineWidth * 2, boardUnits.unit * 2 - lineWidth * 2);
      // ctx.fillStyle = "#FFFFFF";
      // ctx.fillRect(boardUnits.xOrigin + x * boardUnits.unit + 12, boardUnits.yOrigin + y * boardUnits.unit + 12,
      //   boardUnits.unit - 24, boardUnits.unit * 2 - 24);
    } else {
      let x = Math.floor(gCursorX + 0.5);
      let y = Math.floor(gCursorY + 1);
      let xy = getXYFromBoardUnits(boardUnits, x, y);
      ctx.fillStyle = "#0000FF80";
      ctx.fillRect(xy.x + lineWidth, xy.y + lineWidth, boardUnits.unit * 2 - lineWidth * 2, boardUnits.unit - lineWidth * 2);
      // ctx.fillStyle = "#FFFFFF";
      // ctx.fillRect(boardUnits.xOrigin + x * boardUnits.unit + 12, boardUnits.yOrigin + y * boardUnits.unit + 12,
      //   boardUnits.unit - 24, boardUnits.unit - 24);
    }
  }

  let xy = getXYFromBoardUnits(boardUnits, gColumns + 1, gRows / 2);
  if (gMessage && gMessage.length > 0) {
    ctx.fillStyle = "#000000";
    ctx.font = "" + (boardUnits.unit * 2 / 7) + "px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(gMessage, (width / 2), (height * (gRows * 4 - 1) / (gRows * 4)));
  }
}

function getXYFromBoardUnits(boardUnits, x, y) {
  let resultX = boardUnits.xOrigin + boardUnits.unit * x
  let resultY = boardUnits.yOrigin + boardUnits.unit * y;
  return {x: resultX, y: resultY};
}

function getBoardUnits(width, height, xMax, yMax) {
  let xOrigin, yOrigin;
  if (width / xMax > height / yMax) {
    unit = height / yMax;
    xOrigin = (width / 2) - (height / yMax * (xMax / 2));
    yOrigin = 0;
  } else {
    unit = width / xMax;
    xOrigin = 0;
    yOrigin = (height / 2) - (width / xMax * (yMax / 2));
  }

  return {
    xMax: xMax,
    yMax, yMax,
    xOrigin: xOrigin,
    yOrigin: yOrigin,
    unit: unit
  };
}

function getXYFromMousePosition(mouseX, mouseY, width, height, xMax, yMax) {
  let units = getBoardUnits(width, height, xMax, yMax);

  let x = Math.floor((mouseX - units.xOrigin) / unit * 2) / 2 - 1;
  let y = Math.floor((mouseY - units.yOrigin) / unit * 2) / 2 - 1;

  return {x: x, y: y};
}

function mouseDownOnSettings(event) {
  if (event.target.id != 'settings') {
    gSettingTouchCount = 0;
    return;
  }

  let touchInterval = Date.now() - gSettingLastTouchTime;
  if (touchInterval < 500) {
    gSettingTouchCount++;
    if (gSettingTouchCount >= 3) {
      if (document.getElementById('cheat_mode').className.indexOf('gone') >= 0) {
        document.getElementById('cheat_mode').className = '';
      } else {
        document.getElementById('cheat_mode').className = 'gone';
      }
      gSettingTouchCount = 0;
    }
  } else {
    gSettingTouchCount = 1;
  }
  gSettingLastTouchTime = Date.now();
}

function cheatModeClicked(event) {
 if (gCheatMode) {
    gCheatMode = false;
    drawCanvas();
    return;
  } else {
    gCheatMode = true;
    updateScore();
    drawCanvas();
    return;
  }
}

function updateScore() {
  for (let x = 0; x <= gColumns; x++) {
    for (let y = 0; y <= gRows; y++) {
      gBoardScore[x][y] = undefined;
    }
  }

  let playableMoves = getPlayableMoves();
  if (playableMoves != undefined && playableMoves.length > 0) {
    let index = 0;
    let tmpBoard = new Array(gColumns);
    for (let x = 0; x <= gColumns; x++) {
      tmpBoard[x] = new Array(gRows);
      for (let y = 0; y <= gRows; y++) {
        tmpBoard[x][y] = gBoard[x][y];
      }
    }

    let maxPlayableMovesCount = -gRows * gColumns * 2;
    let maxPlayableMovesIndices = [];
    for (let i = 0; i < playableMoves.length; i++) {
      for (let x = 0; x <= gColumns; x++) {
        for (let y = 0; y <= gRows; y++) {
          tmpBoard[x][y] = gBoard[x][y];
        }
      }
      playAtBoard(playableMoves[i].x, playableMoves[i].y, tmpBoard, gPlaying);
      let positivePlayableMovesCount = getPlayableMoves(tmpBoard, gPlaying).length;
      let negativePlayableMovesCount = getPlayableMoves(tmpBoard, gPlaying + 1).length;
      if (gMisere) {
        positivePlayableMovesCount *= -1;
        negativePlayableMovesCount *= -1;
      }
      let playableMovesCount = positivePlayableMovesCount - negativePlayableMovesCount;
      gBoardScore[playableMoves[i].x][playableMoves[i].y] = playableMovesCount;
    }
  }
}
