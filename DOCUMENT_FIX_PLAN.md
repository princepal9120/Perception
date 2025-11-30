# Document Context Fix Plan

## 🚨 The Problem
The AI states "I don't have access to your resume" even when a file is attached.

**Root Cause Analysis:**
1.  **Automatic Retrieval Failure**: When you ask "give me ats score", the system automatically searches the resume for those exact keywords. If the resume doesn't explicitly mention "ATS score", the search returns **0 results**.
2.  **Weak Fallback**: When 0 results are found, the system injects a note saying "No relevant context was retrieved."
3.  **LLM Misinterpretation**: The LLM interprets "No context retrieved" as "I can't read the file," leading to the "I don't have access" response.

## 🛠️ Proposed Solution

We will implement a 3-layer fix to ensure the AI always acknowledges and uses your files.

### 1. Strengthen Fallback Prompts (`prompt_library.py`)
We will rewrite the `no_results_context_prompt` to be much more directive.

**Current:**
> "The documents are available... but no relevant context was retrieved... Please acknowledge..."

**New:**
> "⚠️ **CRITICAL**: The user has uploaded {doc_count} document(s): {doc_list}.
> Although the initial keyword search yielded no results, **YOU DO HAVE ACCESS TO THESE FILES**.
>
> **DO NOT** say you cannot access the files.
> **DO NOT** ask the user to paste the text.
>
> **IMMEDIATE ACTION**: Use the `search_documents` tool with a broader query (e.g., "summary", "full text", or "skills") to read the document content."

### 2. Update System Prompt (`prompt_library.py`)
We will add a "Zero Tolerance" rule for claiming no access.

**Add to `PERCEPTION_SYSTEM_PROMPT`:**
> "⛔ **NEVER** say 'I don't have access to your document' if the system indicates files are uploaded. If your initial search fails, you MUST try again with the `search_documents` tool using different keywords."

### 3. Improve Retrieval Logic (`llm_client.py`)
We will modify the automatic retrieval to be more robust.
- If the user's query is short (like "summary" or "ats score"), we will fetch the **first 3 chunks** of the document automatically, ensuring the AI always has *some* content to start with.

## 📅 Execution Steps

1.  **Modify `server/app/prompts/prompt_library.py`**: Update the prompts.
2.  **Modify `server/app/services/llm_client.py`**: Implement the "always fetch first chunk" fallback.
3.  **Restart Server**: Apply changes.
4.  **Verify**: Upload a resume and ask "give me ats score" again.

## 🚀 Expected Outcome
The AI will say: "I see you've uploaded `resume.pdf`. I'll analyze it for an ATS score..." and then use the tool to read the content.
