import * as vscode from 'vscode';

/**
 * Generate a feedback ID using VSCode's Language Model API (Copilot)
 */
export async function generateLlmId(
    context: string,
    selectedText: string,
    feedbackText: string,
    token: vscode.CancellationToken
): Promise<string | null> {
    try {
        // Select available models - prefer smaller/faster models for ID generation
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'gpt-4o-mini'  // Fast, cheap, sufficient for short ID generation
        });

        // Fallback to any available model if gpt-4o-mini not available
        const availableModels = models.length > 0
            ? models
            : await vscode.lm.selectChatModels({ vendor: 'copilot' });

        if (availableModels.length === 0) {
            // No models available - user may not have Copilot
            return null;
        }

        const prompt = `Generate a short, kebab-case ID (2-4 words, lowercase, hyphens) for this feedback:

Section context: ${context}
Selected text: "${selectedText.substring(0, 100)}"
Feedback: "${feedbackText.substring(0, 100)}"

Reply with ONLY the ID, nothing else. Example: auth-flow-unclear`;

        const messages = [
            vscode.LanguageModelChatMessage.User(prompt)
        ];

        const response = await availableModels[0].sendRequest(messages, {}, token);

        // Collect streamed response
        let result = '';
        for await (const fragment of response.text) {
            result += fragment;
            // Early exit if we have enough characters
            if (result.length > 40) {
                break;
            }
        }

        // Validate and clean the ID
        const id = result.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        return id && id.length >= 3 && id.length <= 30 ? id : null;

    } catch (err) {
        if (err instanceof vscode.LanguageModelError) {
            // Log for debugging but don't break functionality
            console.log('Language model error:', err.message, err.code);
        }
        return null;  // Fallback to heuristic generation
    }
}

/**
 * Check if Copilot language models are available
 */
export async function isCopilotAvailable(): Promise<boolean> {
    try {
        const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
        return models.length > 0;
    } catch {
        return false;
    }
}
