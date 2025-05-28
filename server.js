const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path'); // path 모듈 추가
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const MONGODB_URI = process.env.MONGODB_URI; // .env 파일의 MONGODB_URI 사용

if (!MONGODB_URI) {
  console.error("MongoDB URI가 설정되지 않았습니다. MONGODB_URI 환경 변수를 확인해주세요.");
  process.exit(1);
}

// Middleware
// app.use(cors()); // 기존의 일반적인 cors 사용 대신 아래와 같이 특정 origin을 지정

const corsOptions = {
  origin: 'https://xsachin.netlify.app', // Netlify 프론트엔드 앱의 주소
  optionsSuccessStatus: 200 // 일부 레거시 브라우저(IE11, 다양한 SmartTV)는 204 대신 200을 반환해야 함
};
app.use(cors(corsOptions));

app.use(express.json());
// 정적 파일 (CSS, 클라이언트 JS 등) 제공 설정
app.use(express.static(path.join(__dirname, '')));


// MongoDB Connection with Mongoose
mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('MongoDB connected successfully');
    // 데이터베이스 연결 성공 후 서버 시작
    app.listen(PORT, () => {
        console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    });
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // 연결 실패 시 프로세스 종료
});

// Test Result Schema
const testResultSchema = new mongoose.Schema({
    testId: { type: String, unique: true, required: true, default: uuidv4 },
    participantType: { type: String, enum: ['partner1', 'partner2'], required: true },
    score: { type: Number, required: true },
    resultSummary: { type: String, required: true },
    isSharedLinkOrigin: { type: Boolean, default: false },
    linkedTestId: { type: String, default: null },
    daysMet: { type: Number, default: null }, // <--- 이 필드가 있는지 확인!
    timeTakenDays: { type: Number, default: null }, // <--- 이 필드가 있는지 확인!
    createdAt: { type: Date, default: Date.now },
});

const TestResult = mongoose.model('TestResult', testResultSchema);

// API Routes
// POST: Create a new test result
app.post('/api/test', async (req, res) => {
    try {
        // daysMet와 timeTakenDays를 req.body에서 추출
        const { score, resultSummary, participantType, linkedTestId: clientLinkedTestId, daysMet, timeTakenDays } = req.body;

        if (typeof score !== 'number' || !resultSummary || !participantType) {
            return res.status(400).json({ message: 'Missing required fields: score, resultSummary, participantType' });
        }
        // daysMet와 timeTakenDays에 대한 유효성 검사도 추가할 수 있습니다 (예: 숫자인지).
        // if (typeof daysMet !== 'number' || typeof timeTakenDays !== 'number') {
        //     return res.status(400).json({ message: 'daysMet and timeTakenDays must be numbers.' });
        // }
        
        const newTestId = uuidv4();
        let isOrigin = false;
        let finalLinkedTestId = null;

        if (participantType === 'partner1') {
            isOrigin = true;
        } else if (participantType === 'partner2' && clientLinkedTestId) {
            const partner1Test = await TestResult.findOne({ testId: clientLinkedTestId, isSharedLinkOrigin: true });
            if (!partner1Test) {
                return res.status(404).json({ message: 'Original test for sharing not found or invalid.' });
            }
            finalLinkedTestId = clientLinkedTestId;
            isOrigin = false;
        } else if (participantType === 'partner2' && !clientLinkedTestId) {
            return res.status(400).json({ message: 'Partner2 must provide a linkedTestId from a shared link.' });
        }

        const newTestResult = new TestResult({
            testId: newTestId,
            participantType,
            score,
            resultSummary,
            isSharedLinkOrigin: isOrigin,
            linkedTestId: finalLinkedTestId,
            daysMet: daysMet !== undefined ? daysMet : null, // <--- 저장 로직에 추가
            timeTakenDays: timeTakenDays !== undefined ? timeTakenDays : null, // <--- 저장 로직에 추가
        });

        await newTestResult.save();
        // 저장된 전체 문서를 반환하거나, 필요한 정보만 선택하여 반환할 수 있습니다.
        // newTestResult 객체에는 daysMet와 timeTakenDays가 포함되어 있을 것입니다.
        res.status(201).json(newTestResult);

    } catch (error) {
        console.error('Error saving test result:', error);
        res.status(500).json({ message: 'Server error while saving test result', error: error.message });
    }
});

// GET: Get a single test result by its own testId
app.get('/api/test/:testId', async (req, res) => {
    try {
        const result = await TestResult.findOne({ testId: req.params.testId });
        if (!result) {
            return res.status(404).json({ message: 'Test result not found' });
        }
        res.json(result);
    } catch (error) {
        console.error('Error fetching test result:', error);
        res.status(500).json({ message: 'Server error while fetching test result' });
    }
});

// GET: Get paired test results. :originalTestId is the testId of partner1 (isSharedLinkOrigin = true)
app.get('/api/test/pair/:originalTestId', async (req, res) => {
    try {
        const { originalTestId } = req.params;
        // TestResult.findById(originalTestId) 대신 findOne({ testId: ... }) 사용
        const partner1TestDoc = await TestResult.findOne({ testId: originalTestId });

        if (!partner1TestDoc) {
            return res.status(404).json({ message: 'Original test result not found.' });
        }

        // partner2TestDoc를 찾을 때도 originalTestId는 partner1의 testId를 의미합니다.
        // linkedTestId 필드가 partner1의 testId를 저장하고 있으므로, 이 부분은 그대로 둡니다.
        const partner2TestDoc = await TestResult.findOne({
            linkedTestId: originalTestId, // partner1의 testId
            participantType: 'partner2'
        });

        // 응답 객체 구성 시 daysMet와 timeTakenDays를 명시적으로 포함
        const partner1Response = {
            testId: partner1TestDoc.testId, // 응답에 testId도 포함시켜주면 좋음
            score: partner1TestDoc.score,
            resultSummary: partner1TestDoc.resultSummary,
            participantType: partner1TestDoc.participantType,
            daysMet: partner1TestDoc.daysMet,
            timeTakenDays: partner1TestDoc.timeTakenDays
            // ... 기타 필요한 partner1TestDoc에서 필요한 필드들 ...
        };

        let partner2Response = null;
        if (partner2TestDoc) {
            partner2Response = {
                testId: partner2TestDoc.testId, // 응답에 testId도 포함시켜주면 좋음
                score: partner2TestDoc.score,
                resultSummary: partner2TestDoc.resultSummary,
                participantType: partner2TestDoc.participantType,
                daysMet: partner2TestDoc.daysMet,
                timeTakenDays: partner2TestDoc.timeTakenDays
                // ... 기타 필요한 partner2TestDoc에서 필요한 필드들 ...
            };
        }

        if (!partner2Response) {
            // 파트너2가 아직 테스트를 완료하지 않은 경우의 처리
            return res.status(200).json({
                message: 'Partner 2 has not completed the test yet.',
                partner1Test: partner1Response,
                partner2Test: null
            });
        }

        res.status(200).json({
            partner1Test: partner1Response,
            partner2Test: partner2Response
        });

    } catch (error) {
        console.error('Error fetching paired results:', error);
        // 오류 응답에 오류 객체의 name과 message를 포함시켜 더 자세한 정보 제공
        res.status(500).json({ 
            message: 'Server error while fetching paired results', 
            errorName: error.name, 
            errorMessage: error.message 
        });
    }
});

// 기본 라우트: index.html 파일 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 애플리케이션 종료 시 MongoDB 연결 해제
process.on('SIGINT', async () => {
  console.log('서버 종료 중... MongoDB 연결을 닫습니다.');
  await mongoose.connection.close(); // Mongoose 연결 사용
  process.exit(0);
});
