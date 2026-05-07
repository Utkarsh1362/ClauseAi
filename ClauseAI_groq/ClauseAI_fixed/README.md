# ClauseAI - Animated Legal Assistant Chatbot ⚖️🤖

ClauseAI is a premium, full-stack legal assistant chatbot powered by the Google Gemini API. It can answer legal questions in simple English, generate legal documents (like NDAs and rent agreements), and analyze uploaded contracts to highlight key points, risks, and summaries.

## 🌟 Features
- **Smart Chatbot:** Answers legal questions simply and clearly using the Gemini AI model.
- **Document Generation:** Automatically drafts NDAs and Rent Agreements based on your details.
- **Contract Analysis:** Upload `.txt` or `.pdf` files, and ClauseAI will summarize risks and extract key points.
- **Premium UI/UX:** Dark glassmorphism theme, smooth sliding animations, bouncing typing indicators, and an animated gradient background.
- **Download Docs:** Save any generated document or response as a `.txt` file with one click.
- **Error Handling:** Full backend error catching and frontend visual feedback.

## 📂 Project Structure
```
ClauseAI/
├── frontend/
│   ├── index.html     # Main UI Layout
│   ├── style.css      # Premium styling, animations & theme
│   └── script.js      # Frontend logic, DOM handling & API calls
├── backend/
│   ├── app.py         # Flask server & Gemini API integration
│   ├── requirements.txt # Python dependencies
│   └── .env           # Environment variables (Add your API key here)
└── README.md
```

## 🚀 How to Run the Project

### 1. Setup Backend (Flask)
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd "C:\Users\ASUS\OneDrive\Desktop\CHATBOT AI\ClauseAI\backend"
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Get a free Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/).
5. Open the `.env` file in the `backend` folder and add your key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
6. Run the Flask server:
   ```bash
   python app.py
   ```
   *The backend will run on `http://127.0.0.1:5000`.*

### 2. Setup Frontend (HTML/CSS/JS)
1. Open the `frontend` folder.
2. Simply double-click `index.html` to open it in your browser. (Alternatively, use a Live Server extension in VS Code for the best experience).
3. Start chatting!

## 💡 Demo Queries
- **Chat:** "What is the difference between a copyright and a trademark?"
- **Draft NDA:** Click the "Draft NDA" action chip and type: "Between TechCorp and John Doe for a new software project. Valid for 2 years."
- **Analyze Contract:** Click "Analyze Contract", upload a PDF or TXT of a contract, and wait for the AI to summarize it.

## 🛠️ Built With
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Backend:** Python, Flask, PyPDF2
- **AI:** Google Gemini API
