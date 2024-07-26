// ------------ selectors for the scene: -------------
    const canvas = document.querySelector('canvas');
    const scene = canvas.getContext('2d');
    scene.textAlign = "center";

    const sceneWidth = canvas.width;
    const sceneHeight = canvas.height;
    const midWidth = round_down(sceneWidth / 2);
    const midHeight = round_down(sceneHeight / 2);

    // ----------- class for position on scene -----------
    class Posn {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      };
    };

    // ---------- setting up constants/initial values: -------------

    const snakeHead_radius = 3;
    const snakeFruit_radius = 4;
    const snakeColor = "red";
    const fruitColor = "green";
    
    const initial_timeInterval = 100;
    const timeInterval_change_ratio = 0.02;
    const distance_perMove = 2 * snakeHead_radius;
    const points_perFruit = 10;
    
    const fruit_min_posn_x = snakeFruit_radius;
    const fruit_max_posn_x = sceneWidth - snakeFruit_radius;
    const fruit_min_posn_y = snakeFruit_radius;
    const fruit_max_posn_y = sceneHeight - snakeFruit_radius;

    const initial_snakeHead = new Posn(midWidth, midHeight);
    const initial_fruitPosn = generate_fruitPosn();
    const initial_direction = "down";
    const initial_points = 0;

    // --------------initial snake object: ---------------

    const snake = {
      posns: [initial_snakeHead],          // Array of Posn
      fruit: initial_fruitPosn,            // Posn
      direction: initial_direction,        // String
      points: initial_points,              // Number
      gameState: false,                    // Boolean

      // ------- methods: --------
      snakeHead_Posn() {
        return this.posns[0];
      },

      removeTail() {
        this.posns.pop();
      },

      generate_NewFruit() {
        this.fruit = generate_fruitPosn();
      },

      changeDirection (newDirection) {
        this.direction = newDirection;
      },
 
      addPoint() {
        this.points += points_perFruit;
      },
    };

    // ----------- Constructing timeInterval object: ----------------
    // Purpose: ability to start, stop and modify Interval during runtime.

    function timeInterval(fun, time) {
      this.fun = fun;
      this.time = time;
      this.interval = null;
      this.isRunning = false;

      this.startInterval = function () {
        this.interval = setInterval(this.fun, this.time);
        this.isRunning = true;
      };

      this.stopInterval = function () {
        clearInterval(this.interval);
        this.interval = null;
        this.isRunning = false;
      };

      this.setTime = function (ms) {
        this.time = ms;
      };
    };
    
    // ------------------------------------------------------------
    // ------------------ main variables/selectors: ---------------

    // ------ rendering initial scene: -----
    render_SnakeGame();

    // ------ time interval: ---------------
    let current_timeInterval = initial_timeInterval;
    const gameInterval = new timeInterval(nextMove, current_timeInterval);

    // ------ button selectors: ------------
    const buttonStart = document.getElementById('btnStart');
    buttonStart.addEventListener('click', startGame);

    const buttonReset = document.getElementById('btnReset');
    buttonReset.addEventListener('click', resetGame);
    
    // ------ on-key selector: -------------
    document.addEventListener("keydown", changeDirection);

    //------------------------------------------------------------
    //--------------- main functions: -----------------------------
  
    // startGame
    // purpose: resets gameInterval to initial value and starts game
    // by initializing initial interval.
    function startGame() {    
      if (game_is_off()) {
      gameInterval.setTime(initial_timeInterval);
      gameInterval.startInterval();
      snake.gameState = true;
      };  
    };

    // resetGame
    // purpose: Stops gameInterval, resets game to its initial settings,
    // and renders initial game state.
    function resetGame() {
      gameInterval.stopInterval();
      reset_to_InitialSettings();
      updateScene();
    };
    
    // render_SnakeGame :: -> Image
    // renders Snake Object on scene.
    function render_SnakeGame () {

      renderSnake(snake.posns);
      renderFruit(snake.fruit);
      renderScore(snake.points);    
    };

    // nextMove :: Snake -> Mutates Snake Object
    // returns next move of the given snake and renders it on the scene.
    // If next move is illegal, ends the game.
    function nextMove() {

      if (gameEnding_move(snake)) {
        gameInterval.stopInterval();
        render_gameOver();
        run_scoreHandler(snake.points);

      } else if (snake_eatsFruit(snake.snakeHead_Posn(), snake.fruit)) {       
        move_Forward();
        snake.generate_NewFruit();
        snake.addPoint();
        updateInterval();
        updateScene();

      } else {
        move_Forward();
        snake.removeTail();
        updateScene();
      };
    };

    // --------------------------------------------------------------------------
    // ----------------- main conditional functions: ----------------------------

    // gameEnding_move :: Snake -> Boolean
    // given snake, returns true if current state is a game ending one.
    // either snake touches the border or eats its own tail.
    function gameEnding_move(s) {
      const head = s.snakeHead_Posn();
      const radius = snakeHead_radius;

      return out_ofScene(head, radius, sceneWidth, sceneHeight) || (eats_Itself(s.posns));
    };

    // out_ofScene :: Posn Number Number -> Boolean
    // given posn, snake radius and scene dimensions, 
    // returns true if is too close/out of the scene. 
    function out_ofScene (pos, radius, width, height) {

      const acceptable_margin = radius - 1;
      const x = pos.x;
      const y = pos.y;
      const left_border_margin = acceptable_margin;
      const right_border_margin = width - acceptable_margin;
      const upper_border_margin = acceptable_margin;
      const lower_border_margin = height - acceptable_margin;

      return (x < left_border_margin) || (x > right_border_margin) ||
            (y < upper_border_margin) || (y > lower_border_margin);
    };

    // eats_Itself :: [Array of Posn] -> Boolean
    // reutrns true if the snake head comes too close to the rest of the body.
    function eats_Itself (posns) {
      const head = posns[0];
      const rest = posns.slice(1);
      const closeness_factor = snakeHead_radius;

      return ormap(rest, (p) => too_close(p, head, closeness_factor));
    };

    // snake_eatsFruit :: Posn Posn -> Boolean
    // returns true if the snake head comes close enough to fruit to 'eat' it.
    function snake_eatsFruit(head, fruit) {
      const closeness_factor = snakeHead_radius + snakeFruit_radius;
      
      return too_close(head, fruit, closeness_factor);
    };

    // is_gameOff :: -> Boolean
    // returns true if the the game is off.
    function game_is_off () {
      return gameInterval.isRunning === false && snake.gameState === false;
    };

    // --------------------------------------------------------------------------
    // ---------------------- rendering functions: ------------------------------

    // renderSnake :: [Array-of Posn] -> Image
    // given posns, returns snake on scene.
    function renderSnake (posns) {
      for (let p of posns) {
        scene.beginPath();
        scene.fillStyle = snakeColor;
        scene.arc(p.x, p.y, snakeHead_radius, 0, 2 * Math.PI);
        scene.fill();
      };
    };

    // renderFruit :: Posn -> Image
    // given posn of fruit, returns its image on scene.
    function renderFruit (p) {
      scene.beginPath();
      scene.fillStyle = fruitColor;
      scene.arc(p.x, p.y, snakeFruit_radius, 0, 2 * Math.PI)
      scene.fill();
    };

    // renderScore :: NatNum -> Image
    // given points, returns score display above scene.
    function renderScore (points) {
      const p_string = points.toString();
      
      const display = document.getElementById("score_display");
      display.innerHTML = p_string;
    };

    // clearScene :: -> Image
    // clears scene of any drawings on it.
    function clearScene() {
      scene.clearRect(0,0, sceneWidth, sceneHeight);
    };

    // updateScene :: -> Image
    // clears current scene and renders current state of snake game on it.
    function updateScene() {
      clearScene();
      render_SnakeGame();
    };

    // render_gameOver :: -> Image
    // returns gameover message on a snake scene.
    function render_gameOver () {
      const msg_sceneSize_ratio = 0.1;
      const msg_size = round_down(sceneHeight * msg_sceneSize_ratio); 
      const size = `${msg_size}px`;
      const font = "Courier New";
      
      const text = "GAME OVER";
      const x = midWidth;
      const y = midHeight;

      scene.font = `${size} ${font}`;
      scene.strokeText(text, x, y);
    };

    //---------------------------------------------------------------------------
    //--------------------- main aux functions: ---------------------------------

    // move_Forward :: -> Mutates Snake Object
    // returns Snake object with the new head position (next move).  
    function move_Forward() {
      
      let dir = snake.direction;
      let current_headPosn = snake.snakeHead_Posn();
      let current_headX = current_headPosn.x;
      let current_headY = current_headPosn.y;
      
      if (dir === "down") {
        snake.posns.unshift(new Posn(current_headX, current_headY + distance_perMove));
      } else if (dir === "up") {
        snake.posns.unshift(new Posn(current_headX, current_headY - distance_perMove));
      } else if (dir === "left") {
        snake.posns.unshift(new Posn(current_headX - distance_perMove, current_headY));
      } else if (dir === "right") {
        snake.posns.unshift(new Posn(current_headX + distance_perMove, current_headY));
      };
    };

    // changeDirection :: Event -> Mutates Snake Object 
    // purpose: changing the value of Snake Object "direction" property, if legal.
    // note: Snake cannot go to the opposite direction. 
    function changeDirection (event) {
      const keyName = event.key;
      const current_dir = snake.direction;

      if (keyName === "ArrowDown" && current_dir !== "up") {snake.direction = "down"};
      if (keyName === "ArrowUp" && current_dir !== "down") {snake.direction = "up"};
      if (keyName === "ArrowLeft" && current_dir !== "right") {snake.direction = "left"};
      if (keyName === "ArrowRight" && current_dir !== "left") {snake.direction = "right"};
    };

    // updateInterval :: -> Mutates GameInterval Object
    // updates delay value og GameInterval Object and reruns it.
    function updateInterval() {
      current_timeInterval -= (current_timeInterval * timeInterval_change_ratio);
      gameInterval.stopInterval();
      gameInterval.setTime(current_timeInterval);
      gameInterval.startInterval();
    };

    // reset_to_InitialSettings :: Mutates Snake and GameInterval Objects.
    // resets Snake Object properties and time interval to initial values.
    function reset_to_InitialSettings() {
        snake.posns = [initial_snakeHead];          
        snake.fruit = initial_fruitPosn;        
        snake.direction = initial_direction;       
        snake.points = initial_points;
        snake.gameState = false;

        current_timeInterval = initial_timeInterval;
    };

    // generate_fruitPosn :: -> Posn
    // returns randomly chosen legal Posn on scene, for a fruit to be placed.
    function generate_fruitPosn() {
      const min_x = fruit_min_posn_x;
      const max_x = fruit_max_posn_x;
      const min_y = fruit_min_posn_y;
      const max_y = fruit_max_posn_y;

      return new Posn (random_range(min_x, max_x), random_range(min_y, max_y)); 
    };

    // --------------------------------------------------------------------------
    // -------------------- score handling functions: ---------------------------

    // run_scoreHandler :: NatNum -> Maybe Event
    // if score is valid for highest scores ranking, opens a form for record input.
    function run_scoreHandler(score) {
      const score_str = score.toString();

      // run request to php file:
      const xmlhttp = new XMLHttpRequest();
      xmlhttp.open("POST", "https://ferdex.eu/Snake/valid_score_snake.php", true);
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
      const score = snake.points;
      const score_str = score.toString();

      // run request to php file:
      const xmlhttp = new XMLHttpRequest();
      xmlhttp.open("POST", "https://ferdex.eu/Snake/update_records_snake.php", true);
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

    // ------------------------------------------------------------------------
    // -------------------- basic helper functions: ---------------------------

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

    // random_range :: NatNumber NatNumber -> NatNumber
    // given min and max, returns random number from that range, both inclusive.
    function random_range (min, max) {
      const temp_range = (max - min) + 1;
      const adder = min;

      const temp_result = random(temp_range);
      const result = temp_result + adder;
      return result;
    };

    // too_close :: Posn Posn -> Boolean
    // returns true if one Posn is 'too close' by given factor. 
    function too_close(p1, p2, factor) {  
      const x1 = p1.x;
      const y1 = p1.y;
      const x2 = p2.x;
      const y2 = p2.y;

      return (x1 > (x2 - factor)) && (x1 < (x2 + factor)) &&
             (y1 > (y2 - factor)) && (y1 < (y2 + factor));  
    };

    // ormap :: [Array-of X] [X -> Boolean] -> Boolean
    // returns true if at least one of items from array is true for given function.
    function ormap (ar, f) {
      let base = false;

      for (let item of ar) {
        if (f(item) === true) {
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
    }, false)
// ------------------------ THE END ---------------------------
