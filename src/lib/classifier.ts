import { TrainingLabel } from '@prisma/client';

export interface TrainingData {
  text: string;
  label: TrainingLabel;
}

export interface PredictionResult {
  label: TrainingLabel;
  confidence: number;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export class NaiveBayesClassifier {
  private classCounts: Record<string, number> = Object.create(null);
  private wordCounts: Record<string, Record<string, number>> = Object.create(null);
  private wordsPerClass: Record<string, number> = Object.create(null);
  private totalDocs = 0;
  private vocabulary = new Set<string>();

  public reset(): void {
    this.classCounts = Object.create(null);
    this.wordCounts = Object.create(null);
    this.wordsPerClass = Object.create(null);
    this.totalDocs = 0;
    this.vocabulary = new Set();
  }

  public train(data: TrainingData[]): void {
    for (const item of data) {
      const label = item.label;
      const tokens = tokenize(item.text);

      this.totalDocs++;
      this.classCounts[label] = (this.classCounts[label] || 0) + 1;

      if (!this.wordCounts[label]) {
        this.wordCounts[label] = Object.create(null);
        this.wordsPerClass[label] = 0;
      }

      for (const token of tokens) {
        this.vocabulary.add(token);
        this.wordCounts[label][token] = (this.wordCounts[label][token] || 0) + 1;
        this.wordsPerClass[label]++;
      }
    }
  }

  public trainOne(text: string, label: TrainingLabel): void {
    this.train([{ text, label }]);
  }

  public predict(text: string): PredictionResult {
    const tokens = tokenize(text);
    const labels = Object.keys(this.classCounts) as TrainingLabel[];

    if (labels.length === 0) {
      return { label: TrainingLabel.OTHER, confidence: 0 };
    }

    if (tokens.length === 0) {
      return { label: TrainingLabel.OTHER, confidence: 0 };
    }

    const scores: { label: TrainingLabel; logProb: number }[] = [];

    for (const label of labels) {
      const priorCount = this.classCounts[label];
      const priorLogProb = Math.log(priorCount / this.totalDocs);

      const labelWordCounts = this.wordCounts[label];
      const totalWordsInClass = this.wordsPerClass[label] ?? 0;
      const vocabSize = this.vocabulary.size;

      let logProb = priorLogProb;

      for (const token of tokens) {
        const count = labelWordCounts[token] ?? 0;
        const wordProb = (count + 1) / (totalWordsInClass + vocabSize);
        logProb += Math.log(wordProb);
      }

      scores.push({ label, logProb });
    }
    const maxLog = Math.max(...scores.map((s) => s.logProb));
    const expScores = scores.map((s) => ({
      label: s.label,
      exp: Math.exp(s.logProb - maxLog),
    }));
    const sumExp = expScores.reduce((acc, s) => acc + s.exp, 0);

    const best = expScores.reduce((a, b) => (a.exp > b.exp ? a : b));
    const confidence = sumExp > 0 ? best.exp / sumExp : 0;

    return {
      label: best.label,
      confidence,
    };
  }
  public toJSON() {
    return {
      classCounts: this.classCounts,
      wordCounts: this.wordCounts,
      wordsPerClass: this.wordsPerClass,
      totalDocs: this.totalDocs,
      vocabulary: Array.from(this.vocabulary),
    };
  }

  public static fromJSON(data: ReturnType<NaiveBayesClassifier['toJSON']>): NaiveBayesClassifier {
    const c = new NaiveBayesClassifier();
    c.classCounts = Object.assign(Object.create(null), data.classCounts);
    c.wordCounts = Object.create(null);
    for (const [label, counts] of Object.entries(data.wordCounts)) {
      c.wordCounts[label] = Object.assign(Object.create(null), counts);
    }
    c.wordsPerClass = Object.assign(Object.create(null), data.wordsPerClass);
    c.totalDocs = data.totalDocs;
    c.vocabulary = new Set(data.vocabulary);
    return c;
  }
}