let mainFrame = document.getElementById('main__frame');
let ctx = mainFrame.getContext("2d");
let infoFrame = document.getElementById("info__frame");
let ctxInfo = infoFrame.getContext("2d");
let grid = 20;
let isPause = false;

function pause() {
    let button = document.getElementById('pause');
    isPause = !isPause;
    if(isPause){
        rAF = requestAnimationFrame(loop);
        button.innerText = 'PAUSE';
    } else {
        cancelAnimationFrame(rAF);
        button.innerText = 'RESUME';
    }
    
}

//Последовательность фигур
var tetrominoSequence = [];

//Игровое поле
var playfield = [];

//Заполняем игровое поле "0"
for (let row = -2; row < 20; row++) {
    playfield[row] = [];
    for (let col = 0; col < 10; col++) {
        playfield[row][col] = 0;
    }
}

//Переменная с фигурами
const figures = {
    'I': [
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
    ],
    'J': [
        [1,0,0],
        [1,1,1],
        [0,0,0],
      ],
      'L': [
        [0,0,1],
        [1,1,1],
        [0,0,0],
      ],
      'O': [
        [1,1],
        [1,1],
      ],
      'S': [
        [0,1,1],
        [1,1,0],
        [0,0,0],
      ],
      'Z': [
        [1,1,0],
        [0,1,1],
        [0,0,0],
      ],
      'T': [
        [0,1,0],
        [1,1,1],
        [0,0,0],
      ]
};

//Цвета для фигур:
const colors = {
    'I': '#0099aa',
    'O': '#ff7700',
    'T': '#6d0064',
    'S': '#008855',
    'Z': '#bb2200',
    'J': '#0022bb',
    'L': '#bbbb00'
}

//Счетчик кадров
let count = 0;

//Текущая фигура
let tetromino = getNextTetromino();

// следим за кадрами анимации, чтобы если что — остановить игру
let rAF = null;  

//Флаг GameOver
let gameOver = false;

// Функция возвращает случайное число в заданном диапазоне
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
  
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Генерация последовательности фигур
function generateSequence() {
    // тут — сами фигуры
    const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    for (let i = 0; i < 7; i++){
        const rand = getRandomInt(0, 6);
        tetrominoSequence.push(sequence[rand]);
    }
}

//Получение следующей фигуры
function getNextTetromino() {
    // если следующей нет — генерируем
    if (tetrominoSequence.length === 0) {
        generateSequence();
    }
    // берём первую фигуру из массива
    const name = tetrominoSequence.pop();
    //Создаем матрицу новой фигуры
    
    let tmp = figures[name];
    for(let i = 0; i < getRandomInt(0,4); i++){
        tmp = rotate(tmp);
    }
    const matrix = tmp;
    
    // Задаем стартовую колонку: I и O стартуют с середины, остальные — чуть левее
    const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
    // I начинает с 21 строки (смещение -1), а все остальные — со строки 22 (смещение -2)
    const row = name === 'I' ? -1 : -2;

    // вот что возвращает функция 
    return {
        name: name,      // название фигуры (L, O, и т.д.)
        matrix: matrix,  // матрица с фигурой
        row: row,        // текущая строка (фигуры стартую за видимой областью холста)
        col: col         // текущий столбец
    };
}

// поворачиваем матрицу на 90 градусов
function rotate(matrix) {
    const N = matrix.length - 1;
    const result = matrix.map((row, i) =>
      row.map((val, j) => matrix[N - j][i])
    );
    // на входе матрица, и на выходе тоже отдаём матрицу
    return result;
}

function isValidMove(matrix, cellRow, cellCol) {
    // проверяем все строки и столбцы
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col] && (
                // если выходит за границы поля…
                cellCol + col < 0 ||
                cellCol + col >= playfield[0].length ||
                cellRow + row >= playfield.length ||
                // …или пересекается с другими фигурами
                playfield[cellRow + row][cellCol + col])
            ) {
                // то возвращаем, что нет, так не пойдёт
                return false;
            }
        }
    }
    // а если мы дошли до этого момента и не закончили раньше — то всё в порядке
    return true;
}

// когда фигура окончательна встала на своё место
function placeTetromino() {
    // обрабатываем все строки и столбцы в игровом поле
    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {
  
          // если край фигуры после установки вылезает за границы поля, то игра закончилась
          if (tetromino.row + row < 0) {
            return showGameOver();
          }
          // если всё в порядке, то записываем в массив игрового поля нашу фигуру
          playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
        }
      } 
    }
  
    // проверяем, чтобы заполненные ряды очистились снизу вверх
    for (let row = playfield.length - 1; row >= 0; ) {
      // если ряд заполнен
      if (playfield[row].every(cell => !!cell)) {
  
        // очищаем его и опускаем всё вниз на одну клетку
        for (let r = row; r >= 0; r--) {
          for (let c = 0; c < playfield[r].length; c++) {
            playfield[r][c] = playfield[r-1][c];
          }
        }
      }
      else {
        // переходим к следующему ряду
        row--;
      }
    }
    // получаем следующую фигуру
    tetromino = getNextTetromino();
    //Обновляем экран с информацией
}

  // показываем надпись Game Over
function showGameOver() {
    // прекращаем всю анимацию игры
    cancelAnimationFrame(rAF);
    // ставим флаг окончания
    gameOver = true;
    // рисуем чёрный прямоугольник посередине поля
    ctx.fillStyle = 'black';
    ctx.globalAlpha = 0.75;
    ctx.fillRect(0, mainFrame.height / 2 - 30, mainFrame.width, 60);
    // пишем надпись белым моноширинным шрифтом по центру
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'white';
    ctx.font = 'Press Start 2P';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER!', mainFrame.width / 2, mainFrame.height / 2);
}

// главный цикл игры
function loop() {
    // начинаем анимацию
    rAF = requestAnimationFrame(loop);
    // очищаем холст
    ctx.clearRect(0,0,mainFrame.width,mainFrame.height);
    drawBG(ctx);

    // рисуем игровое поле с учётом заполненных фигур
    for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
            if (playfield[row][col]) {
                const name = playfield[row][col];
                ctx.fillStyle = colors[name];
                // рисуем всё на один пиксель меньше, чтобы получился эффект «в клетку»
                ctx.fillRect(col * grid, row * grid, grid-1, grid-1);
            }
        }
    }

    // рисуем текущую фигуру
  if (tetromino) {

    // фигура сдвигается вниз каждые 35 кадров
    if (++count > 35) {
      tetromino.row++;
      count = 0;

      // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
      if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
        tetromino.row--;
        placeTetromino();
      }
    }

    // не забываем про цвет текущей фигуры
    ctx.fillStyle = colors[tetromino.name];

    // отрисовываем её
    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {

          // и снова рисуем на один пиксель меньше
          ctx.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid-1, grid-1);
        }
      }
    }
  }
  infoUpdate();
}

// следим за нажатиями на клавиши
document.addEventListener('keydown', function(e) {
    // если игра закончилась — сразу выходим
    if (gameOver) return;
    if(!isPause) return;
  
    // стрелки влево и вправо
    if (e.which === 37 || e.which === 39) {
      const col = e.which === 37
        // если влево, то уменьшаем индекс в столбце, если вправо — увеличиваем
        ? tetromino.col - 1
        : tetromino.col + 1;
  
      // если так ходить можно, то запоминаем текущее положение 
      if (isValidMove(tetromino.matrix, tetromino.row, col)) {
        tetromino.col = col;
      }
    }
  
    // стрелка вверх — поворот
    if (e.which === 38) {
      // поворачиваем фигуру на 90 градусов
      const matrix = rotate(tetromino.matrix);
      // если так ходить можно — запоминаем
      if (isValidMove(matrix, tetromino.row, tetromino.col)) {
        tetromino.matrix = matrix;
      }
    }
  
    // стрелка вниз — ускорить падение
    if(e.which === 40) {
      // смещаем фигуру на строку вниз
      const row = tetromino.row + 1;
      // если опускаться больше некуда — запоминаем новое положение
      if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
        tetromino.row = row - 1;
        // ставим на место и смотрим на заполненные ряды
        placeTetromino();
        return;
      }
      // запоминаем строку, куда стала фигура
      tetromino.row = row;
    }
  });
  

function drawBG(context) {
    for(let x = 0; x < mainFrame.width; x += 20){
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, mainFrame.height);
        context.setLineDash([2, 2]);
        context.strokeStyle = '#55004e';
        context.stroke();
    }

    for(let y = 0; y < mainFrame.height; y += 20){
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(mainFrame.width, y);
        context.setLineDash([2, 2]);
        context.strokeStyle = '#55004e';
        context.stroke();
    }
}

function infoUpdate() {
    // если следующей нет — генерируем
    if (tetrominoSequence.length === 0) {
        generateSequence();
    }
    ctxInfo.clearRect(0, 0, 80, 80);
    drawBG(ctxInfo);
    let name = tetrominoSequence[tetrominoSequence.length-1];
    const next = figures[name];
    for (let row = 0; row < next.length; row++) {
        for (let col = 0; col < next[row].length; col++) {
            if (next[row][col]) {
                ctxInfo.fillStyle = colors[name];
                ctxInfo.fillRect((name == 'I' ? col : col + 1) * grid, (row+1) * grid, grid-1, grid-1); //Написать тернарный оператор для палки
            }
        }
    }
}
  // старт игры
 // rAF = requestAnimationFrame(loop);


