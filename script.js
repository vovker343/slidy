const puzzleContainer = document.querySelector("#puzzle-container");

let solve = false;
let firstMoveTime = 0;
let currentMoveCount = 0;
let timer;
let solves = [];

class Puzzle {
    constructor(w = 4, h = 4) {
        this.width = w;
        this.height = h;
        this.state = [];
        for (let i = 1; i < w*h; i++) {
            this.state.push(i);
        }
        this.state.push(0);
    }
    draw() {
        puzzleContainer.innerHTML = ``;
        let colors = Fringe(this);
        let puzzleWidth = parseFloat((319.7/this.width).toFixed(1));
        let puzzleHeight = puzzleWidth;
        let fontSize = (puzzleHeight/32).toFixed(2);
        for (const i of this.state) {
            let el = document.createElement("div");
            if (i === 0) {
                el.className = "blank";
                el.id = "blank";
                el.style.backgroundColor = "transparent";
                el.style.width = `${puzzleWidth}px`;
                el.style.height = el.style.width;
                puzzleContainer.appendChild(el);
            } else {
                el.className = "piece";
                el.id = `piece-${i}`;
                el.style.backgroundColor = `hsl(${colors[i-1][0]}, ${colors[i-1][1]}%, ${colors[i-1][2]}%)`
                el.style.width = `${puzzleWidth}px`;
                el.style.height = el.style.width;
                el.style.lineHeight = el.style.width;
                el.style.fontSize = fontSize+"rem";
                el.appendChild(document.createTextNode(i));
                puzzleContainer.appendChild(el);
            }
        }
        puzzleContainer.style.width = (puzzleWidth+1)*this.width;
        puzzleContainer.style.height = (puzzleHeight+1)*this.height;
    }
    doMove(move) {
        const moveDir = move.match(/[a-z]/i)[0];
        let moveVal = parseInt(move.match(/\d+/g));
        moveVal = moveVal ? moveVal : 1;
        for (let i = 0; i < moveVal; i++) {
            const zeroIndex = this.state.findIndex((n) => n===0);
            switch (moveDir) {
                case "R":
                    if (zeroIndex % this.width > 0) {
                        swap(this.state, zeroIndex, zeroIndex - 1); 
                        swapHtmlReal(zeroIndex, zeroIndex-1);
                        continue
                    }
                case "L":
                    if (zeroIndex % this.width < this.width - 1) {
                        swap(this.state, zeroIndex, zeroIndex + 1); 
                        swapHtmlReal(zeroIndex, zeroIndex+1);
                        continue
                    }
                case "U":
                    if (zeroIndex / this.width <= this.height - 1) {
                        swap(this.state, zeroIndex, zeroIndex + this.width); 
                        swapHtmlReal(zeroIndex, zeroIndex+this.width);
                        continue
                    }
                case "D":
                    if (zeroIndex / this.width >= 1) {
                        swap(this.state, zeroIndex, zeroIndex - this.width); 
                        swapHtmlReal(zeroIndex, zeroIndex-this.width);
                        continue
                    }
            }
        }
    }
    doMoves(moves) {
        moves = parseMoves(moves);
        for (const i of moves) {
            this.doMove(i);
        }
        return this;
    }
    randomShuffle() {
        const a = this.width;
        const b = this.height;
        let parity = false;
        const initial_state = this.solvedState();
        for (let i = 0; i < a*b-1; i++) {
            const j = Math.floor(Math.random()*(a*b-1));
            if (j === i) { continue; }
            swap(initial_state, j, i);
            parity = !parity;
        }
        if (parity) {
            swap(initial_state, a*b-2, a*b-3);
        }
        const d_moves = Math.floor(Math.random()*b);
        const r_moves = Math.floor(Math.random()*a);
        for (let i = 0; i < d_moves; i++) {
            const zeroIndex = initial_state.findIndex(i => i === 0);
            swap(initial_state, zeroIndex, zeroIndex - a);
        }
        for (let i = 0; i < r_moves; i++) {
            const zeroIndex = initial_state.findIndex(i => i === 0);
            swap(initial_state, zeroIndex, zeroIndex - 1);
        }
        this.state = initial_state;
        return this;
    }
    solvedState() {
        let a = this.state.slice();
        let c = a.sort((a,b) =>a-b);
        c.push(c.shift());
        return c;
    }
}
const swap = (arr,a,b) => {
    const temp = arr[a];
    arr[a] = arr[b];
    arr[b] = temp;
}
const parseMoves = (moves) => {
    let moveArr = [];
    let currMove = moves.slice(0,1);
    for (const i of moves.slice(1)) {
        if ((/\d/).test(i)) {
            currMove+=i;
        } else if ((/[a-z]/i).test(i)) {
            moveArr.push(currMove);
            currMove = i;
        }
    }
    moveArr.push(currMove);
    return moveArr;
}

const swapHtmlReal = (i,z) => {
    let children = puzzleContainer.childNodes;
    let elem_i = children[i].cloneNode(true);
    let elem_z = children[z].cloneNode(true);
    puzzleContainer.removeChild(children[i]);
    puzzleContainer.insertBefore(elem_z, children[i]);
    puzzleContainer.removeChild(children[z]);
    puzzleContainer.insertBefore(elem_i, children[z]);
}

const swapHtml = (puz, i, z) => {
    let gap = i-z;
    let gapSign = Math.sign(gap);
    gap = Math.abs(gap);
    let moveValue = gap < puz.width ? gap : parseInt(gap / puz.width);
    if (gap < puz.width) {
        if (gapSign < 0) {
            puz.doMove(`R${moveValue}`);
        } else {
            puz.doMove(`L${moveValue}`);
        }
    } else {
        if (gapSign < 0) {
            puz.doMove(`D${moveValue}`);
        } else {
            puz.doMove(`U${moveValue}`);
        }
    }
    updateTiles(puz);
    return moveValue;
}
/* to be fixed - can hover over the tiles that aren't supposed to be enabled */
const updateTiles = (puz) => {
    const puzzlePieces = document.querySelectorAll(".piece, .blank");
    let lastIndex;
    puzzlePieces.forEach((node, index) => {
        let zeroIndex = puz.state.findIndex(n => n===0);
        const check = [
            (index - zeroIndex) % puz.width === 0,
            Math.floor(index / puz.width) === Math.floor(zeroIndex / puz.width)
        ].some(n => n && index !== zeroIndex);
        if (!check) {
            node.removeEventListener("mouseenter", handleMove, true);
        } else {
            node.addEventListener("mouseenter", handleMove, true);
        }
    })
}
const handleMove = async (e) => {
    let zeroIndex = puzzle.state.findIndex(n => n === 0);
    const nth = [...puzzleContainer.children].findIndex(val => val.id === e.target.id);
    let m = swapHtml(puzzle, nth, zeroIndex);
    if (solve) {
        if (!currentMoveCount) {
            firstMoveTime = new Date();
        }
        currentMoveCount += m;
        timer = timer ? timer : setInterval(updateTimeTps, 50);
        updateMoves(currentMoveCount);
        if (isSolved()) {
            updateTimeTps();
            const finalTime = parseFloat(parseFloat(document.querySelector("#single-time").textContent).toFixed(3));
            const finalMvc = currentMoveCount;
            stopSolve();
            solves.push([finalTime, finalMvc, parseFloat((finalMvc/finalTime).toFixed(3))])
            updateAverages();
        }
    }
}
const isSolved = () => {
    const sol = puzzle.solvedState();
    let a = sol.map((index) => puzzle.state[index] === sol[index]);
    if (a.every(n=>n)) {
        return true;
    }
    return false;
}
const updateTimeTps = async () => {
    const newTime = new Date() - firstMoveTime;
    document.querySelector("#single-time").textContent = ((newTime)/1000).toFixed(3);
    document.querySelector("#single-tps").textContent = (1000*currentMoveCount/(newTime)).toFixed(3);
}
const updateMoves = (m) => {
    document.querySelector("#single-moves").textContent = m;
}

const updateAverages = () => {
    for (const i of [5, 12, 50, 100]) {
        if (solves.length >= i) {
            let avg = calcAverage(solves.slice(-i));
            document.querySelector(`.avg${i}.time`).textContent = avg[0];
            document.querySelector(`.avg${i}.moves`).textContent = avg[1];
            document.querySelector(`.avg${i}.tps`).textContent = avg[2];
        } else {
            document.querySelector(`.avg${i}.time`).textContent = "";
            document.querySelector(`.avg${i}.moves`).textContent = "";
            document.querySelector(`.avg${i}.tps`).textContent = "";
        }
    }
}

const calcAverage = (solves) => {
    let solvesToRemove = Math.ceil(solves.length*0.05);
    let average = [];
    for (let j = 0; j < 3; j++) {
        let newSolves = solves.map(el => el[j]);
        for (let i = 0; i < solvesToRemove; i++) {
            const maxInd = newSolves.findIndex(i => i === Math.max(...newSolves));
            newSolves.splice(maxInd,1);
            const minInd = newSolves.findIndex(i => i === Math.min(...newSolves));
            newSolves.splice(minInd,1);
        }
        average.push(parseFloat((sum(newSolves)/newSolves.length).toFixed(3)));
    }
    return average;
}

const sum = (arr) => arr.reduce((a,b) => a+b, 0);

const initSolve = () => {
    puzzle.randomShuffle();
    puzzle.draw();
    resetStats();
    solve = true;
    updateTiles(puzzle);
}
const stopSolve = () => {
    puzzle.state = puzzle.solvedState();
    puzzle.draw();
    solve = false;
    updateTiles(puzzle);
    clearInterval(timer);
    timer = 0;
}

let puzzle = new Puzzle();
document.addEventListener("keydown", (e) => {
    if (e.key === " " && !solve) { 
        initSolve(); 
    }
    if (e.key === "Escape") { 
        if (!isSolved(puzzle)) {
            solves = [];
        }
        stopSolve();
        resetStats();
        updateAverages();
    }
    if (e.key === "=" || e.key === "+") {
        if (solve) { return; }
        solves = [];
        resetStats();
        puzzle = new Puzzle(Math.min(puzzle.width+1, 10), Math.min(puzzle.height+1, 10));
        puzzle.draw();
        updateTiles(puzzle);
    }
    if (e.key === "-") {
        if (solve) { return; }
        solves = [];
        resetStats();
        puzzle = new Puzzle(Math.max(puzzle.width-1, 3), Math.max(puzzle.width-1, 3));
        puzzle.draw();
        updateTiles(puzzle);
    }
}, true)
window.onload = () => {
    puzzle.draw();
    updateTiles(puzzle);
}
const resetStats = () => {
    document.querySelector("#single-time").textContent = "0.000"
    document.querySelector("#single-tps").textContent = "0.000";
    document.querySelector("#single-moves").textContent = "0";
    currentMoveCount = 0;
    clearInterval(timer);
    firstMoveTime = 0;
    timer = 0;
}
const Fringe = (puzzle) => {
    let colorArr = {};
    let isVertical = false;
    const colors = evenlySpacedColors(puzzle.width+puzzle.height-1);
    let wh = [0,0];
    while (wh[0] < puzzle.width || wh[1] < puzzle.height) {
        if (!isVertical) {
            let w = wh[0];
            while (w < puzzle.width) {
                colorArr[wh[1]*puzzle.width+w] = colors[wh[0]+wh[1]];
                w++;
            }
            wh[1]++;
        } else {
            let h = wh[1];
            while (h < puzzle.height) {
                colorArr[wh[0]+h*puzzle.width] = colors[wh[0]+wh[1]];
                h++;
            }
            wh[0]++;
        }
        isVertical = !isVertical;
    }
    colorArr[puzzle.width * puzzle.height] = undefined;
    return colorArr;
}

const lum = (hue) => (0.5 + (0.25 * Math.cos(2*Math.PI*(0.65 + hue/720)) + 0.35 * Math.exp(-hue/100)))*100;
const evenlySpacedColors = (n) => {
    color1 = [0,1,lum(0)];
    color2 = [330,1,lum(330)];
    let arr = [];
    const diffHue = (color2[0] - color1[0])/(n-1);
    for (let i = 0; i < n; i++) {
        const currHue = i*diffHue+color1[0];
        arr.push([currHue, 100, lum(currHue)].map(n => parseFloat(n.toFixed(2))));
    }
    return arr;
}