const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config(); // .env 파일을 사용하기 위해 dotenv 패키지를 불러옵니다 (로컬 개발 시 유용)

const app = express();
const PORT = process.env.PORT || 3000;

// 중요: <db_password>를 실제 데이터베이스 사용자의 비밀번호로 바꾸세요!
// 이미지에서 제공된 연결 문자열을 사용합니다.
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MongoDB URI가 설정되지 않았습니다. MONGODB_URI 환경 변수를 확인해주세요.");
  process.exit(1); // URI가 없으면 애플리케이션을 종료합니다.
}

// MongoClient 인스턴스를 생성합니다.
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Middleware
app.use(cors()); // Consider restricting origin in production
app.use(express.json());

// MongoDB Connection (replace with your MongoDB Atlas URI or Render's MongoDB service URI)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/xsachin_test';
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

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

// 기본 라우트 (테스트용)
app.get('/', (req, res) => {
    res.send('X사친 테스트 백엔드 서버입니다!');
});

// 서버 시작 전에 데이터베이스 연결
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  });
}).catch(console.error);

// 애플리케이션 종료 시 MongoDB 연결 해제 (선택 사항, 서버 환경에 따라 다름)
process.on('SIGINT', async () => {
  console.log('서버 종료 중... MongoDB 연결을 닫습니다.');
  await client.close();
  process.exit(0);
});
