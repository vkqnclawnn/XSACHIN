document.addEventListener('DOMContentLoaded', () => {
    // const API_BASE_URL = 'http://localhost:3000/api'; // 이전 설정
    const API_BASE_URL = '/api'; // 상대 경로로 변경

    // Screen elements
    const startScreen = document.getElementById('start-screen');
    const testScreen = document.getElementById('test-screen');
    const resultScreen = document.getElementById('result-screen');
    const combinedResultScreen = document.getElementById('combined-result-screen');

    // Buttons
    const startButton = document.getElementById('start-button');
    const nextQuestionButton = document.getElementById('next-question-button');
    const copyLinkButton = document.getElementById('copy-link-button');
    const restartButton = document.getElementById('restart-button');

    // Display elements
    const questionTitle = document.getElementById('question-title');
    const questionText = document.getElementById('question-text');
    const answerOptionsContainer = document.getElementById('answer-options');
    const scoreDisplay = document.getElementById('score');
    const resultSummaryDisplay = document.getElementById('result-summary');
    const shareSection = document.getElementById('share-section');
    const shareLinkInput = document.getElementById('share-link');
    const partnerResultPrompt = document.getElementById('partner-result-prompt');
    
    const myScoreCombined = document.getElementById('my-score-combined');
    const mySummaryCombined = document.getElementById('my-summary-combined');
    const partnerScoreCombined = document.getElementById('partner-score-combined');
    const partnerSummaryCombined = document.getElementById('partner-summary-combined');

    // const participantTypeSelect = document.getElementById('participant-type'); // 제거됨

    // Test state
    let currentQuestionIndex = 0;
    let userScore = 0;
    let userAnswers = [];
    let currentTestId = null; // For the first user
    let linkedTestId = null; // For the second user, this is the first user's testId
    let participantType = 'partner1'; // 기본값은 'partner1', URL 파라미터에 따라 변경될 수 있음

    // Placeholder questions (replace with actual questions and scoring logic)
    const questions = [
        { text: "애인이 이성친구와 단둘이 저녁 식사를 하는 것은 괜찮다.", options: [{ text: "매우 그렇다", score: 4 }, { text: "그렇다", score: 3 }, { text: "보통이다", score: 2 }, { text: "아니다", score: 1 }, { text: "절대 아니다", score: 0 }] },
        { text: "애인이 이성친구와 밤늦게까지 메신저로 대화하는 것은 괜찮다.", options: [{ text: "매우 그렇다", score: 4 }, { text: "그렇다", score: 3 }, { text: "보통이다", score: 2 }, { text: "아니다", score: 1 }, { text: "절대 아니다", score: 0 }] },
        { text: "애인이 이성친구와 단둘이 영화를 보러 가는 것은 괜찮다.", options: [{ text: "매우 그렇다", score: 4 }, { text: "그렇다", score: 3 }, { text: "보통이다", score: 2 }, { text: "아니다", score: 1 }, { text: "절대 아니다", score: 0 }] },
        { text: "애인이 이성친구의 고민을 들어주며 위로해주는 것은 괜찮다.", options: [{ text: "매우 그렇다", score: 4 }, { text: "그렇다", score: 3 }, { text: "보통이다", score: 2 }, { text: "아니다", score: 1 }, { text: "절대 아니다", score: 0 }] },
        { text: "애인이 이성친구와 가벼운 신체 접촉(하이파이브, 어깨동무 등)을 하는 것은 괜찮다.", options: [{ text: "매우 그렇다", score: 4 }, { text: "그렇다", score: 3 }, { text: "보통이다", score: 2 }, { text: "아니다", score: 1 }, { text: "절대 아니다", score: 0 }] },
    ];

    function initializeTest() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedTestId = urlParams.get('test_id');

        if (sharedTestId) {
            linkedTestId = sharedTestId;
            participantType = 'partner2'; // 공유 링크로 접속 시 partner2로 설정
            // participantTypeSelect.value = 'partner2'; // 제거됨
            // participantTypeSelect.disabled = true; // 제거됨
            console.log("Opened via shared link. Linked Test ID:", linkedTestId, "Participant Type:", participantType);
        } else {
            participantType = 'partner1'; // 직접 접속 시 partner1로 설정
            console.log("New test session. Participant Type:", participantType);
        }
    }
    
    startButton.addEventListener('click', () => {
        currentQuestionIndex = 0;
        userScore = 0;
        userAnswers = [];
        // initializeTest()가 이미 호출되었으므로 participantType은 설정된 상태임
        startScreen.classList.add('hidden');
        testScreen.classList.remove('hidden');
        resultScreen.classList.add('hidden');
        combinedResultScreen.classList.add('hidden');
        displayQuestion();
    });

    function displayQuestion() {
        if (currentQuestionIndex < questions.length) {
            const question = questions[currentQuestionIndex];
            questionTitle.textContent = `질문 ${currentQuestionIndex + 1}/${questions.length}`;
            questionText.textContent = question.text;
            answerOptionsContainer.innerHTML = '';
            question.options.forEach(option => {
                const button = document.createElement('button');
                button.textContent = option.text;
                button.onclick = () => selectAnswer(option.score);
                answerOptionsContainer.appendChild(button);
            });
            nextQuestionButton.classList.add('hidden'); // Hide next button until an answer is selected
        } else {
            finishTest();
        }
    }

    function selectAnswer(score) {
        userScore += score;
        userAnswers.push(score); // Or more detailed answer object
        
        // Highlight selected answer or provide feedback (optional)
        // For now, just enable Next button or directly go to next question
        
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            displayQuestion();
        } else {
            finishTest();
        }
    }

    // nextQuestionButton.addEventListener('click', () => {
    //     currentQuestionIndex++;
    //     displayQuestion();
    // }); // This button might not be needed if answers directly trigger next question

    async function finishTest() {
        testScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');

        const resultSummary = getResultSummary(userScore);
        scoreDisplay.textContent = userScore;
        resultSummaryDisplay.textContent = resultSummary;

        // participantType은 initializeTest 또는 startButton 클릭 시점에 이미 결정됨
        // const participantType = participantTypeSelect.value; // 제거됨

        try {
            const response = await fetch(`${API_BASE_URL}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score: userScore,
                    resultSummary: resultSummary,
                    participantType: participantType, // 자동 결정된 participantType 사용
                    linkedTestId: linkedTestId 
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save test results');
            }
            
            currentTestId = data.testId; // The ID of the test just taken

            if (participantType === 'partner1' && data.isSharedLinkOrigin) {
                shareSection.classList.remove('hidden');
                partnerResultPrompt.classList.remove('hidden');
                const shareUrl = `${window.location.origin}${window.location.pathname}?test_id=${currentTestId}`;
                shareLinkInput.value = shareUrl;
            } else if (participantType === 'partner2' && linkedTestId) {
                // Partner 2 finished, now fetch both results
                shareSection.classList.add('hidden');
                partnerResultPrompt.classList.add('hidden');
                fetchAndDisplayCombinedResults(linkedTestId);
            } else {
                 // Fallback or error case
                shareSection.classList.add('hidden');
                partnerResultPrompt.classList.add('hidden');
                // 만약 partner1인데 isSharedLinkOrigin이 false로 오는 예외적인 경우 (서버 로직상 거의 없음)
                // 또는 partner2인데 linkedTestId가 없는 경우 (클라이언트 로직상 거의 없음)
                console.log("Displaying individual result for a scenario not typically leading to sharing or combined view immediately.");
            }

        } catch (error) {
            console.error('Error finishing test:', error);
            resultSummaryDisplay.textContent = `오류가 발생했습니다: ${error.message}`;
        }
    }

    async function fetchAndDisplayCombinedResults(originalTestId) {
        try {
            const response = await fetch(`${API_BASE_URL}/test/pair/${originalTestId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch combined results');
            }

            const partner1Result = data.partner1Test;
            const partner2Result = data.partner2Test;

            if (partner1Result && partner2Result) {
                // Determine who is "my" result and who is "partner"
                // If currentTestId matches partner1Result.testId, then partner1 is "me"
                // This logic needs refinement based on who is viewing.
                // For now, assume partner1 is the one who initiated, partner2 is the one who used the link.
                // The person viewing this is partner2.
                
                myScoreCombined.textContent = partner2Result.score;
                mySummaryCombined.textContent = partner2Result.resultSummary;
                partnerScoreCombined.textContent = partner1Result.score;
                partnerSummaryCombined.textContent = partner1Result.resultSummary;

                resultScreen.classList.add('hidden'); // Hide individual result for partner2
                combinedResultScreen.classList.remove('hidden');

            } else {
                 // Handle case where one result might be missing, though ideally both should be there
                alert("파트너의 결과를 가져오는 데 문제가 발생했습니다.");
                // Show individual result for partner2 if partner1's is not found
                scoreDisplay.textContent = userScore; // userScore is partner2's score
                resultSummaryDisplay.textContent = getResultSummary(userScore);
            }

        } catch (error) {
            console.error('Error fetching combined results:', error);
            alert(`결합된 결과를 가져오는데 실패했습니다: ${error.message}`);
        }
    }


    function getResultSummary(score) {
        const maxScore = questions.length * 4; // Assuming max score per question is 4
        if (score >= maxScore * 0.8) return "매우 관대함";
        if (score >= maxScore * 0.6) return "약간 관대함";
        if (score >= maxScore * 0.4) return "보통";
        if (score >= maxScore * 0.2) return "질투심이 약간 있음";
        return "질투심이 매우 강함";
    }

    copyLinkButton.addEventListener('click', () => {
        shareLinkInput.select();
        document.execCommand('copy');
        alert('링크가 복사되었습니다!');
    });

    restartButton.addEventListener('click', () => {
        // Reset state and go to start screen
        currentTestId = null;
        linkedTestId = null;
        // participantTypeSelect.disabled = false; // 제거됨
        // participantTypeSelect.value = 'partner1'; // 제거됨
        participantType = 'partner1'; // 재시작 시 기본값으로 초기화
        window.history.pushState({}, document.title, window.location.pathname); // Clear query params

        combinedResultScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        testScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        
        shareSection.classList.add('hidden');
        partnerResultPrompt.classList.add('hidden');
    });

    // Initialize
    initializeTest();
});
