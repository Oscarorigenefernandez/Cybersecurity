const missions = [
  {
    title: "LOGIN STORM",
    category: "NETWORK SECURITY",
    difficulty: "EASY",
    xp: 100,
    scenario: "A fictional company server records 85 failed login attempts from one source in 60 seconds. No successful login is recorded.",
    question: "What is the most likely security concern?",
    answers: [
      "A brute-force login attempt",
      "A normal software update",
      "A hardware failure",
      "A successful backup"
    ],
    correct: 0,
    explanation: "Repeated failed login attempts can indicate a brute-force attack. Review authentication logs and follow the incident-response process."
  },
  {
    title: "BAIT IN THE INBOX",
    category: "THREAT INTELLIGENCE",
    difficulty: "MEDIUM",
    xp: 150,
    scenario: "An employee receives an email threatening account deletion unless they verify their password immediately. The sender address looks unfamiliar.",
    question: "What is the safest first response?",
    answers: [
      "Click the link to check it",
      "Reply with your password",
      "Report the email through the approved process",
      "Forward it to everyone"
    ],
    correct: 2,
    explanation: "Urgency, unfamiliar senders, and suspicious links are common phishing warning signs. Don't click or reply. Report the message."
  },
  {
    title: "THE CHANGED FILE",
    category: "FILE INTEGRITY",
    difficulty: "HARD",
    xp: 200,
    scenario: "A system file's newly calculated SHA-256 hash does not match its known-good reference hash.",
    question: "What does this mismatch tell you?",
    answers: [
      "The file is definitely safe",
      "The file contents may have changed and need investigation",
      "The computer has no security risk",
      "The hash proves who changed it"
    ],
    correct: 1,
    explanation: "A hash mismatch indicates the file contents differ from the reference. It does not prove malware by itself. Investigate the change."
  },
  {
    title: "THE OPEN PORT",
    category: "NETWORK DEFENSE",
    difficulty: "MEDIUM",
    xp: 175,
    scenario: "A fictional network scan identifies an unexpected open administrative port on a company test server.",
    question: "What should a defender do first?",
    answers: [
      "Ignore the result",
      "Investigate whether the service is authorized",
      "Delete every server file",
      "Share the server address publicly"
    ],
    correct: 1,
    explanation: "Verify whether the service is expected, identify its owner, and follow approved procedures to reduce unnecessary exposure."
  },
  {
    title: "THE PHISHING CLONE",
    category: "EMAIL SECURITY",
    difficulty: "HARD",
    xp: 225,
    scenario: "A website looks identical to a company's login page, but its domain contains an extra character.",
    question: "What is the strongest warning sign?",
    answers: [
      "The website uses a logo",
      "The domain name is different",
      "The website has a blue background",
      "The page loads quickly"
    ],
    correct: 1,
    explanation: "Lookalike domains are commonly used in phishing. Verify the official address independently before entering credentials."
  }
];

const ranks = [
  { name: "RECRUIT", xp: 0 },
  { name: "TRAINEE", xp: 100 },
  { name: "SPECIALIST", xp: 300 },
  { name: "ANALYST", xp: 600 },
  { name: "DEFENDER", xp: 1000 },
  { name: "ELITE OPERATOR", xp: 1600 }
];

const STORAGE_KEY = "oscarcyberArena";

let state = {};

try {
  state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
} catch {
  state = {};
}

state = {
  name: typeof state.name === "string" ? state.name : "RECRUIT_01",
  xp: Number.isFinite(state.xp) ? Math.max(0, state.xp) : 0,
  cleared: Array.isArray(state.cleared)
    ? state.cleared.filter(id =>
        Number.isInteger(id) && id >= 0 && id < missions.length
      )
    : [],
  streak: Number.isInteger(state.streak) ? state.streak : 0,
  lastPlayed: state.lastPlayed || null
};

let activeMission = null;
let answered = false;

const $ = id => document.getElementById(id);

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const rankIndex = ranks.reduce(
    (found, rank, index) => state.xp >= rank.xp ? index : found,
    0
  );

  const rank = ranks[rankIndex];
  const next = ranks[rankIndex + 1];

  const progress = next
    ? ((state.xp - rank.xp) / (next.xp - rank.xp)) * 100
    : 100;

  $("operatorName").textContent = state.name;
  $("leaderName").textContent = state.name;
  $("leaderXP").textContent = state.xp.toLocaleString() + " XP";
  $("xp").textContent = state.xp.toLocaleString();
  $("rankName").textContent = rank.name;
  $("nextRank").textContent = next
    ? "NEXT: " + next.name
    : "MAXIMUM RANK";

  $("cleared").textContent = state.cleared.length;

  $("progressText").textContent = next
    ? `${state.xp - rank.xp} / ${next.xp - rank.xp} XP TO NEXT RANK`
    : "MAXIMUM RANK REACHED";

  $("progressBar").style.width = progress + "%";

  document.querySelectorAll("[data-mission]").forEach(button => {
    const id = Number(button.dataset.mission);

    button.textContent = state.cleared.includes(id)
      ? "REPLAY MISSION ↗"
      : "START MISSION ↗";
  });

  document.querySelectorAll(".mission-card").forEach((card, index) => {
    const mission = missions[index];

    if (!mission) return;

    const title = card.querySelector("h3");
    const description = card.querySelector("p");
    const type = card.querySelector(".mission-type");
    const difficulty = card.querySelector(".difficulty");
    const reward = card.querySelector(".mission-bottom span");

    if (title) title.textContent = mission.title;
    if (type) type.textContent = `0${index + 1} / ${mission.category}`;
    if (description) description.textContent = mission.scenario;
    if (reward) reward.textContent = `+${mission.xp} XP`;

    if (difficulty) {
      difficulty.textContent = mission.difficulty;
      difficulty.className = "difficulty " + mission.difficulty.toLowerCase();
    }
  });
}

function openMission(id) {
  if (!missions[id]) return;

  activeMission = id;
  answered = false;

  const mission = missions[id];

  $("modalNumber").textContent =
    `MISSION 0${id + 1} // +${mission.xp} XP`;

  $("modalTitle").textContent = mission.title;
  $("scenario").textContent = mission.scenario;
  $("question").textContent = mission.question;

  $("feedback").className = "feedback hidden";
  $("continueBtn").classList.add("hidden");
  $("answers").innerHTML = "";

  mission.answers.forEach((answer, index) => {
    const button = document.createElement("button");

    button.className = "answer";
    button.type = "button";
    button.textContent =
      String.fromCharCode(65 + index) + ". " + answer;

    button.addEventListener("click", () => chooseAnswer(index));

    $("answers").appendChild(button);
  });

  $("missionModal").classList.remove("hidden");
}

function chooseAnswer(index) {
  if (answered || activeMission === null) return;

  answered = true;

  const mission = missions[activeMission];
  const correct = index === mission.correct;

  const buttons = [...$("answers").children];

  buttons.forEach((button, i) => {
    button.disabled = true;

    if (i === mission.correct) {
      button.classList.add("correct");
    }

    if (i === index && !correct) {
      button.classList.add("wrong");
    }
  });

  let earned = 0;

  if (correct) {
    if (!state.cleared.includes(activeMission)) {
      earned = mission.xp;
      state.cleared.push(activeMission);
    } else {
      earned = 25;
    }

    state.xp += earned;

    const today = new Date().toISOString().slice(0, 10);

    if (state.lastPlayed !== today) {
      state.streak += 1;
      state.lastPlayed = today;
    }

    save();
    render();
  }

  $("feedback").className =
    "feedback" + (correct ? "" : " bad");

  $("feedback").textContent =
    (correct
      ? `CORRECT — +${earned} XP. `
      : "NOT QUITE — NO XP THIS TIME. ") +
    mission.explanation;

  $("continueBtn").classList.remove("hidden");
}

document.querySelectorAll("[data-mission]").forEach(button => {
  button.addEventListener("click", () => {
    openMission(Number(button.dataset.mission));
  });
});

$("closeModal").addEventListener("click", () => {
  $("missionModal").classList.add("hidden");
});

$("missionModal").addEventListener("click", event => {
  if (event.target === $("missionModal")) {
    $("missionModal").classList.add("hidden");
  }
});

$("continueBtn").addEventListener("click", () => {
  $("missionModal").classList.add("hidden");
});

$("saveName").addEventListener("click", () => {
  const name = $("callsign").value
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 16);

  if (!name) {
    $("callsign").focus();
    return;
  }

  state.name = name.toUpperCase();

  save();
  render();

  $("callsign").value = "";
});

$("callsign").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    $("saveName").click();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    $("missionModal").classList.add("hidden");
  }
});

render();