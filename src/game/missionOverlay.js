/**
 * 중앙 미션 오버레이 렌더/로그 제어
 */

export function createMissionOverlay(deps) {
  var state = deps.state;
  var elements = deps.elements;
  var ALLOWED_SYMBOLS = deps.ALLOWED_SYMBOLS;
  var CLAUSES = deps.CLAUSES;
  var isQuizLockedPhase = deps.isQuizLockedPhase;
  var isFormulaPuzzleClause = deps.isFormulaPuzzleClause;
  var buildAssembledFormula = deps.buildAssembledFormula;
  var getClauseSlotCount = deps.getClauseSlotCount;
  var toRomanNumeral = deps.toRomanNumeral;
  var buildMaskedFormula = deps.buildMaskedFormula;

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

  function clearMissionLog() {
    if (!elements.missionLog) {
      return;
    }
    elements.missionLog.innerHTML = "";
  }

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

  function setMissionOverlayVisible(visible) {
    if (!visible && isQuizLockedPhase()) {
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
      elements.missionState.textContent =
        evaluation && evaluation.success ? "ACCESS RESTORED" : "INTRUSION LOCK";
      elements.missionState.style.color = evaluation && evaluation.success ? "#8fe3a8" : "#f2c66d";
    }
    if (elements.missionTip) {
      if (evaluation) {
        elements.missionTip.textContent =
          "자리+기호 " +
          evaluation.bulls +
          " / " +
          getClauseSlotCount(clause) +
          " · 기호만 일치 " +
          evaluation.cows;
      } else {
        elements.missionTip.textContent =
          "INTRUSION LOCK 상태에서는 창이 닫히지 않습니다. 빈칸 " +
          getClauseSlotCount(clause) +
          "개를 기호로 채우세요.";
      }
    }

    setMissionOverlayVisible(true);
  }

  return {
    renderMissionSymbols: renderMissionSymbols,
    clearMissionLog: clearMissionLog,
    appendMissionLogLine: appendMissionLogLine,
    setMissionOverlayVisible: setMissionOverlayVisible,
    syncMissionOverlay: syncMissionOverlay,
  };
}
