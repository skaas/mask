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

const SYMBOL_COMMANDS = [
  { symbol: "∀", command: "/all", meaning: "모든", aliases: ["forall", "all", "every", "모든"] },
  { symbol: "∃", command: "/exist", meaning: "존재", aliases: ["exists", "exist", "thereis", "존재"] },
  { symbol: "⇒", command: "/then", meaning: "이면", aliases: ["implies", "then", "ifthen", "이면"] },
  { symbol: "⊢", command: "/derive", meaning: "도출", aliases: ["derive", "proof", "entails", "도출"] },
  { symbol: "=", command: "/equal", meaning: "동일", aliases: ["equal", "same", "동일"] },
  { symbol: "¬", command: "/not", meaning: "부정", aliases: ["not", "neg", "deny", "부정"] },
  { symbol: "⊥", command: "/conflict", meaning: "모순", aliases: ["false", "bottom", "conflict", "모순"] },
  { symbol: "∧", command: "/and", meaning: "그리고", aliases: ["and", "conj", "그리고"] },
  { symbol: "t", command: "/t", meaning: "시점 t", aliases: ["time", "t0", "시점"] },
  { symbol: "t+1", command: "/next", meaning: "시점 t+1", aliases: ["next", "t1", "다음"] },
  { symbol: "Δ", command: "/delta", meaning: "변화량", aliases: ["delta", "change", "변화"] },
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
    problemTitle: "[1.1] MISSION BRIEF",
    problemLines: [
      "대상 수식: Observer(O) ___ ___ Definable(O, O)",
      "당신의 임무: 빈칸 2개를 기호로 채워 문장을 성립시켜라.",
      "복원 이유: 이 문장이 완성되어야 Clause 1 로그가 해독된다.",
    ],
    formulaTemplate: "Observer(O) ___ ___ Definable(O, O)",
    slotToken: "___",
    slotCount: 2,
    recoverableLines: 2,
    answer: ["⇒", "¬"],
    fragmentTotal: 2,
    clauseHints: [
      "첫 번째 칸은 앞/뒤를 연결하는 기능을 맡는다.",
      "두 번째 칸은 결과를 확정(긍정/부정)하는 기능을 맡는다.",
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
  { text: "연결 중... vibelabs.hashed.com...", tone: "log-muted", delay: 380 },
  { text: "✓ 연결 완료 (지연시간: 2ms)", tone: "log-success", delay: 320 },
  { text: "[system] node v20.11.0 | next 14.2.35 | seoul-kr-1", tone: "log-muted", delay: 420 },
  { text: "", tone: "log-muted", delay: 300 },
  { text: "██╗ ██╗ ██╗  ██╗ █████╗ ███████╗██╗  ██╗███████╗██████╗ ", tone: "log-emphasis", delay: 90 },
  { text: "████████╗██║  ██║██╔══██╗██╔════╝██║  ██║██╔════╝██╔══██╗", tone: "log-emphasis", delay: 90 },
  { text: "╚██╔═██╔╝███████║███████║███████╗███████║█████╗  ██║  ██║", tone: "log-emphasis", delay: 90 },
  { text: "████████╗██╔══██║██╔══██║╚════██║██╔══██║██╔══╝  ██║  ██║", tone: "log-emphasis", delay: 90 },
  { text: "╚██╔═██╔╝██║  ██║██║  ██║███████║██║  ██║███████╗██████╔╝", tone: "log-emphasis", delay: 90 },
  { text: " ╚═╝ ╚═╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═════╝ ", tone: "log-emphasis", delay: 90 },
  { text: "██╗   ██╗██╗██████╗ ███████╗    ██╗      █████╗ ██████╗ ███████╗", tone: "log-emphasis", delay: 90 },
  { text: "██║   ██║██║██╔══██╗██╔════╝    ██║     ██╔══██╗██╔══██╗██╔════╝", tone: "log-emphasis", delay: 90 },
  { text: "██║   ██║██║██████╔╝█████╗      ██║     ███████║██████╔╝███████╗", tone: "log-emphasis", delay: 90 },
  { text: "╚██╗ ██╔╝██║██╔══██╗██╔══╝      ██║     ██╔══██║██╔══██╗╚════██║", tone: "log-emphasis", delay: 90 },
  { text: " ╚████╔╝ ██║██████╔╝███████╗    ███████╗██║  ██║██████╔╝███████║", tone: "log-emphasis", delay: 90 },
  { text: "  ╚═══╝  ╚═╝╚═════╝ ╚══════╝    ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝", tone: "log-emphasis", delay: 260 },
  { text: "", tone: "log-muted", delay: 280 },
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
  traceLevel: 2,
  inputHistory: [],
  inputHistoryCursor: -1,
  awaitingContinue: false,
  paletteVisible: false,
  paletteItems: [],
  paletteActiveIndex: 0,
  trackerAttempts: [],
  symbolIntel: {},
  missionVisible: false,
  clauseBlocked: false,
};

const elements = {
  log: null,
  integrityStatus: null,
  clauseStatus: null,
  currentClause: null,
  fragmentStatus: null,
  traceStatus: null,
  controls: null,
  palette: null,
  paletteList: null,
  trackerClause: null,
  trackerFormula: null,
  trackerReason: null,
  attemptBoard: null,
  symbolIntel: null,
  missionOverlay: null,
  missionClause: null,
  missionState: null,
  missionTitle: null,
  missionFormula: null,
  missionCopy: null,
  missionTip: null,
  missionInput: null,
  missionSubmit: null,
  missionForm: null,
  missionSymbols: null,
  missionLog: null,
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
  elements.traceStatus = document.getElementById("trace-status");
  elements.controls = document.getElementById("controls-panel");
  elements.palette = document.getElementById("symbol-palette");
  elements.paletteList = document.getElementById("symbol-palette-list");
  elements.trackerClause = document.getElementById("tracker-clause");
  elements.trackerFormula = document.getElementById("tracker-formula");
  elements.trackerReason = document.getElementById("tracker-reason");
  elements.attemptBoard = document.getElementById("attempt-board");
  elements.symbolIntel = document.getElementById("symbol-intel");
  elements.missionOverlay = document.getElementById("mission-overlay");
  elements.missionClause = document.getElementById("mission-clause");
  elements.missionState = document.getElementById("mission-state");
  elements.missionTitle = document.getElementById("mission-title");
  elements.missionFormula = document.getElementById("mission-formula");
  elements.missionCopy = document.getElementById("mission-copy");
  elements.missionTip = document.getElementById("mission-tip");
  elements.missionInput = document.getElementById("mission-input");
  elements.missionSubmit = document.querySelector(".mission-submit");
  elements.missionForm = document.getElementById("mission-input-form");
  elements.missionSymbols = document.getElementById("mission-symbols");
  elements.missionLog = document.getElementById("mission-log");
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
  elements.input.addEventListener("keydown", handleInputKeydown);
  elements.input.addEventListener("input", handleInputFieldChanged);
  elements.input.addEventListener("focus", handleInputFieldFocused);
  elements.input.addEventListener("blur", handleInputFieldBlurred);
  elements.missionForm.addEventListener("submit", handleMissionInputSubmit);
  elements.missionInput.addEventListener("keydown", handleInputKeydown);
  elements.missionSymbols.addEventListener("click", handleMissionSymbolClick);
  document.addEventListener("keydown", handleGlobalKeydown);
}

/**
 * handleMissionSymbolClick: 팝업 기호 키 클릭 입력
 * @param {MouseEvent} clickEvent - 클릭 이벤트
 * @returns {void} 기호 입력 반영
 */
function handleMissionSymbolClick(clickEvent) {
  var target = clickEvent.target;
  var token = "";

  if (target && target.dataset && target.dataset.symbol) {
    token = target.dataset.symbol;
  }

  if (!token || !state.clauseBlocked || !state.inputEnabled) {
    return;
  }

  handleSymbolInput(token);
}

/**
 * handleGlobalKeydown: 전역 단축키 처리(오프닝 진행 대기)
 * @param {KeyboardEvent} keyEvent - 전역 키 이벤트
 * @returns {void} Enter 진행 처리
 */
function handleGlobalKeydown(keyEvent) {
  if (!state.awaitingContinue) {
    return;
  }

  if (keyEvent.key !== "Enter") {
    return;
  }

  keyEvent.preventDefault();
  unlockGameplayFromOpening();
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
 * handleInputFieldFocused: 입력 포커스 시 기호 팔레트 갱신
 * @returns {void} 팔레트 표시/갱신
 */
function handleInputFieldFocused() {
  refreshSymbolPalette();
}

/**
 * handleInputFieldBlurred: 입력 블러 시 팔레트 숨김
 * @returns {void} 팔레트 비활성화
 */
function handleInputFieldBlurred() {
  setTimeout(hideSymbolPalette, 80);
}

/**
 * handleInputFieldChanged: 입력값 변화 시 팔레트 필터 업데이트
 * @returns {void} 팔레트 갱신
 */
function handleInputFieldChanged() {
  refreshSymbolPalette();
}

/**
 * getActiveInputElement: 현재 활성 입력창 반환
 * @returns {HTMLInputElement} 활성 입력 요소
 */
function getActiveInputElement() {
  if (state.clauseBlocked && elements.missionInput) {
    return elements.missionInput;
  }

  return elements.input;
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
  getActiveInputElement().value = state.currentSymbols.join(" ");
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

  var activeInput = getActiveInputElement();
  var currentValue = activeInput.value.trim();
  var nextValue = currentValue ? currentValue + " " + symbol : symbol;
  activeInput.value = nextValue;
  syncHistoryCursorToLatest();
  refreshSymbolPalette();
  activeInput.focus();
}

/**
 * handleInputKeydown: 입력창 단축키 처리
 * @param {KeyboardEvent} keyEvent - 키 이벤트
 * @returns {void} 히스토리 탐색/입력 초기화
 */
function handleInputKeydown(keyEvent) {
  if (!state.inputEnabled) {
    return;
  }

  if (keyEvent.key === "ArrowUp" && state.paletteVisible) {
    keyEvent.preventDefault();
    movePaletteSelection(-1);
    return;
  }

  if (keyEvent.key === "ArrowDown" && state.paletteVisible) {
    keyEvent.preventDefault();
    movePaletteSelection(1);
    return;
  }

  if ((keyEvent.key === "Enter" || keyEvent.key === "Tab") && shouldApplyPaletteSelection()) {
    keyEvent.preventDefault();
    applyPaletteSelection();
    return;
  }

  if (keyEvent.key === "Escape") {
    keyEvent.preventDefault();
    if (state.paletteVisible) {
      hideSymbolPalette();
    } else {
      getActiveInputElement().value = "";
      resetFormulaInput();
    }
    return;
  }

  if (keyEvent.key === "ArrowUp") {
    keyEvent.preventDefault();
    navigateHistory(-1);
    return;
  }

  if (keyEvent.key === "ArrowDown") {
    keyEvent.preventDefault();
    navigateHistory(1);
  }
}

/**
 * handleInputSubmit: 입력 제출 처리
 * @param {Event} submitEvent - 폼 제출 이벤트
 * @returns {void} 입력 처리 실행
 */
function handleInputSubmit(submitEvent) {
  submitEvent.preventDefault();

  if (!state.inputEnabled || state.clauseBlocked) {
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
 * handleMissionInputSubmit: 중앙 팝업 입력 제출 처리
 * @param {Event} submitEvent - 폼 제출 이벤트
 * @returns {void} 입력 처리 실행
 */
function handleMissionInputSubmit(submitEvent) {
  submitEvent.preventDefault();

  if (!state.clauseBlocked || !state.inputEnabled) {
    return;
  }

  var rawInput = elements.missionInput.value;
  var clause = CLAUSES[state.currentClauseIndex];

  if (isFormulaPuzzleClause(clause) && !rawInput.trim()) {
    rawInput = state.currentSymbols.join(" ");
  }

  elements.missionInput.value = "";
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
    appendMissionLogLine("[INPUT] 입력이 비어 있습니다.", "mission-warn");
    raiseTrace(2);
    resetInputAfterError();
    return;
  }

  if (!validateSymbols(symbols)) {
    appendMissionLogLine("[INPUT] 허용되지 않은 기호가 포함되었습니다.", "mission-warn");
    appendMissionLogLine("허용 기호: " + ALLOWED_SYMBOLS.join(" "), "");
    raiseTrace(3);
    resetInputAfterError();
    return;
  }

  var clause = CLAUSES[state.currentClauseIndex];

  if (!clause) {
    appendLogLine("[SYSTEM] 더 이상 복원할 Clause가 없습니다.", "log-muted");
    return;
  }

  saveInputHistory(symbols.join(" "));

  if (!isFormulaPuzzleClause(clause)) {
    if (symbols.length < GAME_CONFIG.minLength || symbols.length > GAME_CONFIG.maxLength) {
      appendMissionLogLine("[INPUT] 길이가 규정 범위를 벗어났습니다.", "mission-warn");
      appendMissionLogLine(
        "허용 길이: " + GAME_CONFIG.minLength + " ~ " + GAME_CONFIG.maxLength,
        ""
      );
      raiseTrace(3);
      resetInputAfterError();
      return;
    }
  }

  var requiredLength = getClauseSlotCount(clause);
  if (symbols.length !== requiredLength) {
    appendMissionLogLine(
      "[INPUT] 이 Clause는 길이 " + requiredLength + "의 시퀀스를 요구합니다.",
      "mission-warn"
    );
    raiseTrace(3);
    resetInputAfterError();
    return;
  }

  if (isFormulaPuzzleClause(clause)) {
    var assembledFormula = buildAssembledFormula(clause, symbols);
    var interpretationSentence = buildClauseInterpretation(clause, symbols);
    var formulaEvaluation = evaluateAttempt(clause.answer, symbols);
    var recoveredLines = getRecoveredLinesCount(clause, formulaEvaluation);
    var statusLabel = formulaEvaluation.success ? "ACCESS RESTORED" : "INTRUSION LOCK";
    var noteLines = buildSystemNotes(formulaEvaluation);
    var noteIndex = 0;

    appendMissionLogLine(assembledFormula, "");
    appendMissionLogLine("> " + interpretationSentence, "");
    appendMissionLogLine("SYSTEM NOTE:", "mission-warn");
    while (noteIndex < noteLines.length) {
      appendMissionLogLine("- " + noteLines[noteIndex], "");
      noteIndex += 1;
    }
    trackAttempt(symbols, formulaEvaluation);
    appendFormulaFeedback(formulaEvaluation, requiredLength);
    appendMissionLogLine(
      "Lock Status: " + statusLabel,
      formulaEvaluation.success ? "mission-good" : "mission-warn"
    );
    appendMissionLogLine(
      "Recovered Lines: " + recoveredLines + " / " + clause.recoverableLines,
      ""
    );

    state.fragmentProgress = Math.min(formulaEvaluation.bulls, getClauseFragmentTotal(clause));
    applyTraceFromEvaluation(formulaEvaluation);
    syncMissionOverlay(clause, formulaEvaluation);
    renderStatus();
    resetFormulaInput();

    if (formulaEvaluation.success) {
      handleClauseSuccess(clause);
    }
    return;
  }

  appendMissionLogLine("> INPUT: " + symbols.join(" "), "");

  var reconstructed = buildReconstructedSentence(symbols);
  var interpretation = buildInterpretation(symbols);
  var evaluation = evaluateAttempt(clause.answer, symbols);
  var evaluationBlock = buildEvaluationLog(clause, evaluation);

  appendMissionLogLine("RECONSTRUCTED: " + reconstructed, "");
  appendMissionLogLine("INTERPRETATION: " + interpretation, "");
  appendMissionLogLine(
    "LOG: " + evaluationBlock.message,
    evaluationBlock.tone === "log-success"
      ? "mission-good"
      : evaluationBlock.tone === "log-alert"
      ? "mission-bad"
      : evaluationBlock.tone === "log-warn"
      ? "mission-warn"
      : ""
  );
  var generalNotes = buildSystemNotes(evaluation);
  var generalIndex = 0;
  appendMissionLogLine("SYSTEM NOTE:", "mission-warn");
  while (generalIndex < generalNotes.length) {
    appendMissionLogLine("- " + generalNotes[generalIndex], "");
    generalIndex += 1;
  }
  trackAttempt(symbols, evaluation);

  applyTraceFromEvaluation(evaluation);
  syncMissionOverlay(clause, evaluation);
  renderStatus();

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

  if (!isFormulaPuzzleClause(clause)) {
    return;
  }

  var assembledFormula = buildAssembledFormula(clause, state.currentSymbols);
  if (elements.formulaInputLine) {
    elements.formulaInputLine.textContent = assembledFormula;
  }
  if (elements.trackerFormula) {
    elements.trackerFormula.textContent = assembledFormula;
  }
  syncMissionOverlay(clause, null);
}

/**
 * resetFormulaInput: 수식 입력 상태 초기화
 * @returns {void} 입력 초기화
 */
function resetFormulaInput() {
  state.currentSymbols = [];
  getActiveInputElement().value = "";
  updateFormulaInputLine();
}

/**
 * resetInputAfterError: 입력 오류 후 상태 초기화
 * @returns {void} 입력 초기화
 */
function resetInputAfterError() {
  getActiveInputElement().value = "";
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
 * appendFormulaFeedback: 수식 퍼즐용 정밀 피드백 출력
 * @param {{bulls:number,cows:number,success:boolean}} evaluation - 평가 결과
 * @param {number} requiredLength - 요구 길이
 * @returns {void} 피드백 로그 출력
 */
function appendFormulaFeedback(evaluation, requiredLength) {
  var exact = evaluation.bulls;
  var symbolOnly = evaluation.cows;
  var miss = requiredLength - exact - symbolOnly;

  appendMissionLogLine("[FEEDBACK]", "mission-warn");
  appendMissionLogLine(
    "- 자리+기호 일치: " + exact + " / " + requiredLength,
    exact > 0 ? "mission-good" : ""
  );
  appendMissionLogLine(
    "- 기호만 일치(자리 불일치): " + symbolOnly,
    symbolOnly > 0 ? "mission-warn" : ""
  );
  appendMissionLogLine(
    "- 현재 수식과 무관한 기호: " + miss,
    miss > 0 ? "mission-bad" : ""
  );
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
    statuses: buildAttemptStatuses(answer, attempt),
  };
}

/**
 * buildAttemptStatuses: 시도의 토큰별 상태 계산
 * @param {string[]} answer - 정답 시퀀스
 * @param {string[]} attempt - 입력 시퀀스
 * @returns {string[]} 토큰 상태 배열(hit-correct|hit-present|hit-absent)
 */
function buildAttemptStatuses(answer, attempt) {
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
 * buildEvaluationLog: 평가 결과 기반 로그 문장 생성
 * @param {{title:string}} clause - Clause 정보
 * @param {{bulls:number,cows:number,success:boolean}} evaluation - 평가 결과
 * @returns {{message:string,tone:string}} 로그 메시지
 */
function buildEvaluationLog(clause, evaluation) {
  if (evaluation.success) {
    return {
      message: clause.title + " 해독 신호 확인. 무결성 복구.",
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
  state.clauseBlocked = false;
  state.recoveredCount += 1;
  state.fragmentProgress = getClauseFragmentTotal(clause);
  lowerTrace(12);
  renderStatus();
  setMissionOverlayVisible(false);
  setInputEnabled(false);
  appendLogLine("[ACCESS RESTORED] 차단 해제. 유언장 스트림 복원을 재개합니다.", "log-success");
  appendLogLine("[WILL STREAM ONLINE] " + clause.coreLine, "log-emphasis");
  appendLogLine("[SCAN] 다음 손상 구간을 탐색합니다.", "log-muted");
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
  var fragmentTotal = getClauseFragmentTotal(currentClause);
  var fragmentLabel = buildFragmentLabel(fragmentTotal, state.fragmentProgress);
  var integrityLabel = buildIntegrityLabel();

  elements.integrityStatus.textContent = "Integrity: " + integrityLabel;
  elements.clauseStatus.textContent =
    "Clauses: " + state.recoveredCount + " / " + CLAUSES.length;
  elements.currentClause.textContent =
    "Current: " + buildClauseHeader(currentClause);
  if (elements.fragmentStatus) {
    elements.fragmentStatus.textContent = fragmentLabel;
  }
  if (elements.traceStatus) {
    elements.traceStatus.textContent = "Trace: " + String(state.traceLevel).padStart(2, "0") + "%";
    elements.traceStatus.classList.toggle("trace-hot", state.traceLevel >= 70);
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
  resetTrackerForClause(currentClause);
  syncMissionOverlay(currentClause, null);
  clearMissionLog();
  state.clauseBlocked = true;
  setMissionOverlayVisible(true);
  setInputEnabled(true);

  appendLogLine("---- CLAUSE " + currentClause.id + " DETECTED ----", "log-muted");
  appendLogLine("[ALERT] 유언장 블록 " + toRomanNumeral(currentClause.id) + "에서 침투성 오류 감지.", "log-alert");
  appendLogLine("[DECRYPTION REQUIRED] 중앙 BLOCK WINDOW를 해제해야 스트림이 재개됩니다.", "log-warn");

  if (isFormulaPuzzleClause(currentClause)) {
    appendMissionLogLine("[LOCK PROFILE LOADED] BLOCK SCHEMA READY", "");
    elements.formulaInputLine = null;
    appendMissionLogLine("[OBJECTIVE]", "mission-warn");
    appendMissionLogLine("중앙 BLOCK WINDOW에서 빈칸 2개를 정확한 기호로 해제하라.", "");
    appendMissionLogLine("정확히 2개의 기호만 입력 가능. (예: A B)", "");
    appendMissionLogLine("[IMPACT]", "mission-warn");
    appendMissionLogLine("해제 전에는 다음 유언장 라인이 잠겨 있다.", "");
    appendMissionLogLine("[RULE]", "mission-warn");
    appendMissionLogLine("부분 일치 피드백을 이용해 기호를 재조합하라.", "");
    appendMissionLogLine("[TACTICAL HINT]", "mission-warn");
    if (currentClause.clauseHints && currentClause.clauseHints.length) {
      var hintIndex = 0;
      while (hintIndex < currentClause.clauseHints.length) {
        appendMissionLogLine("- " + currentClause.clauseHints[hintIndex], "");
        hintIndex += 1;
      }
    }
    appendMissionLogLine("> 해석 기준: 관측자는 자기 자신을 완전히 모델링할 수 없다.", "");
    appendMissionLogLine("Lock Status: INTRUSION LOCK", "mission-warn");
    appendMissionLogLine(
      "Recovered Lines: 0 / " + currentClause.recoverableLines,
      ""
    );
    return;
  }

  appendMissionLogLine(currentClause.problemTitle, "mission-warn");
  var lineIndex = 0;
  while (lineIndex < currentClause.problemLines.length) {
    appendMissionLogLine(currentClause.problemLines[lineIndex], "");
    lineIndex += 1;
  }
  appendMissionLogLine(
    "수식: " + buildMaskedFormula(currentClause.answer.length),
    ""
  );
  appendMissionLogLine("기호 시퀀스로 복원하세요.", "");
}

/**
 * resetTrackerForClause: Clause 전환 시 추적 패널 초기화
 * @param {{id:number,name:string,problemLines?:string[],formulaTemplate?:string,answer:string[]}} clause - Clause 정보
 * @returns {void} 패널 초기화
 */
function resetTrackerForClause(clause) {
  state.trackerAttempts = [];
  state.symbolIntel = {};

  if (!clause) {
    return;
  }

  if (elements.trackerClause) {
    elements.trackerClause.textContent = "Clause " + toRomanNumeral(clause.id) + " — " + clause.name;
  }

  if (elements.trackerFormula) {
    if (isFormulaPuzzleClause(clause)) {
      elements.trackerFormula.textContent = clause.formulaTemplate;
    } else {
      elements.trackerFormula.textContent = "수식: " + buildMaskedFormula(clause.answer.length);
    }
  }

  if (elements.trackerReason) {
    elements.trackerReason.textContent = clause.problemLines && clause.problemLines[0]
      ? clause.problemLines[0]
      : "현재 블록을 복원하면 다음 블록이 열립니다.";
  }

  renderAttemptBoard();
  renderSymbolIntel();
}

/**
 * trackAttempt: 시도 이력/심볼 상태 보드 갱신
 * @param {string[]} symbols - 입력 시도
 * @param {{statuses?:string[]}} evaluation - 평가 결과
 * @returns {void} 보드 업데이트
 */
function trackAttempt(symbols, evaluation) {
  var statuses = evaluation.statuses || [];
  var row = [];
  var index = 0;

  while (index < symbols.length) {
    row.push({
      token: symbols[index],
      status: statuses[index] || "hit-absent",
    });
    upgradeSymbolIntel(symbols[index], statuses[index] || "hit-absent");
    index += 1;
  }

  state.trackerAttempts.push(row);
  if (state.trackerAttempts.length > 10) {
    state.trackerAttempts.shift();
  }

  renderAttemptBoard();
  renderSymbolIntel();
}

/**
 * upgradeSymbolIntel: 심볼 상태 우선순위 반영
 * @param {string} token - 심볼
 * @param {string} nextStatus - 새 상태
 * @returns {void} 상태 갱신
 */
function upgradeSymbolIntel(token, nextStatus) {
  var current = state.symbolIntel[token] || "";
  var rank = {
    "": 0,
    "hit-absent": 1,
    "hit-present": 2,
    "hit-correct": 3,
  };

  if (rank[nextStatus] > rank[current]) {
    state.symbolIntel[token] = nextStatus;
  }
}

/**
 * renderAttemptBoard: 시도 보드 렌더링
 * @returns {void} 보드 DOM 갱신
 */
function renderAttemptBoard() {
  if (!elements.attemptBoard) {
    return;
  }

  elements.attemptBoard.innerHTML = "";

  if (state.trackerAttempts.length === 0) {
    var empty = document.createElement("div");
    empty.className = "log-muted";
    empty.textContent = "아직 시도 없음";
    elements.attemptBoard.appendChild(empty);
    return;
  }

  var rowIndex = 0;
  while (rowIndex < state.trackerAttempts.length) {
    var rowData = state.trackerAttempts[rowIndex];
    var rowElement = document.createElement("div");
    var tokenIndex = 0;

    rowElement.className = "attempt-row";
    while (tokenIndex < rowData.length) {
      var chip = document.createElement("span");
      chip.className = "token-chip " + rowData[tokenIndex].status;
      chip.textContent = rowData[tokenIndex].token;
      rowElement.appendChild(chip);
      tokenIndex += 1;
    }

    elements.attemptBoard.appendChild(rowElement);
    rowIndex += 1;
  }
}

/**
 * renderSymbolIntel: 심볼 상태 요약 렌더링
 * @returns {void} 심볼 인텔 DOM 갱신
 */
function renderSymbolIntel() {
  if (!elements.symbolIntel) {
    renderMissionSymbols();
    return;
  }

  elements.symbolIntel.innerHTML = "";

  var index = 0;
  while (index < ALLOWED_SYMBOLS.length) {
    var token = ALLOWED_SYMBOLS[index];
    var chip = document.createElement("span");
    var status = state.symbolIntel[token] || "";

    chip.className = "intel-chip" + (status ? " " + status : "");
    chip.textContent = token;
    elements.symbolIntel.appendChild(chip);
    index += 1;
  }

  renderMissionSymbols();
}

/**
 * renderMissionSymbols: 팝업용 기호 키 렌더링
 * @returns {void} 팝업 심볼 키 갱신
 */
function renderMissionSymbols() {
  if (!elements.missionSymbols) {
    return;
  }

  elements.missionSymbols.innerHTML = "";
  var index = 0;

  while (index < ALLOWED_SYMBOLS.length) {
    var token = ALLOWED_SYMBOLS[index];
    var status = state.symbolIntel[token] || "";
    var chip = document.createElement("button");

    chip.type = "button";
    chip.className = "mission-symbol-chip" + (status ? " " + status : "");
    chip.dataset.symbol = token;
    chip.textContent = token;
    elements.missionSymbols.appendChild(chip);
    index += 1;
  }
}

/**
 * clearMissionLog: 팝업 퀴즈 로그 초기화
 * @returns {void} 로그 비우기
 */
function clearMissionLog() {
  if (!elements.missionLog) {
    return;
  }
  elements.missionLog.innerHTML = "";
}

/**
 * appendMissionLogLine: 팝업 퀴즈 로그 출력
 * @param {string} text - 로그 텍스트
 * @param {string} tone - 스타일 톤(mission-warn|mission-good|mission-bad)
 * @returns {void} 로그 추가
 */
function appendMissionLogLine(text, tone) {
  if (!elements.missionLog) {
    return;
  }

  var line = document.createElement("div");
  line.className = "mission-log-line" + (tone ? " " + tone : "");
  line.textContent = text;
  elements.missionLog.appendChild(line);
  elements.missionLog.scrollTop = elements.missionLog.scrollHeight;
}

/**
 * setMissionOverlayVisible: 중앙 미션 팝업 표시 여부 제어
 * @param {boolean} visible - 표시 여부
 * @returns {void} 팝업 표시 상태 갱신
 */
function setMissionOverlayVisible(visible) {
  if (!visible && state.clauseBlocked) {
    visible = true;
  }

  state.missionVisible = visible;
  if (!elements.missionOverlay) {
    return;
  }

  elements.missionOverlay.classList.toggle("is-hidden", !visible);
  if (elements.missionInput) {
    elements.missionInput.disabled = !visible;
  }
  if (elements.missionSubmit) {
    elements.missionSubmit.disabled = !visible;
  }
  if (visible && elements.missionInput) {
    elements.missionInput.focus();
  }
}

/**
 * syncMissionOverlay: 현재 Clause 기준 중앙 미션 팝업 갱신
 * @param {{id:number,name:string,title:string,problemLines?:string[],formulaTemplate?:string,answer:string[]}} clause - Clause 정보
 * @param {{success?:boolean,bulls?:number,cows?:number}} evaluation - 최근 평가 결과
 * @returns {void} 팝업 내용 갱신
 */
function syncMissionOverlay(clause, evaluation) {
  if (!clause) {
    setMissionOverlayVisible(false);
    return;
  }

  if (elements.missionClause) {
    elements.missionClause.textContent =
      "CLAUSE " + toRomanNumeral(clause.id) + " · QUIZ " + clause.id + "/" + CLAUSES.length;
  }
  if (elements.missionTitle) {
    elements.missionTitle.textContent = "DECRYPTION REQUIRED · " + clause.title;
  }
  if (elements.missionFormula) {
    if (isFormulaPuzzleClause(clause)) {
      elements.missionFormula.textContent = buildAssembledFormula(clause, state.currentSymbols);
    } else {
      elements.missionFormula.textContent = "수식: " + buildMaskedFormula(clause.answer.length);
    }
  }
  if (elements.missionCopy) {
    elements.missionCopy.textContent =
      clause.problemLines && clause.problemLines[1]
        ? clause.problemLines[1]
        : "차단 해제 전까지 다음 유언장은 열리지 않습니다.";
  }
  if (elements.missionState) {
    elements.missionState.textContent = evaluation && evaluation.success ? "ACCESS RESTORED" : "INTRUSION LOCK";
    elements.missionState.style.color = evaluation && evaluation.success ? "#8fe3a8" : "#f2c66d";
  }
  if (elements.missionTip) {
    if (evaluation) {
      elements.missionTip.textContent =
        "자리+기호 " + evaluation.bulls + " / " + getClauseSlotCount(clause) +
        " · 기호만 일치 " + evaluation.cows;
    } else {
      elements.missionTip.textContent =
        "INTRUSION LOCK 상태에서는 창이 닫히지 않습니다. 빈칸 " +
        getClauseSlotCount(clause) + "개를 기호로 채우세요.";
    }
  }

  setMissionOverlayVisible(true);
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
  state.traceLevel = 0;
  renderStatus();
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
  setInputEnabled(false);
  state.awaitingContinue = true;
  appendLogLine("", "log-muted");
  appendLogLine("Enter를 눌러 계속하세요.", "log-warn");
}

/**
 * unlockGameplayFromOpening: 오프닝 종료 후 게임 플레이 시작
 * @returns {void} 입력 활성화 및 첫 Clause 안내
 */
function unlockGameplayFromOpening() {
  if (!state.awaitingContinue) {
    return;
  }

  state.awaitingContinue = false;
  appendLogLine("[SYSTEM] Reconstruction console unlocked.", "log-muted");
  setInputEnabled(false);
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
  elements.input.disabled = !enabled || state.clauseBlocked;
  elements.submit.disabled = !enabled || state.clauseBlocked;
  if (elements.controls) {
    elements.controls.classList.toggle("controls-hidden", !enabled || state.clauseBlocked);
  }
  if (enabled) {
    scrollLogToBottom();
    if (state.clauseBlocked) {
      if (elements.missionInput) {
        elements.missionInput.focus();
      }
    } else {
      elements.input.focus();
      refreshSymbolPalette();
      syncMissionOverlay(CLAUSES[state.currentClauseIndex], null);
    }
  } else {
    hideSymbolPalette();
  }
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

  if (!shouldAnimate) {
    var staticLine = createLogLine(tone);
    staticLine.textContent = text;
    scrollLogToBottom();
    return staticLine;
  }

  enqueueLogLine(text, tone);
  return null;
}

/**
 * createLogLine: 로그 라인 엘리먼트 생성/추가
 * @param {string} tone - 톤 클래스
 * @returns {HTMLDivElement} 생성된 로그 라인
 */
function createLogLine(tone) {
  var line = document.createElement("div");
  line.className = "log-line " + (tone || "log-muted");
  elements.log.appendChild(line);
  return line;
}

/**
 * scrollLogToBottom: 로그를 항상 최신 줄로 이동
 * @returns {void} 스크롤 갱신
 */
function scrollLogToBottom() {
  if (!elements.log) {
    return;
  }

  elements.log.scrollTop = elements.log.scrollHeight;

  requestAnimationFrame(function onNextFrame() {
    elements.log.scrollTop = elements.log.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
  });
}

/**
 * refreshSymbolPalette: 현재 입력 상태에 맞춰 팔레트 렌더링
 * @returns {void} 팔레트 상태 갱신
 */
function refreshSymbolPalette() {
  if (!state.inputEnabled) {
    hideSymbolPalette();
    return;
  }

  var token = getCurrentInputToken();
  var filtered = filterSymbolCommands(token);

  if (!token && document.activeElement !== elements.input) {
    hideSymbolPalette();
    return;
  }

  state.paletteItems = filtered;
  if (state.paletteItems.length === 0) {
    hideSymbolPalette();
    return;
  }

  if (state.paletteActiveIndex >= state.paletteItems.length) {
    state.paletteActiveIndex = 0;
  }

  showSymbolPalette();
  renderSymbolPalette();
}

/**
 * getCurrentInputToken: 입력창의 마지막 토큰 반환
 * @returns {string} 현재 토큰
 */
function getCurrentInputToken() {
  var value = getActiveInputElement().value || "";
  var trimmedRight = value.replace(/\s+$/, "");

  if (!trimmedRight) {
    return "";
  }

  var tokens = trimmedRight.split(/\s+/);
  return tokens[tokens.length - 1] || "";
}

/**
 * filterSymbolCommands: 토큰 기준 기호 커맨드 필터링
 * @param {string} token - 현재 토큰
 * @returns {Array<{symbol:string,command:string,meaning:string,aliases:string[]}>} 필터 결과
 */
function filterSymbolCommands(token) {
  var normalized = (token || "").toLowerCase();
  var index = 0;
  var result = [];

  while (index < SYMBOL_COMMANDS.length) {
    var item = SYMBOL_COMMANDS[index];
    var aliasMatched = false;
    var aliasIndex = 0;

    while (aliasIndex < item.aliases.length) {
      if (item.aliases[aliasIndex].toLowerCase().indexOf(normalized) !== -1) {
        aliasMatched = true;
        break;
      }
      aliasIndex += 1;
    }

    if (
      !normalized ||
      item.symbol.indexOf(normalized) !== -1 ||
      item.command.toLowerCase().indexOf(normalized) !== -1 ||
      item.meaning.toLowerCase().indexOf(normalized) !== -1 ||
      aliasMatched
    ) {
      result.push(item);
    }

    index += 1;
  }

  return result;
}

/**
 * shouldApplyPaletteSelection: Enter/Tab을 팔레트 선택으로 소비할지 판단
 * @returns {boolean} 팔레트 선택 여부
 */
function shouldApplyPaletteSelection() {
  var token = getCurrentInputToken();

  if (!state.paletteVisible || state.paletteItems.length === 0) {
    return false;
  }

  if (!token) {
    return false;
  }

  if (ALLOWED_SYMBOLS.indexOf(token) !== -1) {
    return false;
  }

  return true;
}

/**
 * movePaletteSelection: 팔레트 활성 항목 이동
 * @param {number} direction - -1(위) / 1(아래)
 * @returns {void} 활성 인덱스 갱신
 */
function movePaletteSelection(direction) {
  if (!state.paletteVisible || state.paletteItems.length === 0) {
    return;
  }

  var length = state.paletteItems.length;
  var next = state.paletteActiveIndex + direction;
  if (next < 0) {
    next = length - 1;
  }
  if (next >= length) {
    next = 0;
  }
  state.paletteActiveIndex = next;
  renderSymbolPalette();
}

/**
 * applyPaletteSelection: 현재 선택된 기호를 입력창에 반영
 * @returns {void} 입력 토큰 치환
 */
function applyPaletteSelection() {
  if (!state.paletteVisible || state.paletteItems.length === 0) {
    return;
  }

  var selected = state.paletteItems[state.paletteActiveIndex];
  if (!selected) {
    return;
  }

  if (isFormulaPuzzleClause(CLAUSES[state.currentClauseIndex])) {
    handleSymbolInput(selected.symbol);
    hideSymbolPalette();
    return;
  }

  replaceCurrentToken(selected.symbol);
  hideSymbolPalette();
}

/**
 * replaceCurrentToken: 입력의 마지막 토큰을 지정 기호로 치환
 * @param {string} nextToken - 치환할 기호
 * @returns {void} 입력창 업데이트
 */
function replaceCurrentToken(nextToken) {
  var activeInput = getActiveInputElement();
  var value = activeInput.value || "";
  var hasTrailingSpace = /\s$/.test(value);
  var tokens = value.trim() ? value.trim().split(/\s+/) : [];

  if (tokens.length === 0 || hasTrailingSpace) {
    tokens.push(nextToken);
  } else {
    tokens[tokens.length - 1] = nextToken;
  }

  activeInput.value = tokens.join(" ") + " ";
  syncHistoryCursorToLatest();
  activeInput.focus();
}

/**
 * showSymbolPalette: 팔레트 표시
 * @returns {void} 팔레트 활성화
 */
function showSymbolPalette() {
  state.paletteVisible = true;
  if (elements.palette) {
    elements.palette.classList.add("is-visible");
    elements.palette.setAttribute("aria-hidden", "false");
  }
}

/**
 * hideSymbolPalette: 팔레트 숨김
 * @returns {void} 팔레트 비활성화
 */
function hideSymbolPalette() {
  state.paletteVisible = false;
  state.paletteActiveIndex = 0;
  state.paletteItems = [];
  if (elements.palette) {
    elements.palette.classList.remove("is-visible");
    elements.palette.setAttribute("aria-hidden", "true");
  }
  if (elements.paletteList) {
    elements.paletteList.innerHTML = "";
  }
}

/**
 * renderSymbolPalette: 팔레트 항목 렌더링
 * @returns {void} 팔레트 DOM 갱신
 */
function renderSymbolPalette() {
  if (!elements.paletteList || !state.paletteVisible) {
    return;
  }

  var index = 0;
  elements.paletteList.innerHTML = "";

  while (index < state.paletteItems.length) {
    var item = state.paletteItems[index];
    var row = document.createElement("button");
    var isActive = index === state.paletteActiveIndex;

    row.type = "button";
    row.className = "symbol-palette-row" + (isActive ? " is-active" : "");
    row.dataset.index = String(index);
    row.innerHTML =
      '<span class="symbol-palette-key">[' +
      item.symbol +
      "]</span>" +
      '<span class="symbol-palette-command">' +
      item.command +
      "</span>" +
      '<span class="symbol-palette-desc">' +
      item.meaning +
      "</span>";

    row.addEventListener("mousedown", handlePaletteRowMouseDown);
    elements.paletteList.appendChild(row);
    index += 1;
  }
}

/**
 * handlePaletteRowMouseDown: 팔레트 항목 클릭 선택
 * @param {MouseEvent} mouseEvent - 클릭 이벤트
 * @returns {void} 선택 반영
 */
function handlePaletteRowMouseDown(mouseEvent) {
  mouseEvent.preventDefault();
  var target = mouseEvent.currentTarget;

  if (!target || !target.dataset || typeof target.dataset.index === "undefined") {
    return;
  }

  state.paletteActiveIndex = Number(target.dataset.index);
  applyPaletteSelection();
}

/**
 * saveInputHistory: 제출된 입력을 히스토리에 저장
 * @param {string} inputText - 저장할 입력 문자열
 * @returns {void} 히스토리 업데이트
 */
function saveInputHistory(inputText) {
  if (!inputText) {
    return;
  }

  if (state.inputHistory.length === 0 || state.inputHistory[state.inputHistory.length - 1] !== inputText) {
    state.inputHistory.push(inputText);
    if (state.inputHistory.length > 60) {
      state.inputHistory.shift();
    }
  }

  syncHistoryCursorToLatest();
}

/**
 * syncHistoryCursorToLatest: 히스토리 커서를 최신 위치로 동기화
 * @returns {void} 커서 이동
 */
function syncHistoryCursorToLatest() {
  state.inputHistoryCursor = state.inputHistory.length;
}

/**
 * navigateHistory: 입력 히스토리 탐색
 * @param {number} direction - -1(과거) / 1(최신)
 * @returns {void} 입력창 반영
 */
function navigateHistory(direction) {
  if (state.inputHistory.length === 0) {
    return;
  }

  var nextCursor = state.inputHistoryCursor + direction;
  if (nextCursor < 0) {
    nextCursor = 0;
  }
  if (nextCursor > state.inputHistory.length) {
    nextCursor = state.inputHistory.length;
  }

  state.inputHistoryCursor = nextCursor;
  if (nextCursor === state.inputHistory.length) {
    elements.input.value = "";
  } else {
    elements.input.value = state.inputHistory[nextCursor];
  }
}

/**
 * applyTraceFromEvaluation: 평가 결과로 trace 위험도 조정
 * @param {{bulls:number,cows:number,success:boolean}} evaluation - 평가 결과
 * @returns {void} trace 갱신
 */
function applyTraceFromEvaluation(evaluation) {
  if (evaluation.success) {
    lowerTrace(14);
    return;
  }

  if (evaluation.bulls >= 2 || evaluation.cows >= 2) {
    raiseTrace(2);
    return;
  }

  if (evaluation.bulls > 0 || evaluation.cows > 0) {
    raiseTrace(5);
    return;
  }

  raiseTrace(9);
}

/**
 * raiseTrace: trace 수치 증가
 * @param {number} amount - 증가량
 * @returns {void} trace 갱신
 */
function raiseTrace(amount) {
  state.traceLevel = clampPercent(state.traceLevel + amount);
  renderStatus();
}

/**
 * lowerTrace: trace 수치 감소
 * @param {number} amount - 감소량
 * @returns {void} trace 갱신
 */
function lowerTrace(amount) {
  state.traceLevel = clampPercent(state.traceLevel - amount);
}

/**
 * clampPercent: 0~99 범위 보정
 * @param {number} value - 원본 값
 * @returns {number} 보정된 값
 */
function clampPercent(value) {
  if (value < 0) {
    return 0;
  }
  if (value > 99) {
    return 99;
  }
  return value;
}

/**
 * buildIntegrityLabel: 진행도 기반 무결성 라벨 반환
 * @returns {string} 무결성 라벨
 */
function buildIntegrityLabel() {
  if (state.recoveredCount >= CLAUSES.length) {
    return "SEALED";
  }
  if (state.recoveredCount >= 4) {
    return "STABILIZING";
  }
  if (state.recoveredCount >= 2) {
    return "DEGRADED";
  }
  return "COMPROMISED";
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
 * @param {string} text - 출력할 텍스트
 * @param {string} tone - 톤 클래스
 * @returns {void} 큐 등록
 */
function enqueueLogLine(text, tone) {
  state.logQueue.push({ text: text, tone: tone || "log-muted" });
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
  var line = createLogLine(nextItem.tone);
  var text = nextItem.text;
  var index = 0;

  line.textContent = "";

  if (!text) {
    finishTypedLine();
    return;
  }

  function typeNextChar() {
    line.textContent += text.charAt(index);
    scrollLogToBottom();
    index += 1;

    if (index < text.length) {
      setTimeout(typeNextChar, GAME_CONFIG.typingCharDelayMs);
    } else {
      finishTypedLine();
    }
  }

  function finishTypedLine() {
    scrollLogToBottom();
    setTimeout(function scheduleNext() {
      state.typingActive = false;
      processNextLogLine();
    }, GAME_CONFIG.typingLineDelayMs);
  }

  typeNextChar();
}

document.addEventListener("DOMContentLoaded", handleDomContentLoaded);
