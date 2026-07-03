import axios from "axios";
import { ICreateTtsResponse } from "../../types/tts";
import { STATUS_CODE } from "../../constants";

const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

const cleanVerseNumbers = (text: string): string =>
  text.replace(/\s*\d+\s*/g, " ").replace(/\s{2,}/g, " ").trim();

export const createTtsService = async (
  text: string,
): Promise<ICreateTtsResponse> => {
  console.log("IN - createTtsService");

  const cleanedText = cleanVerseNumbers(text);

  try {
    const { data } = await axios.post(
      GOOGLE_TTS_URL,
      {
        input: { text: cleanedText },
        voice: { languageCode: "pt-BR", name: "pt-BR-Neural2-B" },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.9 },
      },
      { params: { key: process.env.GOOGLE_TTS_API_KEY } },
    );

    console.log("OUT - createTtsService");
    return { audioContent: data.audioContent };
  } catch (error: any) {
    console.error("ERR - createTtsService - Google TTS:", error?.response?.status);
    throw {
      statusCode: STATUS_CODE.BAD_GATEWAY,
      message: "Google TTS request failed",
      errors: error?.response?.data,
    };
  }
};
