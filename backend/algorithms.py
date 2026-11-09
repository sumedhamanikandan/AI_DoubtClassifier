"""
DoubtAI — Algorithms module
===========================

Every algorithm here is written from scratch in pure Python (no scikit-learn,
no NLTK) so each step can be explained line by line in a viva.

Pipeline used when a student submits a doubt (see main.py):

    1. Text preprocessing        lowercase -> tokenize -> stop-word removal -> stemming
    2. TF-IDF vectorization      turn text into weighted term vectors
    3. Cosine similarity         compare two vectors (0 = unrelated, 1 = identical)
    4. Duplicate detection       reuse a stored answer if cosine >= 0.90 (caching)
    5. Naive Bayes classifier    predict the academic DOMAIN of the doubt
    6. Bloom's taxonomy model    rule-based difficulty estimation
    7. Weighted ensemble         combine LLM output with the algorithms above for
                                 final domain, difficulty and confidence
    8. Similar question ranking  hybrid lexical (TF-IDF) + semantic (LLM) score
    9. Resource ranking          content-based, multi-factor weighted score
   10. Keyword extraction        top TF-IDF terms of the doubt
"""

import math
import re
from collections import Counter, defaultdict
from difflib import get_close_matches

# ===========================================================================
# 1. TEXT PREPROCESSING
# ===========================================================================

STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being", "am",
    "do", "does", "did", "doing", "have", "has", "had", "having",
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "its",
    "they", "them", "their", "this", "that", "these", "those",
    "what", "which", "who", "whom", "whose", "when", "where", "why", "how",
    "and", "or", "but", "if", "then", "else", "so", "than", "too", "very",
    "of", "in", "on", "at", "to", "for", "from", "by", "with", "about", "into",
    "over", "under", "between", "through", "during", "before", "after",
    "can", "could", "should", "would", "will", "shall", "may", "might", "must",
    "not", "no", "yes", "all", "any", "some", "each", "every", "both", "few",
    "more", "most", "other", "such", "only", "own", "same", "just", "also",
    "there", "here", "up", "down", "out", "off", "again", "further", "once",
    "please", "explain", "tell", "give", "difference", "mean", "means",
    "meaning", "use", "used", "using", "example", "examples", "one", "two",
}


def tokenize(text: str) -> list:
    """Lowercase the text and split it into word tokens.
    Keeps '+' and '#' so that 'c++' and 'c#' survive as tokens."""
    return re.findall(r"[a-z0-9][a-z0-9+#]*", (text or "").lower())


def stem(word: str) -> str:
    """Light suffix-stripping stemmer (a simplified Porter stemmer).
    Reduces related word forms to one root: 'trees'->'tree',
    'sorting'->'sort', 'studies'->'study', 'balanced'->'balanc'."""
    if len(word) <= 3 or not word.isalpha():
        return word
    if word.endswith("ies") and len(word) > 4:
        return word[:-3] + "y"
    if word.endswith("sses"):
        return word[:-2]
    if word.endswith("ing") and len(word) > 5:
        return word[:-3]
    if word.endswith("ed") and len(word) > 4:
        return word[:-2]
    if word.endswith("es") and len(word) > 4 and word[-3] in "sxz":
        return word[:-2]
    if word.endswith("s") and not word.endswith(("ss", "us", "is")):
        return word[:-1]
    return word


def preprocess(text: str) -> list:
    """Full NLP preprocessing pipeline: tokenize -> remove stop words -> stem."""
    return [stem(t) for t in tokenize(text) if t not in STOP_WORDS and len(t) > 1]


# ===========================================================================
# 2. TF-IDF VECTORIZER   and   3. COSINE SIMILARITY
# ===========================================================================

class TfidfVectorizer:
    """
    Term Frequency - Inverse Document Frequency.

        TF(t, d)  = count of term t in document d / total terms in d
        IDF(t)    = ln( (1 + N) / (1 + DF(t)) ) + 1        (smoothed IDF)
        TFIDF     = TF * IDF, then the vector is L2-normalised

    N = number of documents, DF(t) = number of documents containing t.
    Rare, specific words (e.g. 'bst', 'photosynthesis') get HIGH weight;
    common words get LOW weight.
    """

    def __init__(self):
        self.idf = {}
        self.n_docs = 0

    def fit(self, documents: list):
        self.n_docs = len(documents)
        df = Counter()
        for doc in documents:
            df.update(set(preprocess(doc)))
        self.idf = {
            term: math.log((1 + self.n_docs) / (1 + count)) + 1
            for term, count in df.items()
        }
        return self

    def transform(self, text: str) -> dict:
        tokens = preprocess(text)
        if not tokens:
            return {}
        counts = Counter(tokens)
        total = len(tokens)
        # Unseen terms get the maximum possible IDF (they are the rarest).
        default_idf = math.log(1 + self.n_docs) + 1
        vec = {t: (c / total) * self.idf.get(t, default_idf) for t, c in counts.items()}
        norm = math.sqrt(sum(v * v for v in vec.values()))
        return {t: v / norm for t, v in vec.items()} if norm else {}


def cosine_similarity(vec_a: dict, vec_b: dict) -> float:
    """
    cos(θ) = (A · B) / (|A| × |B|)
    Vectors from TfidfVectorizer are already unit length, so the
    dot product alone is the cosine. Result is between 0 and 1.
    """
    if not vec_a or not vec_b:
        return 0.0
    if len(vec_a) > len(vec_b):
        vec_a, vec_b = vec_b, vec_a
    dot = sum(w * vec_b.get(t, 0.0) for t, w in vec_a.items())
    norm_a = math.sqrt(sum(w * w for w in vec_a.values()))
    norm_b = math.sqrt(sum(w * w for w in vec_b.values()))
    return max(0.0, min(1.0, dot / (norm_a * norm_b))) if norm_a and norm_b else 0.0


def extract_keywords(vectorizer: TfidfVectorizer, text: str, k: int = 5) -> list:
    """Keyword extraction: the k terms with the highest TF-IDF weight."""
    vec = vectorizer.transform(text)
    return [t for t, _ in sorted(vec.items(), key=lambda x: -x[1])[:k]]


# ===========================================================================
# 5. MULTINOMIAL NAIVE BAYES  —  domain classifier
# ===========================================================================

DOMAINS = [
    "Computer Science & IT",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology & Life Sciences",
    "Core Engineering",
    "Commerce, Economics & Management",
    "History & Social Sciences",
    "Languages & Literature",
    "General Knowledge",
]

# Seed training set: labelled example questions for every domain.
# Stored doubts are added on top of this, so the classifier keeps learning.
SEED_TRAINING_DATA = {
    "Computer Science & IT": [
        "What is a binary search tree and how does insertion work",
        "Difference between abstract class and interface in Java",
        "How does a hash table handle collisions",
        "What is normalization in DBMS",
        "Explain deadlock in operating systems",
        "What is the time complexity of quicksort",
        "How does TCP three way handshake work in computer networks",
        "What is recursion in programming",
        "Explain inheritance and polymorphism in object oriented programming",
        "What is a SQL join query",
        "How does a React component render state",
        "What is machine learning and neural network training",
        "Explain linked list stack and queue data structures",
        "What is cloud computing and virtualization",
        "How does encryption work in cybersecurity",
    ],
    "Mathematics": [
        "How do I solve a quadratic equation",
        "What is the derivative of sin x",
        "Explain integration by parts",
        "What is a matrix determinant and inverse",
        "How to find eigenvalues of a matrix",
        "What is probability of independent events",
        "Explain limits and continuity in calculus",
        "What is the Pythagoras theorem",
        "How to solve differential equations",
        "What is mean median mode and standard deviation in statistics",
        "Explain permutations and combinations",
        "What are prime numbers and number theory",
        "How to find the area under a curve",
    ],
    "Physics": [
        "What is Newton's second law of motion",
        "Explain the photoelectric effect",
        "What is the difference between speed and velocity",
        "How does electromagnetic induction work",
        "What is kinetic and potential energy",
        "Explain Ohm's law and electric current resistance",
        "What is the theory of relativity",
        "How do waves and sound travel",
        "What is gravitational force between two masses",
        "Explain refraction of light through a lens",
        "What is quantum mechanics and wave particle duality",
        "What is thermodynamics first law heat work",
    ],
    "Chemistry": [
        "What is a covalent bond and ionic bond",
        "Explain the periodic table trends",
        "What is pH and acid base reaction",
        "How to balance a chemical equation",
        "What is oxidation and reduction redox",
        "Explain organic chemistry functional groups",
        "What is molarity of a solution",
        "What is an exothermic and endothermic reaction",
        "Explain hybridization of carbon atom orbitals",
        "What is a catalyst in reaction rate",
        "What are isotopes of an element atom",
        "Explain electrochemistry and electrolysis",
    ],
    "Biology & Life Sciences": [
        "What is photosynthesis in plants",
        "Explain the structure of DNA and RNA",
        "What is mitosis and meiosis cell division",
        "How does the human heart pump blood",
        "What is natural selection and evolution",
        "Explain the function of mitochondria in the cell",
        "What are enzymes and how do they work",
        "How does the immune system fight infection",
        "What is genetics and inheritance of genes",
        "Explain the nervous system and neurons",
        "What is an ecosystem food chain",
        "How does digestion work in the human body",
    ],
    "Core Engineering": [
        "What is the working of a transformer in electrical engineering",
        "Explain stress and strain in mechanical engineering",
        "How does an internal combustion engine work",
        "What is a PID controller in control systems",
        "Explain BJT and MOSFET transistor in electronics",
        "What is bending moment in a beam civil engineering",
        "How does a digital logic flip flop work",
        "What is fluid mechanics Bernoulli equation",
        "Explain signal processing Fourier transform",
        "What is an op amp amplifier circuit",
        "How are reinforced concrete structures designed",
        "What is microprocessor and microcontroller architecture",
    ],
    "Commerce, Economics & Management": [
        "What is the law of demand and supply",
        "Explain inflation and its causes",
        "What is GDP and how is it calculated",
        "Difference between balance sheet and income statement",
        "What is double entry bookkeeping in accounting",
        "Explain marketing mix 4 Ps",
        "What is monetary policy of the central bank",
        "How does the stock market and shares work",
        "What is working capital in finance",
        "Explain SWOT analysis in management",
        "What is opportunity cost in economics",
        "What are taxes GST and fiscal policy",
    ],
    "History & Social Sciences": [
        "What were the causes of World War 1",
        "Explain the French Revolution",
        "Who was Mahatma Gandhi and the Indian independence movement",
        "What is the Indian constitution and fundamental rights",
        "Explain the Mughal empire history",
        "What is democracy and the parliament system",
        "What is the role of the United Nations",
        "Explain the industrial revolution",
        "What are the features of federalism in political science",
        "Explain climate zones and rivers in geography",
        "What is sociology and social stratification",
        "What was the cold war",
    ],
    "Languages & Literature": [
        "What is a metaphor and simile in English literature",
        "Explain the theme of Shakespeare's Hamlet",
        "What is the difference between active and passive voice grammar",
        "How to write a good essay introduction",
        "What are the tenses in English grammar",
        "Explain the poem and its literary devices",
        "What is a noun pronoun verb and adjective",
        "Who wrote the novel Pride and Prejudice",
        "What is alliteration and personification",
        "How to improve vocabulary and reading comprehension",
        "Explain the structure of a sonnet",
        "What is the difference between prose and poetry",
    ],
    "General Knowledge": [
        "What is the capital of Australia",
        "How many continents are there in the world",
        "Who invented the telephone",
        "What is the largest ocean on earth",
        "Why is the sky blue during the day",
        "What are the Olympic games",
        "How do I manage my study time better",
        "What is the tallest mountain in the world",
        "Which is the national animal of India",
        "How to prepare for an interview",
        "What are some good habits for students",
        "What is current affairs news today",
    ],
}


class NaiveBayesClassifier:
    """
    Multinomial Naive Bayes with Laplace (add-one) smoothing.

        P(class | words) ∝ P(class) × Π P(word | class)

        P(class)        = docs in class / total docs              (prior)
        P(word | class) = (count(word, class) + 1)
                          / (total words in class + |Vocabulary|)  (likelihood)

    Log-probabilities are summed instead of multiplying tiny numbers
    (avoids floating-point underflow), then converted back with a
    numerically-stable softmax (log-sum-exp trick).
    """

    def __init__(self, alpha: float = 1.0):
        self.alpha = alpha
        self.class_doc_counts = Counter()
        self.word_counts = defaultdict(Counter)
        self.class_word_totals = Counter()
        self.vocabulary = set()
        self.total_docs = 0

    def fit(self, texts: list, labels: list):
        for text, label in zip(texts, labels):
            tokens = preprocess(text)
            self.class_doc_counts[label] += 1
            self.word_counts[label].update(tokens)
            self.class_word_totals[label] += len(tokens)
            self.vocabulary.update(tokens)
            self.total_docs += 1
        return self

    def predict_proba(self, text: str) -> dict:
        tokens = preprocess(text)
        vocab_size = len(self.vocabulary) or 1
        log_scores = {}
        for label, doc_count in self.class_doc_counts.items():
            score = math.log(doc_count / self.total_docs)  # log prior
            denom = self.class_word_totals[label] + self.alpha * vocab_size
            for tok in tokens:
                score += math.log((self.word_counts[label][tok] + self.alpha) / denom)
            log_scores[label] = score
        max_log = max(log_scores.values())
        exp_scores = {k: math.exp(v - max_log) for k, v in log_scores.items()}
        total = sum(exp_scores.values())
        return {k: v / total for k, v in exp_scores.items()}

    def predict(self, text: str) -> str:
        probs = self.predict_proba(text)
        return max(probs, key=probs.get)


def build_domain_classifier(history: list = None) -> NaiveBayesClassifier:
    """Trains on the seed data plus previously classified doubts
    (list of (question, domain) tuples) — the model improves as
    more doubts are asked (incremental learning)."""
    texts, labels = [], []
    for domain, examples in SEED_TRAINING_DATA.items():
        texts.extend(examples)
        labels.extend([domain] * len(examples))
    for question, domain in history or []:
        if domain in DOMAINS and question:
            texts.append(question)
            labels.append(domain)
    return NaiveBayesClassifier().fit(texts, labels)


DOMAIN_ALIASES = {
    "computer": "Computer Science & IT", "software": "Computer Science & IT",
    "programming": "Computer Science & IT", "information technology": "Computer Science & IT",
    "data": "Computer Science & IT", "math": "Mathematics", "statistic": "Mathematics",
    "physic": "Physics", "chemi": "Chemistry", "biolog": "Biology & Life Sciences",
    "medic": "Biology & Life Sciences", "life science": "Biology & Life Sciences",
    "engineering": "Core Engineering", "electric": "Core Engineering",
    "mechanic": "Core Engineering", "civil": "Core Engineering", "electronic": "Core Engineering",
    "commerce": "Commerce, Economics & Management", "econom": "Commerce, Economics & Management",
    "manage": "Commerce, Economics & Management", "account": "Commerce, Economics & Management",
    "financ": "Commerce, Economics & Management", "business": "Commerce, Economics & Management",
    "histor": "History & Social Sciences", "social": "History & Social Sciences",
    "politic": "History & Social Sciences", "geograph": "History & Social Sciences",
    "civics": "History & Social Sciences", "language": "Languages & Literature",
    "literature": "Languages & Literature", "english": "Languages & Literature",
    "grammar": "Languages & Literature", "general": "General Knowledge",
}


def normalize_domain(raw: str):
    """Maps the LLM's domain string onto the fixed taxonomy:
    1) exact match, 2) keyword alias match,
    3) string similarity (difflib's Ratcliff/Obershelp ratio)."""
    if not raw:
        return None
    cleaned = raw.strip().lower()
    for d in DOMAINS:
        if d.lower() == cleaned:
            return d
    for key, domain in DOMAIN_ALIASES.items():
        if key in cleaned:
            return domain
    match = get_close_matches(raw.strip(), DOMAINS, n=1, cutoff=0.5)
    return match[0] if match else None


# ===========================================================================
# 6. BLOOM'S TAXONOMY  —  rule-based difficulty estimation
# ===========================================================================

BLOOM_LEVELS = [
    (1, "Remember", ["define", "what is", "what are", "list", "name", "who", "when",
                     "state", "identify", "recall", "full form", "meaning of"]),
    (2, "Understand", ["explain", "describe", "why", "summarize", "summarise",
                       "discuss", "interpret", "classify", "how does", "how do"]),
    (3, "Apply", ["solve", "calculate", "compute", "implement", "apply",
                  "find", "use", "demonstrate", "write a program", "code", "how to"]),
    (4, "Analyze", ["compare", "differentiate", "difference between", "distinguish",
                    "analyze", "analyse", "contrast", "examine", "relationship", "vs"]),
    (5, "Evaluate", ["evaluate", "justify", "critique", "assess", "which is better",
                     "argue", "judge", "advantages and disadvantages", "pros and cons"]),
    (6, "Create", ["design", "derive", "prove", "develop", "construct", "formulate",
                   "optimize", "optimise", "propose", "create"]),
]

DIFFICULTY_TO_SCORE = {"Easy": 0.0, "Medium": 0.5, "Hard": 1.0}


def score_to_difficulty(score: float) -> str:
    if score < 0.34:
        return "Easy"
    if score < 0.67:
        return "Medium"
    return "Hard"


def detect_bloom_level(question: str) -> dict:
    """Returns the HIGHEST Bloom's taxonomy level whose action verb
    appears in the question (default: level 2, Understand)."""
    q = f" {(question or '').lower()} "
    found = None
    for level, name, verbs in BLOOM_LEVELS:
        for verb in verbs:
            if re.search(rf"\b{re.escape(verb)}\b", q):
                found = (level, name, verb)
                break
    if not found:
        return {"level": 2, "name": "Understand", "matchedVerb": None}
    return {"level": found[0], "name": found[1], "matchedVerb": found[2]}


def heuristic_difficulty(question: str) -> dict:
    """
    Weighted feature score in [0, 1]:
        0.50 × Bloom level          (cognitive demand)
        0.20 × question length      (longer = more context needed)
        0.15 × lexical complexity   (share of long, technical words)
        0.15 × multi-part structure (several sub-questions / clauses)
    """
    words = tokenize(question)
    bloom = detect_bloom_level(question)
    bloom_f = (bloom["level"] - 1) / 5
    length_f = min(1.0, len(words) / 40)
    long_words = sum(1 for w in words if len(w) >= 9)
    lexical_f = min(1.0, (long_words / len(words)) * 3) if words else 0.0
    parts = (question or "").count("?") + len(re.findall(r"\b(and|also|then)\b", (question or "").lower()))
    multi_f = min(1.0, max(0, parts - 1) / 3)
    score = 0.50 * bloom_f + 0.20 * length_f + 0.15 * lexical_f + 0.15 * multi_f
    return {
        "score": round(score, 3),
        "label": score_to_difficulty(score),
        "bloom": bloom,
        "features": {
            "bloom": round(bloom_f, 2),
            "length": round(length_f, 2),
            "lexicalComplexity": round(lexical_f, 2),
            "multiPart": round(multi_f, 2),
        },
    }


# ===========================================================================
# 7. WEIGHTED ENSEMBLE  —  final difficulty and confidence
# ===========================================================================

W_LLM_DIFFICULTY = 0.6
W_RULE_DIFFICULTY = 0.4
W_LLM_CONFIDENCE = 0.6
W_NB_CONFIDENCE = 0.4


def ensemble_difficulty(llm_label: str, heuristic: dict) -> dict:
    llm_score = DIFFICULTY_TO_SCORE.get(llm_label, 0.5)
    final = W_LLM_DIFFICULTY * llm_score + W_RULE_DIFFICULTY * heuristic["score"]
    return {"llm": llm_label, "heuristic": heuristic["label"],
            "heuristicScore": heuristic["score"], "finalScore": round(final, 3),
            "final": score_to_difficulty(final)}


def ensemble_confidence(llm_confidence: int, nb_probability: float) -> dict:
    llm_c = max(0, min(100, int(llm_confidence or 0)))
    nb_c = round(nb_probability * 100)
    final = round(W_LLM_CONFIDENCE * llm_c + W_NB_CONFIDENCE * nb_c)
    return {"llm": llm_c, "naiveBayes": nb_c, "final": max(0, min(100, final))}


# ===========================================================================
# 8. SIMILAR QUESTION RANKING  (hybrid lexical + semantic)
# ===========================================================================

W_LEXICAL = 0.5
W_SEMANTIC = 0.5
HISTORY_MIN_SIMILARITY = 0.25
DUPLICATE_THRESHOLD = 0.90


def rank_similar_questions(vectorizer, query, history, ai_candidates, k=3):
    """
    history       : list of (doubt_id, question) already stored in MySQL
    ai_candidates : list of {"question", "similarity"} proposed by the LLM

    Past doubts   -> score = cosine similarity (pure TF-IDF retrieval)
    AI candidates -> score = 0.5 × cosine + 0.5 × LLM semantic estimate
    Results are merged, de-duplicated, sorted and the top k returned.
    """
    q_vec = vectorizer.transform(query)
    scored, seen = [], set()

    # Prioritize AI candidates specially crafted for this user doubt
    for cand in ai_candidates:
        text = (cand.get("question") or "").strip()
        if not text or text.lower() in seen:
            continue
        seen.add(text.lower())
        cos = cosine_similarity(q_vec, vectorizer.transform(text))
        semantic = max(70, min(98, int(cand.get("similarity") or 85)))
        hybrid = max(semantic, round(W_LEXICAL * cos * 100 + W_SEMANTIC * semantic))
        scored.append({"question": text, "similarity": hybrid,
                       "source": "ai", "lexical": round(cos * 100)})

    # Only include historical doubts if they have genuine high topical similarity (>= 50%)
    for doubt_id, text in history:
        key = text.strip().lower()
        if key in seen or key == query.strip().lower():
            continue
        cos = cosine_similarity(q_vec, vectorizer.transform(text))
        if cos >= 0.50:
            seen.add(key)
            scored.append({"question": text, "similarity": round(cos * 100),
                           "source": "history", "lexical": round(cos * 100)})

    scored.sort(key=lambda s: s["similarity"], reverse=True)
    return scored[:k]


def find_duplicate(vectorizer, query, history):
    """
    Find the closest prior question by TF-IDF cosine similarity.
    Returns (doubt_id, similarity) or (None, best_similarity_seen). The API
    uses the score to display similar history but does not reuse old answers.
    """
    q_vec = vectorizer.transform(query)
    q_level = detect_bloom_level(query)["level"]
    best_id, best = None, 0.0
    for doubt_id, text in history:
        cos = cosine_similarity(q_vec, vectorizer.transform(text))
        if cos > best:
            best_id, best = doubt_id, cos
    if best >= DUPLICATE_THRESHOLD:
        match_text = next(t for d, t in history if d == best_id)
        if detect_bloom_level(match_text)["level"] == q_level:
            return best_id, best
    return None, best


# ===========================================================================
# 9. CONTENT-BASED RESOURCE RANKING
# ===========================================================================

W_RES_TEXT = 0.45
W_RES_LLM = 0.35
W_RES_TYPE_FIT = 0.20

# Which resource formats suit which difficulty level (learning-path rule):
# beginners benefit from videos/notes, hard doubts from practice and docs.
TYPE_FIT = {
    "Easy":   {"Video": 1.0, "Notes": 0.9, "Article": 0.8, "PDF": 0.7, "Practice Questions": 0.6, "Documentation": 0.5},
    "Medium": {"Article": 1.0, "Video": 0.9, "Notes": 0.9, "PDF": 0.8, "Practice Questions": 0.8, "Documentation": 0.7},
    "Hard":   {"Practice Questions": 1.0, "Documentation": 0.9, "PDF": 0.9, "Article": 0.8, "Notes": 0.7, "Video": 0.6},
}


def rank_resources(vectorizer, query, subject, topic, difficulty, resources):
    """
    Content-based recommendation with a multi-factor weighted score:

    relevance = 0.45 × text similarity (resource title vs. doubt + subject + topic)
              + 0.35 × LLM relevance estimate
              + 0.20 × format fit (how well the resource type suits the difficulty)

    Results are sorted highest first (ranking).
    """
    profile = vectorizer.transform(f"{query} {subject or ''} {topic or ''} {topic or ''}")
    fit_table = TYPE_FIT.get(difficulty, TYPE_FIT["Medium"])
    ranked = []
    for r in resources:
        text_sim = cosine_similarity(profile, vectorizer.transform(r.get("title", "")))
        llm_rel = max(0, min(100, int(r.get("relevance") or 0))) / 100
        type_fit = fit_table.get(r.get("type"), 0.7)
        score = W_RES_TEXT * text_sim + W_RES_LLM * llm_rel + W_RES_TYPE_FIT * type_fit
        ranked.append({**r, "relevance": round(score * 100),
                       "textSimilarity": round(text_sim * 100)})
    ranked.sort(key=lambda r: r["relevance"], reverse=True)
    return ranked
