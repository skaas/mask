/**
 * Bulls & Cows 스타일 평가 로직
 */

/**
 * 시도의 토큰별 상태 계산
 * @param {string[]} answer
 * @param {string[]} attempt
 * @returns {string[]}
 */
export function buildAttemptStatuses(answer, attempt) {
  var statuses = [];
  var answerUsed = [];
  var attemptUsed = [];
  var index = 0;

  while (index < answer.length) {
    statuses.push("hit-absent");
    answerUsed.push(false);
    attemptUsed.push(false);
    index += 1;
  }

  index = 0;
  while (index < answer.length) {
    if (attempt[index] === answer[index]) {
      statuses[index] = "hit-correct";
      answerUsed[index] = true;
      attemptUsed[index] = true;
    }
    index += 1;
  }

  index = 0;
  while (index < answer.length) {
    if (!attemptUsed[index]) {
      var searchIndex = 0;
      while (searchIndex < answer.length) {
        if (!answerUsed[searchIndex] && attempt[index] === answer[searchIndex]) {
          statuses[index] = "hit-present";
          answerUsed[searchIndex] = true;
          break;
        }
        searchIndex += 1;
      }
    }
    index += 1;
  }

  return statuses;
}

/**
 * Bulls & Cows 변형 평가
 * @param {string[]} answer
 * @param {string[]} attempt
 * @returns {{bulls:number,cows:number,success:boolean,statuses:string[]}}
 */
export function evaluateAttempt(answer, attempt) {
  var bulls = 0;
  var cows = 0;
  var answerUsed = [];
  var attemptUsed = [];
  var index = 0;

  while (index < answer.length) {
    answerUsed.push(false);
    attemptUsed.push(false);
    index += 1;
  }

  index = 0;
  while (index < answer.length) {
    if (answer[index] === attempt[index]) {
      bulls += 1;
      answerUsed[index] = true;
      attemptUsed[index] = true;
    }
    index += 1;
  }

  index = 0;
  while (index < answer.length) {
    if (!attemptUsed[index]) {
      var searchIndex = 0;

      while (searchIndex < answer.length) {
        if (!answerUsed[searchIndex] && attempt[index] === answer[searchIndex]) {
          cows += 1;
          answerUsed[searchIndex] = true;
          break;
        }
        searchIndex += 1;
      }
    }
    index += 1;
  }

  return {
    bulls: bulls,
    cows: cows,
    success: bulls === answer.length,
    statuses: buildAttemptStatuses(answer, attempt),
  };
}
