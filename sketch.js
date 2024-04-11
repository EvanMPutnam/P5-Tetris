//import p5 from "./p5/p5";

// Global drawing constants
const X_GRID_OFFSET = 10
const Y_GRID_OFFSET = 40
const X_NEXT_PIECE_OFFSET = 375
let Y_NEXT_PIECE_OFFSET = 200

// Game configuration constants
const LEFT_MOVE = 0
const RIGHT_MOVE = 1
const X_SPACES = 10
const Y_SPACES = 20

let game
let font

/**
 * A class meant to represent a piece.
 */
class Piece {
  constructor(r, g, b, tetrino) {
    this.r = r
    this.g = g
    this.b = b
    this.tetrinoPiece = tetrino
    this.activePiece = false
  }
}

/**
 * Class that represents a 4x4 grid with a Tetrino in it.
 * This 4x4 grid is then rotated.
 */
class TetrinoQuadrant {
  constructor(quadrant) {
    // Deepcopy the initial config for rotation logic.
    this.quad = JSON.parse(JSON.stringify(quadrant.CONFIG))
    this.color = quadrant.COLOR
    this.startX = 0
    this.startY = 0
  }
}

class Game {
  constructor() {
    this.board = []

    this.needsNewPiece = true
    this.score = 0
    this.lines = 0

    this.gameLost = false
    this.gamePaused = false

    // Generate a new tetrino for the start of the game.
    this.tetrinoQuadrant = null
    this.nextQuadrant = null

    // A variable used between functions to determine when a row needs to be moved downward.
    this.moveRow = -1

    for (let y = 0; y < Y_SPACES; y++) {
      this.board.push([])
      for (let x = 0; x < X_SPACES; x++) {
        this.board[y].push(new Piece(30, 30, 30, false))
      }
    }
    this.tetrinoConfigs = [TETRINO_TYPE.I, TETRINO_TYPE.J,
      TETRINO_TYPE.L, TETRINO_TYPE.O, TETRINO_TYPE.S,
      TETRINO_TYPE.T, TETRINO_TYPE.Z
    ]

    this.generateNewTetrino()
    this.score = 0 // Normally generating a new tetrino increases score.
  }

  /**
   * Duplicates the board without any active tetrino pieces on it.
   */
  duplicateBoardWithoutActive() {
    const dupBoard = []
    for (let y = 0; y < Y_SPACES; y++) {
      dupBoard.push([])
      for (let x = 0; x < X_SPACES; x++) {
        if (!this.board[y][x].activePiece) {
          let p = this.board[y][x]
          dupBoard[y].push(new Piece(p.r, p.g, p.b, p.tetrinoPiece))
        } else {
          dupBoard[y].push(new Piece(30, 30, 30, false))
        }
      }
    }
    return dupBoard
  }

  /**
   * Sets all tetrino pieces that are active to an inactive state.
   */
  setInactiveTetrinos() {
    for (let y = 0; y < Y_SPACES; y++) {
      for (let x = 0; x < X_SPACES; x++) {
        if (this.board[y][x].activePiece) {
          this.board[y][x].activePiece = false
        }
      }
    }
    // When a tetrino is set to inactive a new one needs to be generated
    this.needsNewPiece = true
  }

  /**
   * Function to see if the placement of a piece into this space would be valid.
   * @param {x position to check} x 
   * @param {y position to check} y 
   * @param {the board object to check, may be a duplicated board} board 
   */
  validPlacement(x, y, board) {
    if (y == Y_SPACES) {
      return false
    } else if (board[y][x].activePiece) {
      return true
    } else if (board[y][x].tetrinoPiece && !board[y][x].activePiece) {
      return false;
    }

    return true
  }

  /**
   * This function updates the falling motion of an active tetrino.
   * If it collides with the ground, or other tetrinos, it will set the current tetrino inactive.
   */
  updateBoard() {
    let tempBoard = this.duplicateBoardWithoutActive()
    let allMovesValid = true
    for (let y = 0; y < Y_SPACES; y++) {
      for (let x = 0; x < X_SPACES; x++) {
        if (this.board[y][x].activePiece) {
          const valid = this.validPlacement(x, y + 1, tempBoard)
          if (valid) {
            tempBoard[y + 1][x] = this.board[y][x]
          } else {
            allMovesValid = false
          }
        }
      }
    }
    if (allMovesValid) {
      this.board = tempBoard.slice()
      this.tetrinoQuadrant.startY += 1
    } else {
      this.setInactiveTetrinos()
    }
  }


  /**
   * This function just looks for rows that are completed and deletes them.
   * It also sets the this.gamePaused variable which indicates that the game needs to recheck.
   */
  lookForCompleteRowsAndDelete() {
    let rowToDelete = -1
    for (let y = Y_SPACES - 1; y >= 0; y--) {
      let totalInRow = 0
      for (let x = 0; x < X_SPACES; x++) {
        if (this.board[y][x].tetrinoPiece) {
          totalInRow += 1
        }
      }
      if (totalInRow == X_SPACES) {
        rowToDelete = y
        break
      }
    }

    // Delete this row!
    if (rowToDelete >= 0) {
      for (let x = 0; x < X_SPACES; x++) {
        this.board[rowToDelete][x] = new Piece(30, 30, 30, false)
      }
      this.moveRow = rowToDelete
      this.gamePaused = true
      return
    }
    this.gamePaused = false
    this.moveRow = -1

  }

  /**
   * This function generates a new tetrion and sets up the information for the next one
   * to be selected.
   */
  generateNewTetrino() {

    let index = Math.floor(Math.random() * this.tetrinoConfigs.length);
    const tetrino = this.nextQuadrant == null ? new TetrinoQuadrant(this.tetrinoConfigs[index]) : this.nextQuadrant;

    index = Math.floor(Math.random() * this.tetrinoConfigs.length);
    this.nextQuadrant = new TetrinoQuadrant(this.tetrinoConfigs[index])

    // Just changing the base position of the tetrinos.
    let startingXPosition = Math.floor(Math.random() * X_SPACES - 2)
    if (startingXPosition + tetrino.quad[0].length >= X_SPACES) {
      startingXPosition = 5
    }
    if (startingXPosition < 0) {
      startingXPosition = 0
    }


    // Assign the new tetrinos to the board at their starting locations.
    for (let y = 0; y < tetrino.quad.length; y++) {
      for (let x = 0; x < tetrino.quad[y].length; x++) {
        if (tetrino.quad[y][x] == 1) {
          // If the tetrino generated is overlapping another then game over!
          if (this.board[y][startingXPosition + x].tetrinoPiece) {
            this.gameLost = true
          }
          this.board[y][startingXPosition + x] = new Piece(tetrino.color[0],
            tetrino.color[1],
            tetrino.color[2],
            true)
          this.board[y][startingXPosition + x].activePiece = true
        }
      }
    }


    this.needsNewPiece = false

    // Sets the tetrino quadrant.  It is useful for rotations.
    this.tetrinoQuadrant = tetrino
    this.tetrinoQuadrant.startX = startingXPosition
    this.tetrinoQuadrant.startY = 0

    this.score += 10
  }


  /**
   * Modifies a temporary board with a left move, if its valid.  If not a valid left move
   * then it returns false and the temporary board should be discarded.
   * @param {A temporary board without active pieces to place to move the piece onto} tempBoard 
   */
  moveLeft(tempBoard) {
    let allMovesValid = true
    for (let y = 0; y < Y_SPACES; y++) {
      for (let x = 0; x < X_SPACES; x++) {
        if (this.board[y][x].activePiece && x - 1 >= 0 &&
          (this.board[y][x - 1].activePiece || !this.board[y][x - 1].tetrinoPiece)) {
          tempBoard[y][x - 1] = this.board[y][x]
        } else if (this.board[y][x].activePiece) {
          allMovesValid = false
        }
      }
    }
    return allMovesValid
  }

  /**
   * Modifies a temporary board with a right move, if its valid.  If not a valid right move
   * then it returns false and the temporary board should be discarded.
   * @param {A temporary board without active pieces to place to move the piece onto} tempBoard 
   */
  moveRight(tempBoard) {
    let allMovesValid = true
    for (let y = 0; y < Y_SPACES; y++) {
      for (let x = X_SPACES - 1; x >= 0; x--) {
        if (this.board[y][x].activePiece && x + 1 < X_SPACES &&
          (this.board[y][x + 1].activePiece || !this.board[y][x + 1].tetrinoPiece)) {
          tempBoard[y][x + 1] = this.board[y][x]
        } else if (this.board[y][x].activePiece) {
          allMovesValid = false
        }
      }
    }
    return allMovesValid
  }


  /**
   * A left or right move command on the board.
   * Returns true if the move was successful and the board should be redrawn.
   * @param {Are you moving left or right} moveCommand 
   */
  movePiece(moveCommand) {
    const tempBoard = this.duplicateBoardWithoutActive()
    const allMovesValid = moveCommand == LEFT_MOVE ? this.moveLeft(tempBoard) : this.moveRight(tempBoard);
    if (allMovesValid) {
      this.tetrinoQuadrant.startX = moveCommand == LEFT_MOVE ?
        this.tetrinoQuadrant.startX - 1 : this.tetrinoQuadrant.startY + 1;
      this.board = tempBoard.slice()
      return true
    }
    return false
  }


  /**
   * Rotates the active tetrino 90 degrees.
   * It uses a matrix rotation algorithm to perform the rotation if it does 
   * not collide with other tetrinos, goes out of bounds, etc.
   */
  rotatePiece() {
    const tempQuad = this.quad = JSON.parse(JSON.stringify(this.tetrinoQuadrant.quad))
    const N = this.tetrinoQuadrant.quad.length
    // Do the rotation on the temporary quad.
    for (let x = 0; x < Math.floor(N / 2); x += 1) {
      for (let y = x; y < N - x - 1; y += 1) {
        const temp = tempQuad[x][y]
        tempQuad[x][y] = tempQuad[y][N - x - 1]
        tempQuad[y][N - 1 - x] = tempQuad[N - 1 - x][N - 1 - y]
        tempQuad[N - 1 - x][N - 1 - y] = tempQuad[N - 1 - y][x]
        tempQuad[N - 1 - y][x] = temp
      }
    }

    // Create a temporary board to see if the moves are valid.
    const tempBoard = this.duplicateBoardWithoutActive()
    let startingX = this.tetrinoQuadrant.startX
    let startingY = this.tetrinoQuadrant.startY
    let allValid = true
    for (let y = 0; y < this.tetrinoQuadrant.quad.length; y += 1) {
      let tempX = startingX
      for (let x = 0; x < this.tetrinoQuadrant.quad.length; x += 1) {
        if (tempQuad[y][x] == 1) {
          if (!(startingX < X_SPACES && startingX >= 0 && startingY < Y_SPACES && startingY >= 0) ||
            (tempBoard[startingY][startingX].tetrinoPiece)) {
            allValid = false
          }
        }
        startingX += 1
      }
      startingX = tempX
      startingY += 1
    }

    // If all tetrino spaces are valid then do the rotation and update the existing tetrino quad.
    if (allValid) {
      this.tetrinoQuadrant.quad = tempQuad
      let r = this.tetrinoQuadrant.color[0]
      let g = this.tetrinoQuadrant.color[1]
      let b = this.tetrinoQuadrant.color[2]
      startingX = this.tetrinoQuadrant.startX
      startingY = this.tetrinoQuadrant.startY
      for (let y = 0; y < this.tetrinoQuadrant.quad.length; y += 1) {
        let tempX = startingX
        for (let x = 0; x < this.tetrinoQuadrant.quad.length; x += 1) {
          if (this.tetrinoQuadrant.quad[y][x] == 1) {
            tempBoard[startingY][startingX] = new Piece(r, g, b, true)
            tempBoard[startingY][startingX].activePiece = true
          }
          startingX += 1
        }
        startingY += 1
        startingX = tempX
      }
      this.board = tempBoard.slice()
      return true
    }

    return false

  }

  /**
   * Moves all rows down on the condition that we have a row of pieces.
   */
  moveRowsDown() {
    if (this.moveRow != -1) {
      for (let y = this.moveRow - 1; y >= 0; y--) {
        for (let x = 0; x < X_SPACES; x++) {
          let temp = this.board[y][x]
          this.board[y][x] = new Piece(30, 30, 30, false)
          this.board[y + 1][x] = temp
        }
      }
      // Add scoring information
      this.score += 100
      this.lines += 1
    }
  }

  /**
   * This performs a single frame calculation for the game.
   */
  gameFrame() {
    if (!this.gameLost && !this.gamePaused) {
      this.updateBoard()
      if (this.needsNewPiece) {
        this.lookForCompleteRowsAndDelete()
        if (!this.gamePaused) {
          this.generateNewTetrino()
        } else {
          this.moveRowsDown()
        }
      }
    } else if (game.gamePaused) {
      this.lookForCompleteRowsAndDelete()
      if (game.gamePaused) {
        this.moveRowsDown()
      }
    }
  }
}

function drawPiece(x, y) {
  fill(game.board[y][x].r, game.board[y][x].g, game.board[y][x].b)
  square((x * 30) + X_GRID_OFFSET, (y * 30) + Y_GRID_OFFSET, 27)
}

function reDrawGame() {
  // Draw pieces
  for (let y = 0; y < Y_SPACES; y++) {
    for (let x = 0; x < X_SPACES; x++) {
      drawPiece(x, y)
    }
  }

  // Draw next piece
  let r = game.nextQuadrant.color[0]
  let g = game.nextQuadrant.color[1]
  let b = game.nextQuadrant.color[2]
  fill(r, g, b)
  for (let y = 0; y < game.nextQuadrant.quad.length; y++) {
    for (let x = 0; x < game.nextQuadrant.quad.length; x++) {
      if (game.nextQuadrant.quad[y][x] == 1) {
        square(X_NEXT_PIECE_OFFSET + ((x * 30) + X_GRID_OFFSET),
          Y_NEXT_PIECE_OFFSET + ((y * 30) + Y_GRID_OFFSET), 27)
      }
    }
  }


}

/**
 * This handles the framerate change for a "drop" move.
 */
function handleSpeed() {
  if (keyIsDown(DOWN_ARROW) && !game.gamePaused) {
    frameRate(20)
  } else {
    frameRate(3)
  }
}

/**
 * This handles all user input to the game.
 */
function keyPressed() {
  if (!game.gameLost && !game.gamePaused) {
    let updateBoard = false
    if (keyCode == LEFT_ARROW) {
      updateBoard = game.movePiece(LEFT_MOVE)
    } else if (keyCode == RIGHT_ARROW) {
      updateBoard = game.movePiece(RIGHT_MOVE)
    } else if (keyCode == UP_ARROW) {
      updateBoard = game.rotatePiece()
    }

    if (updateBoard) {
      reDrawGame()
    }
  }
}

/**
 * Preloading in the arcade font.
 */
function preload() {
  font = loadFont('arcadeFont.ttf')
}


/**
 * Basic setup items.
 */
function setup() {
  // put setup code here
  createCanvas(600, 650);
  frameRate(3)
  game = new Game()

  textFont(font)
  textSize(40)

}


/**
 * Draw frame for our game!
 */
function draw() {
  // Any addittional control code.
  handleSpeed()

  // Drawing code for game.
  background(0)
  fill(255, 255, 255)
  textSize(40)
  text("Tetris", 340, 100)
  textSize(20)
  text("Score: " + game.score, 345, 150)
  text("Lines: " + game.lines, 345, 180)
  text("Next Piece", 345, 250)
  reDrawGame() // Draws the tetris board.

  // Perform a step of the game.
  game.gameFrame()
}
