import { useEffect, useState } from 'react';
import { currentKey, recordQuiz } from '@/lib/progress';
import { Check, RotateCcw, Trophy, X } from 'lucide-react';

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explain?: string;
}

export default function QuizIsland({ questions, title = 'Quick quiz' }: { questions: QuizQuestion[]; title?: string }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const answered = picked.filter((p) => p !== null).length;
  const correct = picked.filter((p, i) => p === questions[i].answer).length;
  const finished = answered === questions.length;

  useEffect(() => {
    if (finished) recordQuiz(currentKey(), correct, questions.length);
  }, [finished]);

  return (
    <div className="not-prose my-10 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid size-9 place-items-center rounded-xl bg-warn-soft text-warn">
          <Trophy size={18} />
        </span>
        <div className="flex-1">
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted">
            {answered}/{questions.length} answered · {correct} correct
          </p>
        </div>
        {answered > 0 && (
          <button
            type="button"
            onClick={() => setPicked(questions.map(() => null))}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-medium text-muted hover:text-fg"
          >
            <RotateCcw size={14} /> Retry
          </button>
        )}
      </div>

      <ol className="divide-y divide-line">
        {questions.map((question, qi) => {
          const choice = picked[qi];
          const done = choice !== null;
          return (
            <li key={qi} className="p-5">
              <p className="mb-3 font-medium">
                <span className="mr-2 text-faint">{qi + 1}.</span>
                {question.q}
              </p>
              <div className="grid gap-2">
                {question.options.map((opt, oi) => {
                  const isAnswer = oi === question.answer;
                  const isPicked = oi === choice;
                  const state = !done ? 'idle' : isAnswer ? 'right' : isPicked ? 'wrong' : 'dim';
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={done}
                      onClick={() => setPicked((prev) => prev.map((p, j) => (j === qi ? oi : p)))}
                      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[0.95rem] transition-all ${
                        state === 'idle'
                          ? 'border-line hover:border-brand hover:bg-brand-soft/50'
                          : state === 'right'
                            ? 'border-ok/50 bg-ok-soft text-fg'
                            : state === 'wrong'
                              ? 'border-danger/50 bg-danger-soft text-fg'
                              : 'border-line text-faint'
                      }`}
                    >
                      <span
                        className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                          state === 'right'
                            ? 'border-ok bg-ok text-white'
                            : state === 'wrong'
                              ? 'border-danger bg-danger text-white'
                              : 'border-line-strong text-muted'
                        }`}
                      >
                        {state === 'right' ? <Check size={13} strokeWidth={3} /> : state === 'wrong' ? <X size={13} strokeWidth={3} /> : String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {done && question.explain && (
                <p className={`mt-3 rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${choice === question.answer ? 'bg-ok-soft/60' : 'bg-subtle'} text-muted`}>
                  <strong className="text-fg">{choice === question.answer ? 'Correct! ' : 'Not quite. '}</strong>
                  {question.explain}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {finished && (
        <div className="border-t border-line bg-subtle px-5 py-4 text-center">
          <p className="text-lg font-semibold">
            {correct === questions.length ? '🎉 Perfect score!' : correct >= questions.length / 2 ? '👍 Nice work!' : '📚 Worth another read.'}
          </p>
          <p className="text-sm text-muted">
            You got {correct} out of {questions.length} right.
          </p>
        </div>
      )}
    </div>
  );
}
