import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Challenge {
  id: number;
  description: string;
  starterCode: string;
  testInput: any;
  expectedOutput: any;
  testFunction: (userFunc: Function, input: any) => any;
}

const challenges: Challenge[] = [
  {
    id: 1,
    description: "Write a function to reverse a string.",
    starterCode: `function reverse(str) {
  return str.split('').reverse().join('');
}`,
    testInput: "vibe",
    expectedOutput: "ebiv",
    testFunction: (userFunc, input) => userFunc(input)
  },
  {
    id: 2,
    description: "Write a function to check if a number is even.",
    starterCode: `function isEven(num) {
  // Your code here
}`,
    testInput: 4,
    expectedOutput: true,
    testFunction: (userFunc, input) => userFunc(input)
  },
  {
    id: 3,
    description: "Write a function to find the maximum number in an array.",
    starterCode: `function findMax(arr) {
  // Your code here
}`,
    testInput: [1, 5, 3, 9, 2],
    expectedOutput: 9,
    testFunction: (userFunc, input) => userFunc(input)
  },
  {
    id: 4,
    description: "Write a function to count vowels in a string.",
    starterCode: `function countVowels(str) {
  // Your code here
}`,
    testInput: "hello world",
    expectedOutput: 3,
    testFunction: (userFunc, input) => userFunc(input)
  },
  {
    id: 5,
    description: "Write a function to check if a string is a palindrome.",
    starterCode: `function isPalindrome(str) {
  // Your code here
}`,
    testInput: "racecar",
    expectedOutput: true,
    testFunction: (userFunc, input) => userFunc(input)
  }
];

export const CodeQuest = () => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [code, setCode] = useState(challenges[0].starterCode);
  const [output, setOutput] = useState("");
  const [gameState, setGameState] = useState<'playing' | 'victory' | 'defeat' | 'complete'>('playing');
  const [heroAnimation, setHeroAnimation] = useState("");
  const [enemyAnimation, setEnemyAnimation] = useState("");

  const currentChallenge = challenges[currentLevel];

  useEffect(() => {
    setCode(currentChallenge.starterCode);
    setOutput("");
    setAttempts(0);
    setGameState('playing');
    setHeroAnimation("");
    setEnemyAnimation("");
  }, [currentLevel]);

  const showSuccess = (message: string) => {
    setOutput(message);
    setHeroAnimation("slash");
    setEnemyAnimation("explode");
    setGameState('victory');
    
    setTimeout(() => {
      setHeroAnimation("");
      setEnemyAnimation("");
      if (currentLevel < challenges.length - 1) {
        setCurrentLevel(prev => prev + 1);
      } else {
        setGameState('complete');
      }
    }, 1000);
  };

  const showError = (message: string) => {
    setOutput(message);
    setHeroAnimation("hurt");
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    setTimeout(() => {
      setHeroAnimation("");
    }, 600);

    if (newAttempts >= 3) {
      setHeroAnimation("explode");
      setGameState('defeat');
      setTimeout(() => {
        restartGame();
      }, 1000);
    }
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setAttempts(0);
    setCode(challenges[0].starterCode);
    setOutput("");
    setGameState('playing');
    setHeroAnimation("");
    setEnemyAnimation("");
  };

  const runCode = () => {
    if (gameState !== 'playing') return;

    try {
      const userFunc = eval("(" + code + ")");
      const result = currentChallenge.testFunction(userFunc, currentChallenge.testInput);

      if (JSON.stringify(result) === JSON.stringify(currentChallenge.expectedOutput)) {
        showSuccess("✅ Correct! Challenge completed.");
      } else {
        showError("❌ Incorrect output. Try again.");
      }
    } catch (e) {
      showError("⚠️ Error in your code: " + (e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#00ff88] p-5 font-mono">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-[#00ff88] drop-shadow-[0_0_5px_#00ff88]">
          💻 CodeQuest
        </h1>
        
        <div className="bg-[#1a1a1a] border-2 border-[#00ff88] rounded-lg p-6 shadow-[0_0_15px_#00ff88]">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold">Level {currentLevel + 1} of {challenges.length}</span>
              <span className="text-[#ff4c4c] font-bold">Attempts: {attempts}/3</span>
            </div>
            <p className="text-lg mb-4">
              <strong>Challenge:</strong> {currentChallenge.description}
            </p>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-40 bg-black text-[#00ff88] border border-[#00ff88] p-3 font-mono text-base resize-none rounded"
            disabled={gameState !== 'playing'}
          />

          <Button
            onClick={runCode}
            disabled={gameState !== 'playing'}
            className="mt-3 bg-[#00ff88] text-black font-bold hover:bg-[#00cc66] disabled:opacity-50"
          >
            Submit Code
          </Button>

          {output && (
            <div className="mt-4 bg-[#111] p-3 border border-[#00ff88] rounded">
              {output}
            </div>
          )}

          <div className="flex justify-between items-center mt-8">
            <div 
              className={`w-32 h-32 bg-black border-2 border-[#00ff88] flex items-center justify-center text-2xl font-bold relative ${
                heroAnimation === 'slash' ? 'animate-[slash_0.4s_ease-in-out]' :
                heroAnimation === 'hurt' ? 'animate-[shake_0.4s]' :
                heroAnimation === 'explode' ? 'animate-[explode_0.6s_ease-in-out_forwards]' : ''
              }`}
            >
              🦸‍♂️
            </div>

            <div className="text-4xl">⚔️</div>

            <div 
              className={`w-32 h-32 bg-black border-2 border-[#00ff88] flex items-center justify-center text-2xl font-bold ${
                enemyAnimation === 'explode' ? 'animate-[explode_0.6s_ease-in-out_forwards]' : ''
              }`}
            >
              👾
            </div>
          </div>

          {gameState === 'victory' && currentLevel < challenges.length - 1 && (
            <div className="text-3xl text-center mt-6 text-[#00ff88] drop-shadow-[0_0_10px_#00ff88] animate-[fadeIn_0.8s_ease-in-out]">
              🎉 Victory! Advancing to next level...
            </div>
          )}

          {gameState === 'complete' && (
            <div className="text-center mt-6">
              <div className="text-3xl text-[#00ff88] drop-shadow-[0_0_10px_#00ff88] animate-[fadeIn_0.8s_ease-in-out] mb-4">
                🏆 Game Complete! You've mastered all challenges!
              </div>
              <Button onClick={restartGame} className="bg-[#00ff88] text-black font-bold hover:bg-[#00cc66]">
                Play Again
              </Button>
            </div>
          )}

          {gameState === 'defeat' && (
            <div className="text-3xl text-center mt-6 text-red-500 drop-shadow-[0_0_10px_red] animate-[fadeIn_0.8s_ease-in-out]">
              💀 Defeat! Restarting game...
            </div>
          )}
        </div>
      </div>

    </div>
  );
};