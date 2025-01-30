import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (or set to ["http://localhost:3000"])
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)
OLLAMA_API_URL = "http://localhost:11434/api/generate"

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat(request: ChatRequest):
    """Sends user message to DeepSeek R1 via Ollama."""
    payload = {
        "model": "deepseek-r1",
        "prompt": request.message,
        "stream": False  # Ensure Ollama sends a complete response
    }
    
    response = requests.post(OLLAMA_API_URL, json=payload)

    print("RAW RESPONSE TEXT:", response.text)  # Log raw response

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Ollama API Error")

    try:
        data = response.json()
    except requests.exceptions.JSONDecodeError:
        print("ERROR: Response is not valid JSON.")
        return {"response": "Error: Model returned an invalid response"}

    return {
        "choices": [
            {
                "message": {
                    "content": data.get("response", "Error: No response received")
                }
            }
        ]
    }