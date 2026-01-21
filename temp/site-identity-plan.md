# Plan: Henrik Pettersson — Site Identity Update

Transform the blog from anonymous "vghpe/+++" to a clear professional identity as Henrik Pettersson, indie game designer. Prioritized to unblock progress—foundational identity changes first, design exploration deferred until structure is in place.

## Priority 1: Establish Identity (Do First)

1. **Update hugo.toml** — Set title to "Henrik Pettersson" ✓, add Bio parameter "Game Designer · Narrative & Systems · Based in Gothenburg" under `[params]` section, add author parameter "Henrik Pettersson", update description for SEO

2. **Fix layouts/partials/profile.html** — Replace hardcoded "+++" with `{{ .Site.Title }}` or proper name display ✓, show Bio tagline from config (fix `.Site.Params.bio` reference)

3. **Fix content/about/_index.md** — Change `author: "Hugo Authors"` to `author: "Henrik Pettersson"`, expand professional history section (Gardens Between, Netflix Games, 20M players)

## Priority 2: Navigation Structure (Do Second)

4. **Update navigation in hugo.toml and layouts/partials/header.html** — New menu: Home, Blog, Sketchbook, Projects, About, Resume (direct PDF link)

5. **Create Projects section** — Add `content/projects/_index.md` hub page, `content/projects/9-platforms/_index.md` overview, move outline post to `content/projects/9-platforms/outline.md`, add `content/projects/9-platforms/characters.md`

## Priority 3: Design Exploration (Do When Ready)

6. **Consider landing page layout** — Test current chronological feed with new identity header. If articles still feel buried, explore: larger visual treatment for "article"-tagged posts, or separate "Articles" page in navigation. Mobile-first thinking.

7. **Consider Blog vs Home distinction** — Decide if Home and Blog should be same page or separate (Home = mixed feed, Blog = posts only). Can defer until you see how new structure feels.

## Priority 4: Polish (Do Later)

8. **Wiki versioning for 9 Platforms** — When updating outline to v2, copy current to archive folder. Design version-switcher UI when needed.

9. **Projects template customization** — Add custom layout for wiki-style navigation when second project arrives or 9 Platforms grows.

10. **Custom domain** — Optional future step once site purpose is clear.

---

## Context

### Feedback Received

**From Jonas:**
- No clear identity on landing page (just username "vghpe")
- Had to search for resume
- Professional credentials buried in About page
- Good once you find the About/Resume, but hard to discover

**Your Goals:**
- Target indie studios and smaller game companies in Gothenburg
- Showcase ongoing creative projects (9 Platforms story/game)
- Share drawings and design process
- Move away from anonymous "vghpe" gamer tag
- Make professional identity immediately clear

### Inspirations
- lostgarden.com — "You've found a rare treasure trove of readable, thoughtful essays on game design theory, art and the business of design."
- 100r.co — Clear artist collective identity with mission statement

### Site Challenges
- High-effort "article" posts (FLCL, Kojima) get buried by frequent sketchbook posts
- Current landing shows "+++" instead of name
- No bio/tagline visible anywhere
- Resume requires navigation to find
- Previous games (Gardens Between, Netflix) not prominently featured
