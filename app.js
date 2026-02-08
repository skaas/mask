/**
 * 파일명: app.js
 * 목적: HYRESIS 웹 게임의 오프닝/퍼즐/로그 흐름 구현
 * 역할: 입력 파싱, Bulls & Cows 변형 평가, 상태 업데이트 수행
 * 작성일: 2026-02-07
 */
import {
  GAME_CONFIG,
  SYMBOL_GROUPS,
  SYMBOL_COMMANDS,
  ALLOWED_SYMBOLS,
  SYMBOL_PHRASES,
  CLAUSES,
  OPENING_SEQUENCE,
} from "./src/config/config.js";
import {
  FLOW_PHASE,
  state,
  elements,
  setFlowPhase,
  isQuizLockedPhase,
  canUseTerminalInput,
  canUseMissionInput,
} from "./src/state/state.js";
import { evaluateAttempt } from "./src/game/evaluator.js";
import { createMissionOverlay } from "./src/game/missionOverlay.js";
import { createController } from "./src/game/controller.js";

var missionOverlay = createMissionOverlay({
  state: state,
  elements: elements,
  ALLOWED_SYMBOLS: ALLOWED_SYMBOLS,
  CLAUSES: CLAUSES,
  isQuizLockedPhase: isQuizLockedPhase,
  isFormulaPuzzleClause: isFormulaPuzzleClause,
  buildAssembledFormula: buildAssembledFormula,
  getClauseSlotCount: getClauseSlotCount,
  toRomanNumeral: toRomanNumeral,
  buildMaskedFormula: buildMaskedFormula,
});

var controller = createController({
  state: state,
  elements: elements,
  FLOW_PHASE: FLOW_PHASE,
  CLAUSES: CLAUSES,
  SYMBOL_COMMANDS: SYMBOL_COMMANDS,
  ALLOWED_SYMBOLS: ALLOWED_SYMBOLS,
  isQuizLockedPhase: isQuizLockedPhase,
  canUseMissionInput: canUseMissionInput,
  canUseTerminalInput: canUseTerminalInput,
  isFormulaPuzzleClause: isFormulaPuzzleClause,
  getClauseSlotCount: getClauseSlotCount,
  updateFormulaInputLine: updateFormulaInputLine,
  syncHistoryCursorToLatest: syncHistoryCursorToLatest,
  navigateHistory: navigateHistory,
  resetFormulaInput: resetFormulaInput,
  processUserInput: processUserInput,
  unlockGameplayFromOpening: unlockGameplayFromOpening,
  handleSymbolInput: handleSymbolInput,
});

function handleMissionSymbolClick(clickEvent) {
  controller.handleMissionSymbolClick(clickEvent);
}

function handleGlobalKeydown(keyEvent) {
  controller.handleGlobalKeydown(keyEvent);
}

function handleInputFieldFocused() {
  controller.handleInputFieldFocused();
}

function handleInputFieldBlurred() {
  controller.handleInputFieldBlurred();
}

function handleInputFieldChanged() {
  controller.handleInputFieldChanged();
}

function getActiveInputElement() {
  return controller.getActiveInputElement();
}

function addSymbolToFormulaInput(symbol) {
  controller.addSymbolToFormulaInput(symbol);
}

function appendSymbolToInput(symbol) {
  controller.appendSymbolToInput(symbol);
}

function handleInputKeydown(keyEvent) {
  controller.handleInputKeydown(keyEvent);
}

function handleInputSubmit(submitEvent) {
  controller.handleInputSubmit(submitEvent);
}

function handleMissionInputSubmit(submitEvent) {
  controller.handleMissionInputSubmit(submitEvent);
}

function refreshSymbolPalette() {
  controller.refreshSymbolPalette();
}

function getCurrentInputToken() {
  return controller.getCurrentInputToken();
}

function filterSymbolCommands(token) {
  return controller.filterSymbolCommands(token);
}

function shouldApplyPaletteSelection() {
  return controller.shouldApplyPaletteSelection();
}

function movePaletteSelection(direction) {
  controller.movePaletteSelection(direction);
}

function applyPaletteSelection() {
  controller.applyPaletteSelection();
}

function replaceCurrentToken(nextToken) {
  controller.replaceCurrentToken(nextToken);
}

function showSymbolPalette() {
  controller.showSymbolPalette();
}

function hideSymbolPalette() {
  controller.hideSymbolPalette();
}

function renderSymbolPalette() {
  controller.renderSymbolPalette();
}

function handlePaletteRowMouseDown(mouseEvent) {
  controller.handlePaletteRowMouseDown(mouseEvent);
}

function renderMissionSymbols() {
  missionOverlay.renderMissionSymbols();
}

function clearMissionLog() {
  missionOverlay.clearMissionLog();
}

function appendMissionLogLine(text, tone) {
  missionOverlay.appendMissionLogLine(text, tone);
}

function setMissionOverlayVisible(visible) {
  missionOverlay.setMissionOverlayVisible(visible);
}

function syncMissionOverlay(clause, evaluation) {
  missionOverlay.syncMissionOverlay(clause, evaluation);
}

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
    var formulaEvaluation = evaluateAttempt(clause.answer, symbols);
    var recoveredLines = getRecoveredLinesCount(clause, formulaEvaluation);
    var statusLabel = formulaEvaluation.success ? "ACCESS RESTORED" : "INTRUSION LOCK";

    appendMissionLogLine("[ATTEMPT] " + assembledFormula, "");
    trackAttempt(symbols, formulaEvaluation);
    appendFormulaFeedback(formulaEvaluation, requiredLength);
    appendMissionLogLine(
      "[STATUS] " + statusLabel + " · RECOVERED " + recoveredLines + "/" + clause.recoverableLines,
      formulaEvaluation.success ? "mission-good" : "mission-warn"
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

  appendMissionLogLine(
    "[MATCH] EXACT " + exact + "/" + requiredLength +
      " | MISPLACED " + symbolOnly + " | INVALID " + miss,
    exact > 0 ? "mission-good" : "mission-warn"
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
  setFlowPhase(FLOW_PHASE.STREAMING);
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
  setFlowPhase(FLOW_PHASE.QUIZ_LOCKED);
  setMissionOverlayVisible(true);
  setInputEnabled(true);

  appendLogLine("---- CLAUSE " + currentClause.id + " DETECTED ----", "log-muted");
  appendLogLine("[ALERT] 유언장 블록 " + toRomanNumeral(currentClause.id) + "에서 침투성 오류 감지.", "log-alert");
  appendLogLine("[DECRYPTION REQUIRED] 중앙 BLOCK WINDOW를 해제해야 스트림이 재개됩니다.", "log-warn");

  if (isFormulaPuzzleClause(currentClause)) {
    appendMissionLogLine("[LOCK PROFILE LOADED] BLOCK SCHEMA READY", "");
    elements.formulaInputLine = null;
    appendMissionLogLine(
      "[OBJECTIVE] Fill " + getClauseSlotCount(currentClause) + " slots to unlock this block.",
      "mission-warn"
    );
    appendMissionLogLine(
      "[RULE] EXACT=correct slot, MISPLACED=wrong slot, INVALID=not used.",
      ""
    );
    appendMissionLogLine("[TACTICAL HINT]", "mission-warn");
    if (currentClause.clauseHints && currentClause.clauseHints.length) {
      var hintIndex = 0;
      while (hintIndex < currentClause.clauseHints.length) {
        appendMissionLogLine("- " + currentClause.clauseHints[hintIndex], "");
        hintIndex += 1;
      }
    }
    appendMissionLogLine("[TARGET] 관측자는 자기 자신을 완전히 모델링할 수 없다.", "");
    appendMissionLogLine("[STATUS] INTRUSION LOCK · RECOVERED 0/" + currentClause.recoverableLines, "mission-warn");
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
  setFlowPhase(FLOW_PHASE.ENDED);
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
  setFlowPhase(FLOW_PHASE.OPENING);
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
  setFlowPhase(FLOW_PHASE.WAIT_CONTINUE);
  appendLogLine("", "log-muted");
  appendLogLine("Enter를 눌러 계속하세요.", "log-warn");
}

/**
 * unlockGameplayFromOpening: 오프닝 종료 후 게임 플레이 시작
 * @returns {void} 입력 활성화 및 첫 Clause 안내
 */
function unlockGameplayFromOpening() {
  if (state.phase !== FLOW_PHASE.WAIT_CONTINUE) {
    return;
  }

  setFlowPhase(FLOW_PHASE.STREAMING);
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
  elements.input.disabled = !enabled || isQuizLockedPhase();
  elements.submit.disabled = !enabled || isQuizLockedPhase();
  if (elements.controls) {
    elements.controls.classList.toggle("controls-hidden", !enabled || isQuizLockedPhase());
  }
  if (enabled) {
    scrollLogToBottom();
    if (isQuizLockedPhase()) {
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
