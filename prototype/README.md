# P.E.T.S prototype (v2)

Interactive prototype for Group 7: the P.E.T.S study-pet concept with the calmer, centred look we liked from PACT.

## Run it

Open `index.html` in a browser. No install, no build step, no server needed.

## Flow

1. **Start a course**: name the course, choose a pet for it, set your terms (help level, what I do myself, my rules). This happens once per course.
2. **Course page**: upload an exercise sheet (simulated), pick an exercise.
3. **Solve**: code editor, Check (3 free checks, feedback detail follows the help level), coach chat at the bottom, menu (top right) with everything set so far.
4. **Garden**: pets that get through a course without fainting move in.

Keyboard: Enter moves forward, ⌘K / Ctrl+K searches, ⌘↵ in the editor runs Check, Esc closes the menu.
The sidebar has **test controls** (change pet hunger, reset) for running test sessions.

## Files: where to change what

| File | What's in it |
|---|---|
| `index.html` | Loads everything below. Rarely needs changing. |
| `styles.css` | All styling. Colours are tokens at the top (`--bg`, `--olive`, …), with a dark-mode set below them. |
| `content.js` | Exercise text, help levels, rule suggestions, unlock questions, hints, check logic. Change wording here. |
| `pets.js` | Pet drawings (SVG) and moods. Add a new pet by adding it to `KINDS` and drawing it in `petSVG`. |
| `state.js` | App state and every user action (`A.something`), plus the pet economy (who gains or loses hunger and when). |
| `views.js` | The screens as HTML templates, plus rendering and keyboard handling. |

The files are plain scripts loaded in order and share top-level names, so keep the order in `index.html`.

## Prototype shortcuts (not real behaviour)

- Uploading a sheet is simulated; only the *Binary search* exercise works.
- "Finish course" unlocks after one finished exercise, standing in for the end of the semester.
- The coach's answers are scripted from keywords, not a real AI.
- Nothing is saved: reloading starts over (except the sidebar collapsed state).

## Working on it together

- Pull before you start: `git pull`
- Keep commits small and say what changed: `git commit -m "Solve: shorten check feedback"`
- If two people need the same file, agree on who edits which screen first.
