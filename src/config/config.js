/**
 * 앱 구성 상수/정적 데이터
 */
export const GAME_CONFIG = {
  minLength: 3,
  maxLength: 5,
  lineDelayMs: 450,
  emphasisDelayMs: 900,
  nextClauseDelayMs: 800,
  typingEnabled: true,
  typingCharDelayMs: 18,
  typingLineDelayMs: 120,
};

export const SYMBOL_GROUPS = [
  { label: "[Quantifiers]", symbols: ["∀", "∃"] },
  { label: "[Relations]", symbols: ["⇒", "⊢", "="] },
  { label: "[Negation]", symbols: ["¬", "⊥"] },
  { label: "[Connectives]", symbols: ["∧"] },
  { label: "[Time]", symbols: ["t", "t+1", "Δ"] },
];

export const SYMBOL_COMMANDS = [
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

export const SYMBOL_PHRASES = {
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

export const CLAUSES = [
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

export const OPENING_SEQUENCE = [
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

export const ALLOWED_SYMBOLS = buildAllowedSymbols();
