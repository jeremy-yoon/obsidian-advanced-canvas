import { CanvasNodeType } from "src/@types/Canvas";

export interface StyleAttributeOption {
	icon: string;
	label: string;
	value: string | null; // The element with the null value is the default
}

export interface StyleAttribute {
	datasetKey: string;
	label: string;
	nodeTypes?: CanvasNodeType[];
	options: StyleAttributeOption[];
}

export const BUILTIN_NODE_STYLE_ATTRIBUTES = [
	{
		datasetKey: "shape",
		label: "프롬프트",
		nodeTypes: ["text"],
		options: [
			{
				icon: "rectangle-horizontal",
				label: "기본",
				value: null,
			},
			{
				icon: "shape-pill",
				label: "구조",
				value: "structure",
			},
			{
				icon: "diamond",
				label: "기반지식",
				value: "knowledge",
			},
			{
				icon: "shape-parallelogram",
				label: "페르소나",
				value: "persona",
			},
			{
				icon: "circle",
				label: "예시",
				value: "example",
			},
			{
				icon: "shape-predefined-process",
				label: "목표",
				value: "goal",
			},
			{
				icon: "shape-document",
				label: "키워드",
				value: "keyword",
			},
			{
				icon: "shape-database",
				label: "필수조건",
				value: "mandatory",
			},
			{
				icon: "shape-database",
				label: "선택조건",
				value: "optional",
			},
			{
				icon: "shape-database",
				label: "선택조건",
				value: "tone-and-manner",
			},
		],
	},
] as StyleAttribute[];

export const BUILTIN_EDGE_STYLE_ATTRIBUTES = [
	{
		datasetKey: "path",
		label: "Path Style",
		options: [
			{
				icon: "path-solid",
				label: "Solid (default)",
				value: null,
			},
			{
				icon: "path-dotted",
				label: "Dotted",
				value: "dotted",
			},
			{
				icon: "path-short-dashed",
				label: "Short Dashed",
				value: "short-dashed",
			},
			{
				icon: "path-long-dashed",
				label: "Long Dashed",
				value: "long-dashed",
			},
		],
	},
	{
		datasetKey: "arrow",
		label: "Arrow Style",
		options: [
			{
				icon: "arrow-triangle",
				label: "Triangle (default)",
				value: null,
			},
			{
				icon: "arrow-triangle-outline",
				label: "Triangle Outline",
				value: "triangle-outline",
			},
			{
				icon: "arrow-thin-triangle",
				label: "Thin Triangle",
				value: "thin-triangle",
			},
			{
				icon: "arrow-halved-triangle",
				label: "Halved Triangle",
				value: "halved-triangle",
			},
			{
				icon: "arrow-diamond",
				label: "Diamond",
				value: "diamond",
			},
			{
				icon: "arrow-diamond-outline",
				label: "Diamond Outline",
				value: "diamond-outline",
			},
			{
				icon: "arrow-circle",
				label: "Circle",
				value: "circle",
			},
			{
				icon: "arrow-circle-outline",
				label: "Circle Outline",
				value: "circle-outline",
			},
		],
	},
	{
		datasetKey: "pathfindingMethod",
		label: "Pathfinding Method",
		options: [
			{
				icon: "pathfinding-method-bezier",
				label: "Bezier (default)",
				value: null,
			},
			{
				icon: "slash",
				label: "Direct",
				value: "direct",
			},
			{
				icon: "pathfinding-method-square",
				label: "Square",
				value: "square",
			},
			{
				icon: "map",
				label: "A*",
				value: "a-star",
			},
		],
	},
] as StyleAttribute[];
