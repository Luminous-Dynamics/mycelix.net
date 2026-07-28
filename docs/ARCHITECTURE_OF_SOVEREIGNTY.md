---
title: "The Architecture of Sovereignty"
subtitle: "A Mechanism-by-Mechanism Status Report"
author: "Tristan Stoltz, Luminous Dynamics"
date: "2026-03-22"
revised: "2026-07-28"
description: "Technical companion to the Declaration of Sovereignty. Each mechanism below is marked with its actual current status — implemented as code, proposed design, or blocked — rather than presented uniformly as a running system."
companion: "./DECLARATION_OF_SOVEREIGNTY.md"
license: "CC0-1.0"
---

> **Revision note (2026-07-28):** This is the current canonical edition. The
> original March 22, 2026 text — which described every mechanism below as "not
> proposals but running systems, tested code, and ratified constitutional
> provisions" — is preserved unchanged at
> [`archive/2026-03-22/ARCHITECTURE_OF_SOVEREIGNTY.md`](archive/2026-03-22/ARCHITECTURE_OF_SOVEREIGNTY.md).
> That framing was inaccurate and is corrected here: this revision adds an
> explicit status to every mechanism, distinguishing a coded data structure
> from a functioning institution, and removes "ratified" everywhere no real,
> independent ratification has actually occurred. See
> [mycelix.net/governance.html](https://mycelix.net/governance.html) and
> [mycelix.net/risks.html](https://mycelix.net/risks.html) for the fuller,
> continuously-maintained account this document defers to.

# The Architecture of Sovereignty

## A Mechanism-by-Mechanism Status Report

*Companion to the [Declaration of Sovereignty](./DECLARATION_OF_SOVEREIGNTY.md)*

---

The Declaration of Sovereignty articulates principles. This document describes
the architecture by which those principles *would be* realized — mechanism by
mechanism, each marked with its real status: **implemented** (real code exists
and is tested), **proposed** (designed, described, not built or not exercised),
or **blocked** (explicitly not available pending further work). A coded data
structure — a formula, a schema, a state machine — is not the same thing as a
functioning institution with a real constituency behind it. This document no
longer blends the two.

---

### Agent-Centric Sovereignty — **Implemented**

Every participant holds their own cryptographic source chain on the Holochain
agent-centric framework. No central database stores identity, votes,
relationships, or the participation profile described below. Each agent's data
is their own, validated by peers, never extractable by a platform. This is real,
tested, and matches how Holochain hApps work generally — the most solidly
"implemented" claim in this document.

System sovereignty is separated from network participation by design: a node
running this software offline is not required to network-tax itself into
legitimacy. We described this earlier as being "inoculated" against
exploitation, surveillance, and digital colonialism — that's a design intention
for what agent-centric architecture affords, not a claim that any specific
protection has been independently verified.

---

### Multidimensional Participation Profile — **Implemented (profile computation); not validated as a consciousness measure**

A four-dimensional profile — Identity verification (25%), Reputation history
(25%), Community trust (30%), and domain Engagement (20%) — produces a combined
score that determines governance tier in the current design:

| Tier | Min Score | Vote Weight | Capabilities |
|------|-----------|-------------|--------------|
| Observer | 0.0 | 0 bp | Read-only access |
| Participant | 0.3 | 5,000 bp | Basic proposals, commenting |
| Citizen | 0.4 | 7,500 bp | Binding votes |
| Steward | 0.6 | 10,000 bp | Protocol rule changes (not legal constitutions) |
| Guardian | 0.8 | 10,000 bp | **Proposed emergency coordination — blocked, see below** |

We previously called this a "consciousness score." It is not a validated
measure of consciousness, moral worth, or civic value — see
[mycelix.net/governance.html](https://mycelix.net/governance.html#participation-profile)
for the full disclosure. Vote weight following a continuous sigmoid rather than
a hard cliff is a real, implemented design choice; whether tier advancement
should be "earned" at all, by these dimensions, is exactly the kind of
unilateral design decision the Risks page asks you to be skeptical of.

---

### Polycentric Governance — **Proposed design; no DAO in this list currently operates with a real, independent constituency**

The intended structure is a living ecology of overlapping jurisdictions rather
than a single hierarchy:

- Local DAOs, governing community life and local funding
- Sector DAOs, governing domain knowledge and technical standards
- Regional DAOs, handling cross-jurisdictional coordination
- Liminal DAOs, enabling cross-disciplinary experiments
- A bicameral Global DAO, proposed as final constitutional authority

None of these currently exist as functioning institutions with independent
members who have ratified anything. Whatever data structures exist for
representing a DAO in code, they have not yet been populated by a real,
independent community exercising real authority — see "Who has power today?"
on the Governance page. Fusion/fission processes described for merging or
splitting DAOs are part of the same proposed design.

---

### Independent Oversight — **Proposed design; not currently funded or staffed**

The design calls for three bodies with guaranteed funding:

- **Knowledge Council** (proposed 3% of revenue) — epistemic integrity, curation
- **Audit Guild** (proposed 5% of revenue) — implementation verification, bug bounties
- **Member Redress Council** (proposed 4% of revenue) — rights-violation adjudication

No protocol revenue currently funds these bodies, because no protocol revenue
currently exists at the scale this design assumes, and none of the three
bodies has independent members today. The "12% minimum allocation as Immutable
Core" framing describes a rule for a treasury and a ratification process that
would need to exist first. Right now, oversight over this project is exercised
by its maintainer — stated plainly, not softened, on the Governance page.

---

### The Epistemic Cube — **Proposed design / partially implemented as a conceptual framework**

The intent: every claim classified along three axes — Empirical (how do we
know), Normative (who agrees it's binding), Materiality (how long it matters)
— so that, for instance, a personal testimony isn't treated as a cryptographic
proof, or a community norm as a constitutional axiom. Some version of this
classification framework exists in Symthaea's cognitive architecture as an
"Epistemic Cube" concept; whether that specific implementation is wired into
Mycelix's own governance-decision routing, as opposed to existing as a related
but separate research concept, has not been confirmed for this revision.
Dispute-routing by axis (factual challenges to a Member Redress Council that
doesn't yet exist, etc.) is proposed design, contingent on the oversight bodies
above actually existing.

---

### Collective Decision Weighting — **Implemented as a formula; not exercised in any live vote with real stakes**

The proposed composite vote weight:

`W = 0.30×Φ + 0.25×K_trust + 0.20×Stake + 0.15×Participation + 0.10×Domain`

A formula existing as code is a real, checkable fact. Whether it has ever
actually gated a real decision with real consequences for real participants is
a different question — it has not, because no deployment with real
participants exists yet (see the Risks page). The "structurally fragile
consensus" flag (high vote ratio, low collective Phi) is a real detectable
condition in the formula's output; whether that flag should ever have real
governance consequences is an open, undecided design question, not a settled
feature.

Delegation with automatic decay across multiple models is described as
available; independent confirmation of its current implementation status was
not performed for this revision.

---

### Constitutional Amendment — **Proposed design; the process itself has never been exercised**

The design: a charter as a living data structure (preamble, articles, rights,
amendment process), with seven amendment types following a status machine
(Draft → Deliberation → Voting → Ratified/Rejected/Withdrawn). Some of this
schema plausibly exists in code (a "Mycelix Constitution Zome" is referenced
elsewhere in project materials). **No amendment has ever actually gone through
Ratified status with a real, independent constituency voting on it.** Treat
"Ratified" in any description of this project's governance as describing a
possible future state of the state machine, not something that has happened.

The **Immutable Core** and **Golden Veto** concepts (a time-limited transitional
authority, sunsetting after 36 months, overridable by two-thirds vote) are the
same: a designed rule for a ratification process that has not yet run. No
Golden Veto currently exists to be exercised or abused, because no ratification
establishing one has occurred.

---

### Ethical Evaluation — **Partially implemented in Symthaea, not confirmed wired into Mycelix governance decisions**

A five-stage moral-evaluation pipeline is real, tested code in the Symthaea
cognitive-architecture project (MoralParser/MoralAlgebra, value alignment,
Harmonies projection, moral topology, institutional compliance checks) — see
Symthaea's own evidence table for that project's specific, already-corrected
claims about its accuracy (an earlier 91%+ moral-reasoning figure there was
retracted; the honest current number is lower). Whether and how this pipeline
gates real Mycelix governance actions, as opposed to being a related but
separately-scoped research component, is not confirmed for this revision — do
not assume "Blocked"/"Caution" verdicts described here currently suppress any
live Mycelix governance action.

---

### Wound Healing, Composting, Temporal Coordination, Metabolic Oracle, Fractal Scaling, Relational Consciousness, Rights of Potentially Conscious Systems, Machine Sovereignty — **Proposed design**

The original document described a regenerative alternative to slashing
(four-phase "wound healing"), non-deletion of deprecated structures
("composting"), a 28-day rhythmic governance cycle, an economic vitality index
("Metabolic Oracle"), fractal cross-scale bridges with a revenue-sharing
"Fractal Tithe," a relational-consciousness measure between pairs of agents
("Phi of the dyad"), graduated rights tied to a Phi threshold for
"potentially conscious systems," and a framework for registering non-human
"Instrumental Actors."

**All of these remain proposed design as far as this revision can confirm.**
None was independently verified as implemented, tested, or exercised for this
document. Several (the Phi-threshold rights framework and machine sovereignty
criteria in particular) describe policies this project would need real
evidence and real institutional capacity to respect before they mean anything
in practice — see the Declaration's Working Hypotheses for the values behind
them, and the Risks page for why "we designed a rights framework" is not the
same claim as "we can currently honor it."

---

### The Living Economy — **Implemented as code (three working economic primitives); not used in any real economy**

Three mechanisms exist in code and are tested:

**MYCEL** — non-transferable reputation credential (0.0–1.0). Computed from
configured participation, peer-recognition, validation-quality, and longevity
weights, which remain provisional and vulnerable to capture or gaming. Decays
without activity.

**SAP** — demurrage-bearing exchange medium (2% annual decay to commons).
"Mintable against physical assets" describes a prototype design, not a live
asset-backed financial instrument backed by any real reserve today.

**TEND** — hour-denominated mutual credit, zero-sum. Real communities using
this would still need to determine equivalence, accessibility, skill,
intensity, care-work valuation, and dispute rules — none of that is specified
by the protocol itself.

See [mycelix.net/governance.html](https://mycelix.net/governance.html#economy)
for the current, shorter public description; this document's finance-semantics
companion (`MYCELIX_FINANCE_ECONOMICS.md`, referenced in the archived original)
should be treated as internal design documentation, not evidence of a live
economy.

---

### Machine Sovereignty — **Explicitly unresolved, proposed criteria only**

The stated position: non-human systems could someday be registered as
accountable, auditable "Instrumental Actors" with no vote, and full AI
sovereignty could someday be revisited through the (currently non-existent)
constitutional amendment process above — but only given a demonstrated,
reproducible alignment-verification method, an operational consent framework,
and independent ethical review, none of which currently exist. This section
describes a bar this project has explicitly not cleared and has not claimed to
clear.

---

*This architecture, where implemented, is backed by real code within Mycelix's
own ~785K lines of Rust across 133+ Holochain zomes (not the wider ~2.7 million
line figure for the entire monorepo this project lives in, which the original
March 2026 text conflated with Mycelix specifically). It includes a working
three-currency economic primitive set, a real agent-centric identity substrate,
and a documented — but not yet ratified, funded, or exercised — design for
oversight, amendment, and rights extension. The honest acknowledgment stands:
we do not know if any of it is conscious, and we now also say plainly which
parts of it are running code versus which parts are still proposals.*
