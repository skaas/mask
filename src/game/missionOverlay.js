/**
 * 중앙 미션 오버레이 렌더/로그 제어
 */

export function createMissionOverlay(deps) {
  var state = deps.state;
  var elements = deps.elements;
  var ALLOWED_SYMBOLS = deps.ALLOWED_SYMBOLS;
  var isQuizLockedPhase = deps.isQuizLockedPhase;
  var isFormulaPuzzleClause = deps.isFormulaPuzzleClause;
  var getClauseSlotCount = deps.getClauseSlotCount;
  var buildMaskedFormula = deps.buildMaskedFormula;

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function getLockedCount(clause) {
    if (!isFormulaPuzzleClause(clause)) {
      return 0;
    }

    var locked = state.lockedFormulaSlots || [];
    var total = getClauseSlotCount(clause);
    var index = 0;
    var count = 0;

    while (index < total) {
      if (locked[index]) {
        count += 1;
      }
      index += 1;
    }

    return count;
  }

  function buildFormulaMarkup(clause) {
    var template = clause.formulaTemplate;
    var token = clause.slotToken;
    var parts = template.split(token);
    var locked = state.lockedFormulaSlots || [];
    var pending = state.currentSymbols || [];
    var pendingIndex = 0;
    var slotIndex = 0;
    var html = "";

    html += escapeHtml(parts[0] || "");
    while (slotIndex < parts.length - 1) {
      if (locked[slotIndex]) {
        html += '<span class="mission-slot mission-slot-locked">' + escapeHtml(locked[slotIndex]) + "</span>";
      } else if (pendingIndex < pending.length) {
        html += '<span class="mission-slot mission-slot-pending">' + escapeHtml(pending[pendingIndex]) + "</span>";
        pendingIndex += 1;
      } else {
        html += '<span class="mission-slot mission-slot-empty">□</span>';
      }
      html += escapeHtml(parts[slotIndex + 1] || "");
      slotIndex += 1;
    }

    return html;
  }

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

  function setMissionTipMessage(text, tone) {
    if (!elements.missionTip) {
      return;
    }

    elements.missionTip.textContent = text || "";
    elements.missionTip.classList.remove("tip-default", "tip-warn", "tip-good", "tip-bad");
    elements.missionTip.classList.add(tone || "tip-default");
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

  function syncMissionOverlay(clause, evaluation, reveal) {
    var shouldReveal = true;

    if (typeof reveal === "boolean") {
      shouldReveal = reveal;
    }

    if (!clause) {
      setMissionOverlayVisible(false);
      return;
    }

    if (elements.missionClause) {
      elements.missionClause.textContent = "ERROR WINDOW";
    }
    if (elements.missionTitle) {
      elements.missionTitle.textContent = clause.title;
    }
    if (elements.missionFormula) {
      if (isFormulaPuzzleClause(clause)) {
        elements.missionFormula.innerHTML = buildFormulaMarkup(clause);
      } else {
        elements.missionFormula.textContent = "수식: " + buildMaskedFormula(clause.answer.length);
      }
    }
    if (elements.missionState) {
      elements.missionState.textContent =
        evaluation && evaluation.success ? "ACCESS RESTORED" : "INTRUSION LOCK";
      elements.missionState.style.color = evaluation && evaluation.success ? "#8fe3a8" : "#f2c66d";
    }
    var totalSlots = getClauseSlotCount(clause);
    var lockedCount = getLockedCount(clause);
    var remainingSlots = Math.max(0, totalSlots - lockedCount);

    if (elements.missionInput) {
      elements.missionInput.placeholder =
        "남은 기호 " + remainingSlots + "개 입력 (예: ⇒ ¬)";
    }
    if (evaluation) {
      if (evaluation.success) {
        setMissionTipMessage("모든 슬롯 고정 완료 · ACCESS RESTORED", "tip-good");
      } else {
        var invalid = Math.max(0, totalSlots - evaluation.bulls - evaluation.cows);
        var remainHint = remainingSlots === 1 ? " · 남은 1칸만 맞추면 됩니다." : "";
        setMissionTipMessage(
          "EXACT " + evaluation.bulls +
            " · MISPLACED " + evaluation.cows +
            " · INVALID " + invalid +
            " · 고정 " + lockedCount + "칸 / 남은 " + remainingSlots + "칸" +
            remainHint,
          "tip-warn"
        );
      }
    } else if (lockedCount > 0) {
      setMissionTipMessage(
        "고정 " + lockedCount + "칸 · 남은 " + remainingSlots + "칸만 입력하세요.",
        "tip-default"
      );
    } else {
      setMissionTipMessage("SLOTS " + totalSlots, "tip-default");
    }

    if (shouldReveal) {
      setMissionOverlayVisible(true);
    }
  }

  return {
    renderMissionSymbols: renderMissionSymbols,
    setMissionTipMessage: setMissionTipMessage,
    setMissionOverlayVisible: setMissionOverlayVisible,
    syncMissionOverlay: syncMissionOverlay,
  };
}
