import openAiController from './openAIController';
import './style.css'

openAiController.initOpenAi();

export let cells = document.querySelectorAll("#tic-tact-toe-grid .cell");

let currentPlayer = 1;
let canPlay = true;

cells.forEach(cell => {
	cell.addEventListener('click', ()=>{
		if(!cell.classList.contains("cell-played") && canPlay && currentPlayer == 1){
			playerChoosedCell(cell);
		}
	})
});

export async function playerChoosedCell(cellElement){
	cellElement.classList.add("cell-played");
	cellElement.classList.add("played-" + currentPlayer);
	
	let wonState = await checkWinner();

	if(wonState == true) {
		openAiController.sendMessage("La partie est terminé.");
		return
	};

	checkIfIsFull();

	if(currentPlayer == 1) {
		currentPlayer = 2;
		let message = "à toi de jouer.";
		openAiController.sendMessage(message);
	}
	else currentPlayer = 1;
}



function resetGame(){
	cells.forEach(cell => {
		cell.classList.remove("loose-cell");
		cell.classList.remove("won-cell");
		cell.classList.remove("cell-played");
		cell.classList.remove("played-1");
		cell.classList.remove("played-2");
	});
}

function checkIfIsFull(){
	for (let i = 0; i < cells.length; i++) {
		const cell = cells[i];

		if(!cell.classList.contains("cell-played")){
			return;
		}
	}

	// is full, reset game
	resetGame();
}


async function checkWinner() {
    const winCombinations = [
        [0, 1, 2], // Ligne 1
        [3, 4, 5], // Ligne 2
        [6, 7, 8], // Ligne 3
        [0, 3, 6], // Colonne 1
        [1, 4, 7], // Colonne 2
        [2, 5, 8], // Colonne 3
        [0, 4, 8], // Diagonale 1
        [2, 4, 6]  // Diagonale 2
    ];

    for (let combination of winCombinations) {
        const [a, b, c] = combination;

        const cellA = document.getElementById(`cell-${a}`);
        const cellB = document.getElementById(`cell-${b}`);
        const cellC = document.getElementById(`cell-${c}`);

		let winnerPlayer;
		let wonCombinationFound;
		console.log('--------------------- =')

		if(cellA.classList.contains("cell-played") && cellB.classList.contains("cell-played") && cellC.classList.contains("cell-played")){
			cellA.classList.contains("played-1") ? winnerPlayer = "1" : winnerPlayer = "2";

			if(cellB.classList.contains("played-1") && winnerPlayer == 2 || cellB.classList.contains("played-2") && winnerPlayer == 1){
				// vérifier le joueur de la cellule est différent de la cellule
				continue; // saute l'itération
			}
			console.log('winnerPlayer =', winnerPlayer)

			if(cellC.classList.contains("played-1") && winnerPlayer == 2 || cellC.classList.contains("played-2") && winnerPlayer == 1){
				// vérifier le joueur de la cellule est différent de la cellule
				continue; // saute l'itération
			}

			wonCombinationFound = true;
		}

		if(wonCombinationFound){
			// display winner
			cells.forEach(cell => {
				cellA.classList.add("loose-cell");
			});

			cellA.classList.remove("loose-cell");
			cellA.classList.add("won-cell");

			cellB.classList.remove("loose-cell");
			cellB.classList.add("won-cell");

			cellC.classList.remove("loose-cell");
			cellC.classList.add("won-cell");

			setTimeout(()=>{
				resetGame();
			}, 2000)
			
			return true;
		}
    }

    return false;
}
