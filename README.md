# DoubtAI — AI Doubt Classification and Resource Recommender

A full-stack implementation of your project: React frontend, FastAPI backend,
MySQL database, and a **hybrid AI engine**: a configured AI provider generates explanations,
candidate questions, resources and quizzes, while algorithms written from
scratch in `backend/algorithms.py` classify, score and rank them.

**Algorithms used** (full formulas and viva notes in [`ALGORITHMS.md`](ALGORITHMS.md)):
text preprocessing (tokenization, stop-word removal, stemming), TF-IDF,
cosine similarity, Multinomial Naive Bayes, Bloom's taxonomy difficulty
scoring, weighted ensemble, hybrid similar-question retrieval, content-based
resource ranking, TF-IDF duplicate detection, keyword extraction,
retry with exponential backoff, and SQL aggregation analytics.

Each doubt is classified into **Domain → Subject → Topic → Difficulty**, with
an explanation and a computed confidence score.

```
doubtai-fullstack/
├── ALGORITHMS.md   every algorithm explained, with formulas (read before viva)
├── backend/     FastAPI + SQLAlchemy + MySQL + AI provider + reference/news search APIs
│   ├── algorithms.py     TF-IDF, cosine, Naive Bayes, Bloom, ensemble, ranking
│   ├── ai_service.py     AI provider calls, search retrieval, output validation
│   └── migration_v2.sql  upgrade an existing v1 database
└── frontend/    React (Vite) + Tailwind CSS
```

## Architecture

```
React (Vite, port 5173)
   │  fetch() calls
   ▼
FastAPI backend (port 8000)
   │                │                    │
   ▼                ▼                    ▼
MySQL (doubtai_db)  AI provider       Wikipedia / GDELT search
```

The browser never talks to an AI provider directly — every AI call goes through
your FastAPI backend, which keeps your API key private and saves every
result into MySQL before sending it back to React. This is different from
earlier chat-preview versions of this UI, which called Claude straight from
the browser because that's all a claude.ai artifact preview is allowed to
do. This version is a real deployable app.

## 1. Set up MySQL

```bash
cd backend
mysql -u root -p < schema.sql
mysql -u root -p doubtai_db < seed_data.sql
```

**Already created the database with the old version?** Don't drop it. Run the
migration instead, which adds the new `domain`, `bloom_level`,
`algorithm_insights` and `similar_questions.source` columns:

```bash
mysql -u root -p doubtai_db < migration_v2.sql
```

This creates 14 tables (`users`, `doubts`, `similar_questions`, `resources`,
`doubt_resources`, `resource_bookmarks`, `quizzes`, `quiz_questions`,
`quiz_attempts`, `quiz_answers`, `study_plans`, `progress_tracking`,
`feedback`, `admin_logs`) and loads demo data matching what the UI shows
out of the box (the seeded "Sumedha" user, 4 sample doubts, 6 resources,
one 4-question quiz, 4 planner tasks, and a 6-week progress line).

## 2. Set up and run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# then edit .env:
#   DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/doubtai_db
#   Set one provider key: GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY

uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` — you should see the Swagger UI listing
every endpoint. If it loads, your backend is talking to MySQL correctly.

## 3. Set up and run the frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:8000 (default is fine)
npm run dev
```

Open `http://localhost:5173`. Log in (the login screen is a static demo —
it doesn't check credentials against the database yet, see "What's next"
below) and you'll land on the dashboard.

## 4. Try the full loop

1. Type a doubt (any subject — not just CS) on the Dashboard or Ask Doubt
   tab and submit it. It's classified into domain, subject, topic and
   difficulty, explained, and saved to MySQL. Open **How DoubtAI analysed
   this** to see each algorithm's output (keywords, Naive Bayes
   probabilities, Bloom level, ensemble scores, duplicate check).
   Plain arithmetic (for example, `2+2`) is evaluated exactly and returned
   as `4`; other math questions are routed as Mathematics to the configured
   AI provider, with the answer requested before the explanation. When
   Gemini is configured, answers use its Google Search grounding and citations.
   A web-reference/news-search fallback supports study and current-affairs
   questions when grounding is unavailable. Retrieved sources are shown
   with the answer.
   Earlier answers are not reused automatically, so an incorrect or outdated
   response cannot silently replace a fresh answer.
2. Click **Explore Recommended Resources** — the Resources tab shows a
   "From Your Latest Doubts" section pulled straight from the database.
3. Click **Take a Quiz on This Topic** — the 4 quiz questions Claude
   generated for that exact doubt. Submitting saves your score as a
   `quiz_attempts` row.
4. Check **My Doubts** — your new doubt is there, loaded from MySQL.
5. Add a task in **Study Planner** — it's saved and reloads on refresh.
6. Try **Voice Input** (Chrome/Edge — uses the browser's built-in speech
   recognition, no backend needed) and **Upload Image** (sends the image to
   your backend, which asks Claude's vision model to transcribe the
   question in it).

## What's implemented vs. what's next

| Module (from your abstract)        | Status |
|--------------------------------------|--------|
| Doubt Classification & Explanation   | ✅ Live — Claude + Naive Bayes + Bloom's taxonomy ensemble (domain, subject, topic, difficulty, confidence) |
| Similar Question Retrieval           | ✅ Live — TF-IDF cosine over past doubts + AI suggestions (hybrid score) |
| Resource Recommendation              | ✅ Live — content-based weighted ranking, persisted, bookmarking works |
| Quiz Generation                      | ✅ Live — topic-specific, attempts saved |
| Study Planner                        | ✅ Live — full CRUD against MySQL |
| Progress Dashboard                   | ✅ Live — stats, "Doubts by Domain" and quiz performance come from SQL aggregation (`/api/progress/summary`); demo data shows only until you have real rows |
| Feedback Module                      | ✅ Live — saved to MySQL |
| Voice-Based Doubt Submission         | ✅ Live — browser Web Speech API (Chrome/Edge) |
| Image-Based Doubt Recognition (OCR)  | ✅ Live — Claude vision via backend |
| User Authentication                  | ⚠️ Demo only — the login screen doesn't check the database yet; every request is hardcoded to `user_id=1` |
| Admin Dashboard                      | ⬜ Not built — `admin_logs` table exists in the schema but no UI/routes yet |

### Natural next steps
- Real login: add a `/api/auth/login` endpoint (check `password_hash` with
  `passlib`/`bcrypt`) and a JWT or session cookie, then stop hardcoding
  `user_id=1` everywhere.
- Tune the ensemble weights on a labelled set of doubts instead of the
  hand-chosen 0.6 / 0.4 values.
- Build the Admin Dashboard screens (`admin_logs`, user/resource
  management tables) — the database and abstract already account for it.
- Tighten CORS (`allow_origins=["*"]` in `main.py`) to your real frontend
  URL before deploying anywhere public.

## Troubleshooting

- **"Failed to fetch" in the browser console** — the backend isn't running,
  or `VITE_API_URL` doesn't match the port `uvicorn` is on.
- **Answers say they couldn't verify the question** — configure a supported
  AI provider key in `backend/.env` and restart the backend. Public reference
  search can provide sources, but the AI provider is needed to synthesize
  sourced answers and explanations.
- **MySQL connection errors on startup** — double-check `DATABASE_URL` in
  `backend/.env` matches your actual MySQL username/password/host.
- **Voice Input button does nothing** — only Chrome and Edge support the
  Web Speech API well; Firefox/Safari support is limited or absent.
