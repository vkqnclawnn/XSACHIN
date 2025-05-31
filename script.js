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
    // const nextQuestionButton = document.getElementById('next-question-button'); // 이전 ID
    const prevQuestionButton = document.getElementById('prev-question-button'); // 새 ID로 변경 (HTML도 수정 필요)
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

    // Updated questions array with 10 questions, scores set (low score = cool, high score = jealous)
    const questions = [
        { // 1. 가장 일반적인 소통
            text: "애인이 X사친과 밤늦게까지 메신저로 대화하는 것은 괜찮다.",
            options: [
                { text: "전혀 상관없다", score: 0 },
                { text: "가끔은 괜찮다", score: 2 },
                { text: "자주는 좀 그렇다", score: 5 },
                { text: "왠만하면 안 했으면 좋겠다", score: 8 },
                { text: "절대 안 된다", score: 10 }
            ]
        },
        { // 2. 고민 상담
            text: "애인이 X사친과 고민을 들어주며 위로해주는 것은 괜찮다.",
            options: [
                { text: "얼마든지 괜찮다", score: 0 },
                { text: "필요하다면 그럴 수 있다", score: 2 },
                { text: "가끔은 괜찮지만, 나한테 먼저 말했으면 좋겠다", score: 5 },
                { text: "왠만하면 나하고만 했으면 좋겠다", score: 8 },
                { text: "절대 안 된다", score: 10 }
            ]
        },
        { // 3. 별명 사용
            text: "애인이 X사친과 별명으로 친근하게 부를 수 있다.",
            options: [
                { text: "전혀 신경 안 쓴다", score: 0 },
                { text: "그럴 수 있다고 생각한다", score: 2 },
                { text: "둘만 아는 애칭이 아니라면 괜찮다", score: 5 },
                { text: "좀 거슬린다", score: 8 },
                { text: "절대 안 된다", score: 10 }
            ]
        },
        { // 4. 선물 교환
            text: "애인이 X사친과 생일이나 기념일 선물을 챙겨줄 수 있다.",
            options: [
                { text: "얼마든지 괜찮다", score: 0 },
                { text: "가벼운 선물 정도는 괜찮다", score: 2 },
                { text: "상황 봐서 괜찮을 수도 있다", score: 5 },
                { text: "왠만하면 안 했으면 좋겠다", score: 8 },
                { text: "절대 안 된다", score: 10 }
            ]
        },
        { // 5. 가벼운 신체 접촉
            text: "애인이 X사친과 가벼운 신체 접촉(하이파이브, 어깨동무 등)을 하는 것은 괜찮다.",
            options: [
                { text: "전혀 신경 안 쓴다", score: 0 },
                { text: "하이파이브 정도는 괜찮다", score: 2 },
                { text: "상황에 따라 다를 것 같다", score: 5 },
                { text: "좀 불편하다", score: 8 },
                { text: "절대 안 된다", score: 10 }
            ]
        },
        { // 6. 단둘이 식사
            text: "애인이 X사친과 단둘이 저녁 식사를 하는 것은 괜찮다.",
            options: [
                { text: "매우 괜찮다", score: 0 },
                { text: "가끔은 괜찮다", score: 2 },
                { text: "점심 정도면 괜찮다", score: 5 },
                { text: "왠만하면 안 했으면 좋겠다", score: 8 },
                { text: "절대 안 된다", score: 10 }
            ]
        },
        { // 7. 단둘이 영화
            text: "애인이 X사친과 단둘이 영화를 보러 가는 것은 괜찮다.",
            options: [
                { text: "매우 괜찮다", score: 0 },
                { text: "친한 사이면 그럴 수 있다", score: 2 },
                { text: "썩 내키지는 않는다", score: 5 },
                { text: "왠만하면 안 갔으면 좋겠다", score: 8 },
                { text: "절대 안 된다", score: 10 }
            ]
        },
        { // 8. 커플룩 의심
            text: "애인이 X사친과 커플룩처럼 보이는 옷(예: 같은 브랜드, 같은 색상)을 맞춰 입고 단체 모임에 참석 할 수 있다.",
            options: [
                { text: "전혀 신경 안 쓴다, 우연일 수도 있다", score: 0 },
                { text: "신경은 쓰이지만 그럴 수도 있다", score: 2 },
                { text: "썩 기분 좋지는 않다", score: 5 },
                { text: "절대 안 된다고 생각한다", score: 8 },
                { text: "상상도 하기 싫다", score: 10 }
            ]
        },
        { // 9. 휴대폰 배경화면
            text: "애인이 X사친과 함께 찍은 셀카를 자신의 휴대폰 배경화면으로 설정할 수 있다.",
            options: [
                { text: "전혀 상관없다", score: 0 },
                { text: "단체 사진이면 괜찮다", score: 2 },
                { text: "단둘이 찍은 거라면 좀 그렇다", score: 5 },
                { text: "절대 안 된다", score: 8 },
                { text: "이건 선 넘었다", score: 10 }
            ]
        },
        { // 10. 데이트 약속 변경
            text: "애인이 X사친과의 약속 때문에 당신과의 데이트를 미룰 수 있다.",
            options: [
                { text: "정말 중요한 일이면 그럴 수 있다", score: 0 },
                { text: "가끔은 그럴 수 있다", score: 2 },
                { text: "이해는 하지만 기분 나쁘다", score: 5 },
                { text: "절대 안 된다", score: 8 },
                { text: "있을 수 없는 일이다", score: 10 }
            ]
        }
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

    function selectAnswer(score, answerText) { // answerText는 userAnswers에 저장할 경우 필요
        userScore += score;
        // userAnswers에 점수와 함께 선택한 답변 텍스트도 저장할 수 있습니다.
        // userAnswers.push({ score: score, text: answerText }); 
        userAnswers.push(score); // 현재는 점수만 저장
        
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            displayQuestion();
        } else {
            prevQuestionButton.classList.add('hidden'); // 마지막 질문 후에는 이전 버튼 숨김
            finishTest();
        }
    }

    // prevQuestionButton 이벤트 리스너 추가
    prevQuestionButton.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            const lastAnswerScore = userAnswers.pop(); // 마지막 답변 점수 가져오고 배열에서 제거
            if (typeof lastAnswerScore === 'number') { // 또는 userAnswers에 객체를 저장했다면 객체 구조에 맞게 수정
                userScore -= lastAnswerScore;
            }
            displayQuestion();
        }
    });

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
        // 총 10문제, 문제당 최대 10점, 총점 100점 기준 (낮을수록 쿨함, 높을수록 질투심 강함)
        if (score <= 19) return `완전 쿨내 진동! 내 사람 믿어주는 당신의 연인
"어? 남사친이랑 논다고? 응, 재미있게 놀다 와! 나도 내 할 일 할게!"

당신은 정말이지 대인배 스타일이네요. 남사친, 여사친 존재를 당연하게 받아들이고,어떤 친구를 만나든 전적으로 믿어줘요. 어쩌면 관계에 대한 확신이 엄청나거나, 각자의 사생활을 존중하는 게 중요하다고 생각하는 사람일 거예요. 당신같은 이런 연인이라면 마음 편하게 친구들을 만날 수 있겠죠?`; // 0-19점 (가장 쿨함)
        if (score <= 39) return `어라? 갑자기 촉이 오네? 살짝은 신경 쓰이는 당신의 연인
"오늘 누구 만났어? 아, 그 친구? 잘 놀았어? 히히."

대놓고 질투하는 건 아닌데, 남사친이나 여사친을 만났다고 하면 괜히 한 번 더 물어보는 스타일이에요.혹시나 하는 마음에 살짝 궁금해하는 정도랄까요? 귀여운 질투라고 할 수 있죠! 당신이 애인을 너무 좋아해서 생기는 자연스러운 반응이니, 예쁘게 봐주세요!`; // 20-39점
        if (score <= 59) return `나도 모르게 시선 강탈! 왠지 모르게 불편한 당신
"음... 그 친구랑은 자주 만나는 편이야? 뭔가 둘이 분위기가 좀 다른 것 같기도 하고..."

이쯤 되면 당신의 눈에는 X사친의 존재가 살짝 거슬리기 시작할 거예요. 대놓고 불평하진 않아도, 연이이 그들과 함께 있을 때의 모습을 좀 더 유심히 보거나, 만남 후의 대화 내용을 파고들 수도 있어요. 아직은 꾹 참고 있지만, 속으로는 연인의 주변 이성에 대한 경계심이 스멀스멀 올라오고 있을지도 몰라요.`;   // 40-59점
        if (score <= 79) return `선 넘지 마라. 이건 좀 아닌데? 꽤나 질투하는 당신
"솔직히 그 친구랑 너무 자주 연락하는 거 아니야? 내가 좀 신경 쓰여. 왜 나 말고 그 친구랑 그렇게 친해?"

이 단계부터는 연인의 질투가 꽤나 직접적으로 드러나요. 연인의 X사친과의 관계에 대해 노골적으로 불만을 표현하거나, 연인에게 조심하라고 이야기할 수도 있어요. 연인을 너무 사랑해서 다른 이성과 관계를 못마땅하게 보는 건데, 이때는 서로 마음을 좀 헤아려 줄 필요가 있어요 친구 관계도 중요하지만, 연인의 마음도 소중하니까요!`; // 60-79점
        return `내 옆엔 오직 나뿐! 레전드 질투심을 보이는 당신
"도대체 그 친구가 왜 자꾸 너한테 연락하는 거야? 나랑 만나면서 굳이 그 친구랑 볼 필요 있어? 앞으로 그 친구 만나지 마."

아마도 당신은 연인을 향한 독점욕이 엄청나게 강할 거예요. X사친과의 모든 교류를 극도로 싫어하고, 친구 관계에 대놓고 개입하려 할 수 있어요. 심지어 연락 자체를 못하게 하거나, 특정 친구를 만나지 말라고 요구할 수도 있죠. 연인을 너무 사랑해서 그런 거겠지만, 이런 경우에는 연인과 솔직하고 진지하게 대화해서 서로의 선을 정하는 게 정말 중요해요.`; // 80-100점 (가장 질투심 강함)
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
        prevQuestionButton.classList.add('hidden'); // 이전 질문 버튼도 숨김

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
