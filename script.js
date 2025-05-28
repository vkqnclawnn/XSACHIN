document.addEventListener('DOMContentLoaded', () => {
    // const API_BASE_URL = 'http://localhost:3000/api'; // 이전 설정
    const API_BASE_URL = 'https://xsachin.onrender.com/api'; // 상대 경로로 변경

    // Screen elements
    const startScreen = document.getElementById('start-screen');
    const testScreen = document.getElementById('test-screen');
    const resultScreen = document.getElementById('result-screen');
    const combinedResultScreen = document.getElementById('combined-result-screen');
    const surpriseQuestionScreen = document.getElementById('surprise-question-screen');

    // Buttons
    const startButton = document.getElementById('start-button');
    const nextQuestionButton = document.getElementById('next-question-button');
    const copyLinkButton = document.getElementById('copy-link-button');
    const restartButton = document.getElementById('restart-button');
    const submitDaysButton = document.getElementById('submit-days-button');

    // Display elements
    const questionTitle = document.getElementById('question-title');
    const questionText = document.getElementById('question-text');
    const answerOptionsContainer = document.getElementById('answer-options');
    const scoreDisplay = document.getElementById('score');
    const resultSummaryDisplay = document.getElementById('result-summary');
    const shareSection = document.getElementById('share-section');
    const shareLinkInput = document.getElementById('share-link');
    const partnerResultPrompt = document.getElementById('partner-result-prompt');
    const daysInputTimerDisplay = document.getElementById('days-input-timer');
    const daysInputField = document.getElementById('days-input-field');
    
    const myScoreCombined = document.getElementById('my-score-combined');
    const mySummaryCombined = document.getElementById('my-summary-combined');
    const partnerScoreCombined = document.getElementById('partner-score-combined');
    const partnerSummaryCombined = document.getElementById('partner-summary-combined');
    const myDaysCombinedDisplay = document.getElementById('my-days-combined');
    const myTimeDaysCombinedDisplay = document.getElementById('my-time-days-combined');
    const partnerDaysCombinedDisplay = document.getElementById('partner-days-combined');
    const partnerTimeDaysCombinedDisplay = document.getElementById('partner-time-days-combined');

    // const participantTypeSelect = document.getElementById('participant-type'); // 제거됨

    // Test state
    let currentQuestionIndex = 0;
    let userScore = 0;
    let userAnswers = [];
    let currentTestId = null; // For the first user
    let linkedTestId = null; // For the second user, this is the first user's testId
    let participantType = 'partner1'; // 기본값은 'partner1', URL 파라미터에 따라 변경될 수 있음

    // Timer and surprise question state
    let surpriseStartTime;
    let surpriseTimerInterval;
    let surpriseTimeTaken = 0;
    let userDaysMet = null;

    let partnerScore = null;
    let partnerResultSummary = null;
    let partnerDaysMet = null;
    let partnerTimeTakenDays = null;

    // Placeholder questions (replace with actual questions and scoring logic)
    const questions = [
        { text: "애인이 X사친과 단둘이 저녁 식사를 하는 것은 괜찮다.", options: [{ text: "매우 그렇다", score: 4 }, { text: "그렇다", score: 3 }, { text: "보통이다", score: 2 }, { text: "아니다", score: 1 }, { text: "절대 아니다", score: 0 }] },
        { text: "애인이 X사친과 밤늦게까지 메신저로 대화하는 것은 괜찮다.", options: [{ text: "매우 그렇다", score: 4 }, { text: "그렇다", score: 3 }, { text: "보통이다", score: 2 }, { text: "아니다", score: 1 }, { text: "절대 아니다", score: 0 }] },
        { text: "애인이 X사친과 단둘이 영화를 보러 가는 것은 괜찮다.", options: [{ text: "매우 그렇다", score: 4 }, { text: "그렇다", score: 3 }, { text: "보통이다", score: 2 }, { text: "아니다", score: 1 }, { text: "절대 아니다", score: 0 }] },
        { text: "애인이 X사친과 고민을 들어주며 위로해주는 것은 괜찮다.", options: [{ text: "매우 그렇다", score: 4 }, { text: "그렇다", score: 3 }, { text: "보통이다", score: 2 }, { text: "아니다", score: 1 }, { text: "절대 아니다", score: 0 }] },
        { text: "애인이 X사친과 가벼운 신체 접촉(하이파이브, 어깨동무 등)을 하는 것은 괜찮다.", options: [{ text: "매우 그렇다", score: 4 }, { text: "그렇다", score: 3 }, { text: "보통이다", score: 2 }, { text: "아니다", score: 1 }, { text: "절대 아니다", score: 0 }] },
    ];

    function initializeTest() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedTestId = urlParams.get('test_id');
        const p1Days = urlParams.get('days1'); // 파트너1(링크 생성자)의 사귄 날짜
        const p1Time = urlParams.get('time1'); // 파트너1의 입력 시간

        if (sharedTestId) {
            linkedTestId = sharedTestId;
            participantType = 'partner2'; // 공유 링크로 접속 시 partner2로 설정
            // participantTypeSelect.value = 'partner2'; // 제거됨
            // participantTypeSelect.disabled = true; // 제거됨
            console.log("Opened via shared link. Linked Test ID:", linkedTestId, "Participant Type:", participantType);

            if (p1Days && p1Time) {
                partnerDaysMet = parseInt(p1Days, 10);
                partnerTimeTakenDays = parseInt(p1Time, 10);
                console.log("Partner's (P1) days met:", partnerDaysMet, "Time taken:", partnerTimeTakenDays);
            }
        } else {
            participantType = 'partner1'; // 직접 접속 시 partner1로 설정
            console.log("New test session. Participant Type:", participantType);
        }
    }
    
    startButton.addEventListener('click', () => {
        // currentQuestionIndex = 0; // submitDaysButton 클릭 리스너 내부로 이동
        // userScore = 0; // submitDaysButton 클릭 리스너 내부로 이동
        // userAnswers = []; // submitDaysButton 클릭 리스너 내부로 이동
        startScreen.classList.add('hidden');
        surpriseQuestionScreen.classList.remove('hidden'); // 깜짝 질문 화면 먼저 표시
        daysInputField.value = ''; // 입력 필드 초기화
        daysInputTimerDisplay.textContent = '0'; // 타이머 표시 초기화
        startSurpriseTimer(); // 타이머 시작
        // testScreen.classList.remove('hidden'); // 이 부분은 깜짝 질문 완료 후로 이동
        resultScreen.classList.add('hidden');
        combinedResultScreen.classList.add('hidden');
        // displayQuestion(); // 이 부분도 깜짝 질문 완료 후로 이동
    });

    function startSurpriseTimer() {
        surpriseStartTime = Date.now();
        surpriseTimerInterval = setInterval(() => {
            const elapsedTime = Math.floor((Date.now() - surpriseStartTime) / 1000);
            daysInputTimerDisplay.textContent = elapsedTime;
        }, 1000);
    }

    submitDaysButton.addEventListener('click', () => {

        clearInterval(surpriseTimerInterval); // 현재 인터벌 정지
        const currentElapsedTime = Math.floor((Date.now() - surpriseStartTime) / 1000); // 현재까지 흐른 시간 기록
        const daysInputValue = daysInputField.value.trim();

        if (daysInputValue === "" || isNaN(parseInt(daysInputValue, 10)) || parseInt(daysInputValue, 10) <= 0) {
            alert('유효한 날짜를 입력해주세요. (숫자만 입력)');
            
            // alert 창 이후, 타이머를 이어서 시작합니다.
            // surpriseStartTime을 조정하여 이전에 흘렀던 시간을 반영합니다.
            surpriseStartTime = Date.now() - (currentElapsedTime * 1000); 

            surpriseTimerInterval = setInterval(() => {
                const elapsedTime = Math.floor((Date.now() - surpriseStartTime) / 1000);
                daysInputTimerDisplay.textContent = elapsedTime;
            }, 1000);
            return;
        }
        // 유효한 입력인 경우, 최종 시간을 기록합니다.
        surpriseTimeTaken = currentElapsedTime; // 또는 parseInt(daysInputTimerDisplay.textContent, 10);
        userDaysMet = parseInt(daysInputValue, 10);

        surpriseQuestionScreen.classList.add('hidden');
        testScreen.classList.remove('hidden');
        
        // 테스트 시작 상태 초기화
        currentQuestionIndex = 0;
        userScore = 0;
        userAnswers = [];
        
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
        // resultScreen.classList.remove('hidden'); // 개인 결과 화면 표시 로직을 조건부로 변경
        // scoreDisplay.textContent = userScore; // 아래 조건문 내부로 이동
        // resultSummaryDisplay.textContent = resultSummary; // 아래 조건문 내부로 이동

        const resultSummary = getResultSummary(userScore);

        try {
            const response = await fetch(`${API_BASE_URL}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score: userScore,
                    resultSummary: resultSummary,
                    participantType: participantType,
                    linkedTestId: linkedTestId,
                    daysMet: userDaysMet, // 깜짝 질문: 사귄 날짜 추가
                    timeTakenDays: surpriseTimeTaken // 깜짝 질문: 입력 시간 추가
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save test results');
            }

            currentTestId = data.testId; // The ID of the test just taken

            if (participantType === 'partner1' && data.isSharedLinkOrigin) {
                // 첫 번째 사용자: 개인 결과 화면 및 공유 링크 표시
                scoreDisplay.textContent = userScore;
                resultSummaryDisplay.textContent = resultSummary;
                resultScreen.classList.remove('hidden'); // 개인 결과 화면 표시

                shareSection.classList.remove('hidden');
                partnerResultPrompt.classList.remove('hidden');
                // 공유 URL에 깜짝 질문 정보 추가
                const shareUrl = `${window.location.origin}${window.location.pathname}?test_id=${currentTestId}&days1=${userDaysMet}&time1=${surpriseTimeTaken}`;
                shareLinkInput.value = shareUrl;
            } else if (participantType === 'partner2' && linkedTestId) {
                // 공유받은 사용자: 바로 두 사람 결과 비교 화면 표시
                resultScreen.classList.add('hidden'); // 개인 결과 화면을 명시적으로 숨김
                shareSection.classList.add('hidden');
                partnerResultPrompt.classList.add('hidden');
                await fetchAndDisplayCombinedResults(linkedTestId); // 두 사람 결과 비교 함수 호출
            } else {
                 // 기타 경우 (예: partner1이지만 isSharedLinkOrigin이 false 등): 개인 결과 화면 표시
                scoreDisplay.textContent = userScore;
                resultSummaryDisplay.textContent = resultSummary;
                resultScreen.classList.remove('hidden');

                shareSection.classList.add('hidden');
                partnerResultPrompt.classList.add('hidden');
                console.log("Displaying individual result for a fallback scenario.");
            }

        } catch (error) {
            console.error('Error finishing test:', error);
            // 오류 발생 시 개인 결과 화면에 오류 메시지 표시 (combinedResultScreen이 활성화되지 않은 경우)
            if (combinedResultScreen.classList.contains('hidden')) {
                scoreDisplay.textContent = "오류";
                resultSummaryDisplay.textContent = `오류가 발생했습니다: ${error.message}`;
                resultScreen.classList.remove('hidden');
                shareSection.classList.add('hidden');
                partnerResultPrompt.classList.add('hidden');
            }
            // fetchAndDisplayCombinedResults 내부에서 오류 발생 시 해당 함수가 combinedResultScreen에 오류를 표시할 것임
        }
    }

    async function fetchAndDisplayCombinedResults(originalTestId) {
        try {
            const response = await fetch(`${API_BASE_URL}/test/pair/${originalTestId}`);
            const data = await response.json();

            console.log('Combined results data from server:', data); // <--- 서버 응답 데이터 확인

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch combined results');
            }

            const partner1Result = data.partner1Test;
            const partner2Result = data.partner2Test;

            console.log('Partner 1 Result (from server):', partner1Result); // <--- partner1 데이터 확인
            console.log('Partner 2 Result (from server):', partner2Result); // <--- partner2 데이터 확인

            if (partner1Result && partner2Result) {
                // 현재 사용자는 partner2라고 가정 (공유 링크를 통해 접속했으므로)
                // '나의 결과'는 partner2, '애인의 결과'는 partner1
                myScoreCombined.textContent = partner2Result.score;
                mySummaryCombined.textContent = partner2Result.resultSummary;

                // partner2Result.daysMet와 partner2Result.timeTakenDays가 undefined가 아닌지 확인
                if (typeof partner2Result.daysMet !== 'undefined' && partner2Result.daysMet !== null) {
                    myDaysCombinedDisplay.textContent = partner2Result.daysMet;
                } else {
                    myDaysCombinedDisplay.textContent = '입력 안함'; // 또는 'N/A'
                }

                if (typeof partner2Result.timeTakenDays !== 'undefined' && partner2Result.timeTakenDays !== null) {
                    myTimeDaysCombinedDisplay.textContent = partner2Result.timeTakenDays;
                } else {
                    myTimeDaysCombinedDisplay.textContent = 'N/A';
                }

                partnerScoreCombined.textContent = partner1Result.score;
                partnerSummaryCombined.textContent = partner1Result.resultSummary;
                // partner1의 정보는 URL 파라미터에서 가져온 값을 우선 사용하거나, 서버 응답을 사용
                // partnerDaysMet는 URL에서 가져온 값, partnerTimeTakenDays도 URL에서 가져온 값
                if (partnerDaysMet !== null) { // URL 파라미터에 partner1의 days 정보가 있다면 사용
                    partnerDaysCombinedDisplay.textContent = partnerDaysMet;
                } else if (typeof partner1Result.daysMet !== 'undefined' && partner1Result.daysMet !== null) {
                    partnerDaysCombinedDisplay.textContent = partner1Result.daysMet;
                } else {
                    partnerDaysCombinedDisplay.textContent = '입력 안함';
                }

                if (partnerTimeTakenDays !== null) { // URL 파라미터에 partner1의 time 정보가 있다면 사용
                    partnerTimeDaysCombinedDisplay.textContent = partnerTimeTakenDays;
                } else if (typeof partner1Result.timeTakenDays !== 'undefined' && partner1Result.timeTakenDays !== null) {
                    partnerTimeDaysCombinedDisplay.textContent = partner1Result.timeTakenDays;
                } else {
                    partnerTimeDaysCombinedDisplay.textContent = 'N/A';
                }
                
                resultScreen.classList.add('hidden'); 
                combinedResultScreen.classList.remove('hidden');

            } else {
                // 한쪽 결과가 없는 경우 (예: partner2가 아직 테스트를 완료하지 않음)
                // 이 경우, partner1의 결과만 표시하거나, "애인이 아직 테스트를 완료하지 않았습니다."와 같은 메시지를 표시할 수 있습니다.
                // 현재 코드는 partner1Result와 partner2Result가 모두 있어야 이 블록으로 들어옵니다.
                // 만약 data.partner2Test가 null일 수 있다면, 그에 대한 처리가 필요합니다.
                console.log('One or both partner results are missing. Data:', data);
                mySummaryCombined.textContent = "애인 또는 나의 결과 정보를 가져오는 데 실패했습니다.";
                if (partner1Result) { // partner1 정보만 있는 경우
                    partnerScoreCombined.textContent = partner1Result.score;
                    partnerSummaryCombined.textContent = partner1Result.resultSummary;
                    partnerDaysCombinedDisplay.textContent = partnerDaysMet !== null ? partnerDaysMet : (partner1Result.daysMet !== null ? partner1Result.daysMet : '입력 안함');
                    partnerTimeDaysCombinedDisplay.textContent = partnerTimeTakenDays !== null ? partnerTimeTakenDays : (partner1Result.timeTakenDays !== null ? partner1Result.timeTakenDays : 'N/A');
                }
                // throw new Error('두 참여자의 결과를 모두 가져오지 못했습니다.'); // 이 부분은 상황에 따라 조정
                resultScreen.classList.add('hidden'); 
                combinedResultScreen.classList.remove('hidden');
            }

        } catch (error) {
            console.error('Error fetching combined results:', error);
            // 비교 결과 화면에 오류 메시지 표시
            myScoreCombined.textContent = "오류";
            mySummaryCombined.textContent = ""; // Clear previous summary
            myDaysCombinedDisplay.textContent = "N/A";
            myTimeDaysCombinedDisplay.textContent = "N/A";

            partnerScoreCombined.textContent = "오류";
            partnerSummaryCombined.textContent = `결과 비교 중 오류: ${error.message}`;
            partnerDaysCombinedDisplay.textContent = "N/A";
            partnerTimeDaysCombinedDisplay.textContent = "N/A";
            
            resultScreen.classList.add('hidden'); // 개인 결과 화면 숨김
            combinedResultScreen.classList.remove('hidden'); // 비교 결과 화면(오류 메시지 포함) 표시
        }
    }


    function getResultSummary(score) {
        const maxScore = questions.length * 4; // Assuming max score per question is 4
        if (score >= maxScore * 0.8) return "간디도 절레절레할 정도의 관대함";
        if (score >= maxScore * 0.6) return "관대한척하는 컨셉?";
        if (score >= maxScore * 0.4) return "준수하지만 질투가 필요해";
        if (score >= maxScore * 0.2) return "질투쟁이 끝판왕임";
        return "질투심이 매우 강함";
    }

    copyLinkButton.addEventListener('click', () => {
        shareLinkInput.select();
        document.execCommand('copy');
        alert('링크가 복사되었습니다!');
    });

    restartButton.addEventListener('click', () => {
        // Reset state and go to start screen
        startScreen.classList.remove('hidden');
        testScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        combinedResultScreen.classList.add('hidden');
        surpriseQuestionScreen.classList.add('hidden'); // Ensure surprise screen is hidden

        window.history.pushState({}, document.title, window.location.pathname); // Clear query params
        
        // Reset participant type and test IDs
        participantType = 'partner1'; // 재시작 시 기본값으로 초기화
        // participantTypeSelect.value = 'partner1'; // 제거됨
        // participantTypeSelect.disabled = false; // 제거됨
        linkedTestId = null;
        currentTestId = null;
        
        // Reset test state variables
        userScore = 0;
        userAnswers = [];
        currentQuestionIndex = 0;
        userDaysMet = null;
        surpriseTimeTaken = 0;
        daysInputField.value = ''; // Clear days input field

        shareSection.classList.add('hidden');
        partnerResultPrompt.classList.add('hidden');
    });

    // Initialize
    initializeTest();
});
