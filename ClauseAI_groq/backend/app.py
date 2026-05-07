import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv
import PyPDF2
import docx

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Groq client
groq_api_key = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=groq_api_key) if groq_api_key else None

# System prompt defining ClauseAI's behavior
SYSTEM_PROMPT = """You are ClauseAI, a legal assistant. Explain simply. Use structured output. Analyze contracts into key clauses, risks, and summary."""

# Model - llama-3.3-70b-versatile is free and very capable on Groq
MODEL_NAME = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

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
                try:
                    extracted_text = file.read().decode('utf-8')
                    message = f"Please analyze this document:\n\n{extracted_text}\n\nAdditional user message: {message}"
                except:
                    return jsonify({"error": "Unsupported file format. Please upload a PDF, DOCX, or TXT file."}), 400

        if not message.strip():
            return jsonify({"error": "Message or file is required."}), 400

        if not groq_api_key or groq_api_key == "your_groq_api_key_here":
            return jsonify({"error": "Groq API Key is missing. Please configure backend/.env with your valid key."}), 500

        # Call Groq API
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message}
            ],
            max_tokens=1024
        )
        reply = response.choices[0].message.content

        return jsonify({"reply": reply})

    except Exception as e:
        print(f"Error in /chat endpoint: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
