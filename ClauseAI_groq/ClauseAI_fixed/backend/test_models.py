import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")

print(f"API Key loaded: {api_key[:10]}...")
print(f"Configured Model: {model_name}")

genai.configure(api_key=api_key)

try:
    print("\nAvailable models supporting generateContent:")
    available_models = []
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
            available_models.append(m.name)
    
    if f"models/{model_name}" in available_models or model_name in available_models:
        print(f"\nSUCCESS: '{model_name}' is available.")
    else:
        print(f"\nWARNING: '{model_name}' was not found in the list of available models.")

except Exception as e:
    print("Error listing models:", e)
