from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse, StreamingResponse
from app.core.config import settings
import openai
import requests
import tempfile
import os
import io
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from tools import get_tavily_tool, duck_tool
from langgraph.prebuilt import create_react_agent

router = APIRouter()

# Initialize OpenAI client for STT/TTS
openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

# Initialize Agent with Tools (lazy initialization)
agent_executor = None

def get_agent_executor():
    global agent_executor
    if agent_executor is None:
        if not settings.GOOGLE_API_KEY:
            return None
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            api_key=settings.GOOGLE_API_KEY
        )
        # Build tools list, filtering out None
        tools = [t for t in [get_tavily_tool(), duck_tool] if t is not None]
        if not tools:
            return None
        agent_executor = create_react_agent(llm, tools)
    return agent_executor

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file to text using OpenAI Whisper.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    try:
        # Save temp file for STT
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as temp_audio:
            content = await file.read()
            temp_audio.write(content)
            temp_audio_path = temp_audio.name

        try:
            with open(temp_audio_path, "rb") as audio_file:
                transcript_response = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            text = transcript_response.text
        finally:
            if os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)

        return JSONResponse(content={"text": text})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
async def chat_with_agent(text: str = Body(..., embed=True)):
    """
    Process text with an agentic LLM (with search tools).
    Returns the text response.
    """
    executor = get_agent_executor()
    if executor is None:
        raise HTTPException(status_code=503, detail="Agent not available. Check GROQ_API_KEY and tool configuration.")
    
    try:
        # Run the agent
        inputs = {"messages": [("user", text)]}
        result = await executor.ainvoke(inputs)
        
        # Get the last message content
        last_message = result["messages"][-1]
        response_text = last_message.content
        
        return JSONResponse(content={"text": response_text})
        
    except Exception as e:
        print(f"Agent error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/synthesize")
async def synthesize_speech(text: str = Body(..., embed=True)):
    """
    Convert text to speech using ElevenLabs or OpenAI.
    Returns audio stream.
    """
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    try:
        audio_content = None
        
        # Try ElevenLabs first if key is present
        if settings.ELEVENLABS_API_KEY:
            try:
                url = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" # Rachel voice
                headers = {
                    "xi-api-key": settings.ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                }
                data = {
                    "text": text,
                    "model_id": "eleven_monolingual_v1",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.5
                    }
                }
                response = requests.post(url, json=data, headers=headers)
                if response.status_code == 200:
                    audio_content = response.content
            except Exception as e:
                print(f"ElevenLabs error: {e}")
                # Fallback to OpenAI
        
        if not audio_content:
            # OpenAI TTS Fallback
            response = openai_client.audio.speech.create(
                model="tts-1",
                voice="alloy",
                input=text
            )
            audio_content = response.content

        return StreamingResponse(io.BytesIO(audio_content), media_type="audio/mpeg")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
