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
    isSharedLinkOrigin: { type: Boolean, default: false }, // True if this is the first test in a pair
    linkedTestId: { type: String, default: null }, // Stores the testId of the partner1 (if this is partner2's test)
    createdAt: { type: Date, default: Date.now },
});

const TestResult = mongoose.model('TestResult', testResultSchema);

// API Routes
// POST: Create a new test result
app.post('/api/test', async (req, res) => {
    try {
        const { score, resultSummary, participantType, linkedTestId: clientLinkedTestId } = req.body;

        if (typeof score !== 'number' || !resultSummary || !participantType) {
            return res.status(400).json({ message: 'Missing required fields: score, resultSummary, participantType' });
        }
        
        const newTestId = uuidv4();
        let isOrigin = false;
        let finalLinkedTestId = null;

        if (participantType === 'partner1') {
            isOrigin = true;
            // For partner1, clientLinkedTestId should be null or not provided
        } else if (participantType === 'partner2' && clientLinkedTestId) {
            // This is partner2, using a link from partner1
            // Check if partner1's test exists
            const partner1Test = await TestResult.findOne({ testId: clientLinkedTestId, isSharedLinkOrigin: true });
            if (!partner1Test) {
                return res.status(404).json({ message: 'Original test for sharing not found or invalid.' });
            }
            finalLinkedTestId = clientLinkedTestId;
            isOrigin = false;
        } else if (participantType === 'partner2' && !clientLinkedTestId) {
            // Partner2 trying to submit without a linkedTestId - this might be an edge case or error
            // For now, let's treat it as a standalone test, but it won't be pairable later via this flow.
            // Or, you could enforce that partner2 MUST have a linkedTestId.
            // For simplicity, let's allow it but it won't be "linked" in the typical shared flow.
            // isOrigin = true; // Or handle as an error:
            return res.status(400).json({ message: 'Partner2 must provide a linkedTestId from a shared link.' });
        }


        const newTestResult = new TestResult({
            testId: newTestId,
            participantType,
            score,
            resultSummary,
            isSharedLinkOrigin: isOrigin,
            linkedTestId: finalLinkedTestId,
        });

        await newTestResult.save();
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

        const partner1Test = await TestResult.findOne({ testId: originalTestId, isSharedLinkOrigin: true });
        if (!partner1Test) {
            return res.status(404).json({ message: 'Original partner\'s test result not found.' });
        }

        const partner2Test = await TestResult.findOne({ linkedTestId: originalTestId });
        // partner2Test might be null if the second partner hasn't taken the test yet

        res.json({
            partner1Test,
            partner2Test // This will be null if partner2 hasn't completed the test via the link
        });

    } catch (error) {
        console.error('Error fetching paired test results:', error);
        res.status(500).json({ message: 'Server error while fetching paired results' });
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
