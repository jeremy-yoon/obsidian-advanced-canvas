import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

export type Message = {
	role: string;
	content: string;
};

export const streamResponse = async (
	apiKey: string,
	messages: ChatCompletionMessageParam[],
	{
		max_tokens,
		model,
		temperature,
	}: {
		max_tokens?: number;
		model?: string;
		temperature?: number;
	} = {},
	cb: any
) => {
	console.log("AI 호출 :", {
		messages,
		model,
		max_tokens,
		temperature,
		isJSON: false,
	});

	const openai = new OpenAI({
		apiKey: apiKey,
		dangerouslyAllowBrowser: true,
	});

	let accumulatedText = ""; // 누적된 텍스트 저장

	try {
		const stream = await openai.chat.completions.create({
			model: model || "gpt-4o-mini",
			messages,
			stream: true,
			max_tokens,
			temperature,
		});

		for await (const chunk of stream) {
			const deltaContent = chunk.choices[0]?.delta?.content;
			if (deltaContent !== undefined) {
				// console.log("AI 델타 내용:", deltaContent); // 델타 내용을 로그로 출력
				accumulatedText += deltaContent; // 누적된 텍스트에 델타 추가
				cb(deltaContent); // 델타 콜백 호출
			}
		}
	} catch (error) {
		console.log("스트림 에러:", error);
		cb(null); // 에러 발생 시 null 콜백
	}

	// console.log("최종 누적 텍스트:", accumulatedText); // 최종 누적된 텍스트 로그 출력
	// cb(accumulatedText); // 스트림 종료 시 최종 누적 텍스트 콜백 호출
};

export const getResponse = async (
	apiKey: string,
	// prompt: string,
	messages: ChatCompletionMessageParam[],
	{
		model,
		max_tokens,
		temperature,
		isJSON,
	}: {
		model?: string;
		max_tokens?: number;
		temperature?: number;
		isJSON?: boolean;
	} = {}
) => {
	console.log("Calling AI :", {
		messages,
		model,
		max_tokens,
		temperature,
		isJSON,
	});

	const openai = new OpenAI({
		apiKey: apiKey,
		dangerouslyAllowBrowser: true,
	});

	// const totalTokens =
	// 	openaiMessages.reduce(
	// 		(total, message) => total + (message.content?.length || 0),
	// 		0
	// 	) * 2;
	// console.log({ totalTokens });

	const completion = await openai.chat.completions.create({
		// model: "gpt-3.5-turbo",
		model: model || "gpt-4-1106-preview",
		messages,
		max_tokens,
		temperature,
		response_format: { type: isJSON ? "json_object" : "text" },
	});

	console.log("AI response", { completion });
	return isJSON
		? JSON.parse(completion.choices[0].message!.content!)
		: completion.choices[0].message!.content!;
};

let count = 0;
export const createImage = async (
	apiKey: string,
	prompt: string,
	{
		isVertical = false,
		model,
	}: {
		isVertical?: boolean;
		model?: string;
	}
) => {
	console.log("Calling AI :", {
		prompt,
		model,
	});
	const openai = new OpenAI({
		apiKey: apiKey,
		dangerouslyAllowBrowser: true,
	});

	count++;
	// console.log({ createImage: { prompt, count } });
	const response = await openai.images.generate({
		model: model || "dall-e-3",
		prompt,
		n: 1,
		size: isVertical ? "1024x1792" : "1792x1024",
		response_format: "b64_json",
	});
	console.log("AI response", { response });
	// console.log({ responseImg: response });
	return response.data[0].b64_json!;
};
