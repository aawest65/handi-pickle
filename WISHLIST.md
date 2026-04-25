# HandiPick Feature Wishlist

---

## Handicap Rating System ("True Handicap")

### Concept
A secondary rating alongside the existing skill rating — modeled after golf handicaps. The closer to 0, the better the player. A scratch (near-0) player needs no spots; a 9.0 player knows they are being spotted 9 points and have room to grow. Gives players an intuitive, universal sense of where they stand relative to everyone else.

### Two Layers: Index vs. Par

The system has two distinct layers — one for the math, one for the player:

**Handicap Index** (backend) — the precise decimal used for all calculations: net differentials, doubles averaging, allowance adjustments. Players don't need to think about this number directly.

**"Your Par" (frontend)** — the rounded, plain-language number displayed on a player's profile. A player with a handicap index of 3.9 simply sees:

> "Your par: 4"

Just like an 18-handicap golfer mentally adds 18 to a par-72 course and knows they should shoot ~90 — a "par 4" pickleball player knows they should win around 4 gross points in a standard game against scratch competition. Below par = overperforming. Above par = underperforming. No math required from the player.

The par number becomes the identity — "I'm a 4" is immediately meaningful to any player in the system, the same way "I'm an 18" is immediately meaningful to any golfer.

### Core Formula
Inverted, non-linear mapping of the skill rating (1.0–8.0) to a handicap index:

```
handicap = 1.0 + 10.0 × ((8.0 − rating) / 7.0)^0.75
```

| Skill Rating | Handicap |
|---|---|
| 1.0 | 11.0 |
| 2.0 | 8.7 |
| 3.0 | 6.6 |
| 4.0 | 4.7 |
| 4.5 | 3.9 |
| 5.0 | 3.1 |
| 6.0 | 1.8 |
| 8.0 | 1.0 |

**Why non-linear (k=0.75):** Beginners improve quickly (big handicap drops early), while players who plateau at 4.0–4.5 see small changes — mirroring real pickleball development. The k exponent is admin-tunable once real match data is available.

**Clamp:** Cap effective rating to [1.0, 8.0] before applying the formula so no one produces a negative handicap.

### How Net Scoring Works

```
Net differential = Weaker team handicap − Stronger team handicap
Weaker team starts the game with that many points on the board.
```

Example: Player A (handicap 1.1) vs Player B (handicap 10.9). B starts at 9.8–0. B needs only 2 gross points to win; A needs 11.

**Constraints satisfied:**
- Minimum differential between any two different-rated players: >1.0 (weaker player can never win on a single point)
- Maximum differential (9.8 at the extremes) stays below the winning score (11), so the stronger player is never already losing before the game starts

---

### Singles Matches
Full handicap differential applied. Straightforward.

### Doubles Matches

**Team handicap = average of the two partners' handicaps** (calculated fresh per pairing, per round).

```
Team Handicap = (Player A handicap + Player B handicap) / 2
Net differential = Weaker team avg − Stronger team avg
```

This only resolves at pairing time — it must be recalculated each round in rotational or mixer formats.

**Allowance percentage** (TD/manager configurable):

| Format | Suggested Allowance |
|---|---|
| Singles | 100% |
| Doubles, fixed pairs | 85–90% |
| Mixer / rotational | 85% (recalculated each round) |

Allowance dampens the stacking problem: a 1.0 + 11.0 team averages the same as a 5.5 + 6.5 team, but plays very differently. Reducing to 85% narrows the net advantage and discourages extreme pairing strategies.

**Admin controls (Tournament Director / Club Manager):**
- Choose allowance % per tournament (75%, 85%, 100%)
- Format type (singles, fixed doubles, mixer)
- Handicap system on/off per event

---

## Club Map View

### Concept
Rather than a flat list, clubs would be plotted as pins on an interactive map. A player in Orlando can immediately see whether a club is on the north side (near I-4 / Winter Park) or the south side (near Kissimmee), which matters enormously — south-to-north Orlando can be a 2-hour round trip in traffic. A city name alone tells you nothing about convenience.

### How It Would Work
- Toggle between the current list view and a map view (default to map if the player has a location set)
- Player's approximate location shown as a reference pin
- Club pins colored or badged: **My Club** (teal), **Pending request** (amber), **Open to join** (slate)
- Clicking a pin opens a small card with club name, member count, and a Request to Join button — no need to leave the map
- Zoom starts at the player's state; pan and zoom freely to explore other regions or nationally

### Geographic Scope
- **Default zoom:** player's state (e.g., Florida fills the viewport)
- **Auto-zoom:** if all clubs in the state fit in a metro area, zoom to that region instead
- **No location set:** default to a national US view

### Implementation Notes
- Requires geocoding club addresses (city + state → lat/lng) — either at club creation time or lazily on first map load
- **Recommended library:** Mapbox GL JS or Google Maps API (both have React wrappers); Mapbox is cheaper at low volume and has a generous free tier
- Club records would need `lat` and `lng` columns added to the schema, populated via a geocoding API call when a club's city/state is saved
- Player location pin uses their stored city/state geocoded the same way — no GPS required, no privacy concern

### Open Questions
- Mapbox vs. Google Maps — cost, terms, and tile quality at county/metro zoom levels
- Should the map be the default view or opt-in toggle?
- Show courts (not just clubs) on the map eventually — many players care more about where they physically play than which club roster they belong to

---

## Multi-Club Membership

### Concept
Currently a player can belong to only one club at a time. In practice many players are active members of multiple clubs — a weekday club near work and a weekend club near home, for example. The system should reflect that reality.

### Required Schema Change
The current `clubId` field on the `Player` record is a simple foreign key (one club per player). This needs to be replaced with a many-to-many join table:

```
ClubMembership
  id         String   @id
  playerId   String
  clubId     String
  isPrimary  Boolean  @default(false)   // player's "home" club for profile display
  joinedAt   DateTime @default(now())

  @@unique([playerId, clubId])
```

The `isPrimary` flag preserves the concept of a home club — the one that shows on the player's profile card, leaderboard, and public-facing pages — while allowing membership in additional clubs without losing that anchor.

### What Changes
- **Schema:** drop `Player.clubId`, add `ClubMembership` join table, migrate existing memberships
- **Onboarding:** selecting a club sets it as the primary membership
- **Clubs page:** join/leave actions create/delete `ClubMembership` rows; a player can be a member of multiple clubs simultaneously
- **Profile:** displays primary club; secondary clubs listed below or accessible via a small toggle
- **Club admin roster:** members include anyone with a `ClubMembership` row for that club, regardless of primary status
- **Join request flow:** approving a request creates a membership row, not a field update
- **API routes:** any endpoint reading `player.clubId` needs updating — onboarding, profile, leaderboard, clubs, admin

### Open Questions for Co-Creators
- Should there be a cap on how many clubs a player can join (e.g., max 3)?
- Does the rating algorithm need to know about club membership, or is it purely social/organizational?
- Should leaving your only club be allowed, or must a player always have a primary?
- How does the club roster count work — does a player with two clubs count toward both clubs' member totals?

---

---

## Club Events & Flyers

### Concept
Club managers can post upcoming events — clinics, socials, tournaments, court reservations — with an optional flyer image (PNG/JPG upload). Members see a club events feed on the club page and can receive event notifications via email broadcast.

### What's Needed
- `ClubEvent` table: `id`, `clubId`, `title`, `description`, `eventDate`, `location`, `flyerUrl`, `createdById`, `createdAt`
- File upload for flyer (reuse existing Vercel Blob pattern from avatar uploads)
- Club page events section — upcoming events listed with flyer thumbnail, date, and description
- Admin/club manager UI to create, edit, and delete events
- Optional: email broadcast trigger when a new event is posted (reuse broadcast infrastructure)

### Open Questions
- Should players be able to RSVP or is it informational only?
- Should events be visible to non-members (public clubs only)?
- Max flyer file size / accepted formats?

---

## Search & Pagination at Scale

### Concept
The current players page renders all players as cards — fine at 100, unusable at 10,000. All list views need server-side search and pagination before the dataset grows too large to render in the browser.

### Affected Areas
- **Players page** — paginated grid with name/rating/club search box; keep card layout, add page controls
- **Admin user table** — already has a `?q=` search param on the API; needs pagination and a visible search input
- **Club member roster** — paginated list once clubs exceed ~50–100 members
- **Leaderboard** — pagination or infinite scroll; filter by club, format, rating range
- **Tournament registrations** — searchable player list for TDs managing large fields

### Implementation Notes
- All API routes need `?page=` and `?limit=` params (or cursor-based pagination for infinite scroll)
- Client components switch from fetching all records to fetching one page at a time
- Search inputs debounce (300ms) before firing the query
- Consider Postgres full-text search (`to_tsvector`) for name search at scale vs. `ILIKE` (works fine to ~50k rows)

---

## Coach Functionality

### Concept
Coaches occupy a distinct role from club admins and players — they track student progress, assign drill plans, schedule lessons, and may manage a roster of students across multiple clubs. This could also be a monetization vector (premium coach profiles, lesson booking).

### Potential Features
- **Coach role** — new `isCoach` flag (or `Role` enum value) on `User`; coaches can view full rating history and match logs for linked students
- **Student roster** — a coach links to players (students give consent); coach sees their rating trends, recent games, strengths/weaknesses
- **Lesson notes** — private notes per student visible only to coach and student
- **Drill / training plans** — coach assigns a plan; student sees it on their profile dashboard
- **Coach profile page** — public page showing credentials, club affiliations, rating, and a contact/booking link
- **Student progress report** — exportable summary (PDF or email) of a student's rating history, win rate, format breakdown

### Open Questions
- Should coaches be verified (admin-approved) or self-declared?
- Can a player have multiple coaches?
- Is lesson booking in-app or does it just link to an external calendar/booking tool (Calendly etc.)?
- Monetization angle: premium coach tier with analytics dashboard?

---

### Open Questions / Future Tuning
- Should handicap be based on `currentRating` (dynamic) or `selfRatedCategory` (static) or a blend?
- Display handicap index on player profiles and leaderboard?
- Track net-score results separately from gross-score results over time?
- Allow players to see their handicap trend (going down = improving)?
