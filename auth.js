
const SUPABASE_URL = "https://xttaecjykovfxlfskgks.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_4pkrD-z3IpQ1jt8i3tKitA_kX7fXXoZ";

const client = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const switchMode = document.getElementById("switchMode");
const logoutButton = document.getElementById("logout");
const statusBox = document.getElementById("status");

function showMessage(message, error = false) {
  statusBox.textContent = message;
  statusBox.style.color = error ? "#ff7777" : "#a3ff3f";
}

switchMode.addEventListener("click", () => {
  signupForm.classList.toggle("hidden");
  loginForm.classList.toggle("hidden");

  switchMode.textContent = signupForm.classList.contains("hidden")
    ? "NEED AN ACCOUNT? SIGN UP"
    : "ALREADY HAVE AN ACCOUNT? SIGN IN";

  showMessage("");
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    showMessage(
      "Use 3–20 letters, numbers, underscores or hyphens for your callsign.",
      true
    );
    return;
  }

  if (password.length < 8) {
    showMessage("Your password must have at least 8 characters.", true);
    return;
  }

  showMessage("Creating your operator account...");

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { callsign: username },
      emailRedirectTo: window.location.origin + "/auth.html"
    }
  });

  if (error) {
    showMessage(error.message, true);
    return;
  }

  if (data.session) {
    showMessage("Account created! Welcome, " + username + ".");
    await showAccount();
  } else {
    showMessage(
      "Account created! Check your email and confirm your address before signing in."
    );
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  showMessage("Signing in...");

  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showMessage(error.message, true);
    return;
  }

  await showAccount();
});

async function showAccount() {
  const {
    data: { user },
    error
  } = await client.auth.getUser();

  if (error || !user) return;

  signupForm.classList.add("hidden");
  loginForm.classList.add("hidden");
  switchMode.classList.add("hidden");
  logoutButton.classList.remove("hidden");

  const callsign = user.user_metadata?.callsign || "Operator";

  showMessage("SIGNED IN AS " + callsign + " | " + user.email);
}

logoutButton.addEventListener("click", async () => {
  const { error } = await client.auth.signOut();

  if (error) {
    showMessage(error.message, true);
    return;
  }

  signupForm.reset();
  loginForm.reset();

  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  switchMode.classList.remove("hidden");
  logoutButton.classList.add("hidden");

  switchMode.textContent = "ALREADY HAVE AN ACCOUNT? SIGN IN";

  showMessage("You have signed out.");
});

(async () => {
  const {
    data: { session },
    error
  } = await client.auth.getSession();

  if (error) {
    showMessage(error.message, true);
    return;
  }

  if (session) await showAccount();
})();
