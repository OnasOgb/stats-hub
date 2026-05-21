# CONTEXT.md — StatsHub

StatsHub is a mobile-first football stat tracker for weekly clubs. Players join isolated hubs via invite codes and track goals, assists, and clean sheets, with each hub maintaining its own real-time leaderboard, chat, and activity feed.

## Language

### Core entities

**Hub**:
An isolated multi-tenant group with its own leaderboard, chat, and activity feed.
_Avoid_: Group, team, club, room

**Profile**:
A user identity record linked 1:1 with a Supabase auth user.
_Avoid_: User, account

**Hub Member**:
A join record linking a Profile to a Hub, carrying per-hub stats and a role.
_Avoid_: Membership, subscription, participant

**Invite Code**:
A unique lowercase alphanumeric slug (`^[a-z0-9-]+$`) used to join a Hub.
_Avoid_: Join link, access code, invite link

### Stats & tracking

**Stat**:
One of three tracked metrics on a Hub Member: goals, assists, or clean sheets.
_Avoid_: Score, point, metric

**Stat Log**:
An audit trail entry recording a single Stat change as a signed delta (+1 or -1).
_Avoid_: Activity log entry, event, history entry

### Communication

**Message**:
A hub-scoped chat message sent by a Hub Member.
_Avoid_: Comment, post, chat

### Roles

**Admin**:
A Hub Member role with full stat-mutation and hub-management permissions.
_Avoid_: Owner, moderator, manager

**Player**:
A Hub Member role with read-only and chat-only permissions.
_Avoid_: Regular member, basic user

### Views

**Leaderboard**:
A ranked view of all Hub Members in a Hub, sorted by goals.
_Avoid_: Standings, rankings, scoreboard

**Activity Feed**:
A real-time chronological list of Stat Logs within a Hub.
_Avoid_: Event log, history, timeline

## Relationships

- A **Profile** can be a **Hub Member** of many **Hubs**
- A **Hub** has many **Hub Members**, each with exactly one role (**Admin** or **Player**)
- A **Hub** is joined via exactly one **Invite Code**
- A **Hub Member** accumulates **Stats** (goals, assists, clean sheets) scoped to that **Hub**
- A **Stat Log** records a single delta change to one **Stat** for one **Hub Member**, performed by an **Admin**
- A **Message** belongs to exactly one **Hub** and is authored by one **Hub Member**
- The **Leaderboard** is a read view over all **Hub Members** in a **Hub**
- The **Activity Feed** is a read view over all **Stat Logs** in a **Hub**

## Example dialogue

> **Dev:** "When a **Profile** joins a **Hub** via an **Invite Code**, what role do they get?"
> **Domain expert:** "They become a **Hub Member** with the **Player** role. Only the creator gets the **Admin** role, assigned automatically by a database trigger."

> **Dev:** "If an **Admin** taps '+1 goal' on someone's profile, what records change?"
> **Domain expert:** "Two things happen atomically: the **Hub Member**'s goal **Stat** increments by 1, and a **Stat Log** is created with delta +1. The **Activity Feed** picks it up in real time."

> **Dev:** "Can a **Player** modify **Stats**?"
> **Domain expert:** "No. Only an **Admin** can increment or decrement **Stats**. A **Player** can view the **Leaderboard** and send **Messages**, but stat mutation is admin-only."

## Flagged ambiguities

- "player" is used both as a **role** value (`player` vs `admin`) and colloquially to mean any person in a hub. Resolved: use **Hub Member** for the general concept; reserve **Player** strictly for the role value.
- "activity" could mean the **Activity Feed** component or an individual **Stat Log** entry. Resolved: **Stat Log** is the data record; **Activity Feed** is the UI that displays them.
- "stat" without qualification could mean the current value on a **Hub Member** (e.g., `goals: 5`) or a **Stat Log** entry (the delta record). Resolved: **Stat** refers to the metric type and its current value; **Stat Log** refers to the audit entry recording a change.
