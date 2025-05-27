const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

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


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
