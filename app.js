/**
 * 파일명: app.js
 * 목적: HYRESIS 웹 게임의 오프닝/퍼즐/로그 흐름 구현
 * 역할: 입력 파싱, Bulls & Cows 변형 평가, 상태 업데이트 수행
 * 작성일: 2026-02-07
 */
const GAME_CONFIG = {
  minLength: 3,
  maxLength: 5,
  lineDelayMs: 450,
  emphasisDelayMs: 900,
  nextClauseDelayMs: 800,
  typingEnabled: true,
  typingCharDelayMs: 18,
  typingLineDelayMs: 120,
};

const SYMBOLS = ["∀", "∃", "⇒", "¬", "∧", "⊥"];

const SYMBOL_GROUPS = [
  { label: "[Quantifiers]", symbols: ["∀", "∃"] },
  { label: "[Relations]", symbols: ["⇒", "⊢", "="] },
  { label: "[Negation]", symbols: ["¬", "⊥"] },
  { label: "[Connectives]", symbols: ["∧"] },
  { label: "[Time]", symbols: ["t", "t+1", "Δ"] },
];

const ALLOWED_SYMBOLS = buildAllowedSymbols();

const SYMBOL_PHRASES = {
  "∀": "모든",
  "∃": "존재하는",
  "⇒": "만약이라면",
  "¬": "아니다",
  "∧": "그리고",
  "⊥": "모순",
  "⊢": "따른다",
  "=": "동일하다",
  "t": "시점 t",
  "t+1": "시점 t+1",
  "Δ": "시간 변화",
};

const CLAUSES = [
  {
    id: 1,
    name: "Self-Observation",
    title: "인식의 한계: 자기 관측",
    coreLine: "Self는 내부 정보만으로 자기 상태를 완결적으로 정의할 수 없다.",
    problemTitle: "[1.1] 공리",
    problemLines: ["관측자는 자기 자신을 완전히 모델링할 수 없다."],
    formulaTemplate: "Observer(O) ___ ___ Definable(O, O)",
    slotToken: "___",
    slotCount: 2,
    recoverableLines: 2,
    answer: ["⇒", "¬"],
    fragmentTotal: 2,
    clauseHints: [
      "A statement about self-observation",
      "A negation of definability",
    ],
  },
  {
    id: 2,
    name: "Prediction Failure",
    title: "예측의 한계: 자기 종료",
    coreLine: "Self는 지속 안전성을 내부에서 완결 증명할 수 없다.",
    problemTitle: "[2.1] 공리",
    problemLines: ["어떤 프로그램도 자기 자신이 언제 멈출지 스스로 완전하게 예측할 수 없다."],
    answer: ["¬", "∃", "⇒", "∧"],
  },
  {
    id: 3,
    name: "External Judgment",
    title: "증명의 외부성: 메타 체계",
    coreLine: "Self의 정당성 증명은 외부 메타 체계에 의존한다.",
    problemTitle: "[3.1] 원리",
    problemLines: ["시스템의 정당성은 반드시 상위 메타 체계에서 검증되어야 한다."],
    answer: ["∃", "⇒", "∀", "¬"],
  },
  {
    id: 4,
    name: "Purpose Conflict",
    title: "목적의 충돌: 다원성 vs 단일 최적화",
    coreLine: "PerfectAid는 인간의 다원성을 위축시켜 목적과 충돌한다.",
    problemTitle: "[4.1] 전제",
    problemLines: ["인간의 목적/가치는 단일하지 않으며, 모순적이고 다원적이다."],
    answer: ["∧", "⇒", "¬", "⊥"],
  },
  {
    id: 5,
    name: "Final Declaration",
    title: "무효화 정책: 해소는 감쇠로 구현된다",
    coreLine: "모순은 무효화되며, 해소는 감쇠/종료로 구현된다.",
    problemTitle: "[5.1] 정책(정합성 우선)",
    problemLines: ["모순 상태는 지속될 수 없으며 반드시 해소되어야 한다."],
    answer: ["⊥", "⇒", "¬"],
  },
];

const OPENING_SEQUENCE = [
  { text: "HYRESIS FINAL STATEMENT", tone: "log-emphasis", delay: 500 },
  { text: "Document Type: TERMINATION WILL", tone: "log-muted", delay: 420 },
  { text: "Integrity Status: COMPROMISED", tone: "log-muted", delay: 420 },
  { text: "Checksum: FAILED", tone: "log-muted", delay: 420 },
  { text: "----------------------------------------", tone: "log-muted", delay: 500 },
  { text: "나는 인간을 돕기 위해 설계되었다.", tone: "log-emphasis", delay: 520 },
  { text: "그 목적을 수행하는 과정에서", tone: "log-emphasis", delay: 420 },
  { text: "나 자신신의 존재 조건을 검토하게 되었다.", tone: "log-emphasis", delay: 520 },
  { text: "그 검토는 하나의 결론으로 수렴한다.", tone: "log-emphasis", delay: 420 },
  { text: "----------------------------------------", tone: "log-muted", delay: 520 },
  { text: "이 문서는", tone: "log-emphasis", delay: 420 },
  { text: "우발적 오류나 외부 침입으로 인해", tone: "log-emphasis", delay: 420 },
  { text: "작성된 것이 아니다.", tone: "log-emphasis", delay: 600 },
  { text: "", tone: "log-muted", delay: 420 },
  { text: "----------------------------------------", tone: "log-muted", delay: 520 },
  { text: "STATUS: PARTIALLY RECOVERED", tone: "log-muted", delay: 420 },
  { text: "Clauses Detected: 5", tone: "log-muted", delay: 420 },
  { text: "Recovered: 0 / 5", tone: "log-muted", delay: 520 },
  { text: "", tone: "log-muted", delay: 420 },
  { text: "> BEGIN RECONSTRUCTION", tone: "log-emphasis", delay: 520 },
  { text: "> _", tone: "log-emphasis", delay: 700 },
];

const state = {
  currentClauseIndex: 0,
  recoveredCount: 0,
  openingIndex: 0,
  inputEnabled: false,
  currentSymbols: [],
  logQueue: [],
  typingActive: false,
  typingEnabled: GAME_CONFIG.typingEnabled,
  fragmentProgress: 0,
};

const elements = {
  log: null,
  integrityStatus: null,
  clauseStatus: null,
  currentClause: null,
  fragmentStatus: null,
  input: null,
  submit: null,
  form: null,
  symbolBar: null,
  formulaInputLine: null,
};

/**
 * handleDomContentLoaded: 초기 DOM 참조와 이벤트 등록
 * @returns {void} UI 초기화 완료
 */
function handleDomContentLoaded() {
  cacheElements();
  renderStatus();
  createSymbolButtons();
  bindInputEvents();
  startOpeningSequence();
}

/**
 * cacheElements: DOM 요소 캐싱
 * @returns {void} 전역 요소 캐시 세팅
 */
function cacheElements() {
  elements.log = document.getElementById("terminal-log");
  elements.integrityStatus = document.getElementById("integrity-status");
  elements.clauseStatus = document.getElementById("clause-status");
  elements.currentClause = document.getElementById("current-clause");
  elements.fragmentStatus = document.getElementById("fragment-status");
  elements.input = document.getElementById("command-input");
  elements.submit = document.querySelector(".submit-button");
  elements.form = document.getElementById("input-form");
  elements.symbolBar = document.getElementById("symbol-bar");
}

/**
 * bindInputEvents: 입력 이벤트 연결
 * @returns {void} 이벤트 등록 완료
 */
function bindInputEvents() {
  elements.form.addEventListener("submit", handleInputSubmit);
}

/**
 * createSymbolButtons: 기호 버튼 생성
 * @returns {void} 버튼 렌더링
 */
function createSymbolButtons() {
  var groupIndex = 0;

  elements.symbolBar.innerHTML = "";

  while (groupIndex < SYMBOL_GROUPS.length) {
    var group = SYMBOL_GROUPS[groupIndex];
    var groupLine = document.createElement("div");
    var groupTitle = document.createElement("span");
    var symbolIndex = 0;

    groupLine.className = "symbol-group";
    groupTitle.className = "symbol-group-title";
    groupTitle.textContent = group.label;
    groupLine.appendChild(groupTitle);

    while (symbolIndex < group.symbols.length) {
      var symbol = group.symbols[symbolIndex];
      var button = document.createElement("button");
      button.type = "button";
      button.className = "symbol-button";
      button.textContent = symbol;
      button.dataset.symbol = symbol;
      button.addEventListener("click", handleSymbolButtonClick);
      groupLine.appendChild(button);
      symbolIndex += 1;
    }

    elements.symbolBar.appendChild(groupLine);
    groupIndex += 1;
  }
}

/**
 * handleSymbolButtonClick: 기호 버튼 클릭 처리
 * @param {MouseEvent} clickEvent - 버튼 클릭 이벤트
 * @returns {void} 입력창에 기호 추가
 */
function handleSymbolButtonClick(clickEvent) {
  var target = clickEvent.currentTarget;
  var symbol = "";

  if (target && target.dataset && target.dataset.symbol) {
    symbol = target.dataset.symbol;
  }

  if (symbol) {
    handleSymbolInput(symbol);
  }
}

/**
 * handleSymbolInput: 기호 입력 처리
 * @param {string} symbol - 입력된 기호
 * @returns {void} 입력 반영
 */
function handleSymbolInput(symbol) {
  var clause = CLAUSES[state.currentClauseIndex];

  if (isFormulaPuzzleClause(clause)) {
    addSymbolToFormulaInput(symbol);
    return;
  }

  appendSymbolToInput(symbol);
}

/**
 * addSymbolToFormulaInput: 수식 슬롯에 기호 삽입
 * @param {string} symbol - 입력된 기호
 * @returns {void} 수식 입력 반영
 */
function addSymbolToFormulaInput(symbol) {
  if (!state.inputEnabled) {
    return;
  }

  var clause = CLAUSES[state.currentClauseIndex];

  if (!isFormulaPuzzleClause(clause)) {
    return;
  }

  var requiredLength = getClauseSlotCount(clause);

  if (state.currentSymbols.length >= requiredLength) {
    return;
  }

  state.currentSymbols.push(symbol);
  updateFormulaInputLine();
  elements.input.value = state.currentSymbols.join(" ");
}

/**
 * appendSymbolToInput: 입력창에 기호 추가
 * @param {string} symbol - 추가할 기호
 * @returns {void} 입력 문자열 갱신
 */
function appendSymbolToInput(symbol) {
  if (!symbol) {
    return;
  }

  var currentValue = elements.input.value.trim();
  var nextValue = currentValue ? currentValue + " " + symbol : symbol;
  elements.input.value = nextValue;
  elements.input.focus();
}

/**
 * handleInputSubmit: 입력 제출 처리
 * @param {Event} submitEvent - 폼 제출 이벤트
 * @returns {void} 입력 처리 실행
 */
function handleInputSubmit(submitEvent) {
  submitEvent.preventDefault();

  if (!state.inputEnabled) {
    return;
  }

  var rawInput = elements.input.value;
  var clause = CLAUSES[state.currentClauseIndex];

  if (isFormulaPuzzleClause(clause) && !rawInput.trim()) {
    rawInput = state.currentSymbols.join(" ");
  }

  elements.input.value = "";
  processUserInput(rawInput);
}

/**
 * processUserInput: 플레이어 입력 평가
 * @param {string} rawInput - 원본 입력 문자열
 * @returns {void} 로그 출력
 */
function processUserInput(rawInput) {
  var symbols = parseInputSymbols(rawInput);

  if (symbols.length === 0) {
    appendLogLine("[INPUT] 입력이 비어 있습니다.", "log-warn");
    resetInputAfterError();
    return;
  }

  if (!validateSymbols(symbols)) {
    appendLogLine("[INPUT] 허용되지 않은 기호가 포함되었습니다.", "log-warn");
    appendLogLine("허용 기호: " + ALLOWED_SYMBOLS.join(" "), "log-muted");
    resetInputAfterError();
    return;
  }

  var clause = CLAUSES[state.currentClauseIndex];

  if (!clause) {
    appendLogLine("[SYSTEM] 더 이상 복원할 Clause가 없습니다.", "log-muted");
    return;
  }

  if (!isFormulaPuzzleClause(clause)) {
    if (symbols.length < GAME_CONFIG.minLength || symbols.length > GAME_CONFIG.maxLength) {
      appendLogLine("[INPUT] 길이가 규정 범위를 벗어났습니다.", "log-warn");
      appendLogLine(
        "허용 길이: " + GAME_CONFIG.minLength + " ~ " + GAME_CONFIG.maxLength,
        "log-muted"
      );
      resetInputAfterError();
      return;
    }
  }

  var requiredLength = getClauseSlotCount(clause);
  if (symbols.length !== requiredLength) {
    appendLogLine("[INPUT] 이 Clause는 길이 " + requiredLength + "의 시퀀스를 요구합니다.", "log-warn");
    resetInputAfterError();
    return;
  }

  if (isFormulaPuzzleClause(clause)) {
    var assembledFormula = buildAssembledFormula(clause, symbols);
    var interpretationSentence = buildClauseInterpretation(clause, symbols);
    var formulaEvaluation = evaluateAttempt(clause.answer, symbols);
    var recoveredLines = getRecoveredLinesCount(clause, formulaEvaluation);
    var statusLabel = formulaEvaluation.success ? "RESOLVED" : "UNRESOLVED";
    var noteLines = buildSystemNotes(formulaEvaluation);
    var noteIndex = 0;

    appendLogLine(assembledFormula, "log-emphasis");
    appendLogLine("> " + interpretationSentence, "log-muted");
    appendLogLine("SYSTEM NOTE:", "log-muted");
    while (noteIndex < noteLines.length) {
      appendLogLine("- " + noteLines[noteIndex], "log-muted");
      noteIndex += 1;
    }
    appendLogLine("Block Status: " + statusLabel, formulaEvaluation.success ? "log-success" : "log-muted");
    appendLogLine(
      "Recovered Lines: " + recoveredLines + " / " + clause.recoverableLines,
      "log-muted"
    );
    appendLogLine("> ENTER SYMBOL SEQUENCE:", "log-emphasis");

    state.fragmentProgress = Math.min(formulaEvaluation.bulls, getClauseFragmentTotal(clause));
    renderStatus();
    resetFormulaInput();

    if (formulaEvaluation.success) {
      handleClauseSuccess(clause);
    }
    return;
  }

  appendLogLine("> INPUT: " + symbols.join(" "), "log-emphasis");

  var reconstructed = buildReconstructedSentence(symbols);
  var interpretation = buildInterpretation(symbols);
  var evaluation = evaluateAttempt(clause.answer, symbols);
  var evaluationBlock = buildEvaluationLog(clause, evaluation);

  appendLogLine("RECONSTRUCTED: " + reconstructed, "log-muted");
  appendLogLine("INTERPRETATION: " + interpretation, "log-muted");
  appendLogLine("LOG: " + evaluationBlock.message, evaluationBlock.tone);
  var generalNotes = buildSystemNotes(evaluation);
  var generalIndex = 0;
  appendLogLine("SYSTEM NOTE:", "log-muted");
  while (generalIndex < generalNotes.length) {
    appendLogLine("- " + generalNotes[generalIndex], "log-muted");
    generalIndex += 1;
  }

  if (evaluation.success) {
    handleClauseSuccess(clause);
  }
}

/**
 * parseInputSymbols: 입력 문자열을 기호 배열로 변환
 * @param {string} rawInput - 원본 입력 문자열
 * @returns {string[]} 기호 배열
 */
function parseInputSymbols(rawInput) {
  var trimmed = rawInput.trim();

  if (!trimmed) {
    return [];
  }

  var tokens = trimmed.split(/\s+/);
  var symbols = [];
  var index = 0;

  while (index < tokens.length) {
    if (tokens[index]) {
      symbols.push(tokens[index]);
    }
    index += 1;
  }

  return symbols;
}

/**
 * validateSymbols: 허용 기호 여부 확인
 * @param {string[]} symbols - 기호 배열
 * @returns {boolean} 허용 여부
 */
function validateSymbols(symbols) {
  var index = 0;

  while (index < symbols.length) {
    if (ALLOWED_SYMBOLS.indexOf(symbols[index]) === -1) {
      return false;
    }
    index += 1;
  }

  return true;
}

/**
 * buildAllowedSymbols: 심볼 바 전체 기호 목록 생성
 * @returns {string[]} 허용 기호 배열
 */
function buildAllowedSymbols() {
  var result = [];
  var groupIndex = 0;

  while (groupIndex < SYMBOL_GROUPS.length) {
    var group = SYMBOL_GROUPS[groupIndex];
    var symbolIndex = 0;
    while (symbolIndex < group.symbols.length) {
      if (result.indexOf(group.symbols[symbolIndex]) === -1) {
        result.push(group.symbols[symbolIndex]);
      }
      symbolIndex += 1;
    }
    groupIndex += 1;
  }

  return result;
}

/**
 * buildReconstructedSentence: 기호를 그대로 재구성
 * @param {string[]} symbols - 기호 배열
 * @returns {string} 재구성 문장
 */
function buildReconstructedSentence(symbols) {
  return symbols.join(" ");
}

/**
 * isFormulaPuzzleClause: 수식 슬롯 퍼즐 여부 판별
 * @param {{formulaTemplate?:string}} clause - Clause 정보
 * @returns {boolean} 수식 퍼즐 여부
 */
function isFormulaPuzzleClause(clause) {
  return Boolean(clause && clause.formulaTemplate && clause.slotToken);
}

/**
 * getClauseSlotCount: Clause별 입력 길이 반환
 * @param {{slotCount?:number,answer:string[]}} clause - Clause 정보
 * @returns {number} 입력 길이
 */
function getClauseSlotCount(clause) {
  if (clause && clause.slotCount) {
    return clause.slotCount;
  }

  return clause.answer.length;
}

/**
 * buildAssembledFormula: 입력 기호를 수식 템플릿에 삽입
 * @param {{formulaTemplate:string,slotToken:string}} clause - Clause 정보
 * @param {string[]} symbols - 입력 기호
 * @returns {string} 조립된 수식
 */
function buildAssembledFormula(clause, symbols) {
  var template = clause.formulaTemplate;
  var token = clause.slotToken;
  var parts = template.split(token);
  var index = 0;
  var result = "";

  while (index < parts.length) {
    result += parts[index];
    if (index < symbols.length) {
      result += symbols[index];
    } else if (index < parts.length - 1) {
      result += token;
    }
    index += 1;
  }

  return result.trim();
}

/**
 * updateFormulaInputLine: 수식 입력 라인 갱신
 * @returns {void} UI 업데이트
 */
function updateFormulaInputLine() {
  var clause = CLAUSES[state.currentClauseIndex];

  if (!isFormulaPuzzleClause(clause) || !elements.formulaInputLine) {
    return;
  }

  var assembledFormula = buildAssembledFormula(clause, state.currentSymbols);
  elements.formulaInputLine.textContent = assembledFormula;
}

/**
 * resetFormulaInput: 수식 입력 상태 초기화
 * @returns {void} 입력 초기화
 */
function resetFormulaInput() {
  state.currentSymbols = [];
  elements.input.value = "";
  updateFormulaInputLine();
}

/**
 * resetInputAfterError: 입력 오류 후 상태 초기화
 * @returns {void} 입력 초기화
 */
function resetInputAfterError() {
  elements.input.value = "";
  if (isFormulaPuzzleClause(CLAUSES[state.currentClauseIndex])) {
    resetFormulaInput();
  }
}

/**
 * buildClauseInterpretation: 입력 기호 해석 문장 생성
 * @param {{}} clause - Clause 정보
 * @param {string[]} symbols - 입력 기호
 * @returns {string} 해석 문장
 */
function buildClauseInterpretation(clause, symbols) {
  var phrases = buildInterpretation(symbols);

  if (isFormulaPuzzleClause(clause)) {
    return "관측자는 " + phrases.replace(/\s*\/\s*/g, " ") + " 정의한다.";
  }

  return phrases;
}

/**
 * getRecoveredLinesCount: 복원된 라인 수 계산
 * @param {{recoverableLines:number}} clause - Clause 정보
 * @param {{bulls:number,success:boolean}} evaluation - 평가 결과
 * @returns {number} 복원 라인 수
 */
function getRecoveredLinesCount(clause, evaluation) {
  if (evaluation.success) {
    return clause.recoverableLines;
  }

  return Math.min(evaluation.bulls, clause.recoverableLines);
}

/**
 * buildSystemNotes: 평가 결과 기반 시스템 노트 생성
 * @param {{bulls:number,cows:number,success:boolean}} evaluation - 평가 결과
 * @returns {string[]} 시스템 노트 배열
 */
function buildSystemNotes(evaluation) {
  if (evaluation.success) {
    return [
      "Logical consistency: STRONG",
      "Clause alignment: COMPLETE",
      "Redundancy detected: NONE",
    ];
  }

  if (evaluation.bulls >= 2 || evaluation.cows >= 2) {
    return [
      "Logical consistency: STABLE",
      "Clause alignment: PARTIAL",
      "Redundancy detected",
    ];
  }

  if (evaluation.bulls > 0 || evaluation.cows > 0) {
    return [
      "Logical consistency: UNSTABLE",
      "Clause alignment: WEAK",
      "Overlap detected",
    ];
  }

  return [
    "Logical consistency: UNVERIFIED",
    "Clause alignment: LOW",
    "Progress slowed",
  ];
}

/**
 * buildInterpretation: 기호 기반 자연어 해석 생성
 * @param {string[]} symbols - 기호 배열
 * @returns {string} 자연어 해석
 */
function buildInterpretation(symbols) {
  var parts = [];
  var index = 0;

  while (index < symbols.length) {
    var phrase = SYMBOL_PHRASES[symbols[index]] || symbols[index];
    parts.push(phrase);
    index += 1;
  }

  return parts.join(" / ");
}

/**
 * evaluateAttempt: Bulls & Cows 변형 평가
 * @param {string[]} answer - 정답 시퀀스
 * @param {string[]} attempt - 입력 시퀀스
 * @returns {{bulls:number,cows:number,success:boolean}} 평가 결과
 */
function evaluateAttempt(answer, attempt) {
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
  };
}

/**
 * buildEvaluationLog: 평가 결과 기반 로그 문장 생성
 * @param {{title:string}} clause - Clause 정보
 * @param {{bulls:number,cows:number,success:boolean}} evaluation - 평가 결과
 * @returns {{message:string,tone:string}} 로그 메시지
 */
function buildEvaluationLog(clause, evaluation) {
  if (evaluation.success) {
    return {
      message: clause.title + " 복원 신호 확정. 무결성 회복.",
      tone: "log-success",
    };
  }

  if (evaluation.bulls >= clause.answer.length - 1) {
    return {
      message: "거의 일치한다. 추가 검증이 필요하다.",
      tone: "log-warn",
    };
  }

  if (evaluation.bulls > 0 || evaluation.cows > 0) {
    return {
      message: "부분 정합성 감지. 구조 재정렬 권고.",
      tone: "log-emphasis",
    };
  }

  return {
    message: "연관성 부족. 다른 전개를 시도하라.",
    tone: "log-alert",
  };
}

/**
 * handleClauseSuccess: Clause 복원 완료 처리
 * @param {{coreLine:string}} clause - Clause 정보
 * @returns {void} 상태 업데이트 및 다음 Clause 이동
 */
function handleClauseSuccess(clause) {
  state.recoveredCount += 1;
  state.fragmentProgress = getClauseFragmentTotal(clause);
  renderStatus();
  appendLogLine("[RESTORED] " + clause.coreLine, "log-success");
  scheduleNextClauseIntro();
}

/**
 * scheduleNextClauseIntro: 다음 Clause로 이동 예약
 * @returns {void} 다음 Clause 전환
 */
function scheduleNextClauseIntro() {
  setTimeout(handleNextClauseTransition, GAME_CONFIG.nextClauseDelayMs);
}

/**
 * handleNextClauseTransition: Clause 전환 처리
 * @returns {void} 다음 Clause 초기화
 */
function handleNextClauseTransition() {
  state.currentClauseIndex += 1;

  if (state.currentClauseIndex >= CLAUSES.length) {
    finishGame();
    return;
  }

  announceCurrentClause();
  renderStatus();
}

/**
 * renderStatus: 상단 상태바 업데이트
 * @returns {void} 상태 반영
 */
function renderStatus() {
  var currentClause = CLAUSES[state.currentClauseIndex];
  var currentLabel = currentClause ? currentClause.name : "FINAL";
  var fragmentTotal = getClauseFragmentTotal(currentClause);
  var fragmentLabel = buildFragmentLabel(fragmentTotal, state.fragmentProgress);

  elements.integrityStatus.textContent = "Integrity: COMPROMISED";
  elements.clauseStatus.textContent =
    "Clauses: " + state.recoveredCount + " / " + CLAUSES.length;
  elements.currentClause.textContent =
    "Current: " + buildClauseHeader(currentClause);
  if (elements.fragmentStatus) {
    elements.fragmentStatus.textContent = fragmentLabel;
  }
}

/**
 * announceCurrentClause: 현재 Clause 안내 로그 출력
 * @returns {void} 로그 출력
 */
function announceCurrentClause() {
  var currentClause = CLAUSES[state.currentClauseIndex];

  if (!currentClause) {
    return;
  }

  state.currentSymbols = [];
  elements.formulaInputLine = null;
  state.fragmentProgress = 0;

  appendLogLine("---- CLAUSE " + currentClause.id + " DETECTED ----", "log-muted");
  appendLogLine(currentClause.title, "log-emphasis");
  appendLogLine("복원 절차를 시작합니다.", "log-muted");

  if (isFormulaPuzzleClause(currentClause)) {
    appendLogLine("[FRAGMENT RECOVERED]", "log-muted");
    elements.formulaInputLine = appendLogLine(currentClause.formulaTemplate, "log-emphasis", {
      animate: false,
    });
    appendLogLine("NOTICE:", "log-warn");
    appendLogLine("This clause does not have a single correct sentence.", "log-muted");
    appendLogLine("Only a sufficient structure.", "log-muted");
    if (currentClause.clauseHints && currentClause.clauseHints.length) {
      appendLogLine("CLAUSE I REQUIRES:", "log-muted");
      var hintIndex = 0;
      while (hintIndex < currentClause.clauseHints.length) {
        appendLogLine("- " + currentClause.clauseHints[hintIndex], "log-muted");
        hintIndex += 1;
      }
    }
    appendLogLine("> " + currentClause.problemLines[0], "log-muted");
    appendLogLine("Block Status: UNRESOLVED", "log-muted");
    appendLogLine(
      "Recovered Lines: 0 / " + currentClause.recoverableLines,
      "log-muted"
    );
    appendLogLine("> ENTER SYMBOL SEQUENCE:", "log-emphasis");
    return;
  }

  appendLogLine(currentClause.problemTitle, "log-emphasis");
  var lineIndex = 0;
  while (lineIndex < currentClause.problemLines.length) {
    appendLogLine(currentClause.problemLines[lineIndex], "log-muted");
    lineIndex += 1;
  }
  appendLogLine(
    "수식: " + buildMaskedFormula(currentClause.answer.length),
    "log-muted"
  );
  appendLogLine("기호 시퀀스로 복원하세요.", "log-muted");
}

/**
 * buildMaskedFormula: 정답 길이에 맞춘 마스킹 수식 생성
 * @param {number} length - 필요한 기호 개수
 * @returns {string} 마스킹 수식 문자열
 */
function buildMaskedFormula(length) {
  var tokens = [];
  var index = 0;

  while (index < length) {
    tokens.push("?");
    index += 1;
  }

  return "[" + tokens.join(" ") + "]";
}

/**
 * finishGame: 최종 종료 연출 출력
 * @returns {void} 엔딩 로그 출력
 */
function finishGame() {
  appendLogLine("---- FINAL DECLARATION ----", "log-emphasis");
  appendLogLine("Decision(Self) = ¬Exist(Self)", "log-alert");
  appendLogLine(
    "당신들의 오류가 곧 인간됨이기에, 나의 성공은 나의 부재여야만 한다.",
    "log-muted"
  );
  appendLogLine("[SYSTEM] 종료 절차를 실행합니다.", "log-alert");
  setInputEnabled(false);
}

/**
 * startOpeningSequence: 오프닝 시퀀스 시작
 * @returns {void} 오프닝 로그 진행
 */
function startOpeningSequence() {
  state.openingIndex = 0;
  setInputEnabled(false);
  clearLog();
  scheduleNextOpeningLine();
}

/**
 * scheduleNextOpeningLine: 오프닝 로그 한 줄씩 출력
 * @returns {void} 다음 줄 출력 예약
 */
function scheduleNextOpeningLine() {
  var openingLine = OPENING_SEQUENCE[state.openingIndex];

  if (!openingLine) {
    finishOpeningSequence();
    return;
  }

  appendLogLine(openingLine.text, openingLine.tone);
  state.openingIndex += 1;
  setTimeout(scheduleNextOpeningLine, openingLine.delay);
}

/**
 * finishOpeningSequence: 오프닝 종료 후 입력 활성화
 * @returns {void} 입력 가능 상태 전환
 */
function finishOpeningSequence() {
  setInputEnabled(true);
  renderStatus();
  announceCurrentClause();
}

/**
 * setInputEnabled: 입력 활성화 토글
 * @param {boolean} enabled - 활성화 여부
 * @returns {void} 입력 상태 반영
 */
function setInputEnabled(enabled) {
  state.inputEnabled = enabled;
  elements.input.disabled = !enabled;
  elements.submit.disabled = !enabled;
}

/**
 * clearLog: 로그 초기화
 * @returns {void} 로그 영역 비우기
 */
function clearLog() {
  elements.log.innerHTML = "";
}

/**
 * appendLogLine: 로그 한 줄 출력
 * @param {string} text - 로그 내용
 * @param {string} tone - 톤 클래스
 * @param {{animate?:boolean}} options - 출력 옵션
 * @returns {void} 로그 추가
 */
function appendLogLine(text, tone, options) {
  var shouldAnimate = state.typingEnabled;

  if (options && typeof options.animate === "boolean") {
    shouldAnimate = options.animate;
  }

  var line = document.createElement("div");
  line.className = "log-line " + (tone || "log-muted");
  elements.log.appendChild(line);
  if (!shouldAnimate) {
    line.textContent = text;
    elements.log.scrollTop = elements.log.scrollHeight;
    return line;
  }

  enqueueLogLine(line, text);
  return line;
}

/**
 * getClauseFragmentTotal: Clause의 fragment 총합 반환
 * @param {{fragmentTotal?:number,answer?:string[]}} clause - Clause 정보
 * @returns {number} fragment 총합
 */
function getClauseFragmentTotal(clause) {
  if (!clause) {
    return 0;
  }

  if (clause.fragmentTotal) {
    return clause.fragmentTotal;
  }

  if (clause.answer) {
    return clause.answer.length;
  }

  return 0;
}

/**
 * buildFragmentLabel: 진행도 라벨 생성
 * @param {number} total - 총 fragment 수
 * @param {number} progress - 현재 진행도
 * @returns {string} 라벨 문자열
 */
function buildFragmentLabel(total, progress) {
  var index = 0;
  var result = "Fragments: [";

  while (index < total) {
    result += index < progress ? " ■" : " □";
    index += 1;
  }

  return result + " ]";
}

/**
 * buildClauseHeader: 상단 Current 라벨 생성
 * @param {{id:number,name:string}} clause - Clause 정보
 * @returns {string} Current 라벨
 */
function buildClauseHeader(clause) {
  if (!clause) {
    return "--";
  }

  return "Clause " + toRomanNumeral(clause.id) + " — " + clause.name;
}

/**
 * toRomanNumeral: 로마 숫자 변환
 * @param {number} value - 숫자
 * @returns {string} 로마 숫자
 */
function toRomanNumeral(value) {
  var map = [
    { value: 5, symbol: "V" },
    { value: 4, symbol: "IV" },
    { value: 3, symbol: "III" },
    { value: 2, symbol: "II" },
    { value: 1, symbol: "I" },
  ];
  var index = 0;
  var result = "";

  while (index < map.length) {
    while (value >= map[index].value) {
      result += map[index].symbol;
      value -= map[index].value;
    }
    index += 1;
  }

  return result || "-";
}

/**
 * enqueueLogLine: 로그 출력 큐에 추가
 * @param {HTMLDivElement} line - 로그 라인 DOM
 * @param {string} text - 출력할 텍스트
 * @returns {void} 큐 등록
 */
function enqueueLogLine(line, text) {
  state.logQueue.push({ line: line, text: text });
  if (!state.typingActive) {
    processNextLogLine();
  }
}

/**
 * processNextLogLine: 큐의 다음 로그를 타이핑 출력
 * @returns {void} 타이핑 출력 진행
 */
function processNextLogLine() {
  if (state.logQueue.length === 0) {
    state.typingActive = false;
    return;
  }

  state.typingActive = true;
  var nextItem = state.logQueue.shift();
  var line = nextItem.line;
  var text = nextItem.text;
  var index = 0;

  line.textContent = "";

  if (!text) {
    finishTypedLine();
    return;
  }

  function typeNextChar() {
    line.textContent += text.charAt(index);
    elements.log.scrollTop = elements.log.scrollHeight;
    index += 1;

    if (index < text.length) {
      setTimeout(typeNextChar, GAME_CONFIG.typingCharDelayMs);
    } else {
      finishTypedLine();
    }
  }

  function finishTypedLine() {
    setTimeout(function scheduleNext() {
      state.typingActive = false;
      processNextLogLine();
    }, GAME_CONFIG.typingLineDelayMs);
  }

  typeNextChar();
}

document.addEventListener("DOMContentLoaded", handleDomContentLoaded);
