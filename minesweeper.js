// -------------  canvas selectors/constants: ---------------------

const canvas = document.querySelector('canvas');
const scene = canvas.getContext('2d');

const sceneWidth_px = canvas.width;
const sceneHeight_px = canvas.height;
const midWidth_px = round_down(sceneWidth_px / 2);
const midHeight_px = round_down(sceneHeight_px / 2);

// ----------- class for Cell Position on Scene: ------------------

// purpose: representation of x/y coordinate on canvas. 
class Posn {
  constructor (x,y) {
    this.x = x;
    this.y = y;
  };
};

// ------------- class for Minesweeeper Cell: ----------------------

// purpose: representation of a minesweeper cell on canvas.
class Cell {
  constructor (index, posn, isBomb, bombNeighbors, state) {
    this.index = index;                   // NatNum
    this.posn = posn;                     // Posn
    this.isBomb = isBomb;                 // Boolean
    this.bombNeighbors = bombNeighbors;   // NatNum
    this.state = state;                   // String ("covered", "flag" or "revealed")
  };
};

// -------------------- Game constants: ----------------------------

const max_rows = 10;
const max_cols = 10;
const total_mines = 15;
const total_cells = max_rows * max_cols;
const clock_interval = 1000;

const cell_size_px = round_down(sceneWidth_px / max_rows);
const cell_color_covered = "aliceblue";
const cell_color_revealed = "lightgray";
const border_size_px_cellCovered = 2;
const border_size_px_cellRevealed = 0.25;
const border_color = "black";

const create_new_cells = () => generate_minesweeper_cells(max_rows, max_cols, total_mines);
const cells_toReveal = total_cells - total_mines;

const initial_minutes = 0;
const initial_seconds = 0;
const initial_time = [initial_minutes, initial_seconds];

// -------------------- Minesweeper object: -------------------------

const minesweeper = {
  cells: create_new_cells(),     // Array-of Cells
  time: initial_time,            // Array-of NatNum -> [Minutes, Seconds]
  cells_revealed: 0,             // NatNum
  flagCounter: 0,                // NatNum
  gameState: false,              // Boolean
};


// ------------------------------------------------------------------
// --------------------- main handlers: -----------------------------

// ----------------- setting up interval: ---------------------------
let timeInterval = null;

// ------------------------ clock: ----------------------------------
const clock = document.getElementById("clock");

// ---------------------- flag-counter: -----------------------------
const flags = document.getElementById("flags");

// --------------------- initial Scene: -----------------------------
render_initial_gameScene();

// -------------------- game over message: --------------------------
const gameover_message = document.getElementById("gameover_message");

// ------------------- mouse event selectors: -----------------------
const buttonStart = document.getElementById("buttonStart");
buttonStart.addEventListener("click", startGame);

const buttonReset = document.getElementById("buttonReset");
buttonReset.addEventListener("click", resetGame);

canvas.addEventListener("click", (e) => leftClick_onCell(canvas, e));
canvas.addEventListener("contextmenu", (e) => rightClick_onCell(canvas, e));


// ----------------------------------------------------------------------------
// ---------------------- start/reset functions: ------------------------------

// startGame :: Event -> Mutates Minesweeper Object
// purpose: initializes time count and starts the game by allowing to reveal cells.
function startGame () {
  if (!timeInterval && is_game_off()) {
    timeInterval = setInterval(runClock, clock_interval);
    minesweeper.gameState = true;
  };
};

// resetGame :: Event -> Mutates Minesweeper Object
// purpose: stops time count and restarts the game by generating new Minesweeper cells.
function resetGame () {
  stop_timeInterval();
  clearScene();
  reset_to_initialSettings();  
  render_initial_gameScene();
};

// reset_to_initialSettings :: -> Mutates Minesweeper Object
// resets minesweeper to initial settings.
function reset_to_initialSettings () {
  minesweeper.cells = create_new_cells();
  minesweeper.time = [initial_minutes, initial_seconds];
  minesweeper.cells_revealed = 0;
  minesweeper.flagCounter = 0;
  minesweeper.gameState = false;       
};

// stop_timeInterval :: -> Mutates timeInterval
// clears interval and sets it to null value.
function stop_timeInterval () {
  clearInterval(timeInterval);
  timeInterval = null;
};

// ---------------------------------------------------------------------------
// ----------------------- main functions: -----------------------------------

// ------------------------- on-click: ---------------------------------------

// leftClick_onCell :: Canvas Event -> [Maybe Mutates Minesweeper Object]
// While game is running, reveals the cell, if not revealed or falgged. 
function leftClick_onCell (canvas, event) {
  
  if (timeInterval) {
    const scn = canvas.getBoundingClientRect();
    const mouse_x = event.clientX - scn.left;
    const mouse_y = event.clientY - scn.top;

    const posn_clicked = coordinates_to_posn(mouse_x, mouse_y, cell_size_px);
    const index_clicked = posn_toIndex(posn_clicked, max_cols);
    const cell_clicked = minesweeper.cells[index_clicked]; 
    const state = cell_clicked.state;
  
    if (state === "covered") {
      reveal_cell(index_clicked);
    };
  };
};

// rightClick_onCell :: Canvas Event -> [Maybe Mutates Minesweeper Object]
// if game is started, checks/unchecks flag on the cell if not revealed yet.
function rightClick_onCell (canvas, event) {
  
  if (timeInterval) {
    const scn = canvas.getBoundingClientRect();
    const mouse_x = event.clientX - scn.left;
    const mouse_y = event.clientY - scn.top;

    const posn_clicked = coordinates_to_posn(mouse_x, mouse_y, cell_size_px);
    const index_clicked = posn_toIndex(posn_clicked, max_cols);
    const cell_clicked = minesweeper.cells[index_clicked]; 
    const state = cell_clicked.state;
  
    if (state !== "revealed") {
      flagAction_cell(index_clicked);
    };
  };
};

// reveal_cell :: Nat -> Mutates Minesweeper Object
// given index of minesweeper cell, reveals it.
function reveal_cell (index) {
  
  minesweeper.cells[index].state = "revealed";
  minesweeper.cells_revealed += 1;
  // rendering revealed cell:
  render_revealedCell(index);

  const revealed = minesweeper.cells_revealed;
  const all_revealed = (revealed === cells_toReveal);
  const cell = minesweeper.cells[index];
  const posn = cell.posn;
  const has_no_bombNeighbors = cell.bombNeighbors === 0;

  if (cell.isBomb) {
    gameLost_action();
  } else if (all_revealed) {
    gameWon_action();
  } else if (has_no_bombNeighbors) {

    let nbrs = neighbors(posn, max_cols, max_rows);
    let cells = minesweeper.cells;
    let isValid_neighbor = i => cells[i].isBomb === false && cells[i]. state === "covered";
    let same_neighbors = nbrs.filter(isValid_neighbor);
    
    for (let i of same_neighbors) {
      if (cells[i].state !== "revealed") {
        reveal_cell(i);
      };
    };
  };
};

// flagAction_cell :: Nat -> Mutates Minesweeper Object
// marks/unmarks flag from given cell.
// constrain: flag counter - cannot go below 0!
// user cannot put more flags on the scene than possible bombs!
function flagAction_cell (index) {
  const cell = minesweeper.cells[index];
  const current_posn = cell.posn;
  const current_state = cell.state;
  const current_flags = minesweeper.flagCounter;

  if (current_state === "covered" && current_flags < total_mines) {
    minesweeper.cells[index].state = "flag";
    render_flag(current_posn);
    update_flagCounter(1);
  };

  if (current_state === "flag") {
    minesweeper.cells[index].state = "covered";
    render_coveredCell(current_posn);
    update_flagCounter(-1);
  };
};

// ------------------------------------------------------------------------------
// -------------------------- Game Over functions: ------------------------------

// gameLost_action
// Stops game interval and renders final game lost message.
function gameLost_action () {
  stop_timeInterval();
  render_gameFailed_message();
};

// gameWon_action ::
// Stops game interval and renders final game won message.
function gameWon_action () {
  stop_timeInterval();
  render_gameWon_message();
  run_scoreHandler(minesweeper.time);
};

// render_gameFailed_message :: -> String
// returns failed game message on screen.
function render_gameFailed_message () {
  const msg = "SORRY, MISSION FAILED! :("; 
  flags.innerHTML = msg;
};

// render_gameWon_message :: -> String
// returns game won message on screen.
function render_gameWon_message () {
  const msg = "CONGRATULATIONS, MISSION COMPLETE! :)"; 
  flags.innerHTML = msg;
};

// --------------------------------------------------------------------------------
// -------------------------- rendering functions: --------------------------------

// render_initial_gameScene :: -> Image
// renders initial game Scene with cells grid, clock and flag counter.
function render_initial_gameScene () {
  render_initialGrid(max_rows, max_cols);
  render_clock();
  render_flagCounter();
};

// render_initialGrid :: Nat Nat -> Image
// given rows and cols, renders initial cells grid.
function render_initialGrid (rows, cols) {
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      render_coveredCell(new Posn(col, row));
    };
  };
};

// render_clock :: -> Image
// renders representation of a clock on screen.
function render_clock () {
  const display_time = () => convertTime_to_displayFormat(minesweeper.time);
  clock.innerHTML = display_time();
};

// render_flagCounter :: -> Image
// renders representation of a flag counter on screen.
function render_flagCounter () {
  const display_flags = () => convertFlags_to_displayFormat(minesweeper.flagCounter);
  flags.innerHTML = display_flags();
};

// clearScene :: -> Image
// clears whole minesweeper scene.
function clearScene () {
  scene.clearRect(0,0, sceneWidth_px, sceneHeight_px);
};

// ---------------------------------------------------------------------------------
// -------------------------- rendering Covered cells: -----------------------------

// render_coveredCell :: Posn -> Image
// given posn, renders minesweeper covered cell on canvas.
function render_coveredCell (posn) {
  
  const posn_x = posn.x;
  const posn_y = posn.y;
  const x = convert_px(posn_x);
  const y = convert_px(posn_y);

  scene.beginPath();
  scene.fillStyle = cell_color_covered;
  scene.fillRect(x, y, cell_size_px, cell_size_px);

  scene.lineWidth = border_size_px_cellCovered;
  scene.rect(x, y, cell_size_px, cell_size_px);
  scene.stroke();
};

// render_flag :: Posn -> Image
// renders representation of a flag on given posn.
function render_flag (posn) {
  
  const mid_posn_x = posn.x + 0.5;
  const mid_posn_y = posn.y + 0.5;
  const mid_x = convert_px(mid_posn_x);
  const mid_y = convert_px(mid_posn_y);

  const flag_color = "firebrick";
  const flag_radius_ratio = 0.3;
  const flag_radius = round_down(flag_radius_ratio * cell_size_px);

  scene.beginPath();
  scene.fillStyle = flag_color;
  scene.arc(mid_x, mid_y, flag_radius, 0, 2 * Math.PI);
  scene.fill();
};

// ---------------------------------------------------------------------------------
// -------------------------- rendering Revealed cells: ----------------------------

// render_revealedCell :: Index -> Image
// given cell's index, renders it's revealed representation on canvas.
function render_revealedCell (index) {

  const cell = minesweeper.cells[index];
  const posn = cell.posn;
  const is_bomb = cell.isBomb;
  const has_bombs_around = cell.bombNeighbors !== 0;

  // renders revealed cell background;
  render_revealedCell_background(posn);

  if (is_bomb) {
    render_bomb(posn);
  } else if (has_bombs_around) {
    render_number(posn, cell.bombNeighbors);
  };
};

// render_revealedCell_background :: Posn -> Image
// given posn, renders revealed cell background.
function render_revealedCell_background (p) {
  
  const posn_x = p.x;
  const posn_y = p.y;
  const x = convert_px(posn_x);
  const y = convert_px(posn_y);

  scene.beginPath();
  scene.fillStyle = cell_color_revealed;
  scene.fillRect(x, y, cell_size_px, cell_size_px);

  scene.lineWidth = border_size_px_cellRevealed;
  scene.rect(x, y, cell_size_px, cell_size_px);
  scene.stroke();
};

// render_number :: Posn, Integer -> Image
// renders image representation of given number on given posn on scene.
function render_number (p, n) {
  
  const mid_posn_x = p.x + 0.5;
  const mid_posn_y = p.y + 0.7    // to do!!
  const x = convert_px(mid_posn_x);
  const y = convert_px(mid_posn_y);

  //const fontSize_cell_ratio = 0.7;
  const fontSize = "20px" //`${round_down(fontSize_cell_ratio * cell_size_px)}`;
  const fontType = "Arial";

  scene.font = `${fontSize} ${fontType}`;
  scene.textAlign = "center";
  scene.fillStyle = "blue";
  scene.fillText(`${n}`, x, y);
};

// render_bomb :: Posn -> Image
// renders representation of a bomb cell on given posn.
function render_bomb (p) {
  
  const mid_posn_x = p.x + 0.5;
  const mid_posn_y = p.y + 0.5;
  const mid_x = convert_px(mid_posn_x);
  const mid_y = convert_px(mid_posn_y);

  const bomb_color = "black";
  const bomb_base_cell_ratio = 0.55;
  const bomb_line_cell_ratio = 0.8;
  const bomb_line_width = 2;
  
  const bomb_radius = round_down(cell_size_px * bomb_base_cell_ratio * 0.5);
  const bomb_line_length = round_down(cell_size_px * (bomb_line_cell_ratio / 2)); 
  
  scene.beginPath();
  scene.fillStyle = bomb_color;
  scene.arc(mid_x, mid_y, bomb_radius, 0, 2 * Math.PI);

  scene.lineWidth = bomb_line_width;
  scene.moveTo(mid_x, mid_y);
  scene.lineTo(mid_x + bomb_line_length, mid_y);
  scene.moveTo(mid_x, mid_y);
  scene.lineTo(mid_x - bomb_line_length, mid_y);
  scene.moveTo(mid_x, mid_y);
  scene.lineTo(mid_x, mid_y - bomb_line_length);
  scene.moveTo(mid_x, mid_y);
  scene.lineTo(mid_x, mid_y + bomb_line_length);

  scene.fill();
  scene.stroke();
};

// ----------------------------------------------------------------------------
// ------------------------ clock and flag functions: -------------------------

// runClock :: -> Mutating Minesweeper Object/Image
// returns next clock state (increments time property and renders it on the clock).
function runClock () {
  addSecond(minesweeper.time);
  render_clock();
};

// addSecond
function addSecond (time) {
  let sec = time[1];

  if (sec < 59) {
    minesweeper.time[1] += 1;
  } else {
    minesweeper.time[0] += 1;
    minesweeper.time[1] = 0;
  };
};

// update_flagCounter :: Int -> Mutates Minesweeper Object / Image    
// adds/removes a flag from counter if legal, and updates its image representation.  
function update_flagCounter (val) {
  const result = minesweeper.flagCounter + val;

  if (result >= 0) {
    minesweeper.flagCounter = result;
    render_flagCounter();
  };
};

// convertTime_to_displayFormat :: [Array-of Nat] -> String
// given time in minutes and seconds, converts it to a display format.
function convertTime_to_displayFormat (time) {
  const min = time[0];
  const sec = time[1];

  const convert_2digit = n => (n < 10) ? `0${n}` : `${n}`;
  return convert_2digit(min) + ":" + convert_2digit(sec);
};

// convertFlags_to_displayFormat :: Nat -> String
// given number of flags, returns message on screen.
function convertFlags_to_displayFormat (n) {
  const max = total_mines;
  return `Mines Secured: ${n}/${max}`;
};


//------------------------------------------------------------------------
// -------------------- generating minesweeper cells: --------------------

// generate_minesweeper_cells :: Nat Nat Nat -> [Array-of Cells]
function generate_minesweeper_cells (rows, cols, mines) {
  
  const empty_cells = generate_empty_cells(rows, cols);
  const mines_indices = generate_random_set(mines, (rows * cols));
  const result = insert_mines(mines_indices, empty_cells);

  return result;
};

// generate_empty_cells :: Nat Nat -> [Array-of Cells]
// given rows and cols, returns initial cells with no bombs.
function generate_empty_cells (rows, cols) {
  const cells = [];
  let base_index = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push(new Cell(base_index, new Posn(col, row), false, 0, "covered"))
      base_index += 1;
    };
  };
  return cells;
};

// generate_random_set :: NatNum NatNum -> [Array-of NatNum]
// given n numbers to draw and max, returns randomly chosen 
// set of numbers from 0 (inclusive) to max (exclusive).
function generate_random_set (n, max) {
  const random = x => Math.floor(Math.random() * x);

  function helper (m, acc) {
    let result = random(m);

    if (acc.length === n) {
      return acc;
    } else if (acc.includes(result)) {
      return helper(m, acc);
    } else {
      acc.push(result);
      return helper(m, acc);
    };
  };
  return helper(max, []);
};

// insert_mines :: [Array-of NatNum] [Array-of Cells] -> [Array-of Cells]
// given indices for mines and cells, inserts them and increases bombNeighbors value
// for neighbors around.
function insert_mines (indices, cells) {
  const result = cells;

  for (let i of indices) {
    
    result[i].isBomb = true;
    let posn = cells[i].posn;
    // for each neighbor, add1 to bombNeighbor.
    for (let n of neighbors(posn, max_cols, max_rows)) {
      result[n].bombNeighbors += 1;
    };
  };
  return result;
};

// neighbors :: Posn NatNum NatNum -> [Array-of NatNum]
// given posn and max cols/rows, returns indices of neighbor cells.
function neighbors (posn, cols, rows) {
  const x = posn.x;
  const y = posn.y;
  const max_x = cols - 1;
  const max_y = rows - 1;

  const horizontal = [new Posn(x - 1, y), new Posn(x + 1, y)];
  const vertical = [new Posn(x, y - 1), new Posn(x, y + 1)];
  const diagonal = [new Posn(x - 1, y - 1), new Posn(x + 1, y - 1),
                    new Posn(x - 1, y + 1), new Posn(x + 1, y + 1)]; 
  
  const temp_posns = horizontal.concat(vertical, diagonal);
  const is_valid = p => (p.x >= 0) && (p.x <= max_x) && (p.y >= 0) && (p.y <= max_y); 
  const valid_posns = temp_posns.filter(is_valid);
  
  const indices = [];
  for (let vp of valid_posns) {
    indices.push(posn_toIndex(vp, cols));
  };

  return indices;
};

// --------------------------------------------------------------------------
// -------------------- score handling functions: ---------------------------

// run_scoreHandler :: [Array-of NatNum] -> Maybe Event
// if time is valid for highest scores ranking, opens a form for record input.
function run_scoreHandler(time) {
  const min = time[0];
  const sec = time[1];

  // run request to php file:
  const xmlhttp = new XMLHttpRequest();
  xmlhttp.open("POST", "https://ferdex.eu/Minesweeper/valid_score_minesweeper.php", true);
  xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xmlhttp.send(`min=${min}&sec=${sec}`);

  // if valid, opes record form:
  xmlhttp.onload = function() {
    if (xmlhttp.responseText) {
      openForm();
    };
  };
};

// updateRecords :: -> Event
// given name input on the record form, sends data to update highest scores table. 
function updateRecords() {
  const name = document.getElementById('name_input').value;
  const time = minesweeper.time;
  const time_str = convertTime_to_displayFormat(time);

  // run request to php file:
  const xmlhttp = new XMLHttpRequest();
  xmlhttp.open("POST", "https://ferdex.eu/Minesweeper/update_records_minesweeper.php", true);
  xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xmlhttp.send(`t=${time_str}&n=${name}`);

  // alert message when loaded:
  xmlhttp.onload = function() {
    alert("Check Highest Scores!");
  };

  // closing the form:
  closeForm();
};

// openForm :: -> Event
// opens the record form.
function openForm() {
  document.getElementById("record_form").style.display = "block";
  disable_restButtons();
};

// closeForm :: -> Event
// closes the record form.
function closeForm() {
  document.getElementById("record_form").style.display = "none";
  enable_restButtons();
};

// disable_restButtons :: -> Event
// diables game/menu buttons from user interaction.
function disable_restButtons() {
  const game1 = document.getElementById("buttonStart")
  const game2 = document.getElementById("buttonReset");
  const menu1 = document.getElementById("mb1");
  const menu2 = document.getElementById("mb2");
  const menu3 = document.getElementById("mb3");
      
  game1.disabled = true;
  game2.disabled = true;
  menu1.disabled = true;
  menu2.disabled = true;
  menu3.disabled = true;
};

// disable_restButtons :: -> Event
// enables game/menu buttons back for user interaction.
function enable_restButtons () {
  const game1 = document.getElementById("buttonStart")
  const game2 = document.getElementById("buttonReset");
  const menu1 = document.getElementById("mb1");
  const menu2 = document.getElementById("mb2");
  const menu3 = document.getElementById("mb3");
      
  game1.disabled = false;
  game2.disabled = false;
  menu1.disabled = false;
  menu2.disabled = false;
  menu3.disabled = false;
};

// -----------------------------------------------------------------------------------
// ------------------------------ helper functions: ----------------------------------

// convert_px :: Nat -> Nat
// given posn coordinate, returns pixel position on scene.
function convert_px (coordinate) {
  const size = cell_size_px;
  return round_down(coordinate * size);
};

// coordinates_to_posn :: NatNum NatNum NatNum -> Posn
// given mouse x, y coordinates and size of the cell, returns posn that was clicked.
function coordinates_to_posn (x, y, size) {

  function helper (value, counter, acc) {
    return value < acc ? counter : helper(value, counter + 1, acc + size)
  };

  const posn_x = helper(x, 0, size);
  const posn_y = helper(y, 0, size);
  const result = new Posn (posn_x, posn_y);

  return result;
};

// posn_toIndex :: Posn NatNum -> Nat
// given cell posn and max cols, returns its index. 
function posn_toIndex (p, cols) {
  const col_adder = p.y * cols; 
  const row_adder = p.x

  return col_adder + row_adder;
};

// round_down :: Number -> Int
// returns n reduced to its floor value.
function round_down (n) {
  return Math.floor(n);
};

// is_game_off :: -> Boolean
// returns true if the game is not running.
function is_game_off () {
  return minesweeper.gameState === false; 
};

// -----------------------------------------------------------------------------------
// ----------------------------------- THE END ---------------------------------------
