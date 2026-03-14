const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const googleTTS = require('google-tts-api');
const Algorithm = require('../models/Algorithm');
const { getSystemPrompt } = require('../services/geminiPrompt');

const router = express.Router();
let ai = null;

if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// Helper to clean JSON string from Gemini (removes markdown backticks)
const cleanJson = (str) => {
    let cleaned = str.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return cleaned.trim();
};

// GET all algorithms
router.get('/', async (req, res) => {
    try {
        const algorithms = await Algorithm.find().select('_id title description createdAt').sort({ createdAt: -1 });
        res.json(algorithms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET specific algorithm
router.get('/:id', async (req, res) => {
    try {
        const algorithm = await Algorithm.findById(req.params.id);
        if (!algorithm) return res.status(404).json({ error: 'Not found' });
        res.json(algorithm);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST to generate algorithm
router.post('/generate', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        if (!ai) {
            return res.status(500).json({ error: 'Gemini API is not configured on the server.' });
        }

        const systemPrompt = getSystemPrompt(prompt);

        // Call Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemPrompt,
        });

        const responseText = response.text;
        const jsonStr = cleanJson(responseText);
        const parsedData = JSON.parse(jsonStr);

        // Now we need to extract explanations to generate TTS.
        // The componentCode is a string, which means parsing the explanations from it directly is hard.
        // However, google-tts-api resolves to audio URLs dynamically on the client side,
        // or we can generate base64. Let's return the parsedData so the client can generate TTS on the fly, 
        // or we can extract the explanations if Gemini gives them as a separate array.
        // Since our prompt didn't ask for a separate explanations array, we will just save the generated code.
        // A better approach for TTS is for the client to use standard browser SpeechSynthesis,
        // but the prompt specified a free TTS API. We will use the client-side approach or simple TTS URL generation.

        // We can just rely on google-tts-api to get URLs for the client to use.
        // For now, we will save the raw component and let the Visualizer handle TTS 
        // by dynamically calling a TTS service based on the text.

        let newAlgorithmData = {
            title: parsedData.meta?.title || parsedData.title || prompt,
            description: parsedData.meta?.category || parsedData.description || "Auto-generated visualization",
            audioUrls: []
        };

        if ((parsedData.structure || parsedData.structures) && parsedData.timeline) {
            newAlgorithmData.schemaType = 'dsl';
            newAlgorithmData.dsl = parsedData;
        } else {
            newAlgorithmData.schemaType = 'react';
            newAlgorithmData.componentCode = parsedData.componentCode || JSON.stringify(parsedData);
        }

        const newAlgorithm = new Algorithm(newAlgorithmData);

        await newAlgorithm.save();

        res.status(201).json(newAlgorithm);
    } catch (error) {
        console.error('Generation Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate algorithm' });
    }
});

// Setup multer for file uploads
const multer = require('multer');
const pdf = require('pdf-parse');
const upload = multer({ storage: multer.memoryStorage() });

// POST to generate algorithm from file or text
router.post('/generate-from-file', upload.single('document'), async (req, res) => {
    try {
        let extractedText = req.body.text || '';

        if (req.file) {
            if (req.file.mimetype === 'application/pdf') {
                const pdfData = await pdf(req.file.buffer);
                extractedText += '\n\n' + pdfData.text;
            } else {
                // Assume it's a plain text file if not PDF
                extractedText += '\n\n' + req.file.buffer.toString('utf-8');
            }
        }

        if (!extractedText.trim()) {
            return res.status(400).json({ error: 'No text or valid file provided' });
        }

        if (!ai) {
            return res.status(500).json({ error: 'Gemini API is not configured on the server.' });
        }

        const systemPrompt = getSystemPrompt(
            `Generate a visualization based on the following text/document content:\n\n${extractedText}`
        );

        // Call Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemPrompt,
        });

        const responseText = response.text;
        const jsonStr = cleanJson(responseText);
        const parsedData = JSON.parse(jsonStr);

        let newAlgorithmData = {
            title: parsedData.meta?.title || parsedData.title || req.body.title || 'Extracted Visualization',
            description: parsedData.meta?.category || parsedData.description || "Generated from document",
            audioUrls: []
        };

        if ((parsedData.structure || parsedData.structures) && parsedData.timeline) {
            newAlgorithmData.schemaType = 'dsl';
            newAlgorithmData.dsl = parsedData;
        } else {
            newAlgorithmData.schemaType = 'react';
            newAlgorithmData.componentCode = parsedData.componentCode || JSON.stringify(parsedData);
        }

        const newAlgorithm = new Algorithm(newAlgorithmData);
        await newAlgorithm.save();

        res.status(201).json(newAlgorithm);
    } catch (error) {
        console.error('File Generation Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate algorithm from document' });
    }
});

module.exports = router;
