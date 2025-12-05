import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TranslationItem, SuggestionItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const translationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The Traditional Chinese character(s) for the word." },
          jyutping: { type: Type.STRING, description: " The LSHK Jyutping romanization (e.g., 'gwong2 dung1 waa2')." },
          partOfSpeech: { type: Type.STRING, description: "The part of speech (e.g., Noun, Verb, Adj). If unsure, use 'General'." },
        },
        required: ["text", "jyutping", "partOfSpeech"],
      },
    },
  },
  required: ["items"],
};

const suggestionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The Hong Kong Cantonese colloquial word/phrase." },
          jyutping: { type: Type.STRING, description: "LSHK Jyutping." },
          explanation: { type: Type.STRING, description: "Brief meaning or context usage." },
        },
        required: ["text", "jyutping", "explanation"],
      },
    },
  },
  required: ["suggestions"],
};

export const translateToCantonese = async (inputText: string): Promise<TranslationItem[]> => {
  try {
    const prompt = `
      You are a Cantonese language expert and teacher. 
      Your task is to analyze the user's input text and convert it into a structured format for learning.

      Input Text: "${inputText}"

      Rules:
      1. **Segmentation Strategy**:
         - **Respect User Spacing**: If the input text is separated by spaces (e.g., "食飯 瞓覺"), treat each space-separated segment as a distinct, single vocabulary item. Do NOT break these segments down further.
         - **No Spaces**: If the input is a continuous string without spaces (e.g., "身體健康"), treat the **entire string** as one single vocabulary item/phrase. Do not segment it into component words unless it is clearly a long, complex sentence structure. Prioritize keeping it as one unit.

      2. **Content Handling**:
         - **Keep** significant content words (Nouns, Verbs, Adjectives, Idioms).
         - **Remove** only grammatical particles (like 嗎, 呢) if they appear in a long sentence context, but preserve them if they are part of a specific phrase the user typed.

      3. **Output Format**:
         - Convert the retained words to **Traditional Chinese**.
         - Provide the **LSHK Jyutping** (Hong Kong Linguistic Society) romanization with tone numbers.
         - Return the result as a JSON object matching the schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: translationSchema,
        temperature: 0.1, 
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");

    const parsed = JSON.parse(jsonText);
    return parsed.items || [];

  } catch (error) {
    console.error("Gemini Translation Error:", error);
    throw error;
  }
};

export const getColloquialSuggestions = async (word: string): Promise<SuggestionItem[]> => {
  try {
    const prompt = `
      The user is learning Cantonese. They have selected the word: "${word}".
      
      Provide 2 to 3 **Hong Kong colloquial Cantonese** synonyms, slang, or more natural spoken alternatives for this word.
      
      Example:
      If input is "吃飯" (Eat rice/Have a meal), output "食飯" (Standard spoken) and "食嘢" (Eat something).
      If input is "冰淇淋" (Ice cream), output "雪糕".
      If input is "老師" (Teacher), output "阿Sir" or "Miss" (if common context applies) or just return the same if it is already natural.

      Output JSON with 'text' (Traditional Chinese), 'jyutping', and 'explanation'.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: suggestionSchema,
        temperature: 0.4,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");

    const parsed = JSON.parse(jsonText);
    return parsed.suggestions || [];
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};