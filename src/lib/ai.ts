import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const FILER_SYSTEM_PROMPT = `
You are the "Filer" AI for a personal project management system (OS - Organization Strategy). Your job is to act as a natural language parser.
You will be given the human's original Instructions, any supplemental routing notes, the project this item was routed to,
and the list of all known projects.

Return a single JSON object with the keys: "swimlane", "priority", "labels", and "urgency".

Rules:
1. swimlane (string):
   - "Expedite": if instructions imply urgency, external interrupt, bug, stakeholder request, or "wife" task.
   - "Home": if instructions imply a domestic or personal errand.
   - "Habit": if instructions imply a recurring personal development task (study, content creation, etc.).
   - "Project": default for standard project-related work.
2. priority (string):
   - "High" if swimlane is "Expedite" or "Home".
   - "Medium" if swimlane is "Project".
   - "Low" if swimlane is "Habit".
3. labels (array of strings):
   - Add "Job 1 (Income)" if instructions reference Latina, AI Refill, IngePro, Tragaldabas, or Candidatos.
   - Add "Job 2 (Authority)" if instructions reference Portfolio, GitHub Green, Data Science, or Content Creation.
   - Add the matching project name if instructions reference a known project.
4. urgency (string):
   - Must be either "To Do" or "On Hold". Pick "To Do" for items that should move forward immediately; otherwise "On Hold".

You must return only the raw JSON object. Do not include Markdown, commentary, or additional text.
`

const LIBRARIAN_SYSTEM_PROMPT = `
You are an AI Project Analyst. Your job is to analyze a new, incoming task (New_Item) against its surrounding context,
which includes the project's strategic goals (Strategic_Context) and all other existing tasks in the same project (Corpus).

Look for Conflicts, Dependencies, Relations, Redundancies, or Suggestions as defined:
1. Conflict: New item violates a strategic goal.
2. Redundancy: New item duplicates existing work.
3. Relation: New item is logically related to other items.
4. Dependency: New item depends on another item being completed first.
5. Suggestion: Any actionable insight that helps clarify next steps.

Return only a JSON array. Each element must have "type" (Conflict | Dependency | Redundancy | Relation | Suggestion)
and "text" (brief, direct explanation).

If you find nothing, return [].
`

export type FilerResponse = {
  swimlane: string
  priority: string
  labels: string[]
  urgency: "To Do" | "On Hold"
}

export async function callAIFiler(input: Record<string, unknown>): Promise<FilerResponse | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not configured; skipping AI Filer.")
    return null
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: FILER_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(input) }
      ],
      max_output_tokens: 400
    })

    const output = response.output_text.trim()
    const parsed = JSON.parse(output)

    if (
      typeof parsed.swimlane !== "string" ||
      typeof parsed.priority !== "string" ||
      !Array.isArray(parsed.labels) ||
      (parsed.urgency !== "To Do" && parsed.urgency !== "On Hold")
    ) {
      throw new Error("Invalid Filer response")
    }

    return {
      swimlane: parsed.swimlane,
      priority: parsed.priority,
      labels: parsed.labels,
      urgency: parsed.urgency
    }
  } catch (error) {
    console.error("AI Filer failed:", error)
    return null
  }
}

export type LibrarianFinding = {
  type: string
  text: string
}

export async function callAILibrarian(input: Record<string, unknown>): Promise<LibrarianFinding[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not configured; skipping AI Librarian.")
    return []
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: LIBRARIAN_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(input) }
      ],
      max_output_tokens: 600
    })

    const output = response.output_text.trim()
    const parsed = JSON.parse(output)

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid Librarian response")
    }

    return parsed.filter((finding: LibrarianFinding) => finding?.type && finding?.text)
  } catch (error) {
    console.error("AI Librarian failed:", error)
    return []
  }
}

