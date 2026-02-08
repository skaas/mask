/**
 * 입력/키보드/팔레트 컨트롤러
 */

export function createController(deps) {
  var state = deps.state;
  var elements = deps.elements;
  var FLOW_PHASE = deps.FLOW_PHASE;
  var CLAUSES = deps.CLAUSES;
  var SYMBOL_COMMANDS = deps.SYMBOL_COMMANDS;
  var ALLOWED_SYMBOLS = deps.ALLOWED_SYMBOLS;
  var isQuizLockedPhase = deps.isQuizLockedPhase;
  var canUseMissionInput = deps.canUseMissionInput;
  var canUseTerminalInput = deps.canUseTerminalInput;
  var isFormulaPuzzleClause = deps.isFormulaPuzzleClause;
  var getClauseSlotCount = deps.getClauseSlotCount;
  var getRemainingFormulaSlotCount = deps.getRemainingFormulaSlotCount;
  var updateFormulaInputLine = deps.updateFormulaInputLine;
  var syncHistoryCursorToLatest = deps.syncHistoryCursorToLatest;
  var navigateHistory = deps.navigateHistory;
  var resetFormulaInput = deps.resetFormulaInput;
  var processUserInput = deps.processUserInput;
  var unlockGameplayFromOpening = deps.unlockGameplayFromOpening;
  var activateQuizFromPending = deps.activateQuizFromPending;
  var handleSymbolInput = deps.handleSymbolInput;

  function handleMissionSymbolClick(clickEvent) {
    var target = clickEvent.target;
    var token = "";

    if (target && target.dataset && target.dataset.symbol) {
      token = target.dataset.symbol;
    }

    if (!token || !canUseMissionInput()) {
      return;
    }

    handleSymbolInput(token);
  }

  function handleGlobalKeydown(keyEvent) {
    if (keyEvent.key !== "Enter") {
      return;
    }

    if (state.phase === FLOW_PHASE.WAIT_CONTINUE) {
      keyEvent.preventDefault();
      unlockGameplayFromOpening();
      return;
    }

    if (state.phase === FLOW_PHASE.QUIZ_PENDING) {
      keyEvent.preventDefault();
      activateQuizFromPending();
    }
  }

  function handleInputFieldFocused() {
    refreshSymbolPalette();
  }

  function handleInputFieldBlurred() {
    setTimeout(hideSymbolPalette, 80);
  }

  function handleInputFieldChanged() {
    refreshSymbolPalette();
  }

  function getActiveInputElement() {
    if (isQuizLockedPhase() && elements.missionInput) {
      return elements.missionInput;
    }

    return elements.input;
  }

  function addSymbolToFormulaInput(symbol) {
    if (!state.inputEnabled) {
      return;
    }

    var clause = CLAUSES[state.currentClauseIndex];

    if (!isFormulaPuzzleClause(clause)) {
      return;
    }

    var requiredLength = getRemainingFormulaSlotCount(clause);

    if (state.currentSymbols.length >= requiredLength) {
      return;
    }

    state.currentSymbols.push(symbol);
    updateFormulaInputLine();
    getActiveInputElement().value = state.currentSymbols.join(" ");
  }

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

  function handleInputSubmit(submitEvent) {
    submitEvent.preventDefault();

    if (!canUseTerminalInput()) {
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

  function handleMissionInputSubmit(submitEvent) {
    submitEvent.preventDefault();

    if (!canUseMissionInput()) {
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

  function refreshSymbolPalette() {
    if (!state.inputEnabled || isQuizLockedPhase()) {
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

  function getCurrentInputToken() {
    var value = getActiveInputElement().value || "";
    var trimmedRight = value.replace(/\s+$/, "");

    if (!trimmedRight) {
      return "";
    }

    var tokens = trimmedRight.split(/\s+/);
    return tokens[tokens.length - 1] || "";
  }

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

  function showSymbolPalette() {
    state.paletteVisible = true;
    if (elements.palette) {
      elements.palette.classList.add("is-visible");
      elements.palette.setAttribute("aria-hidden", "false");
    }
  }

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

  function handlePaletteRowMouseDown(mouseEvent) {
    mouseEvent.preventDefault();
    var target = mouseEvent.currentTarget;

    if (!target || !target.dataset || typeof target.dataset.index === "undefined") {
      return;
    }

    state.paletteActiveIndex = Number(target.dataset.index);
    applyPaletteSelection();
  }

  return {
    handleMissionSymbolClick: handleMissionSymbolClick,
    handleGlobalKeydown: handleGlobalKeydown,
    handleInputFieldFocused: handleInputFieldFocused,
    handleInputFieldBlurred: handleInputFieldBlurred,
    handleInputFieldChanged: handleInputFieldChanged,
    getActiveInputElement: getActiveInputElement,
    addSymbolToFormulaInput: addSymbolToFormulaInput,
    appendSymbolToInput: appendSymbolToInput,
    handleInputKeydown: handleInputKeydown,
    handleInputSubmit: handleInputSubmit,
    handleMissionInputSubmit: handleMissionInputSubmit,
    refreshSymbolPalette: refreshSymbolPalette,
    getCurrentInputToken: getCurrentInputToken,
    filterSymbolCommands: filterSymbolCommands,
    shouldApplyPaletteSelection: shouldApplyPaletteSelection,
    movePaletteSelection: movePaletteSelection,
    applyPaletteSelection: applyPaletteSelection,
    replaceCurrentToken: replaceCurrentToken,
    showSymbolPalette: showSymbolPalette,
    hideSymbolPalette: hideSymbolPalette,
    renderSymbolPalette: renderSymbolPalette,
    handlePaletteRowMouseDown: handlePaletteRowMouseDown,
  };
}
