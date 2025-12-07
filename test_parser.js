const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/Yacine/Desktop/QCM/Dabbadie/CM1-2.txt';

function parseQCM(text) {
    const lines = text.split('\n');
    const questions = [];
    let currentQuestion = null;
    let lastValidQuestion = null;

    // Regex Definitions
    const regexQuestion = /^(?:Question\s+)?(\d+)\s*[\.:]\s*(.+)/i;
    const regexOption = /^([A-D])\s*\.\s*(.+)/;
    const regexAnswerExplicit = /^(?:\d+\s*[\.:]\s*)?Réponse\s*[:\.]?\s*([A-D])/i;
    const regexAnswerParen = /^([A-D])\s*\((.+)\)/;
    const regexCorrection = /^Correction\s*[:]\s*(.+)/i;

    console.log(`Parsing ${lines.length} lines...`);

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        if (i < 20) console.log(`[L${i}] ${line}`);

        const qMatch = line.match(regexQuestion);
        const isAnswerLine = line.toLowerCase().includes('réponse') || line.toLowerCase().startsWith('correction');

        if (qMatch) {
            console.log(`Matched Q: ${line} -> ID: ${qMatch[1]}`);
        } else if (line.startsWith('Question')) {
            console.log(`Failed Regex on possible question: ${line}`);
            console.log(`Regex Source: ${regexQuestion.source}`);
        }

        if (qMatch && !isAnswerLine) {
            currentQuestion = {
                id: parseInt(qMatch[1]),
                text: line,
                options: [],
                answer: '',
                justification: ''
            };
            questions.push(currentQuestion);
            lastValidQuestion = currentQuestion;
            continue;
        }

        // Check options
        const optMatch = line.match(regexOption);
        if (optMatch && currentQuestion) {
            console.log(`Matched Option: ${line}`);
            currentQuestion.options.push(line);
            continue;
        }
    }

    console.log(`Parsed ${questions.length} questions`);
    return questions;
}

try {
    const data = fs.readFileSync(filePath, 'utf8');
    const result = parseQCM(data);
    console.log('Result count:', result.length);
} catch (e) {
    console.error(e);
}
