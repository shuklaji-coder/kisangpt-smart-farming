"""
AI chat routes (LLM via Ollama/local provider)
"""

import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

router = APIRouter(tags=["ai"])

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("AI_MODEL", "llama3.1:8b-instruct")
TIMEOUT = int(os.getenv("AI_TIMEOUT_SECONDS", "60"))

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., description="User message")
    language: str = Field(default="hi", description="Response language code")
    emotion: Optional[str] = Field(default=None)
    context: Optional[str] = Field(default=None)
    system_context: Optional[str] = Field(default=None)
    previous_messages: Optional[List[dict]] = Field(default=None)
    model: str = Field(default=DEFAULT_MODEL)

@router.post("/chat")
async def chat(req: ChatRequest):
    """Chat endpoint backed by Ollama-compatible server.
    If OLLAMA_BASE_URL is not reachable, return a safe fallback.
    """
    system_prompt = req.system_context or (
        f"You are KisanGPT, a concise, safe agricultural assistant. Reply in {req.language}."
    )

    # Prepare messages for Ollama /chat
    messages = [
        {"role": "system", "content": system_prompt},
    ]
    if req.previous_messages:
        # keep only minimal last messages to avoid large payloads
        for m in req.previous_messages[-5:]:
            if isinstance(m, dict) and "text" in m and "sender" in m:
                role = "user" if m["sender"] == "user" else "assistant"
                messages.append({"role": role, "content": str(m["text"])})
    messages.append({"role": "user", "content": req.message})

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(
                f"{OLLAMA_BASE_URL}/v1/chat/completions",
                json={
                    "model": req.model,
                    "messages": messages,
                    "temperature": 0.6,
                    "max_tokens": 512,
                },
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"LLM provider error: {resp.text}")
            data = resp.json()
            # OpenAI-compatible schema
            choices = data.get("choices") or []
            content = (
                choices[0]["message"]["content"] if choices and choices[0].get("message") else ""
            )
            if not content:
                content = "माफ़ कीजिए, मैं अभी उत्तर बनाने में असमर्थ हूँ। कृपया थोड़ा बाद में कोशिश करें।"
            return {
                "status": "success",
                "response": content,
                "model": req.model,
                "timestamp": datetime.now().isoformat(),
            }
    except Exception:
        # Safe fallback
        fallback = (
            "मैं अभी ऑफ़लाइन चैट मोड में हूँ. मुख्य सुझाव: \n"
            "• मिट्टी की जाँच कराएँ और स्थानीय कृषि अधिकारी से सलाह लें\n"
            "• मौसम अनुसार सिंचाई/स्प्रे की योजना बनाएं\n"
            "• प्रमाणित बीज और संतुलित उर्वरक का प्रयोग करें"
        )
        return {
            "status": "fallback",
            "response": fallback,
            "model": "offline",
            "timestamp": datetime.now().isoformat(),
        }
