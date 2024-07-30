import { TiktokenModel, encodingForModel } from "js-tiktoken";
import { App, ItemView, Notice } from "obsidian";
import { Canvas, CanvasView, CanvasNode } from "src/@types/Canvas";
// import { AgentBuilderPluginSettings, DEFAULT_SETTINGS } from "src/settings";
import { visitNodeAndAncestors } from "src/obsidian/canvasUtil";
import { readNodeContent } from "src/obsidian/fileUtil";
import { getResponse, streamResponse } from "src/utils/chatgpt";
import { createNode, calcHeight } from "./canvas-helper";

/**
 * Color for assistant notes: 6 == purple
 */
const assistantColor = "6";

/**
 * Height to use for placeholder note
 */
const placeholderNoteHeight = 60;

/**
 * Height to use for new empty note
 */
const emptyNoteHeight = 100;

const NOTE_MAX_WIDTH = 400;

const apiModel = "gpt-3.5-turbo";

const apiKey = "YOUR_API";

const systemPrompt = "SYSTEM PROMPT: ";

const maxDepth = 3;

const maxResponseTokens = 1000;

export const NOTE_MIN_HEIGHT = 400;
export const NOTE_INCR_HEIGHT_STEP = 150;

export function noteGenerator(
	app: App,
	fromNode?: CanvasNode,
	toNode?: CanvasNode
	// console.log: Logger
) {
	console.log("noteGenerator2");
	const canCallAI = () => {
		console.log("noteGenerator3");

		// return true;
		if (!apiKey) {
			new Notice("세팅에서 API 키를 설정해주세요.");
			return false;
		}

		return true;
	};

	const getActiveCanvas = () => {
		const maybeCanvasView = app.workspace.getActiveViewOfType(
			ItemView
		) as CanvasView | null;
		return maybeCanvasView ? maybeCanvasView["canvas"] : null;
	};

	const isSystemPromptNode = (text: string) =>
		text.trim().startsWith("SYSTEM PROMPT");

	const getSystemPrompt = async (node: CanvasNode) => {
		// TODO
		let foundPrompt: string | null = null;

		await visitNodeAndAncestors(node, async (n: CanvasNode) => {
			const text = await readNodeContent(n);
			if (text && isSystemPromptNode(text)) {
				foundPrompt = text.replace("SYSTEM PROMPT", "").trim();
				return false;
			} else {
				return true;
			}
		});

		return foundPrompt || systemPrompt;
	};

	const buildMessages = async (
		node: CanvasNode,
		{
			systemPrompt,
			prompt,
		}: {
			systemPrompt?: string;
			prompt?: string;
		} = {}
	) => {
		// return { messages: [], tokenCount: 0 };

		const encoding = encodingForModel(apiModel as TiktokenModel);

		const messages: any[] = [];
		let tokenCount = 0;

		// Note: We are not checking for system prompt longer than context window.
		// That scenario makes no sense, though.
		const systemPrompt2 = systemPrompt || (await getSystemPrompt(node));
		if (systemPrompt2) {
			tokenCount += encoding.encode(systemPrompt2).length;
		}

		const visit = async (
			node: CanvasNode,
			depth: number,
			edgeLabel?: string
		) => {
			if (maxDepth && depth > maxDepth) return false;

			const nodeData = node.getData();
			let nodeText = (await readNodeContent(node))?.trim() || "";
			const inputLimit = 10000;

			let shouldContinue = true;

			if (nodeText) {
				if (isSystemPromptNode(nodeText)) return true;

				let nodeTokens = encoding.encode(nodeText);
				let keptNodeTokens: number;

				if (tokenCount + nodeTokens.length > inputLimit) {
					// will exceed input limit

					shouldContinue = false;

					// Leaving one token margin, just in case
					const keepTokens = nodeTokens.slice(
						0,
						inputLimit - tokenCount - 1
						// * needed because very large context is a little above
						// * should this be a number from settings.maxInput ?
						// TODO
						// (nodeTokens.length > 100000 ? 20 : 1)
					);
					const truncateTextTo = encoding.decode(keepTokens).length;
					console.log(
						`Truncating node text from ${nodeText.length} to ${truncateTextTo} characters`
					);
					new Notice(
						`Truncating node text from ${nodeText.length} to ${truncateTextTo} characters`
					);
					nodeText = nodeText.slice(0, truncateTextTo);
					keptNodeTokens = keepTokens.length;
				} else {
					keptNodeTokens = nodeTokens.length;
				}

				tokenCount += keptNodeTokens;

				const role: any =
					nodeData.chat_role === "assistant" ? "assistant" : "user";

				if (edgeLabel) {
					messages.unshift({
						content: edgeLabel,
						role: "user",
					});
				}
				messages.unshift({
					content: nodeText,
					role,
				});
			}

			return shouldContinue;
		};

		await visitNodeAndAncestors(node, visit);

		// if (messages.length) {
		if (systemPrompt2)
			messages.unshift({
				role: "system",
				content: systemPrompt2,
			});
		// }

		if (prompt)
			messages.push({
				role: "user",
				content: prompt,
			});

		return { messages, tokenCount };
	};

	const generateNote = async (question?: string) => {
		console.log("noteGenerator4");
		if (!canCallAI()) return;

		console.log("Creating AI note");

		const canvas = getActiveCanvas();
		if (!canvas) {
			console.log("No active canvas");
			return;
		}
		// console.log({ canvas });

		await canvas.requestFrame();

		let node: CanvasNode;
		if (!fromNode) {
			const selection = canvas.selection;
			if (selection?.size !== 1) return;
			const values = Array.from(selection.values());
			node = values[0] as CanvasNode;
		} else {
			node = fromNode;
		}

		if (node) {
			// Last typed characters might not be applied to note yet
			// await canvas.requestSave();

			const { messages, tokenCount } = await buildMessages(node, {
				prompt: question,
			});
			// console.log({ messages });
			if (!messages.length) return;

			let created: CanvasNode;
			if (!toNode) {
				created = createNode(
					canvas,
					{
						// text: "```loading...```",
						text: `\`\`\`Calling AI (${apiModel})...\`\`\``,
						size: { height: placeholderNoteHeight },
					},
					node,
					{
						color: assistantColor,
						chat_role: "assistant",
					},
					question
				);
			} else {
				created = toNode;
				created.setText(`\`\`\`Calling AI (${apiModel})...\`\`\``);
			}

			// new Notice(
			// 	`Sending ${messages.length} notes with ${tokenCount} tokens to GPT`
			// );

			try {
				let firstDelta = true;
				let accumulatedText = ""; // 누적된 텍스트 저장

				await streamResponse(
					apiKey,
					messages,
					{
						model: apiModel,
						max_tokens: maxResponseTokens || undefined,
					},
					(delta?: string) => {
						if (delta !== null && delta !== undefined) {
							accumulatedText += delta; // 누적된 텍스트에 델타 추가
							let newText = accumulatedText; // 누적된 텍스트를 newText에 할당

							if (firstDelta) {
								firstDelta = false;

								created.moveAndResize({
									height: NOTE_MIN_HEIGHT,
									width: created.width,
									x: created.x,
									y: created.y,
								});
							} else {
								const height = calcHeight({
									text: newText,
								});

								if (height > created.height) {
									created.moveAndResize({
										height:
											created.height +
											NOTE_INCR_HEIGHT_STEP,
										width: created.width,
										x: created.x,
										y: created.y,
									});
								}
							}
							created.setText(newText);
						} else {
							console.log(
								"스트림 종료, 누적된 텍스트:",
								accumulatedText
							);
						}
					}
				);
			} catch (error) {
				new Notice(`Error calling GPT: ${error.message || error}`);
				console.log("에러 발생:", error);
				if (!toNode) {
					canvas.removeNode(created);
				}
			}
			await sleep(200);
			await canvas.requestSave();
			// console.log("캔버스 저장 요청됨:", created, created.text);
		}
	};
	return { generateNote, buildMessages };
}
