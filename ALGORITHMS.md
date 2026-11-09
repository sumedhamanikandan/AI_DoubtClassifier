# DoubtAI — Algorithms and Techniques

DoubtAI uses a **hybrid AI architecture**. A configured Large Language Model generates
the content (explanation, candidate questions, resources, quiz), and our own
algorithms, written from scratch in `backend/algorithms.py`, **classify, validate,
score and rank** that content. No black-box library is used for the algorithms,
so every formula below maps directly to code you can show.

## Processing pipeline for one doubt

```
Student doubt
   │
   ▼
1. Text preprocessing ──► tokens
   │
   ├──► 2. Naive Bayes domain classifier ──► domain probabilities
   │
   ├──► 3. TF-IDF + cosine ──► find similar past questions (answers are not reused)
   │
   ▼
4. Gemini Google Search grounding ──► direct answer + citations
   │ (provider fallback)
   └──► Wikipedia (study/general) + GDELT (current affairs)
   │
   ▼
5. LLM generation (retry with exponential backoff + output validation)
   │
   ▼
6. Weighted ensemble ──► final DOMAIN, DIFFICULTY (with Bloom's taxonomy), CONFIDENCE
   │
   ▼
7. Hybrid ranking ──► similar questions (TF-IDF + LLM), resources (content-based score)
   │
   ▼
8. Single database transaction ──► MySQL
```

The result screen has a **"How DoubtAI analysed this"** panel that shows the
output of every step live. Use it during your demo.

---

## 1. Text preprocessing (NLP)

**Code:** `tokenize()`, `stem()`, `preprocess()`

Steps:

1. **Lowercasing**, so "BST" and "bst" become the same word.
2. **Tokenization** with the regular expression `[a-z0-9][a-z0-9+#]*`, which keeps `c++` and `c#` intact.
3. **Stop-word removal.** Very common words (is, the, what, how…) carry no topic
   information, so they are removed.
4. **Stemming.** A light suffix-stripping stemmer (simplified Porter stemmer)
   reduces word forms to a common root: `trees → tree`, `sorting → sort`,
   `studies → study`.

**Example:** "What is a Binary Search Tree and how does insertion work?"
→ `[binary, search, tree, insertion, work]`

---

## 2. TF-IDF vectorization

**Code:** `class TfidfVectorizer`

Converts text into a numeric vector where each word gets a weight.

```
TF(t, d)  = (count of term t in document d) / (total terms in d)
IDF(t)    = ln( (1 + N) / (1 + DF(t)) ) + 1          ← smoothed IDF
TF-IDF    = TF × IDF,   then the vector is L2-normalised
```

N is the number of documents and DF(t) is the number of documents containing t.

**Why:** a word like "photosynthesis" appears in very few documents, so it gets a
high IDF and a high weight. A word like "work" appears everywhere, so it gets a
low weight. **Smoothing** (+1) avoids division by zero. **L2 normalisation**
makes long and short questions comparable.

**Corpus used to learn IDF:** the seed training set plus every stored doubt
(the most recent 500) plus the texts in the current request.

**Keyword extraction** (`extract_keywords`) returns the 5 terms with the highest
TF-IDF weight in the doubt.

---

## 3. Cosine similarity

**Code:** `cosine_similarity()`

```
cos(θ) = (A · B) / (|A| × |B|)
```

This measures the angle between two TF-IDF vectors: 1 means the same words in
the same proportions, and 0 means no words in common. Because TF-IDF weights are
never negative, the result always lies between 0 and 1.

**Used for:** similar-question retrieval and resource ranking.

---

## 4. Similar-question lookup (answers are not cached)

**Code:** `find_duplicate()` in `algorithms.py`, doubt analysis in `main.py`

TF-IDF cosine similarity compares the new question with prior questions and
reports the closest match. The prior answer is not reused: every submission
gets a fresh answer and fresh source retrieval, preventing outdated or
incorrect saved answers from silently overriding current results.

## Grounded reference retrieval

When Gemini is configured, the backend enables its Google Search grounding
tool so the model can answer questions from current web results and return
citations. As a fallback, study/general questions retrieve Wikipedia extracts;
time-sensitive political questions retrieve a matching Wikipedia reference
and recent GDELT headlines. Retrieved source links are returned to the
frontend. If both answer generation and source retrieval fail, the fallback
states that it could not verify the answer instead of inventing generic prose.

---

## 5. Multinomial Naive Bayes classifier (domain)

**Code:** `class NaiveBayesClassifier`, `build_domain_classifier()`

Predicts the **domain** from a fixed set of 10: Computer Science & IT, Mathematics,
Physics, Chemistry, Biology & Life Sciences, Core Engineering, Commerce/Economics
& Management, History & Social Sciences, Languages & Literature, and General Knowledge.

```
P(class | words) ∝ P(class) × Π P(word | class)

P(class)        = documents in class / total documents                 (prior)
P(word | class) = (count(word, class) + 1) / (words in class + |V|)    (likelihood, Laplace smoothing)
```

- **"Naive"** because it assumes every word is independent of the others given the class.
- **Laplace (add-one) smoothing** stops an unseen word from making the probability zero.
- **Log probabilities** are added instead of multiplying tiny numbers, which avoids floating-point underflow.
- The **log-sum-exp trick** (a numerically stable softmax) converts the log scores back into probabilities that sum to 1.
- **Training data:** about 12 labelled seed questions per domain **plus every doubt
  already stored in MySQL**. The model therefore improves as more doubts are asked
  (incremental learning).

---

## 6. Bloom's taxonomy difficulty model (rule-based)

**Code:** `detect_bloom_level()`, `heuristic_difficulty()`

Bloom's taxonomy ranks thinking skills from 1 (lowest) to 6 (highest). The doubt is
scanned for action verbs, and the **highest** matching level is taken:

| Level | Name | Example verbs |
|---|---|---|
| 1 | Remember | define, what is, list, who |
| 2 | Understand | explain, describe, why, how does |
| 3 | Apply | solve, calculate, implement, how to |
| 4 | Analyze | compare, differentiate, difference between |
| 5 | Evaluate | justify, evaluate, pros and cons |
| 6 | Create | design, derive, prove, optimize |

Rule-based difficulty score (0 to 1):

```
score = 0.50 × Bloom level factor      ((level − 1) / 5)
      + 0.20 × length factor           (words / 40, max 1)
      + 0.15 × lexical complexity      (share of words ≥ 9 letters × 3, max 1)
      + 0.15 × multi-part factor       (extra "?", "and", "also", "then")

score < 0.34 → Easy     score < 0.67 → Medium     otherwise → Hard
```

---

## 7. Weighted ensemble (final difficulty and confidence)

**Code:** `ensemble_difficulty()`, `ensemble_confidence()`

An ensemble combines several models so that one model's mistakes are balanced
by the others.

```
Final difficulty = 0.6 × LLM difficulty (Easy 0, Medium 0.5, Hard 1)
                 + 0.4 × rule-based score
                 → mapped back to Easy / Medium / Hard

Final confidence = 0.6 × LLM self-reported confidence
                 + 0.4 × Naive Bayes probability of the chosen domain × 100
```

**Final domain:** the LLM's domain is mapped onto the 10-domain taxonomy (exact
match, then keyword aliases, then string similarity with difflib's
Ratcliff/Obershelp algorithm). If it can't be mapped, the Naive Bayes prediction
is used. When Naive Bayes disagrees with the LLM, the confidence score drops
automatically, and this is shown in the UI.

The **confidence score is no longer only the LLM's guess.** It is partly
computed by our own classifier.

---

## 8. Similar question retrieval (hybrid ranking)

**Code:** `rank_similar_questions()`

Two sources are merged, de-duplicated and sorted, and the top 3 are returned:

| Source | Score |
|---|---|
| **Past doubts** in MySQL (label "Asked before") | TF-IDF cosine similarity × 100 (shown only if ≥ 25%) |
| **LLM-suggested** questions | 0.5 × cosine × 100 + 0.5 × LLM semantic estimate |

TF-IDF captures **lexical** similarity (shared words). The LLM captures
**semantic** similarity (same meaning, different words, e.g. "AVL tree" vs "BST").
Combining them is called hybrid retrieval.

---

## 9. Content-based resource recommendation

**Code:** `rank_resources()`

```
relevance = 0.45 × cosine(resource title, doubt + subject + topic)
          + 0.35 × LLM relevance estimate
          + 0.20 × format fit for the difficulty level
```

Format-fit rule: beginners benefit most from Videos and Notes, while Hard doubts
benefit most from Practice Questions and Documentation (see `TYPE_FIT`).

It is **content-based** filtering because it matches the *content* of the doubt,
not the behaviour of other users (which would be collaborative filtering).

---

## 10. Reliability techniques (`ai_service.py`)

- **Retry with exponential backoff.** Temporary failures (429 rate limit, 5xx
  errors, timeouts) are retried after 1 s and then 2 s. Permanent errors
  (400, 401) fail immediately.
- **Output validation.** Every LLM field is checked and repaired before use:
  difficulty must be Easy/Medium/Hard, scores are clamped to 0–100, a quiz
  question must have 4 options, and invalid resource types become "Article".
  This protects the database ENUM columns.
- **Robust JSON extraction.** Markdown fences are stripped and the text from the
  first `{` to the last `}` is parsed. If parsing fails, the request is retried once.

---

## 11. Database and analytics techniques

- **Normalised relational schema** with junction tables for many-to-many relations.
- **Single transaction per doubt.** `flush()` gets each row's ID and `commit()` runs once at the end, so data is never half-saved.
- **Indexes** on `(subject, topic)` and on `domain`.
- **Progress analytics with SQL aggregation.** `/api/progress/summary` uses `COUNT`,
  `COUNT(DISTINCT)`, `AVG` and `GROUP BY domain` for the dashboard cards, the
  "Doubts by Domain" chart and the quiz performance chart.

---

## Complexity (likely viva question)

For N stored doubts and V vocabulary terms:

- Fitting TF-IDF: O(total tokens in corpus)
- Comparing one doubt against history: O(N × k), where k is the number of terms per doubt (sparse dictionaries)
- Naive Bayes prediction: O(C × k), where C = 10 classes
- History is capped at the 500 most recent doubts to keep each request fast.

**Scaling idea:** precompute and store TF-IDF vectors, use an inverted index, or
move to sentence embeddings with a vector database.

---

## Honest limitations (say these confidently if asked)

- The explanation, candidate questions, resource titles and quiz are **generated
  by the LLM**. Our algorithms score and rank them but don't write them.
- TF-IDF is lexical: two questions with the same meaning but no shared words
  score low on their own. That's why the LLM's semantic score is blended in.
- The Naive Bayes seed data is small (about 120 examples). Accuracy improves as more
  doubts are stored.
- The ensemble weights (0.6 / 0.4, etc.) were chosen by reasoning, not learned
  from data. Tuning them on a labelled dataset is future work.
- Login is still a demo (every request uses `user_id = 1`).
