import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
import PyPDF2
import docx

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes so the frontend can communicate with the backend
CORS(app)

# Initialize Gemini client
gemini_api_key = os.environ.get("GEMINI_API_KEY")
if gemini_api_key and gemini_api_key != "your_gemini_api_key_here":
    genai.configure(api_key=gemini_api_key)

# System prompt defining ClauseAI's behavior
SYSTEM_PROMPT = """You are ClauseAI, a legal assistant. Explain simply. Use structured output. Analyze contracts into key clauses, risks, and summary."""

# Model Selection - Change this to switch models (e.g., "gemini-2.5-flash", "gemini-2.5-pro")
MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
def extract_text_from_pdf(file):
    """Extracts text from an uploaded PDF file."""
    text = ""
    try:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            if page.extract_text():
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text

def extract_text_from_docx(file):
    """Extracts text from an uploaded DOCX file."""
    text = ""
    try:
        doc = docx.Document(file)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error reading DOCX: {e}")
    return text

@app.route("/chat", methods=["POST"])
def chat():
    """Handles chat messages and document analysis."""
    try:
        # Check if a file was uploaded
        file = request.files.get("file")
        message = request.form.get("message", "")
        
        extracted_text = ""
        if file:
            filename = file.filename.lower()
            if filename.endswith('.pdf'):
                extracted_text = extract_text_from_pdf(file)
                message = f"Please analyze this contract document:\n\n{extracted_text}\n\nAdditional user message: {message}"
            elif filename.endswith('.docx'):
                extracted_text = extract_text_from_docx(file)
                message = f"Please analyze this Word document:\n\n{extracted_text}\n\nAdditional user message: {message}"
            else:
                # Fallback for txt or other simple text formats
                try:
                    extracted_text = file.read().decode('utf-8')
                    message = f"Please analyze this document:\n\n{extracted_text}\n\nAdditional user message: {message}"
                except:
                    return jsonify({"error": "Unsupported file format. Please upload a PDF, DOCX, or TXT file."}), 400

        if not message.strip():
            return jsonify({"error": "Message or file is required."}), 400

        # Optional: Catch missing API key scenario
        if not os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY") == "your_gemini_api_key_here":
            return jsonify({"error": "Gemini API Key is missing. Please configure backend/.env with your valid key."}), 500

        # === TEST MODE: MOCK DATA TO BYPASS RATE LIMITS ===
        USE_MOCK_DATA = False
        
        if USE_MOCK_DATA:
            import time
            time.sleep(1.5) # Simulate AI thinking delay
            reply = """### 📄 Legal Contract Analysis Report

I have reviewed the provided information. Here is a professional breakdown of the key legal aspects:

#### 1. Core Summary
This agreement constitutes a binding obligation. It appears to focus heavily on **confidentiality**, **liability**, and **termination conditions**. 

#### 2. Key Clauses Identified
* **Non-Disclosure (NDA):** Standard 3-year term. Protects proprietary data.
* **Limitation of Liability:** Capped at the total amount paid under the contract.
* **Termination:** Requires 30 days written notice by either party.

#### 3. Potential Risks & Flags
> **Warning:** The indemnification clause is slightly broad. I recommend having your lead counsel review the section to ensure it does not expose you to third-party litigation.

#### 4. Recommended Action
You are safe to proceed, but please negotiate the liability cap to be mutual. If you have any specific clauses you'd like me to rewrite, just let me know!"""
        else:
            # Call Gemini API
            model = genai.GenerativeModel(
                model_name=MODEL_NAME,
                system_instruction=SYSTEM_PROMPT
            )
            response = model.generate_content(message)
            reply = response.text

        return jsonify({"reply": reply})

    except Exception as e:
        print(f"Error in /chat endpoint: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Run the Flask server
    app.run(debug=True, port=5000)
