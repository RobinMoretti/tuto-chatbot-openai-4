import OpenAI from "openai";
import { cells, playerChoosedCell } from "./main";

let openAiController = {}
let loader = document.querySelector(".loader")

openAiController.initOpenAi = async function() {
    openAiController.openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_KEY, 
        dangerouslyAllowBrowser: true,
    });

    openAiController.assistant = await getAssistantById(import.meta.env.VITE_ASSISTANT_ID);

    openAiController.thread = await openAiController.openai.beta.threads.create();

    openAiController.messageContainer = document.getElementById("message-container");
    console.log('openAiController.messageContainer =', openAiController.messageContainer)

    let firstPrompt = "En attendant que je commence, lance la conversation sans jouer.";

    openAiController.sendMessage(firstPrompt);
    console.log("openai initiated");
}

async function getAssistantById(assistantId) {
    const myAssistant = await openAiController.openai.beta.assistants.retrieve(assistantId);
    return myAssistant;
}

openAiController.sendMessage = async function(message) {
    loader.classList.add("visible");
    openAiController.messageContainer.innerHTML = "";
    
    message += "État de la grille : " + getJsonGridState();

    await openAiController.openai.beta.threads.messages.create(
        openAiController.thread.id,
        {
            role: "user", // Rôle de l'utilisateur pour la conversation
            content: message // Contenu du message envoyé
        }
    );

    // Lancer un stream pour recevoir des réponses
    let stream = openAiController.openai.beta.threads.runs.stream(
        openAiController.thread.id, {
            assistant_id: openAiController.assistant.id,
        });

    // Observe le stream pour gérer les événements qui surviennent durant la génération de la réponse
    observeStream(stream);

    console.log("message sending");
}

// Fonction pour observer le stream et traiter les événements en cours
function observeStream(stream) {
    stream
        .on('textCreated', (textDelta) => { 
            loader.classList.remove("visible");
        })
        .on('textDelta', (textDelta) => { 
            openAiController.messageContainer.innerHTML += textDelta.value || ''; 
        })
        .on("end", () => { // Lorsque le stream se termine
            const currentRun = stream.currentRun(); // Récupère le run actuel

            // Vérifie si une action est requise, notamment la soumission d'outputs d'outils (tool outputs)
            if (currentRun.status === "requires_action" && currentRun.required_action.type === "submit_tool_outputs") {
                const toolCalls = currentRun.required_action.submit_tool_outputs.tool_calls.map((toolCall) => {
                    if (toolCall.function.name === "chatgptPlay") {
                        return {
                            tool_call_id: toolCall.id, // ID de l'appel d'outil
                            output: '{success: true}', // Simule un succès pour cet outil
                        };
                    }
                });

                // Soumet les outputs des outils
                submitToolOutputs(currentRun.id, toolCalls);
            } else {
                console.log("end bis");
            }
        })
        .on('toolCallDone', (toolCallDelta, snapshot) => { 
            if (toolCallDelta.function) {
                let { cellId } = JSON.parse(toolCallDelta.function.arguments); 
                chatgptPlay(cellId);
            }
        })

    return stream.finalMessages();
}

async function submitToolOutputs(runId, toolOutputs) {
    const stream = openAiController.openai.beta.threads.runs.submitToolOutputsStream(
        openAiController.thread.id,
        runId,
        {
            tool_outputs: toolOutputs,
        }
    );

    stream
        .on('textCreated', (textDelta) => { 
            loader.classList.remove("visible");
        })
        .on('textDelta', (textDelta) => { 
            openAiController.messageContainer.innerHTML += textDelta.value || ''; 
        })
        .on("end", () => { 
        })
}

export default openAiController;


function getJsonGridState(){
	let grid = [];

	for (let i = 0; i < cells.length; i++) {
		const cell = cells[i];
		if(cell.classList.contains("played-1")){
			grid.push("O")
		}
		else if(cell.classList.contains("played-2")){
			grid.push("X")
		}
		else{
			grid.push("")
		}
	}

    console.log('grid =', grid)
	return grid;
}


function chatgptPlay(cellId){
	let cellElement = document.getElementById("cell-" + cellId);
	playerChoosedCell(cellElement);
}