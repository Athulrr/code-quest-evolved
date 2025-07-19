import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Challenge {
  id: number;
  description: string;
  starterCode: string;
  testInput: any;
  expectedOutput: any;
  testFunction: (userFunc: Function, input: any) => any;
  difficulty: number;
}

interface PerformanceMetrics {
  timeStarted: number;
  attempts: number;
  totalTime: number;
  successRate: number;
  averageTime: number;
  level: number;
}

// AI Challenge Generator
class ChallengeGenerator {
  private apiKey: string = '';
  
  setApiKey(key: string) {
    this.apiKey = key;
  }

  async generateChallenge(difficulty: number, performance: PerformanceMetrics): Promise<Challenge> {
    if (!this.apiKey) {
      return this.getFallbackChallenge(difficulty);
    }

    const prompt = this.buildPrompt(difficulty, performance);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a coding challenge generator. Create JavaScript function challenges. Return only valid JSON in the exact format requested.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const challengeData = JSON.parse(data.choices[0].message.content);
      
      return {
        id: Date.now(),
        description: challengeData.description,
        starterCode: challengeData.starterCode,
        testInput: challengeData.testInput,
        expectedOutput: challengeData.expectedOutput,
        testFunction: (userFunc, input) => Array.isArray(input) ? userFunc(...input) : userFunc(input),
        difficulty: difficulty
      };
    } catch (error) {
      console.error('AI generation failed, using fallback:', error);
      return this.getFallbackChallenge(difficulty);
    }
  }

  private buildPrompt(difficulty: number, performance: PerformanceMetrics): string {
    let difficultyLevel = '';
    let concepts = '';
    
    if (difficulty <= 2) {
      difficultyLevel = 'beginner';
      concepts = 'basic string/array operations, simple math';
    } else if (difficulty <= 4) {
      difficultyLevel = 'intermediate';
      concepts = 'loops, conditionals, array methods';
    } else if (difficulty <= 6) {
      difficultyLevel = 'advanced';
      concepts = 'recursion, algorithms, data structures';
    } else {
      difficultyLevel = 'expert';
      concepts = 'complex algorithms, optimization';
    }

    const performanceContext = performance.averageTime > 90000 
      ? 'User needs more time - keep it simple' 
      : performance.averageTime < 30000 
        ? 'User is fast - increase challenge' 
        : 'User has moderate pace';

    return `Create a ${difficultyLevel} JavaScript challenge. ${performanceContext}. Focus on: ${concepts}

Return JSON in this exact format:
{
  "description": "Write a function named \`functionName\` that does X. Example: functionName(input) should return output",
  "starterCode": "function functionName(param) {\\n  // Your code here\\n}",
  "testInput": testValue,
  "expectedOutput": expectedResult
}

If multiple parameters, use array for testInput. Make testInput and expectedOutput actual values, not strings.`;
  }

  private getFallbackChallenge(difficulty: number): Challenge {
    const fallbacks = [
      {
        description: "Write a function named `add` that adds two numbers. Example: add(3, 5) should return 8",
        starterCode: "function add(a, b) {\n  // Your code here\n}",
        testInput: [3, 5],
        expectedOutput: 8
      },
      {
        description: "Write a function named `reverse` that reverses a string. Example: reverse('hello') should return 'olleh'",
        starterCode: "function reverse(str) {\n  // Your code here\n}",
        testInput: "hello",
        expectedOutput: "olleh"
      },
      {
        description: "Write a function named `isEven` that checks if a number is even. Example: isEven(4) should return true",
        starterCode: "function isEven(num) {\n  // Your code here\n}",
        testInput: 4,
        expectedOutput: true
      },
      {
        description: "Write a function named `factorial` that calculates factorial. Example: factorial(5) should return 120",
        starterCode: "function factorial(n) {\n  // Your code here\n}",
        testInput: 5,
        expectedOutput: 120
      },
      {
        description: "Write a function named `isPalindrome` that checks palindromes. Example: isPalindrome('racecar') should return true",
        starterCode: "function isPalindrome(str) {\n  // Your code here\n}",
        testInput: "racecar",
        expectedOutput: true
      }
    ];
    
    const selected = fallbacks[difficulty % fallbacks.length];
    return {
      ...selected,
      id: Date.now(),
      difficulty,
      testFunction: (userFunc, input) => Array.isArray(input) ? userFunc(...input) : userFunc(input)
    };
  }
}

const challengeGenerator = new ChallengeGenerator();

export const CodeQuest = () => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'victory' | 'defeat' | 'complete' | 'loading'>('setup');
  const [heroAnimation, setHeroAnimation] = useState("");
  const [enemyAnimation, setEnemyAnimation] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [useAI, setUseAI] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    timeStarted: Date.now(),
    attempts: 0,
    totalTime: 0,
    successRate: 100,
    averageTime: 45000,
    level: 1
  });
  const [challengeStartTime, setChallengeStartTime] = useState(Date.now());

  // Fallback challenges for when AI is not used
  const fallbackChallenges: Challenge[] = [
    {
      id: 1,
      description: "Write a function to reverse a string.",
      starterCode: `function reverse(str) {\n  // Your code here\n}`,
      testInput: "vibe",
      expectedOutput: "ebiv",
      testFunction: (userFunc, input) => userFunc(input),
      difficulty: 1
    },
    {
      id: 2,
      description: "Write a function to check if a number is even.",
      starterCode: `function isEven(num) {\n  // Your code here\n}`,
      testInput: 4,
      expectedOutput: true,
      testFunction: (userFunc, input) => userFunc(input),
      difficulty: 2
    },
    {
      id: 3,
      description: "Write a function to find the maximum number in an array.",
      starterCode: `function findMax(arr) {\n  // Your code here\n}`,
      testInput: [1, 5, 3, 9, 2],
      expectedOutput: 9,
      testFunction: (userFunc, input) => userFunc(input),
      difficulty: 3
    },
    {
      id: 4,
      description: "Write a function to count vowels in a string.",
      starterCode: `function countVowels(str) {\n  // Your code here\n}`,
      testInput: "hello world",
      expectedOutput: 3,
      testFunction: (userFunc, input) => userFunc(input),
      difficulty: 4
    },
    {
      id: 5,
      description: "Write a function to check if a string is a palindrome.",
      starterCode: `function isPalindrome(str) {\n  // Your code here\n}`,
      testInput: "racecar",
      expectedOutput: true,
      testFunction: (userFunc, input) => userFunc(input),
      difficulty: 5
    }
  ];

  const calculateDifficulty = () => {
    const baseLevel = currentLevel + 1;
    const speedBonus = performance.averageTime < 30000 ? 1 : 0;
    const successPenalty = performance.successRate < 50 ? -1 : 0;
    return Math.max(1, Math.min(8, baseLevel + speedBonus + successPenalty));
  };

  const updatePerformance = (success: boolean, timeSpent: number) => {
    const newAttempts = performance.attempts + 1;
    const newSuccessRate = success 
      ? ((performance.successRate * (newAttempts - 1)) + 100) / newAttempts
      : (performance.successRate * (newAttempts - 1)) / newAttempts;
    
    const newTotalTime = performance.totalTime + timeSpent;
    const newAverageTime = newTotalTime / newAttempts;

    setPerformance({
      timeStarted: performance.timeStarted,
      attempts: newAttempts,
      totalTime: newTotalTime,
      successRate: newSuccessRate,
      averageTime: newAverageTime,
      level: currentLevel + 1
    });
  };

  const loadNextChallenge = async () => {
    setGameState('loading');
    const difficulty = calculateDifficulty();
    
    try {
      let challenge: Challenge;
      if (useAI && apiKey) {
        challengeGenerator.setApiKey(apiKey);
        challenge = await challengeGenerator.generateChallenge(difficulty, performance);
      } else {
        challenge = fallbackChallenges[currentLevel % fallbackChallenges.length];
      }
      
      setCurrentChallenge(challenge);
      setCode(challenge.starterCode);
      setOutput("");
      setAttempts(0);
      setGameState('playing');
      setChallengeStartTime(Date.now());
    } catch (error) {
      console.error('Failed to load challenge:', error);
      const fallback = fallbackChallenges[currentLevel % fallbackChallenges.length];
      setCurrentChallenge(fallback);
      setCode(fallback.starterCode);
      setGameState('playing');
    }
  };

  const startGame = () => {
    setCurrentLevel(0);
    setAttempts(0);
    setOutput("");
    setGameState('playing');
    setHeroAnimation("");
    setEnemyAnimation("");
    setPerformance({
      timeStarted: Date.now(),
      attempts: 0,
      totalTime: 0,
      successRate: 100,
      averageTime: 45000,
      level: 1
    });
    loadNextChallenge();
  };

  const showSuccess = (message: string) => {
    const timeSpent = Date.now() - challengeStartTime;
    updatePerformance(true, timeSpent);
    
    setOutput(message);
    setHeroAnimation("slash");
    setEnemyAnimation("explode");
    setGameState('victory');
    
    setTimeout(() => {
      setHeroAnimation("");
      setEnemyAnimation("");
      
      if (currentLevel < 9) { // Infinite levels with AI
        setCurrentLevel(prev => prev + 1);
        loadNextChallenge();
      } else {
        setGameState('complete');
      }
    }, 1500);
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
      const timeSpent = Date.now() - challengeStartTime;
      updatePerformance(false, timeSpent);
      
      setHeroAnimation("explode");
      setGameState('defeat');
      setTimeout(() => {
        restartGame();
      }, 2000);
    }
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setAttempts(0);
    setCode("");
    setOutput("");
    setGameState('setup');
    setHeroAnimation("");
    setEnemyAnimation("");
    setCurrentChallenge(null);
  };

  const runCode = () => {
    if (gameState !== 'playing' || !currentChallenge) return;

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

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-[#00ff88] p-5 font-mono flex items-center justify-center">
        <div className="max-w-md w-full bg-[#1a1a1a] border-2 border-[#00ff88] rounded-lg p-6 shadow-[0_0_15px_#00ff88]">
          <h1 className="text-3xl font-bold text-center mb-8 text-[#00ff88] drop-shadow-[0_0_5px_#00ff88]">
            💻 CodeQuest
          </h1>
          
          <div className="space-y-6">
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Enable AI-Generated Challenges</span>
              </label>
            </div>

            {useAI && (
              <div>
                <label className="block mb-2">OpenAI API Key:</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-black text-[#00ff88] border border-[#00ff88] p-2 rounded"
                />
                <p className="text-sm mt-1 text-gray-400">
                  Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" className="underline">OpenAI</a>
                </p>
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={startGame}
                className="bg-[#00ff88] text-black font-bold hover:bg-[#00cc66] px-8 py-3"
              >
                Start Quest
              </Button>
            </div>

            <div className="text-sm text-gray-400 space-y-2">
              <p>🤖 <strong>AI Mode:</strong> Adaptive difficulty based on your performance</p>
              <p>📚 <strong>Classic Mode:</strong> Fixed 5-level progression</p>
              <p>⚡ <strong>Performance Tracking:</strong> Speed and accuracy affect next challenge</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-[#00ff88] p-5 font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🤖</div>
          <div className="text-xl">Generating next challenge...</div>
        </div>
      </div>
    );
  }

  if (!currentChallenge) return null;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#00ff88] p-5 font-mono">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-[#00ff88] drop-shadow-[0_0_5px_#00ff88]">
          💻 CodeQuest {useAI ? '🤖' : ''}
        </h1>
        
        <div className="bg-[#1a1a1a] border-2 border-[#00ff88] rounded-lg p-6 shadow-[0_0_15px_#00ff88]">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold">
                Level {currentLevel + 1} {useAI ? `(Difficulty: ${currentChallenge.difficulty})` : `of ${fallbackChallenges.length}`}
              </span>
              <div className="flex items-center space-x-4">
                {useAI && (
                  <span className="text-sm">⚡ Avg: {Math.round(performance.averageTime / 1000)}s | 📊 {Math.round(performance.successRate)}%</span>
                )}
                <span className="text-[#ff4c4c] font-bold">Attempts: {attempts}/3</span>
              </div>
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

          <div className="flex space-x-3 mt-3">
            <Button
              onClick={runCode}
              disabled={gameState !== 'playing'}
              className="bg-[#00ff88] text-black font-bold hover:bg-[#00cc66] disabled:opacity-50"
            >
              Submit Code
            </Button>
            <Button
              onClick={restartGame}
              className="bg-red-600 text-white font-bold hover:bg-red-700"
            >
              Restart
            </Button>
          </div>

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

          {gameState === 'victory' && (
            <div className="text-3xl text-center mt-6 text-[#00ff88] drop-shadow-[0_0_10px_#00ff88] animate-[fadeIn_0.8s_ease-in-out]">
              🎉 Victory! {useAI ? 'Generating next challenge...' : 'Advancing to next level...'}
            </div>
          )}

          {gameState === 'complete' && (
            <div className="text-center mt-6">
              <div className="text-3xl text-[#00ff88] drop-shadow-[0_0_10px_#00ff88] animate-[fadeIn_0.8s_ease-in-out] mb-4">
                🏆 Incredible! You've reached Level 10!
              </div>
              <Button onClick={restartGame} className="bg-[#00ff88] text-black font-bold hover:bg-[#00cc66]">
                New Quest
              </Button>
            </div>
          )}

          {gameState === 'defeat' && (
            <div className="text-3xl text-center mt-6 text-red-500 drop-shadow-[0_0_10px_red] animate-[fadeIn_0.8s_ease-in-out]">
              💀 Defeat! Hero vanished... Restarting quest...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};