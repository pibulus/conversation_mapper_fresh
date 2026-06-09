import type { ActionItemInput, ConversationGraph } from "../types/index.ts";

export function extractSpeakers(text: string): string[] {
  const speakerSet = new Set<string>();
  const lines = text.split("\n");
  lines.forEach((line) => {
    const match = line.match(/^([\w\s]+):/);
    if (match) {
      speakerSet.add(match[1].trim());
    }
  });
  return Array.from(speakerSet);
}

export function cleanJsonResponse(text: string): string {
  return text
    .trim()
    .replace(/^```(json)?\s*/, "")
    .replace(/\s*```$/, "");
}

export function parseActionItemsResponse(
  text: string,
): ActionItemInput[] {
  const cleanedText = cleanJsonResponse(text);

  try {
    const actionItems = JSON.parse(cleanedText);
    if (!Array.isArray(actionItems)) return [];

    return actionItems.map((item: any) => ({
      description: item.description.charAt(0).toUpperCase() +
        item.description.slice(1),
      assignee: item.assignee === "null" ? null : item.assignee,
      due_date: item.due_date === "null" ? null : item.due_date,
    }));
  } catch (error) {
    console.error("Error parsing action items JSON:", error);
    console.error("Raw text was:", text);
    return [];
  }
}

export function parseGraphResponse(text: string): ConversationGraph {
  let jsonString = cleanJsonResponse(text);
  jsonString = jsonString.replace(/^.*?({.*}).*?$/, "$1");

  try {
    const data = JSON.parse(jsonString);
    return {
      nodes: data.nodes || [],
      edges: data.edges || [],
    };
  } catch (error) {
    console.error("Error parsing JSON response", error, jsonString);
    return { nodes: [], edges: [] };
  }
}
