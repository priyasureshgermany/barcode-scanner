#!/usr/bin/env node
/**
 * Version bump for the barcode scanner, run once per release.
 * Same rules as the expense tracker:
 *
 *   MAJOR  first release in a new calendar month
 *   MIDDLE first release of a new week (weeks start on Monday)
 *   MINOR  every other release
 *
 * It writes APP_VERSION and APP_BUILT in index.html, VERSION in sw.js,
 * version.json (which the app checks to offer Update now) and a section in
 * RELEASES.md (shown under About, What's new). Notes are required.
 *
 *   node tools/bump-version.mjs --new "Something that was not there before"
 *   node tools/bump-version.mjs --fix "Something wrong that now is not"
 *   node tools/bump-version.mjs --better "Something that now works better"
 *   node tools/bump-version.mjs --amend --new "Found in review"   (adds to the unreleased version)
 *   node tools/bump-version.mjs --dry                              (print what would happen)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION_FILE = join(root, "version.json");
const INDEX_FILE = join(root, "index.html");
const SW_FILE = join(root, "sw.js");
const NOTES_FILE = join(root, "RELEASES.md");

const argv = process.argv.slice(2);
const dry = argv.includes("--dry");
const amend = argv.includes("--amend");
/* A note says what kind of change it was, so the app can show an icon beside
   it. --note stays for a plain improvement, which is most of them. */
const KINDS = { "--fix": "fix", "--new": "new", "--better": "better", "--note": "better" };
const notes = argv.reduce((acc, a, i) => {
  const kind = KINDS[a];
  if (kind && argv[i + 1]) acc.push(kind + ": " + argv[i + 1].trim());
  return acc;
}, []).filter(Boolean);

const iso = (d) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

/* --date pretends to be another day, for checking the rules; a real release
   is always dated today, so it is refused without --dry. */
const dateArg = argv.includes("--date") ? argv[argv.indexOf("--date") + 1] || "" : "";
if (dateArg && (!dry || !/^\d{4}-\d{2}-\d{2}$/.test(dateArg))) {
  console.error("--date YYYY-MM-DD only goes with --dry");
  process.exit(1);
}
const today = dateArg
  ? new Date(+dateArg.slice(0, 4), +dateArg.slice(5, 7) - 1, +dateArg.slice(8, 10))
  : new Date();
const todayISO = iso(today);
/* the Monday that starts this week — Sunday belongs to the week before */
const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (today.getDay() + 6) % 7);
const weekStartISO = iso(weekStart);

const state = JSON.parse(readFileSync(VERSION_FILE, "utf8"));

/** The version currently on main, or "" when it can't be determined. */
function releasedVersion() {
  for (const ref of ["origin/main", "main"]) {
    try {
      const raw = execSync(`git show ${ref}:version.json`, {
        cwd: root, stdio: ["ignore", "pipe", "ignore"]
      }).toString();
      return String(JSON.parse(raw).version || "");
    } catch { /* no such ref, or not a checkout — try the next */ }
  }
  return "";
}

/* --amend leaves the number alone and files the notes under it, for when more
   work lands on a branch whose release was already prepared. */
if (amend) {
  if (!notes.length) {
    console.error(
      '--amend needs a note:\n' +
      '  node tools/bump-version.mjs --amend --note "What else changed"'
    );
    process.exit(1);
  }
  /* Refuse to touch a version that has already shipped: without this, --amend
     on a branch with nothing prepared silently rewrites the notes of the live
     release instead of the one being worked on. */
  if (state.version === releasedVersion()) {
    console.error(
      state.version + " is the released version — nothing is prepared on this branch yet.\n" +
      "Cut the release first:\n" +
      '  node tools/bump-version.mjs --note "What changed in one line"'
    );
    process.exit(1);
  }
  const src = readFileSync(NOTES_FILE, "utf8");
  const at = src.indexOf("## " + state.version + " —");
  if (at === -1) {
    console.error(
      "No section for " + state.version + " in RELEASES.md.\n" +
      "Nothing has been prepared on this branch yet — bump without --amend first."
    );
    process.exit(1);
  }
  /* append inside that section, before the next heading or the end of file */
  const nextAt = src.indexOf("\n## ", at + 1);
  const end = nextAt === -1 ? src.length : nextAt;
  const merged = src.slice(at, end).trimEnd() + "\n" +
    notes.map(n => "- " + n).join("\n");
  writeFileSync(NOTES_FILE, src.slice(0, at) + merged + "\n" + src.slice(end), "utf8");
  console.log("Added to " + state.version + " (version unchanged):");
  notes.forEach(n => console.log("  - " + n));
  process.exit(0);
}

const [major, middle, minor] = String(state.version).split(".").map(Number);
const last = state.lastRelease || "";

const newMonth = last && last.slice(0, 7) !== todayISO.slice(0, 7);
const newWeek = last < weekStartISO;

let next, reason;
if (!last) {
  /* Nothing released yet: 1.0.0 is the starting point, not something to bump past. */
  next = [major, middle, minor];
  reason = "initial release";
} else if (newMonth) {
  next = [major + 1, 0, 0];
  reason = "first release of " + todayISO.slice(0, 7);
} else if (newWeek) {
  next = [major, middle + 1, 0];
  reason = "first release of the week of " + weekStartISO;
} else {
  next = [major, middle, minor + 1];
  reason = "routine release";
}

const version = next.join(".");

if (dry) {
  console.log(`${state.version} -> ${version}  (${reason})`);
  process.exit(0);
}

if (!notes.length) {
  console.error(
    'A release needs at least one note:\n' +
    '  node tools/bump-version.mjs --note "What changed in one line"'
  );
  process.exit(1);
}

/** Replaces exactly one occurrence, and fails loudly rather than silently no-op. */
function patch(file, pattern, replacement) {
  const src = readFileSync(file, "utf8");
  if (!pattern.test(src)) throw new Error(`pattern not found in ${file}: ${pattern}`);
  writeFileSync(file, src.replace(pattern, replacement), "utf8");
}

patch(INDEX_FILE, /const APP_VERSION = "[^"]*"/, `const APP_VERSION = "${version}"`);
patch(INDEX_FILE, /const APP_BUILT = "[^"]*"/, `const APP_BUILT = "${todayISO}"`);
/* the service worker cache name doubles as the release marker, so a new
   version always invalidates the old cache */
patch(SW_FILE, /const VERSION = "[^"]*"/, `const VERSION = "${version}"`);

/* Newest first, inserted under the intro so the file stays appendable. */
const notesSrc = readFileSync(NOTES_FILE, "utf8");
const marker = notesSrc.indexOf("\n## ");
const entry =
  "## " + version + " — " + todayISO + "\n" +
  notes.map(n => "- " + n).join("\n") + "\n";
const updated = marker === -1
  ? notesSrc.trimEnd() + "\n\n" + entry
  : notesSrc.slice(0, marker + 1) + entry + "\n" + notesSrc.slice(marker + 1);
writeFileSync(NOTES_FILE, updated, "utf8");

writeFileSync(
  VERSION_FILE,
  JSON.stringify({ version, lastRelease: todayISO }, null, 2) + "\n",
  "utf8"
);

console.log(`${state.version} -> ${version}  (${reason})`);
notes.forEach(n => console.log("  - " + n));
