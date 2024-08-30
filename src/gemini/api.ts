import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const getGeminiResult = async (fileName:string, mime:string):Promise<number> => {
    try {
        const uploadResponse = await fileManager.uploadFile(`./images/${fileName}`, {
            mimeType: mime,
            displayName: fileName,
        });
    
        const model = genAI.getGenerativeModel({
            // Choose a Gemini model.
            model: "gemini-1.5-flash",
        });
        
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResponse.file.mimeType,
                    fileUri: uploadResponse.file.uri
                }
            },
            { text: "Give me 'Measure Value' only with numbers. Dont give me response anything other than numbers." },
        ]);

        const measureValue = result.response.text();
        return parseInt(measureValue, 10);
    }
    catch(error) {
        console.log("Error with gemini api:", error);
        return 0;
    }
}