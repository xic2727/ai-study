import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_QUESTIONS, QUESTIONS_BY_ID, SMART_LAMP_SPEC } from '../data/questions';
import {
  applyAnswerToProgress,
  buildDomainPracticeIds,
  buildSetPracticeIds,
  buildSmartPracticeIds,
  computeProgressStats,
  createInitialProgress,
  evaluateSubmission,
} from './quizEngine';

test('question bank contains all 120 competition questions across 8 sets with valid interaction fields', () => {
  assert.equal(ALL_QUESTIONS.length, 120);

  for (let s = 1; s <= 8; s++) {
    const setIds = buildSetPracticeIds(ALL_QUESTIONS, s);
    assert.equal(setIds.length, 15, `Set ${s} should have 15 questions`);
  }

  for (const q of ALL_QUESTIONS) {
    assert.ok(q.kidSummary.length > 5, `${q.id} needs kidSummary`);
    assert.ok(q.kidAnalogy.length > 10, `${q.id} needs kidAnalogy`);
    assert.ok(q.wrongTips.length > 5, `${q.id} needs wrongTips`);

    if (q.type === 'single' || q.type === 'boolean') {
      assert.equal(q.correctKeys?.length, 1, `${q.id} should have 1 correct key`);
      const optKeys = new Set((q.options ?? []).map((o) => o.key));
      assert.ok(optKeys.has(q.correctKeys![0]), `${q.id} correctKey must exist in options`);
    }

    if (q.type === 'multiple') {
      assert.ok((q.correctKeys?.length ?? 0) >= 2, `${q.id} should have >=2 correct keys`);
      const optKeys = new Set((q.options ?? []).map((o) => o.key));
      for (const k of q.correctKeys!) {
        assert.ok(optKeys.has(k), `${q.id} key ${k} must exist in options`);
      }
    }

    if (q.type === 'fill') {
      assert.ok((q.correctBlanks?.length ?? 0) >= 1, `${q.id} needs correctBlanks`);
      assert.equal(
        q.blankSegments?.length,
        q.correctBlanks!.length + 1,
        `${q.id} blankSegments length mismatch`
      );
      const bank = new Set(q.wordBank ?? []);
      for (const ans of q.correctBlanks!) {
        assert.ok(bank.has(ans), `${q.id} wordBank missing answer "${ans}"`);
      }
    }

    if (q.type === 'match') {
      assert.equal(q.leftItems?.length, 4);
      assert.equal(q.rightItems?.length, 4);
      assert.equal(Object.keys(q.correctMatches ?? {}).length, 4);
    }

    if (q.type === 'discussion') {
      const wiseCount = (q.discussionChoices ?? []).filter((c) => c.isWise).length;
      const trapCount = (q.discussionChoices ?? []).filter((c) => !c.isWise).length;
      assert.ok(wiseCount >= 2, `${q.id} needs >=2 wise choices`);
      assert.ok(trapCount >= 1, `${q.id} needs >=1 trap choice`);
    }
  }

  assert.equal(SMART_LAMP_SPEC.wiringSlots.length, 3);
  assert.equal(SMART_LAMP_SPEC.blockSlots.length, 7);
});

test('evaluates single, multiple, boolean, fill, match, and discussion submissions accurately', () => {
  // Single
  assert.equal(
    evaluateSubmission(QUESTIONS_BY_ID['S1Q1'], { type: 'single', selected: 'A' }).isCorrect,
    true
  );
  assert.equal(
    evaluateSubmission(QUESTIONS_BY_ID['S1Q1'], { type: 'single', selected: 'B' }).isCorrect,
    false
  );

  // Multiple (order-independent)
  assert.equal(
    evaluateSubmission(QUESTIONS_BY_ID['S1Q5'], {
      type: 'multiple',
      selected: ['D', 'B', 'C'],
    }).isCorrect,
    true
  );
  assert.equal(
    evaluateSubmission(QUESTIONS_BY_ID['S1Q5'], {
      type: 'multiple',
      selected: ['B', 'C'],
    }).isCorrect,
    false
  );

  // Boolean
  assert.equal(
    evaluateSubmission(QUESTIONS_BY_ID['S1Q9'], { type: 'boolean', selected: '否' }).isCorrect,
    true
  );

  // Fill via clickable word tiles
  assert.equal(
    evaluateSubmission(QUESTIONS_BY_ID['S1Q13'], {
      type: 'fill',
      blanks: ['机器', '智能'],
    }).isCorrect,
    true
  );
  assert.equal(
    evaluateSubmission(QUESTIONS_BY_ID['S1Q13'], {
      type: 'fill',
      blanks: ['智能', '机器'],
    }).isCorrect,
    false
  );

  // Match
  assert.equal(
    evaluateSubmission(QUESTIONS_BY_ID['S1Q14'], {
      type: 'match',
      pairs: { '1': 'C', '2': 'B', '3': 'D', '4': 'A' },
    }).isCorrect,
    true
  );

  // Discussion
  const discQ = QUESTIONS_BY_ID['S1Q15'];
  const wiseIds = discQ.discussionChoices!.filter((c) => c.isWise).map((c) => c.id);
  assert.equal(
    evaluateSubmission(discQ, { type: 'discussion', selectedIds: wiseIds }).isCorrect,
    true
  );
  assert.equal(
    evaluateSubmission(discQ, {
      type: 'discussion',
      selectedIds: [...wiseIds, 't1'],
    }).isCorrect,
    false
  );
});

test('progress updates stars, streak, wrong bank, and smart adaptive queue prioritizes wrong questions first', () => {
  let progress = createInitialProgress();

  // Answer S2Q3 wrong -> goes into wrong bank, streak resets
  const r1 = applyAnswerToProgress(progress, 'S2Q3', false, 1000);
  progress = r1.nextProgress;
  assert.equal(r1.starsEarned, 2);
  assert.equal(progress.streak, 0);
  assert.equal(progress.records['S2Q3'].inWrongBank, true);

  // Answer S1Q1 right -> mastered, streak increments
  const r2 = applyAnswerToProgress(progress, 'S1Q1', true, 2000);
  progress = r2.nextProgress;
  assert.equal(r2.starsEarned, 10);
  assert.equal(progress.streak, 1);
  assert.equal(progress.records['S1Q1'].mastered, true);

  const stats = computeProgressStats(ALL_QUESTIONS, progress);
  assert.equal(stats.attemptedCount, 2);
  assert.equal(stats.masteredCount, 1);
  assert.equal(stats.wrongBankCount, 1);

  // Smart queue must put S2Q3 first!
  const smartQueue = buildSmartPracticeIds(ALL_QUESTIONS, progress, 10);
  assert.equal(smartQueue.length, 10);
  assert.equal(smartQueue[0], 'S2Q3');

  // Answering S2Q3 right removes it from wrong bank
  const r3 = applyAnswerToProgress(progress, 'S2Q3', true, 3000);
  progress = r3.nextProgress;
  assert.equal(progress.records['S2Q3'].inWrongBank, false);
  assert.equal(progress.records['S2Q3'].mastered, true);

  const domainQueue = buildDomainPracticeIds(ALL_QUESTIONS, progress, 'safety', 8);
  assert.ok(domainQueue.length > 0);
  for (const id of domainQueue) {
    assert.equal(QUESTIONS_BY_ID[id].domain, 'safety');
  }
});
