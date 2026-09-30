let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X'; // 'X' or 'O'
let isGameActive = true;
let gameMode = 'pvp'; // 'pvp' or 'ai'
let aiDifficulty = 'hard'; // 'easy' or 'hard'
let scores = { X: 0, O: 0, draws: 0 };

// Winning Combinations
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]              // Diagonals
];

// Web Audio API Sound Synthesizer (Zero external audio assets required)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'win') {
        [350, 520, 700, 1050].forEach((freq, i) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.connect(g);
            g.connect(audioCtx.destination);
            o.type = 'triangle';
            o.frequency.setValueAtTime(freq, now + i * 0.08);
            g.gain.setValueAtTime(0.15, now + i * 0.08);
            g.gain.linearRampToValueAtTime(0.01, now + i * 0.08 + 0.22);
            o.start(now + i * 0.08);
            o.stop(now + i * 0.08 + 0.22);
        });
    } else if (type === 'draw') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.3);
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}

function setGameMode(mode) {
    gameMode = mode;
    const pvpBtn = document.getElementById('modePvpBtn');
    const aiBtn = document.getElementById('modeAiBtn');
    const aiPanel = document.getElementById('aiDifficultyPanel');
    const labelPlayerO = document.getElementById('labelPlayerO');

    if (mode === 'pvp') {
        pvpBtn.className = "px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-300 bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20";
        aiBtn.className = "px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-300 text-slate-400 hover:text-white";
        aiPanel.classList.add('hidden');
        labelPlayerO.innerText = "Player O";
    } else {
        aiBtn.className = "px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-300 bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20";
        pvpBtn.className = "px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-300 text-slate-400 hover:text-white";
        aiPanel.classList.remove('hidden');
        labelPlayerO.innerText = "AI Bot (O)";
    }
    resetGame();
}

function setDifficulty(diff) {
    aiDifficulty = diff;
    const easyBtn = document.getElementById('diffEasy');
    const hardBtn = document.getElementById('diffHard');
    if (diff === 'easy') {
        easyBtn.className = "px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 shadow-sm transition";
        hardBtn.className = "px-3 py-1 text-xs font-bold rounded-lg bg-slate-800 text-slate-400 hover:text-white transition";
    } else {
        hardBtn.className = "px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 shadow-sm transition";
        easyBtn.className = "px-3 py-1 text-xs font-bold rounded-lg bg-slate-800 text-slate-400 hover:text-white transition";
    }
    resetGame();
}

function handleCellClick(index) {
    if (!isGameActive || board[index] !== '') return;

    makeMove(index, currentPlayer);
    playSound('click');

    if (checkWin(currentPlayer)) {
        endGame(false);
        return;
    }

    if (checkDraw()) {
        endGame(true);
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnIndicator();

    if (gameMode === 'ai' && currentPlayer === 'O' && isGameActive) {
        setTimeout(makeAIMove, 450);
    }
}

function makeMove(index, player) {
    board[index] = player;
    const cell = document.querySelectorAll('.cell')[index];
    const contentSpan = cell.querySelector('.cell-content');
    
    contentSpan.innerText = player;
    if (player === 'X') {
        contentSpan.className = "cell-content text-cyan-400 neon-glow-cyan transform scale-100 transition-transform duration-300";
        cell.className = "cell group relative border rounded-2xl flex items-center justify-center text-5xl font-black transition-all duration-300 active:scale-95 shadow-inner cell-cyan";
    } else {
        contentSpan.className = "cell-content text-fuchsia-400 neon-glow-magenta transform scale-100 transition-transform duration-300";
        cell.className = "cell group relative border rounded-2xl flex items-center justify-center text-5xl font-black transition-all duration-300 active:scale-95 shadow-inner cell-magenta";
    }
}

function updateTurnIndicator() {
    const statusText = document.getElementById('gameStatus');
    const indicator = document.getElementById('turnIndicator');
    
    if (gameMode === 'ai' && currentPlayer === 'O') {
        statusText.innerText = "Quantum AI is calculating...";
        indicator.className = "w-3 h-3 rounded-full bg-fuchsia-500 shadow-lg shadow-fuchsia-500/50 animate-ping";
    } else {
        statusText.innerText = `Player ${currentPlayer}'s Turn`;
        indicator.className = `w-3 h-3 rounded-full ${currentPlayer === 'X' ? 'bg-cyan-400 shadow-cyan-400/50' : 'bg-fuchsia-500 shadow-fuchsia-500/50'} shadow-lg animate-ping`;
    }
}

function makeAIMove() {
    if (!isGameActive) return;

    let moveIndex;
    if (aiDifficulty === 'easy') {
        const emptyCells = board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
        moveIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else {
        moveIndex = minimax(board, 'O').index;
    }

    if (moveIndex !== undefined) {
        makeMove(moveIndex, 'O');
        playSound('click');

        if (checkWin('O')) {
            endGame(false);
            return;
        }

        if (checkDraw()) {
            endGame(true);
            return;
        }

        currentPlayer = 'X';
        updateTurnIndicator();
    }
}

function minimax(newBoard, player) {
    const availSpots = newBoard.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);

    if (checkWinningState(newBoard, 'X')) {
        return { score: -10 };
    } else if (checkWinningState(newBoard, 'O')) {
        return { score: 10 };
    } else if (availSpots.length === 0) {
        return { score: 0 };
    }

    let moves = [];
    for (let i = 0; i < availSpots.length; i++) {
        let move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === 'O') {
            let result = minimax(newBoard, 'X');
            move.score = result.score;
        } else {
            let result = minimax(newBoard, 'O');
            move.score = result.score;
        }

        newBoard[availSpots[i]] = '';
        moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
        let bestScore = -10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = 10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }

    return moves[bestMove];
}

function checkWinningState(currentBoard, player) {
    return winningConditions.some(condition => {
        return condition.every(index => currentBoard[index] === player);
    });
}

function checkWin(player) {
    return winningConditions.some(condition => {
        const hasWon = condition.every(index => board[index] === player);
        if (hasWon) {
            condition.forEach(index => {
                document.querySelectorAll('.cell')[index].classList.add('winning-cell');
            });
        }
        return hasWon;
    });
}

function checkDraw() {
    return board.every(cell => cell !== '');
}

function endGame(isDraw) {
    isGameActive = false;
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalIcon = document.getElementById('modalIcon');
    const modalIconContainer = document.getElementById('modalIconContainer');

    if (isDraw) {
        scores.draws++;
        document.getElementById('scoreDraws').innerText = scores.draws;
        playSound('draw');
        modalTitle.innerText = "Quantum Stalemate!";
        modalMessage.innerText = "The grid is locked. Equal tactical power!";
        modalIcon.className = "fa-solid fa-handshake";
        modalIconContainer.className = "w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center text-3xl shadow-inner";
    } else {
        playSound('win');
        confetti({
            particleCount: 110,
            spread: 80,
            origin: { y: 0.6 }
        });

        if (currentPlayer === 'X') {
            scores.X++;
            document.getElementById('scoreX').innerText = scores.X;
            modalTitle.innerText = "Player X Victorious!";
            modalMessage.innerText = gameMode === 'ai' ? "Incredible! You defeated the Quantum AI!" : "Player X dominated the grid!";
            modalIcon.className = "fa-solid fa-trophy";
            modalIconContainer.className = "w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-3xl shadow-inner";
        } else {
            scores.O++;
            document.getElementById('scoreO').innerText = scores.O;
            modalTitle.innerText = gameMode === 'ai' ? "Quantum AI Wins!" : "Player O Victorious!";
            modalMessage.innerText = gameMode === 'ai' ? "The neural network calculated your moves. Try again!" : "Player O dominated the grid!";
            modalIcon.className = "fa-solid fa-microchip";
            modalIconContainer.className = "w-16 h-16 mx-auto mb-4 rounded-2xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center text-3xl shadow-inner";
        }
    }

    document.getElementById('gameStatus').innerText = "Match Complete";
    document.getElementById('turnIndicator').className = "w-3 h-3 rounded-full bg-slate-600";

    setTimeout(() => {
        modal.classList.remove('opacity-0', 'pointer-events-none');
        document.getElementById('modalCard').classList.remove('scale-95');
        document.getElementById('modalCard').classList.add('scale-100');
    }, 350);
}

function closeModal() {
    const modal = document.getElementById('customModal');
    modal.classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('modalCard').classList.remove('scale-100');
    document.getElementById('modalCard').classList.add('scale-95');
    resetGame();
}

function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    isGameActive = true;
    currentPlayer = 'X';
    updateTurnIndicator();

    document.querySelectorAll('.cell').forEach(cell => {
        cell.className = "cell group relative bg-slate-950/90 hover:bg-slate-900 border border-slate-800/90 rounded-2xl flex items-center justify-center text-5xl font-black transition-all duration-300 active:scale-95 shadow-inner";
        cell.querySelector('.cell-content').innerText = '';
        cell.querySelector('.cell-content').className = "cell-content transform scale-0 transition-transform duration-300";
    });
}

function resetScores() {
    scores = { X: 0, O: 0, draws: 0 };
    document.getElementById('scoreX').innerText = '0';
    document.getElementById('scoreO').innerText = '0';
    document.getElementById('scoreDraws').innerText = '0';
    resetGame();
}
