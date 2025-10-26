"""
Utility to list all available Gemini models for the configured API key.
Run this to see which models you can use for chat and embeddings.
"""
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings

# Ensure API key is loaded
settings.ensure_google_key_env()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("ERROR: No API key found. Set GOOGLE_API_KEY, GEMMI_API_KEY, or GEMINI_API_KEY in .env")
    sys.exit(1)

print(f"Using API key: {api_key[:20]}...")
print("\nFetching available Gemini models...\n")

try:
    import google.generativeai as genai
    
    genai.configure(api_key=api_key)
    
    models = genai.list_models()
    
    chat_models = []
    embedding_models = []
    
    for model in models:
        name = model.name.replace("models/", "")
        supported_methods = [m for m in model.supported_generation_methods]
        
        if "generateContent" in supported_methods:
            chat_models.append(name)
        if "embedContent" in supported_methods:
            embedding_models.append(name)
    
    print("=" * 60)
    print("CHAT MODELS (for LLM_MODEL):")
    print("=" * 60)
    if chat_models:
        for model in chat_models:
            print(f"  • {model}")
    else:
        print("  None found")
    
    print("\n" + "=" * 60)
    print("EMBEDDING MODELS (for EMBEDDING_MODEL):")
    print("=" * 60)
    if embedding_models:
        for model in embedding_models:
            print(f"  • {model}")
    else:
        print("  None found")
    
    print("\n" + "=" * 60)
    print("RECOMMENDATION:")
    print("=" * 60)
    if chat_models:
        print(f"Set in .env:  LLM_MODEL={chat_models[0]}")
    if embedding_models:
        print(f"Set in .env:  EMBEDDING_MODEL={embedding_models[0]}")
    
except ImportError:
    print("ERROR: google-generativeai package not installed. Installing...")
    os.system("pip install google-generativeai")
    print("\nInstalled. Please run this script again.")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
