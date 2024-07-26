// ------------ selectors for the scene: -------------
    
    const canvas = document.querySelector('canvas');
    const scene = canvas.getContext('2d');
    scene.textAlign = "center";

    const sceneWidth_px = canvas.width;
    const sceneHeight_px = canvas.height;
    const midWidth = round_down(sceneWidth_px / 2);
    const midHeight = round_down(sceneHeight_px / 2);

    // ------------- class for Block position on scene -------------------
    
    // purpose: being able to describe the position of a block on scene.
    // 1 unit is equal to size of a block. The scene is a block grid.
    // x is defined by natural numbers from 0, 1, 2... leftmost being 0.
    // y is defined by natural numbers from 0, 1, 2... upmost being 0.
    // ex: new Posn (0, 3);
    
     class Posn{
      constructor(x, y) {
        this.x = x;
        this.y = y;
      };
    };

    // ------------ class for Block on scene: ----------------------------
    
    // purpose: being able to describe the position, length and orientation
    // of a block on scene.

    class Block {
      constructor(posn, length, orientation) {
        this.posn = posn;                     // Posn
        this.length = length;                 // Number: one of (1,2,3...).
        this.orientation = orientation;       // String: one of: "horizontal", "vertical".     
      };

      // block_posns :: -> [Array-of Posn]
      // returns array of current Posns on scene that are occupied by a Block. 
      currentPosns() {
        return currentPosns_onScene(this.posn, this.length, this.orientation);
      };

      // moveDown :: -> Mutates Block instance
      // moves the whole block down.
      moveDown() {
        this.posn = new Posn (this.posn.x, this.posn.y + 1);
      };

      // moveLeft :: -> Mutates Block instance
      // moves the whole block to the left.
      moveLeft() {
        this.posn = new Posn (this.posn.x - 1, this.posn.y);
      };
      
      // moveRight :: -> Mutates Block instance
      // moves the whole block to the right.
      moveRight() {
        this.posn = new Posn (this.posn.x + 1, this.posn.y);
      };

      // removeHead :: -> Mutates Block Instance
      // removes the lowest posn from the block. Should be used ONLY
      // when in "vertical" orientation and if length more than 1.
      removeHead() {
          this.posn = new Posn(this.posn.x, this.posn.y - 1);
          this.length -= 1;
      };

      // rotateBlock :: -> Mutates Block instance
      // changes Block orientation - if vertical, changes to horizontal and vice versa. 
      rotateBlock() {
          this.orientation === "horizontal" ? this.orientation = "vertical" : this.orientation = "horizontal";
      };
    };

    // ------------- setting Landscape representation: -------------------

    // landscape is a Map.
    // Keys:   Natural Numbers, starting from 0.
    // Values: [Array-of Posn]
    // keys represent rows of tetris landscape.
    // values represent positions occupied by landscape (blocks that landed).
    
    // example: if landscape has two blocks in position (3,3) and (4,3), map representation: 
    // Map {0 => [], 1 => [], 2 => [], 3 => [new Posn(3,2), new Posn(4,2)], ...}
    
    const landscape = new Map();

    // generate_emptyLandscape :: Number Number -> Mutates landscape Object
    // given range, returns min, min+1, ... max keys with empty arrays. 
    function generate_emptyLandscape (min, max) {
      landscape.clear();

      for (let i = min; i <= max; i++) {
        landscape.set(i, []);
      };
    };

    // ------------- setting constants/initial values: ----------------------

    const sceneWidth_inBlocks = 10;
    const sceneHeight_inBlocks = 10;
    const max_BlockLength = 4;

    const blockSize = round_down(sceneWidth_px / sceneWidth_inBlocks);
    const blockColor = "firebrick";
   
    const min_y = 0;
    const max_y = sceneHeight_inBlocks - 1;
    const min_x = 0;
    const max_x = sceneWidth_inBlocks - 1;

    const initial_timeInterval = 400;
    const timeInterval_change_ratio = 0.02; 
    const points_forFullRow = sceneWidth_inBlocks;
    const initial_points = 0;

    // generating initial random Block:
    const newRandomBlock = () => generate_newBlock(max_x, max_BlockLength);
    const initial_block = newRandomBlock();
    
    // generating initial landscape Map:
    generate_emptyLandscape(min_y, max_y);


    // ------------------- initial tetris object: -------------------

    const tetris = {
      block: initial_block,                 // Block
      landscape: landscape,                 // landscape
      points: initial_points,               // Number
      gameState: false,                     // Boolean
    };

    // ----------- Constructing timeInterval object: ----------------
    // Purpose: ability to start, stop and modify Interval during runtime.

    function timeInterval(fun, time) {
      this.fun = fun;
      this.time = time;
      this.interval = null;
      this.isRunning = false;

      this.start = function () {
        this.interval = setInterval(this.fun, this.time);
        this.isRunning = true;
      };

      this.stop = function () {
        clearInterval(this.interval);
        this.interval = null;
        this.isRunning = false;
      };

      this.setTime = function (ms) {
        this.time = ms;
      };
    };
    
    // ----------------------------------------------------------------
    // ------------------ main handlers: ------------------------------

    // ------ rendering tetris scene: --------------
    
    renderTetris();

    // ------ setting time interval: ---------------
    
    let current_timeInterval = initial_timeInterval;
    const gameInterval = new timeInterval(nextState, current_timeInterval);

    // ------ button selectors: --------------------
    
    const buttonStart = document.getElementById('btnStart');
    buttonStart.addEventListener('click', startGame);

    const buttonReset = document.getElementById('btnReset');
    buttonReset.addEventListener('click', resetGame);
    
    // ------ on-key selector: ---------------------
    
    document.addEventListener("keydown", changePosition_of_currentBlock);

    //------------------------------------------------------------------
    //-------------------- main functions: -----------------------------
  
    // startGame :: -> Mutates GameInterval Object
    // if game is not running, resets timeInterval to initial value and starts Tetris Game.
    function startGame() {
      if (game_isOff()) {
        gameInterval.setTime(initial_timeInterval);
        gameInterval.start();
        tetris.gameState = true;
      };
    };

    // resetGame :: -> Mutates GameInterval/Tetris Object
    // Stops gameInterval, resets Tetris to its initial settings, renders initial State.
    function resetGame() {
      gameInterval.stop();
      reset_to_InitialSettings();
      updateScene();
    };

    // renderTetris :: -> Image
    // renders tetris object on scene.
    function renderTetris() {
      render_tetrisBlock(tetris.block);
      render_tetrisLandscape(tetris.landscape);
      renderScore(tetris.points);
    };

    // nextState :: -> Mutates Tetris Object
    // returns next state of the tetris Object and renders it on the scene.
    // If terminating condition is met, ends the interval and game.
    function nextState() {
      
      const block = tetris.block;
      const land = tetris.landscape;
      const current_row = block.posn.y;
      
      if (landscape_touchesCeiling(land, min_y)) {
        endGame();

      } else if (is_completeRow(block, current_row, sceneWidth_inBlocks)) {
        updatePoints();
        updateBlock_afterRowCompletion();
        updateRows(current_row);
        updateInterval();
        updateScene();

      } else if (block_onGround(block, max_y)) {
        appendBlock_toLandscape();
        generate_newBlock_forTetris();
        updateScene();

      } else if (block_onLandscape(block, land)) {
        appendBlock_toLandscape();
        generate_newBlock_forTetris();
        updateScene();

      } else { 
        moveDown_currentBlock();
        updateScene();      
      };
    };

    //---------------------------------------------------------------------------
    //--------------------- main conditional functions: -------------------------

    // landscape_touchesCeiling :: Landscape Number -> Boolean
    // given landscape, returns true if any of its blocks 'touches' given level.
    function landscape_touchesCeiling (l, ceiling) {     
      const level = l.get(ceiling);
      return level.length !== 0;
    };

    // is_completeRow :: Block Number Number -> Boolean
    // returns true if given block and current row of landscape form a complete row.
    function is_completeRow(b, y, total) {
      const row = tetris.landscape.get(y);
      const block_length = b.length;
      const row_length = row.length;
      const position = b.orientation;

      return position === "horizontal" ? 
             (row_length + block_length) === total : 
             (row_length + 1) === total;
    };
    
    // block_onGround :: Block Number -> Boolean
    // returns true if given block lands on the ground.
    function block_onGround (block, ground) {
      const p = block.posn;
      return posn_onGround(p, ground); 
    };

    // block_onLandscape :: Block Landscape Number -> Boolean
    // returns true if given block lands on the landscape.
    function block_onLandscape (block, l) {   
      const current_posns = block.currentPosns();
      return ormap(current_posns, (p) => posn_onLandscape(p, l))
    };

    // posn_onLandscape :: Posn Landscape -> Boolean
    // returns true if given posn lands/is on the current landscape.
    function posn_onLandscape (posn, l) {
      if (withinScene(posn)) {
        const x = posn.x;
        const y = posn.y;
        const layer_under = l.get(y + 1);

        return ormap(layer_under, (p) => p.x === x);
      } else {
        return false;
      };
    };

    // posn_onGround :: Posn Number -> Boolean
    // given posn and ground level, returns true if it lands on the ground.
    function posn_onGround (p, ground) {
      return p.y === ground;
    };

    // isPosn_Landscape :: Posn Landscape -> Boolean
    // returns true if given posn is part of the landscape.
    function isPosn_Landscape (p, l) {
      const x = p.x; 
      const y = p.y;
  
      if (withinScene(p)) {
        const row = l.get(y);
        return ormap(row, (p) => p.x === x);
      } else {
        return false;
      };
    };  

    // withinScene :: Posn -> Boolean
    // returns true if given Posn is within boundaries of the scene.
    function withinScene(p) {
      const x = p.x;
      const y = p.y;
      
      return x >= min_x && x <= max_x && y >= min_y && y <= max_y;
    };

    // game_isOn :: -> Boolean
    // returns true when gameInterval is running and gameState is true.
    function game_isOn () {
      return gameInterval.isRunning && tetris.gameState;
    };

    // game_isOff :: -> Boolean
    // returns true when gameInterval is not running and gameState is false.
    function game_isOff () {
      return !(gameInterval.isRunning || tetris.gameState);
    };

    //--------------------------------------------------------------------------------------------
    //------------------------ rendering functions: ----------------------------------------------

    // convertPosn_pixels :: Posn -> [Array-of Number]
    // converts given Block Posn to an actual (value in pixels) position on scene -> [x, y]
      function convertPosn_pixels(pn) {
        let x = pn.x * blockSize;
        let y = pn.y * blockSize;

        return [x, y];
      };

    // render_tetrisBlock :: Block -> Image
    // renders given block on scene.
    function render_tetrisBlock (block) {
      const block_posns = block.currentPosns();

      for (let p of block_posns) {
        let current_p = convertPosn_pixels(p);
        let current_x = current_p[0];
        let current_y = current_p[1];

        scene.beginPath();
        scene.fillStyle = blockColor;
        scene.rect(current_x, current_y, blockSize, blockSize);
        scene.fill();
      };
    };

    // render_tetrisLandscape :: Landscape -> Image
    // renders given landscape on scene.
    function render_tetrisLandscape (l) {
      l.forEach(render_row);

      function render_row (posns) {
        for (let p of posns) {
          let grounded_p = convertPosn_pixels(p);
          let grounded_x = grounded_p[0];
          let grounded_y = grounded_p[1];        

          scene.beginPath();
          scene.fillStyle = blockColor;
          scene.rect(grounded_x, grounded_y, blockSize, blockSize);
          scene.fill();
        };
      };
    };

    // renderScore :: NatNum -> Image
    // given points, returns score display above scene.
    function renderScore (points) {
      const p_string = points.toString();
      
      const display = document.getElementById("score_display");
      display.innerHTML = p_string;
    };

    // render_gameOver :: -> Image
    // returns gameover message on a snake scene.
    function render_gameOver () {
      const msg_sceneSize_ratio = 0.1;
      const msg_size = round_down(sceneHeight_px * msg_sceneSize_ratio); 
      const size = `${msg_size}px`;
      const font = "Courier New";
      
      const text = "GAME OVER";
      const x = midWidth;
      const y = midHeight;

      scene.font = `${size} ${font}`;
      scene.strokeText(text, x, y);
    };

    //--------------------------------------------------------------------------------------------
    // ---------------------------- functions for key-events: ------------------------------------

    // changePosition_of_currentBlock :: Event -> Mutating Tetris Object 
    // purpose: changing orientation/Posn of a current Block if legal.
    function changePosition_of_currentBlock (event) {

      if (game_isOn()) {

      const keyName = event.key;
      const block = tetris.block;
      const land = tetris.landscape;

      const legalRotation = () => isLegal_toRotate(block, land, max_x);
      const legalLeft = () => isLegal_toMoveLeft(block, land, min_x);
      const legalRight = () => isLegal_toMoveRight(block, land, max_x);

      if (keyName === " " && legalRotation()) { tetris.block.rotateBlock() };
      if (keyName === "ArrowLeft" && legalLeft()) { tetris.block.moveLeft() };
      if (keyName === "ArrowRight" && legalRight()) { tetris.block.moveRight() };
      if (keyName === "ArrowDown") { nextState() };
      };
    };

    // isLegal_toMoveLeft :: Block Landscape Number -> Boolean
    // returns true if given block can legally move to the left.
    // legally: it doesn't fall out of the scene nor collides with a landscape.
    function isLegal_toMoveLeft (block, l, min_x) {
      const posns = block.currentPosns();
      
      const fallsOut = ormap(posns, (p) => (p.x - 1) < min_x);
      const collides = ormap(posns, (p) => isPosn_Landscape(new Posn (p.x - 1, p.y), l));

      return !(fallsOut || collides);
    };

    // isLegal_toMoveRight :: Block Landscape Number -> Boolean
    // returns true if given block can legally move to the right.
    // legally: it doesn't fall out of the scene nor collides with a landscape.
    function isLegal_toMoveRight(block, l, max_x) {
      const posns = block.currentPosns();
      
      const fallsOut = ormap(posns, (p) => (p.x + 1) > max_x);
      const collides = ormap(posns, (p) => isPosn_Landscape(new Posn (p.x + 1, p.y), l));

      return !(fallsOut || collides);
    };

    // isLegal_toRotate :: Block Landscape Number -> Boolean
    // returns true if given block can legally change its orientation.
    // legally: it doesn't fall out of the scene nor collides with a landscape.
    function isLegal_toRotate (block, l, max_x) {
      
      let counter = 1;
      let max_count = block.length;
      let p = block.posn;
      let x = p.x;
      let y = p.y;
      let is_horizontal = block.orientation === "horizontal";
      let result = [];

      for (let i = counter; i <= max_count; i++) {
        result.push(new Posn (x, y));
        
        is_horizontal ? y -= 1 : x += 1;
      };

      const posns_afterRotation = result;
      const fallsOut = ormap(posns_afterRotation, (p) => p.x > max_x);
      const collides = ormap (posns_afterRotation, (p) => isPosn_Landscape(p, l));

      return !(fallsOut || collides);
    };

    //--------------------------------------------------------------------------------------------
    //----------------------- Tetris state Updating functions: -----------------------------------
   
    // updateScene :: -> Image
    // clears Tetris scene and renders it again (current state).
    function updateScene() {
      scene.clearRect(0, 0, sceneWidth_px, sceneHeight_px);
      renderTetris();
    };

    // updatePoints :: -> Mutates Tetris Object
    // adds points to the current tetris.points value.
    function updatePoints() {
      tetris.points += points_forFullRow;
    };

    // updateInterval :: -> Mutates gameInterval Object
    // clears current gameInterval, sets a new time value and runs it again.
    function updateInterval() {
      gameInterval.stop();
      current_timeInterval -= (current_timeInterval * timeInterval_change_ratio);
      gameInterval.setTime(current_timeInterval);
      gameInterval.start();
    };

    // updateBlock_afterRowCompletion :: -> Mutates Tetris Block Instance
    function updateBlock_afterRowCompletion() {
      const block = tetris.block;
      const length = block.length;
      const position = block.orientation;

      if (position === "horizontal" || length === 1) {
        generate_newBlock_forTetris();
      } else {
        tetris.block.removeHead();
      };
    };

    // updateRows :: Nummber -> Mutates Landscape Map
    // given row of landscape, removes it and makes all above landscape fall,
    // as low as possible. Either on other landscape or on the ground.
    function updateRows(row) {
      tetris.landscape.set(row, []);
      lowerAllAbove(row);
    };

    // reset_to_InitialSettings :: -> Mutating timeInterval & Tetris Object
    // resets tetris Object properties and time interval to initial values.
    function reset_to_InitialSettings() {

      current_timeInterval = initial_timeInterval;
      generate_emptyLandscape(min_y, max_y);

      tetris.block = newRandomBlock();
      tetris.landscape = landscape; 
      tetris.points = initial_points;
      tetris.gameState = false;
    };

    //--------------------------------------------------------------------------------------------
    //--------------------------- main auxilliary functions: -------------------------------------

    // endGame :: -> Image
    // stops Game Interval and renders final scene with a score Information.
    function endGame() {
      gameInterval.stop();
      render_gameOver();
      run_scoreHandler(tetris.points);
    };

    // appendBlock_toLandscape :: -> Mutates Tetris Object
    // appends current tetris block to the landscape.
    function appendBlock_toLandscape() {
      const posns = tetris.block.currentPosns();

      for (let p of posns) {
        add_posn_toLandscape(p);
      };
    };
    
    // add_posn_toLandscape :: Posn -> Mutates Landscape
    // adds given Posn to current landscape.
      function add_posn_toLandscape(posn) {
        if (withinScene(posn)) {
          const y = posn.y;
          tetris.landscape.set(y, tetris.landscape.get(y).concat(posn));
        };
      };
  
    // generate_newBlock_forTetris :: -> Mutates Tetris Block property
    // generates a new random block for tetris.
    function generate_newBlock_forTetris() {
      tetris.block = newRandomBlock();
    };
    
    // generate_newBlock :: Number Number -> Block
    // given maximum x posn and maximum block length, returns randomly chosen 
    // and placed new falling Block. 
    function generate_newBlock (max_x, max_length) {
      
      const size = random(max_length) + 1;
      const orientationToss = random(2);
      const orientation = (orientationToss === 0) ? "horizontal" : "vertical";

      const posn_y = min_y;
      const posn_x = (orientation === "vertical") ? random(max_x + 1) : random(max_x - (size - 1)); 

      return new Block(new Posn (posn_x, posn_y), size, orientation);
    };

    // current_posns_onScene :: Posn NatNum String -> Array-of Posn
    // given Block Posn, its length and orientation, returns array of Posns that
    // this block occupies.
    function currentPosns_onScene (posn, length, orientation) {
      const current_x = posn.x;
      const current_y = posn.y;
      const max = length;
      const counter = 1;

      return (orientation === "horizontal") ? aux_horizontal(current_x, current_y) : aux_vertical(current_y, current_x);

      function aux_horizontal (variable_x, constant_y) {
        let result = [];
        let x = variable_x;

        for (let i = counter; i <= max; i++) {
          result.push(new Posn(x, constant_y));
          x += 1;
        };
        return result;
      };

      function aux_vertical (variable_y, constant_x,) {
        let result = [];
        let y = variable_y;

        for (let i = counter; i <= max; i++) {
          result.push(new Posn(constant_x, y));
          y -= 1;
        };
        return result;
      };
    };
    
    // moveDown_currentBlock :: Mutates Tetris Block Instance.
    // purpose: new position for current Block as a result of 'falling'.
    function moveDown_currentBlock () {
      tetris.block.moveDown();
    };
    
    // lowerAllAbove :: Number -> Mutates Landscape Map
    // given row, lowers all above landscape as low as possible.
    function lowerAllAbove (row) {
      let starting_level = row - 1;

      for (let i = starting_level; i >= min_y; i--) {
        lowerAll_fromRow(i);
      };
    };

    // lowerAll_fromRow :: Number -> Mutates Landscape Map
    // lowers whole given row of the landscape. 
    function lowerAll_fromRow(row) {
      
      const current_row = tetris.landscape.get(row);
      const posns = current_row.slice();
      tetris.landscape.set(row, []);

      function lower_all (level, blocks) {
        const fallingBlocks = [];
        const total_row_length = tetris.landscape.get(level).length + blocks.length; 

        if (total_row_length === sceneWidth_inBlocks) {
          tetris.landscape.set(level, []);
          lowerAllAbove(level);
        } else {
          for (let b of blocks) {
            let check_posn = new Posn (b.x, level);

            if (posn_onGround(check_posn, max_y) || posn_onLandscape(check_posn, tetris.landscape)) {
              add_posn_toLandscape(check_posn);
            } else {
              fallingBlocks.push(check_posn);
            };
          };
        };

        if (fallingBlocks.length !== 0) {
          return lower_all(level + 1, fallingBlocks);
        };
      };

      return lower_all(row, posns);
    };

    // --------------------------------------------------------------------------
    // -------------------- score handling functions: ---------------------------

    // run_scoreHandler :: NatNum -> Maybe Event
    // if score is valid for highest scores ranking, opens a form for record input.
    function run_scoreHandler(score) {
      const score_str = score.toString();

      // run request to php file:
      const xmlhttp = new XMLHttpRequest();
      xmlhttp.open("POST", "https://ferdex.eu/Tetris/valid_score_tetris.php", true);
      xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      xmlhttp.send(`s=${score_str}`);

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
      const score = tetris.points;
      const score_str = score.toString();

      // run request to php file:
      const xmlhttp = new XMLHttpRequest();
      xmlhttp.open("POST", "https://ferdex.eu/Tetris/update_records_tetris.php", true);
      xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      xmlhttp.send(`s=${score_str}&n=${name}`);

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
      const game1 = document.getElementById("btnStart")
      const game2 = document.getElementById("btnReset");
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
      const game1 = document.getElementById("btnStart")
      const game2 = document.getElementById("btnReset");
      const menu1 = document.getElementById("mb1");
      const menu2 = document.getElementById("mb2");
      const menu3 = document.getElementById("mb3");
      
      game1.disabled = false;
      game2.disabled = false;
      menu1.disabled = false;
      menu2.disabled = false;
      menu3.disabled = false;
    };

    // ----------------------------------------------------------------------------------
    // ------------------------- basic helper functions: --------------------------------

    // round_down :: Number -> NatNumber
    // given num, returns nearest Integer that is below it. 
    function round_down (num) {
      return Math.floor(num)
    };

    // random :: NatNumber -> NatNumber
    // given n, returns randomly chosen natural number from 0 inclusive, to n exclusive.
    function random (n) {
      return Math.floor(Math.random() * n) 
    };

    // ormap :: [Array-of X] [X -> Boolean] -> Boolean
    // returns true if at least one of items from array is true for given function.
    function ormap (ar, fun) {
      let base = false;

      for (let item of ar) {
        if (fun(item) === true) {
          base = true;
          break;
        };
      };
      return base;
    };

    // disabling arrows: 
    // pressing arrows cannot scroll browser window (as needed for a game).
    window.addEventListener("keydown", function(e) {
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
      }
    }, false);

    // ----------------------------------------------------------------------------------
    // --------------------------------- THE END ----------------------------------------
