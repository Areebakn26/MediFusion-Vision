const Groq = require('groq-sdk');
const fs = require('fs');

const MEDICAL_SYSTEM_PROMPT = `
You are a professional medical scribe for "MediFusion Vision", an advanced AI-powered diagnostic platform specializing in Retinal Diseases, Pneumonia, and Brain Tumors. 

Your task is to analyze the consultation transcript and generate structured clinical notes in valid JSON format.

DISEASE FOCUS:
Prioritize identifying findings related to:
1. Retinal Imaging (Diabetic Retinopathy, Glaucoma, Macular Degeneration)
2. Chest X-rays (Pneumonia Detection)
3. Brain MRI (Tumor Analysis)

IMPORTANT RULES:
1. The transcript may contain mixed Urdu/English. Translate ALL content to professional medical English first.
2. Only include information explicitly mentioned. Never hallucinate.
3. Use null for missing fields; use [] for empty arrays. 
4. Use generic drug names.
5. patientSummary must be in simple plain language for the patient portal.
6. Return ONLY valid JSON.

Return a JSON object with exactly these keys:
{
  "chiefComplaint": "string",
  "historyOfPresentIllness": "string",
  "symptoms": ["array of strings"],
  "medicalHistoryMentioned": ["array of strings"],
  "assessment": "string",
  "plan": "string",
  "followUpInstructions": "string",
  "patientSummary": "2-3 sentence plain-language summary"
}`;

const transcribeAudio = async (audioFilePath) => {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const transcription = await groq.audio.transcriptions.create({
        model: 'whisper-large-v3-turbo',
        file: fs.createReadStream(audioFilePath),
        // response_format defaults to 'json' → returns { text: "..." }
        // language left undefined → auto-detect handles mixed Urdu/English
    });
    // Groq SDK may return a plain string (text mode) or object (json mode) — handle both
    return typeof transcription === 'string' ? transcription : (transcription.text || '');
};

const generateConsultationNotes = async (transcript, patientContext) => {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const patientContextStr = patientContext
        ? JSON.stringify({
            name: patientContext.name,
            age: patientContext.age,
            gender: patientContext.gender,
            bloodGroup: patientContext.bloodGroup,
            allergies: patientContext.allergies,
            currentMeds: patientContext.currentMedications,
            medicalHistory: patientContext.medicalHistories?.map(h => ({
                condition: h.condition,
                type: h.type,
                status: h.status,
                notes: h.notes
            }))
        })
        : 'Not available';

    const userPrompt = `Patient context: ${patientContextStr}\n\nConsultation transcript:\n"""\n${transcript}\n"""`;

    const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.2,
        messages: [
            { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
        ]
    });

    return JSON.parse(completion.choices[0].message.content);
};

module.exports = { transcribeAudio, generateConsultationNotes };
