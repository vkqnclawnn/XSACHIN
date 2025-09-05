document.addEventListener('DOMContentLoaded', () => {
    // const API_BASE_URL = 'http://localhost:3000/api'; // 로컬 개발용
    // const API_BASE_URL = 'https://xsachin.onrender.com/api'; // 이전 Render 서버
    const API_BASE_URL = 'https://xsachin-production.up.railway.app/api'; // Railway 서버 URL

    // Screen elements
    const startScreen = document.getElementById('start-screen');
    const testScreen = document.getElementById('test-screen');
    const resultScreen = document.getElementById('result-screen');
    const combinedResultScreen = document.getElementById('combined-result-screen');
    const surpriseQuestionScreen = document.getElementById('surprise-question-screen');
    const siteDescriptionSection = document.getElementById('site-description'); // 사이트 설명 섹션 추가

    // Buttons
    const startButton = document.getElementById('start-button');
    // const nextQuestionButton = document.getElementById('next-question-button'); // 이전 ID
    const prevQuestionButton = document.getElementById('prev-question-button'); // 새 ID로 변경 (HTML도 수정 필요)
    const copyLinkButton = document.getElementById('copy-link-button');
    const submitDaysButton = document.getElementById('submit-days-button');
    const toggleDescriptionButton = document.getElementById('toggle-description'); // 설명 토글 버튼 추가

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
    const detailedAnswersPageContainer = document.getElementById('detailedAnswersPage'); // 상세 답변 페이지 컨테이너

    // const participantTypeSelect = document.getElementById('participant-type'); // 제거됨

    // Test state
    let currentQuestionIndex = 0;
    let userScore = 0;
    // userAnswers 배열은 각 답변을 객체 형태로 저장: { questionIndex: number, text: string, score: number }
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

    // Updated questions array with 10 questions, scores set (low score = cool, high score = jealous)
    // Options are now sorted by score in descending order
    const questions = [
        { // 1. 가장 일반적인 소통
            text: "애인이 X사친과 밤늦게까지 디엠으로 대화하는 것은 괜찮다.",
            options: [
                { text: "절대 안 된다", score: 10 },
                { text: "왠만하면 안 했으면 좋겠다", score: 8 },
                { text: "자주는 좀 그렇다", score: 5 },
                { text: "가끔은 괜찮다", score: 2 },
                { text: "전혀 상관없다", score: 0 }
            ].sort((a, b) => b.score - a.score) // Sort by score descending
        },
        { // 2. 고민 상담
            text: "애인이 X사친과 만나서 고민을 들어주며 위로해주는 것은 괜찮다.",
            options: [
                { text: "절대 안 된다", score: 10 },
                { text: "친족의 별세 외에는 안 된다", score: 8 },
                { text: "가끔은 괜찮지만, 나한테 먼저 말했으면 좋겠다", score: 5 },
                { text: "필요하다면 그럴 수 있다", score: 2 },
                { text: "얼마든지 괜찮다", score: 0 }
            ].sort((a, b) => b.score - a.score) // Sort by score descending
        },
        { // 3. 별명 사용
            text: "애인이 X사친과 둘만 아는 별명으로 친근하게 부를 수 있다.",
            options: [
                { text: "절대 안 된다", score: 10 },
                { text: "좀 거슬린다", score: 8 },
                { text: "둘만 아는 애칭이 아니라면 괜찮다", score: 5 },
                { text: "그럴 수 있다고 생각한다", score: 2 },
                { text: "전혀 신경 안 쓴다", score: 0 }
            ].sort((a, b) => b.score - a.score) // Sort by score descending
        },
        { // 4. 선물 교환
            text: "애인이 X사친과 생일이나 기념일 선물을 챙겨줄 수 있다.",
            options: [
                { text: "절대 안 된다", score: 10 },
                { text: "왠만하면 안 했으면 좋겠다", score: 8 },
                { text: "상황 봐서 괜찮을 수도 있다", score: 5 },
                { text: "가벼운 선물 정도는 괜찮다", score: 2 },
                { text: "얼마든지 괜찮다", score: 0 }
            ].sort((a, b) => b.score - a.score) // Sort by score descending
        },
        { // 5. 가벼운 신체 접촉
            text: "애인이 X사친과 가벼운 신체 접촉(하이파이브, 어깨동무 등)을 하는 것은 괜찮다.",
            options: [
                { text: "절대 안 된다", score: 10 },
                { text: "좀 불편하다", score: 8 },
                { text: "상황에 따라 다를 것 같다", score: 5 },
                { text: "하이파이브 정도는 괜찮다", score: 2 },
                { text: "전혀 신경 안 쓴다", score: 0 }
            ].sort((a, b) => b.score - a.score) // Sort by score descending
        },
        { // 6. 단둘이 식사
            text: "애인이 X사친과 단둘이 저녁 술자리를 하는 것은 괜찮다.",
            options: [
                { text: "절대 안 된다", score: 10 },
                { text: "왠만하면 안 했으면 좋겠다", score: 8 },
                { text: "점심 정도면 괜찮다", score: 5 },
                { text: "가끔은 괜찮다", score: 2 },
                { text: "매우 괜찮다", score: 0 }
            ].sort((a, b) => b.score - a.score) // Sort by score descending
        },
        { // 7. 단둘이 영화
            text: "애인이 X사친과 단둘이 영화를 보러 가는 것은 괜찮다.",
            options: [
                { text: "절대 안 된다", score: 10 },
                { text: "왠만하면 안 갔으면 좋겠다", score: 8 },
                { text: "썩 내키지는 않는다", score: 5 },
                { text: "그럴 수 있다", score: 2 },
                { text: "매우 괜찮다", score: 0 }
            ].sort((a, b) => b.score - a.score) // Sort by score descending
        },
        { // 8. 커플룩 의심
            text: "애인이 X사친과 커플룩처럼 보이는 옷(예: 같은 브랜드, 같은 색상)을 맞춰 입고 단체 모임에 참석 할 수 있다.",
            options: [
                { text: "상상도 하기 싫다", score: 10 },
                { text: "절대 안 된다고 생각한다", score: 8 },
                { text: "썩 기분 좋지는 않다", score: 5 },
                { text: "신경은 쓰이지만 그럴 수도 있다", score: 2 },
                { text: "전혀 신경 안 쓴다, 우연일 수도 있다", score: 0 }
            ].sort((a, b) => b.score - a.score) // Sort by score descending
        },
        { // 9. 휴대폰 배경화면
            text: "애인이 X사친과 함께 찍은 셀카를 자신의 휴대폰 배경화면으로 설정할 수 있다.",
            options: [
                { text: "이건 선 넘었다", score: 10 },
                { text: "절대 안 된다", score: 8 },
                { text: "단둘이 찍은 거라면 좀 그렇다", score: 5 },
                { text: "단체 사진이면 괜찮다", score: 2 },
                { text: "전혀 상관없다", score: 0 }
            ].sort((a, b) => b.score - a.score) // Sort by score descending
        },
        { // 10. 데이트 약속 변경
            text: "애인이 X사친과의 약속 때문에 당신과의 데이트를 빠질 수 있다.",
            options: [
                { text: "있을 수 없는 일이다", score: 10 },
                { text: "절대 안 된다", score: 8 },
                { text: "이해는 하지만 기분 나쁘다", score: 5 },
                { text: "가끔은 그럴 수 있다", score: 2 },
                { text: "정말 중요한 일이면 그럴 수 있다", score: 0 }
            ].sort((a, b) => b.score - a.score) // Sort by score descending
        }
    ];

    function initializeTest() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedTestId = urlParams.get('test_id');
        const p1Days = urlParams.get('days1');
        const p1Time = urlParams.get('time1');
        const viewAnswersFlag = urlParams.get('view_answers'); // view_answers 파라미터 확인

        if (viewAnswersFlag === 'true' && sharedTestId) {
            // 상세 답변 비교 화면을 바로 표시
            startScreen.classList.add('hidden');
            if (siteDescriptionSection) { // 사이트 설명 숨기기
                siteDescriptionSection.classList.add('hidden');
            }
            testScreen.classList.add('hidden');
            resultScreen.classList.add('hidden');
            combinedResultScreen.classList.add('hidden');
            surpriseQuestionScreen.classList.add('hidden');
            
            if (detailedAnswersPageContainer) {
                detailedAnswersPageContainer.classList.remove('hidden');
                renderDetailedAnswersView(sharedTestId, detailedAnswersPageContainer);
            }
            return; // 일반 테스트 초기화 로직 중단
        }

        if (sharedTestId) {
            linkedTestId = sharedTestId;
            participantType = 'partner2'; // 공유 링크로 접속 시 partner2로 설정
            
            // Change the ID of the startButton for GTM purposes if it's partner2
            if (startButton) { // Ensure startButton element exists
                startButton.id = 'start-button-partner2';
                console.log("Changed start button ID to 'start-button-partner2' for partner2.");
            }
            
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
    
    // 사이트 설명 토글 기능
    toggleDescriptionButton.addEventListener('click', () => {
        const isHidden = siteDescriptionSection.classList.contains('hidden');
        
        if (isHidden) {
            // 설명 보여주기
            siteDescriptionSection.classList.remove('hidden');
            siteDescriptionSection.style.opacity = '1';
            siteDescriptionSection.style.maxHeight = '500px';
            toggleDescriptionButton.innerHTML = '🙈 설명 숨기기';
            toggleDescriptionButton.classList.add('toggled');
        } else {
            // 설명 숨기기
            siteDescriptionSection.style.opacity = '0';
            siteDescriptionSection.style.maxHeight = '0';
            setTimeout(() => {
                siteDescriptionSection.classList.add('hidden');
            }, 400);
            toggleDescriptionButton.innerHTML = '🎉 뭐하는 곳이냐구요? 🎉';
            toggleDescriptionButton.classList.remove('toggled');
        }
    });
    
    startButton.addEventListener('click', () => {
        // currentQuestionIndex = 0; // submitDaysButton 클릭 리스너 내부로 이동
        // userScore = 0; // submitDaysButton 클릭 리스너 내부로 이동
        // userAnswers = []; // submitDaysButton 클릭 리스너 내부로 이동
        startScreen.classList.add('hidden');
        if (siteDescriptionSection) { // 사이트 설명 숨기기
            siteDescriptionSection.classList.add('hidden');
        }
        surpriseQuestionScreen.classList.remove('hidden'); // 깜짝 질문 화면 먼저 표시
        daysInputField.value = ''; // 입력 필드 초기화
        daysInputTimerDisplay.textContent = '0'; // 타이머 표시 초기화
        startSurpriseTimer(); // 타이머 시작
        // testScreen.classList.remove('hidden'); // 이 부분은 깜짝 질문 완료 후로 이동
        resultScreen.classList.add('hidden');
        combinedResultScreen.classList.add('hidden');
        detailedAnswersPageContainer.classList.add('hidden'); // 상세 답변 페이지도 숨김
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
                button.onclick = () => selectAnswer(option.score, option.text); // 답변 텍스트도 전달 (선택 사항)
                answerOptionsContainer.appendChild(button);
            });
            // nextQuestionButton.classList.add('hidden'); // 이전 로직
            if (currentQuestionIndex > 0) {
                prevQuestionButton.classList.remove('hidden');
            } else {
                prevQuestionButton.classList.add('hidden');
            }
        } else {
            finishTest();
        }
    }

    function selectAnswer(score, answerText) { // answerText 파라미터는 이미 받고 있음
        // 현재 질문에 대한 이전 답변이 있다면 제거하고 점수 조정
        const existingAnswerIndex = userAnswers.findIndex(ans => ans.questionIndex === currentQuestionIndex);
        if (existingAnswerIndex > -1) {
            userScore -= userAnswers[existingAnswerIndex].score; // 이전 점수 차감
            userAnswers.splice(existingAnswerIndex, 1); // 이전 답변 제거
        }

        // 새 답변 추가
        userAnswers.push({ 
            questionIndex: currentQuestionIndex, 
            selectedOptionText: answerText, 
            score: score 
        });
        userScore += score; // 새 점수 합산
        
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            displayQuestion();
        } else {
            prevQuestionButton.classList.add('hidden'); // 마지막 질문 후에는 이전 버튼 숨김
            finishTest();
        }
    }

    // prevQuestionButton 이벤트 리스너 수정
    prevQuestionButton.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            // 현재 질문에 대한 답변을 userAnswers에서 제거
            const lastAnswerIndex = userAnswers.findIndex(ans => ans.questionIndex === currentQuestionIndex -1 );
            if (lastAnswerIndex > -1) {
                userScore -= userAnswers[lastAnswerIndex].score;
                userAnswers.splice(lastAnswerIndex, 1);
            }
            currentQuestionIndex--;
            displayQuestion();
        }
    });

    async function finishTest() {
        // resultScreen.classList.add('hidden'); // 개인 결과 화면 표시 로직을 조건부로 변경
        // scoreDisplay.textContent = userScore; // 아래 조건문 내부로 이동
        // resultSummaryDisplay.textContent = resultSummary; // 아래 조건문 내부로 이동
        testScreen.classList.add('hidden'); // 테스트 화면 숨기기

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
                    daysMet: userDaysMet,
                    timeTakenDays: surpriseTimeTaken,
                    answers: userAnswers // 상세 답변 배열 전송 (이미 구현됨)
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save test results');
            }

            currentTestId = data.testId; // The ID of the test just taken
            // testScreen.classList.add('hidden'); // 위치 이동: try 블록 시작 부분으로

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
            testScreen.classList.add('hidden'); // 오류 발생 시에도 테스트 화면 숨기기
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
        const loadingMessageContainer = document.getElementById('loadingMessageContainer');
        const genericLoadingText = document.getElementById('genericLoadingText');
        const longWaitMessageText = document.getElementById('longWaitMessageText');
        const viewDetailedAnswersButton = document.getElementById('viewDetailedAnswersButton'); // 버튼 ID 가져오기
        let longLoadTimerId = null;

        testScreen.classList.add('hidden'); // 테스트 화면 숨기기

        // 로딩 메시지 표시 (초기 - 일반 메시지)
        if (loadingMessageContainer && genericLoadingText && longWaitMessageText) {
            genericLoadingText.textContent = "결과를 불러오는 중입니다...";
            longWaitMessageText.classList.add('hidden'); // 긴 대기 메시지는 일단 숨김
            loadingMessageContainer.classList.remove('hidden');

            // 일정 시간(예: 3초) 후 "30초 소요" 메시지 표시 설정
            longLoadTimerId = setTimeout(() => {
                longWaitMessageText.classList.remove('hidden');
            }, 3000); // 3초 후 실행 (이 시간은 조절 가능)
        }

        // 다른 화면 숨김 (필요에 따라)
        // resultScreen.classList.add('hidden'); // 이 함수 호출 전에 이미 숨겨져 있을 수 있음

        try {
            const response = await fetch(`${API_BASE_URL}/test/pair/${originalTestId}`);
            const data = await response.json();

            console.log('Combined results data from server:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch combined results');
            }

            const partner1Result = data.partner1Test;
            const partner2Result = data.partner2Test;

            console.log('Partner 1 Result (from server):', partner1Result);
            console.log('Partner 2 Result (from server):', partner2Result);

            // Check if both results are valid objects
            if (partner1Result && typeof partner1Result === 'object' && partner2Result && typeof partner2Result === 'object') {
                // My results (partner2)
                myScoreCombined.textContent = partner2Result.hasOwnProperty('score') ? partner2Result.score : '오류';
                mySummaryCombined.textContent = partner2Result.hasOwnProperty('resultSummary') ? partner2Result.resultSummary : '';

                if (partner2Result.hasOwnProperty('daysMet') && partner2Result.daysMet !== null) {
                    myDaysCombinedDisplay.textContent = partner2Result.daysMet;
                } else {
                    myDaysCombinedDisplay.textContent = '입력 안함';
                }

                if (partner2Result.hasOwnProperty('timeTakenDays') && partner2Result.timeTakenDays !== null) {
                    myTimeDaysCombinedDisplay.textContent = partner2Result.timeTakenDays;
                } else {
                    myTimeDaysCombinedDisplay.textContent = 'N/A';
                }

                // Partner's results (partner1)
                partnerScoreCombined.textContent = partner1Result.hasOwnProperty('score') ? partner1Result.score : '오류';
                partnerSummaryCombined.textContent = partner1Result.hasOwnProperty('resultSummary') ? partner1Result.resultSummary : '';

                // Use partnerDaysMet (from URL params, for P1) if available, otherwise fallback to P1 data from server
                if (partnerDaysMet !== null) {
                    partnerDaysCombinedDisplay.textContent = partnerDaysMet;
                } else if (partner1Result.hasOwnProperty('daysMet') && partner1Result.daysMet !== null) {
                    partnerDaysCombinedDisplay.textContent = partner1Result.daysMet;
                } else {
                    partnerDaysCombinedDisplay.textContent = '입력 안함';
                }

                // Use partnerTimeTakenDays (from URL params, for P1) if available, otherwise fallback to P1 data from server
                if (partnerTimeTakenDays !== null) {
                    partnerTimeDaysCombinedDisplay.textContent = partnerTimeTakenDays;
                } else if (partner1Result.hasOwnProperty('timeTakenDays') && partner1Result.timeTakenDays !== null) {
                    partnerTimeDaysCombinedDisplay.textContent = partner1Result.timeTakenDays;
                } else {
                    partnerTimeDaysCombinedDisplay.textContent = 'N/A';
                }
                
                resultScreen.classList.add('hidden'); 
                combinedResultScreen.classList.remove('hidden');

                // "각자 선택한 답변 보기" 버튼 표시 로직
                if (participantType === 'partner2' && viewDetailedAnswersButton) {
                    viewDetailedAnswersButton.classList.remove('hidden');
                    viewDetailedAnswersButton.onclick = () => {
                        const currentUrl = new URL(window.location.href);
                        currentUrl.searchParams.set('view_answers', 'true');
                        // originalTestId는 이미 URL의 test_id로 존재해야 함
                        // days1과 time1 파라미터도 현재 URL에 있어야 함 (combined-result-screen에 도달했다면)
                        window.location.href = currentUrl.toString();
                    };
                } else if (viewDetailedAnswersButton) {
                    viewDetailedAnswersButton.classList.add('hidden');
                }

            } else {
                console.log('One or both partner results are missing or not valid objects. Data:', data);
                // Fallback: Display error messages or defaults
                myScoreCombined.textContent = "오류";
                mySummaryCombined.textContent = "결과 정보를 가져오는 데 실패했습니다.";
                myDaysCombinedDisplay.textContent = 'N/A';
                myTimeDaysCombinedDisplay.textContent = 'N/A';

                partnerScoreCombined.textContent = "오류";
                partnerSummaryCombined.textContent = "결과 정보를 가져오는 데 실패했습니다.";
                partnerDaysCombinedDisplay.textContent = 'N/A';
                partnerTimeDaysCombinedDisplay.textContent = 'N/A';

                // Attempt to display partner1's data if it alone is valid
                if (partner1Result && typeof partner1Result === 'object') {
                    partnerScoreCombined.textContent = partner1Result.hasOwnProperty('score') ? partner1Result.score : "오류";
                    partnerSummaryCombined.textContent = partner1Result.hasOwnProperty('resultSummary') ? partner1Result.resultSummary : "";
                    if (partnerDaysMet !== null) {
                        partnerDaysCombinedDisplay.textContent = partnerDaysMet;
                    } else if (partner1Result.hasOwnProperty('daysMet') && partner1Result.daysMet !== null) {
                        partnerDaysCombinedDisplay.textContent = partner1Result.daysMet;
                    } else {
                        partnerDaysCombinedDisplay.textContent = '입력 안함';
                    }
                    if (partnerTimeTakenDays !== null) {
                        partnerTimeDaysCombinedDisplay.textContent = partnerTimeTakenDays;
                    } else if (partner1Result.hasOwnProperty('timeTakenDays') && partner1Result.timeTakenDays !== null) {
                        partnerTimeDaysCombinedDisplay.textContent = partner1Result.timeTakenDays;
                    } else {
                        partnerTimeDaysCombinedDisplay.textContent = 'N/A';
                    }
                }
                
                resultScreen.classList.add('hidden'); 
                combinedResultScreen.classList.remove('hidden');
            }

        } catch (error) {
            console.error('Error fetching combined results:', error);
            myScoreCombined.textContent = "오류";
            mySummaryCombined.textContent = ""; 
            myDaysCombinedDisplay.textContent = "N/A";
            myTimeDaysCombinedDisplay.textContent = "N/A";

            partnerScoreCombined.textContent = "오류";
            partnerSummaryCombined.textContent = `결과 비교 중 오류: ${error.message}`;
            partnerDaysCombinedDisplay.textContent = "N/A";
            partnerTimeDaysCombinedDisplay.textContent = "N/A";
            
            resultScreen.classList.add('hidden'); 
            combinedResultScreen.classList.remove('hidden'); 
            testScreen.classList.add('hidden'); // 여기에도 추가 (혹시 모를 경우 대비)
        } finally {
            // 로딩 메시지 숨김
            if (loadingMessageContainer) {
                loadingMessageContainer.classList.add('hidden');
            }
            // 설정된 타이머가 있다면 해제 (결과가 빨리 와서 "30초" 메시지가 뜨기 전에)
            if (longLoadTimerId) {
                clearTimeout(longLoadTimerId);
            }
        }
    }


    function getResultSummary(score) {
        // 총 10문제, 문제당 최대 10점, 총점 100점 기준 (낮을수록 쿨함, 높을수록 질투심 강함)
        // 점수 로직을 반대로 변경: 높을수록 질투심 강한 메시지가 먼저 나오도록
        if (score >= 80) return `내 옆엔 오직 나뿐! 레전드 질투심을 보이는 당신
"도대체 그 친구가 왜 자꾸 너한테 연락하는 거야? 나랑 만나면서 굳이 그 친구랑 볼 필요 있어? 앞으로 그 친구 만나지 마."`; // 80-100점 (가장 질투심 강함)
        if (score >= 60) return `선 넘지 마라. 이건 좀 아닌데? 꽤나 질투하는 당신
"솔직히 그 친구랑 너무 자주 연락하는 거 아니야?  신경 쓰여. 왜 나 말고 그 친구랑 그렇게 친해?"`; // 60-79점
        if (score >= 40) return `나도 모르게 기분이 나빠져버렷! 왠지 모르게 불편한 당신
"음... 그 친구랑은 자주 만나는 편이야? 뭔가 둘이 분위기가 좀 다른 것 같기도 하고..."`;   // 40-59점
        if (score >= 20) return `어라? 갑자기 촉이 오네? 살짝은 신경 쓰이는 연인의 X사친
"오늘 누구 만났어? 아, 그 친구? 잘 놀았어? 히히."`; // 20-39점
        return `완전 쿨내 진동! 내 사람 믿어주는 당신의 연인
"어? X사친이랑 논다고? 응, 재미있게 놀다 와! 나도 내 할 일 할게!"`; // 0-19점 (가장 쿨함)
    }

    copyLinkButton.addEventListener('click', () => {
        shareLinkInput.select();
        document.execCommand('copy');
        alert('링크가 복사되었습니다!');
    });

    async function renderDetailedAnswersView(testId, container) {
        container.innerHTML = '<p>두 분의 상세 답변을 불러오는 중입니다...</p>';
        // testScreen을 명시적으로 숨김 (이 뷰에서는 사용하지 않음)
        if (testScreen) {
            testScreen.classList.add('hidden');
        }
        if (prevQuestionButton) {
            prevQuestionButton.classList.add('hidden');
        }

        try {
            const response = await fetch(`${API_BASE_URL}/test/pair/${testId}/answers`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '상세 답변 정보를 가져오는데 실패했습니다.');
            }

            const partner1Result = data.partner1Test;
            const partner2Result = data.partner2Test;

            if (!partner1Result || !partner2Result || !partner1Result.answers || !partner2Result.answers) {
                let errorMessage = '상세 답변 정보가 완전하지 않습니다.';
                if (!partner1Result || !partner1Result.answers) errorMessage += ' (애인 정보 부족)';
                if (!partner2Result || !partner2Result.answers) errorMessage += ' (내 정보 부족)';
                throw new Error(errorMessage);
            }
            
            const urlParams = new URLSearchParams(window.location.search);
            const p1Days = urlParams.get('days1') || (partner1Result ? partner1Result.daysMet : '');
            const p1Time = urlParams.get('time1') || (partner1Result ? partner1Result.timeTakenDays : '');

            let detailedViewHtml = `<h2 style="text-align: center; color: #aa2016e0; margin-bottom: 10px; font-size: 1.3em; font-weight: bold;">선택한 답변을 비교해보세요!</h2>
                                  <hr style="margin-bottom: 20px; border: 0; border-top: 1px solid #eee;">`;
            
            questions.forEach((question, index) => {
                const p1AnswerObj = partner1Result.answers.find(ans => ans.questionIndex === index);
                const p2AnswerObj = partner2Result.answers.find(ans => ans.questionIndex === index);

                const p1SelectedText = p1AnswerObj ? p1AnswerObj.selectedOptionText : null;
                const p2SelectedText = p2AnswerObj ? p2AnswerObj.selectedOptionText : null;

                detailedViewHtml += `
                    <div class="question-comparison-block" style="margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                        <h3 style="font-size: 1.1em; color: #333; margin-top:0;">질문 ${index + 1}/${questions.length}: ${question.text}</h3>
                        <div class="answer-options-comparison" style="display: flex; flex-direction: column; gap: 10px;">`;

                question.options.forEach(option => {
                    let buttonStyle = 'background-color: #fff; color: #333; border: 1px solid #ccc;';
                    let selectedByLabels = [];

                    if (option.text === p1SelectedText) {
                        buttonStyle = 'background-color: #e0f0ff; color: #0056b3; border: 1px solid #0056b3; font-weight: bold;'; // 연한 파란색 계열 (애인)
                        selectedByLabels.push('애인 선택');
                    }
                    if (option.text === p2SelectedText) {
                        // 만약 P1도 같은 것을 선택했다면, 스타일을 덮어쓰거나 병합할 수 있음. 여기서는 P2 스타일 우선 또는 다른 색상.
                        // P1과 P2가 같은 답변을 선택한 경우
                        if (option.text === p1SelectedText) {
                             buttonStyle = 'background-color: #d4f0d4; color: #186318; border: 1px solid #186318; font-weight: bold;'; // 연한 초록색 계열 (둘 다)
                             selectedByLabels = ['애인 & 나의 선택']; // 라벨 변경
                        } else {
                             buttonStyle = 'background-color: #ffe0e0; color: #b30000; border: 1px solid #b30000; font-weight: bold;'; // 연한 빨간색/분홍색 계열 (나)
                             selectedByLabels.push('나의 선택');
                        }
                    }
                    
                    detailedViewHtml += `<button class="comparison-option-button" disabled style="${buttonStyle} padding: 10px; text-align: left; border-radius: 5px; cursor: default;">
                                            ${option.text} 
                                            ${selectedByLabels.length > 0 ? ` <span style="font-size: 0.8em; opacity: 0.8;">(${selectedByLabels.join(', ')})</span>` : ''}
                                         </button>`;
                });

                detailedViewHtml += `</div></div>`;
            });
            
            container.innerHTML = detailedViewHtml;


        } catch (error) {
            console.error("Error rendering detailed answers view:", error);
            container.innerHTML = `<p style="color: red;">상세 답변을 표시하는 중 오류가 발생했습니다: ${error.message}</p> 
                                   <p><a href="${window.location.pathname}" class="button">테스트 처음으로 돌아가기</a></p>`;
        }
    }

    // Initialize
    initializeTest();
});
