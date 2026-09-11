import { starterMarkdown } from './markdown.js';

const narrative = `# A clear story
## The message your audience should remember

This is your through-line. It stays in your notes and is not projected.

---

# The tension worth solving
## Name the cost of staying where you are
- What changed
- Why it matters now
- What the audience should decide

Keep the evidence in your notes, then deliver the point in the room.

---

# The evidence
## Show only what makes the decision credible
| Before | After |
| --- | --- |
| Fragmented work | One operating rhythm |
| Assumptions | A visible decision |

Use this slide to make the trade-off easy to read.

---

# Make the next move obvious
## State the owner, timing, and first action
- Owner: add a name
- Timing: add a date
- First action: make it concrete

Close with a sentence the audience can repeat.`;

const boardUpdate = `version: '1'
theme: analyst-proof
meta:
  title: Board update · illustrative model
  subtitle: A concise decision-ready operating review
  language: en
  description: Replace illustrative figures with your own evidence before presenting.
slides:
  - layout: title
    title: A stronger signal. One decision to make.
    subtitle: Board update · illustrative model
    source: Illustrative Gamma Presenter template
    narration: Open with the decision, then use the next slides to establish why it is ready now.
  - layout: chart
    title: Momentum is visible.
    subtitle: Replace this illustrative series with the metric that decides the conversation.
    chart:
      type: bar
      data:
        labels: [Q1, Q2, Q3, Q4]
        datasets:
          - label: Illustrative operating signal
            values: [42, 57, 68, 81]
            color: primary
      options:
        show_values: true
        show_legend: false
        y_label: Illustrative index
    source: Illustrative values · replace before use
    footnote: This is a template, not a benchmark or customer claim.
  - layout: table
    title: Turn evidence into an operating commitment.
    subtitle: A small table is easier to act on than a crowded dashboard.
    table:
      headers: [Decision, Owner, Next proof]
      rows:
        - [Choose the priority, Name the accountable owner, Confirm the first milestone]
        - [Set the operating cadence, Name the review lead, Schedule the next readout]
    source: Gamma Presenter template
  - layout: closing
    title: Make the decision explicit.
    subtitle: Replace this with the exact commitment you want from the room.
    callout:
      label: NEXT
      value: Approve the operating plan
    source: Gamma Presenter template
`;

const architectureReview = `version: '1'
theme: signal-room
meta:
  title: Architecture review · live model
  subtitle: A runnable Archify diagram with focused views
  language: en
  description: A local model for explaining a technical system without flattening it into a screenshot.
slides:
  - layout: title
    title: Explain the system as a live system.
    subtitle: Architecture review · runnable local model
    source: Gamma Presenter template
  - layout: diagram
    title: From source to a controlled stage.
    subtitle: Use the diagram controls to focus the story while retaining the complete system.
    diagram:
      type: architecture
      spec:
        schema_version: 1
        diagram_type: architecture
        meta:
          title: Local presentation flow
          quality_profile: showcase
          animation: trace
          viewBox: [1100, 500]
          views:
            - id: authoring
              label: Authoring flow
              focus: [source, renderer, stage]
              note: One source becomes one live presentation under operator control.
        components:
          - id: source
            type: external
            label: Source document
            sublabel: Markdown · YAML · JSON
            pos: [40, 190]
            size: [185, 76]
          - id: renderer
            type: backend
            label: Gamma runtime
            sublabel: Media · charts · diagrams · GPU
            pos: [430, 190]
            size: [240, 76]
          - id: stage
            type: frontend
            label: Stage + Speaker View
            sublabel: Timing · notes · recording
            pos: [875, 190]
            size: [185, 76]
        connections:
          - id: source-renderer
            from: source
            to: renderer
            label: validate + render
            variant: emphasis
          - id: renderer-stage
            from: renderer
            to: stage
            label: present
            variant: emphasis
    source: Gamma Presenter template
  - layout: closing
    title: Keep the system editable.
    subtitle: Change the labels, views, and relationships in YAML; the live diagram follows the source.
    callout:
      label: TRY NEXT
      value: Focus a diagram view on Stage
    source: Gamma Presenter template
`;

const liveRehearsal = `version: '1'
theme: cutting-room
meta:
  title: Live operator rehearsal · model
  subtitle: Practice timing, a live chart, and the human approval boundary
  language: en
  description: A safe rehearsal model for the Gamma Presenter control room.
slides:
  - layout: title
    title: Rehearse the room before the room matters.
    subtitle: Start the countdown, open Stage, then keep the operator in control.
    source: Gamma Presenter template
  - layout: chart
    title: Keep the live signal live.
    subtitle: Edit the data in YAML and see the stage update without importing an image.
    chart:
      type: line
      data:
        labels: [Open, Context, Evidence, Decision, Close]
        datasets:
          - label: Illustrative audience clarity
            values: [38, 52, 76, 92, 100]
            color: primary
      options:
        show_values: true
        show_legend: false
        y_label: Illustrative clarity index
    source: Illustrative values · Gamma Presenter template
    footnote: Replace with your own evidence before a real presentation.
  - layout: visual
    title: The co-pilot can request. The operator decides.
    subtitle: Use the Control room to try a countdown, a private cue, and an explicit action approval.
    visual:
      alt: A local co-pilot request flowing through a visible human approval boundary to Stage.
      mechanism:
        type: queue
        status: HUMAN APPROVAL IS THE LAST STEP
        steps:
          - { label: Local co-pilot, detail: Claude Code or Codex drafts a bounded request, value: request }
          - { label: Loopback MCP, detail: Local endpoint plus bearer token, value: authenticated }
          - { label: Author approval, detail: Approve or reject the exact action, value: human }
          - { label: Stage action, detail: Only after explicit approval, value: executed }
    source: Gamma Presenter template
  - layout: closing
    title: End on time, with control.
    subtitle: The speaker gets the cue. The operator keeps the final decision.
    callout:
      label: REHEARSE
      value: Start a five-minute countdown
    source: Gamma Presenter template
`;

const catalog = Object.freeze([
  { id: 'blank', title: 'Blank story', description: 'A two-slide Markdown starting point for a fast narrative.', kind: 'Markdown', theme: 'Signal Room', themeName: 'signal-room', sourceKind: 'markdown', source: starterMarkdown, deckTitle: 'New presentation' },
  { id: 'narrative', title: 'Decision narrative', description: 'A four-slide Markdown story: tension, evidence, and next move.', kind: 'Markdown', theme: 'Signal Room', themeName: 'signal-room', sourceKind: 'markdown', source: narrative, deckTitle: 'Decision narrative' },
  { id: 'board-update', title: 'Board update', description: 'A decision-ready YAML model with a live chart and table.', kind: 'YAML', theme: 'Analyst Proof', themeName: 'analyst-proof', sourceKind: 'yaml', source: boardUpdate, deckTitle: 'Board update · illustrative model' },
  { id: 'architecture', title: 'Architecture review', description: 'A runnable Archify system diagram with an authored focus view.', kind: 'YAML', theme: 'Signal Room', themeName: 'signal-room', sourceKind: 'yaml', source: architectureReview, deckTitle: 'Architecture review · live model' },
  { id: 'live-rehearsal', title: 'Live operator rehearsal', description: 'A timed stage rehearsal with a chart and local AI approval model.', kind: 'YAML', theme: 'Cutting Room', themeName: 'cutting-room', sourceKind: 'yaml', source: liveRehearsal, deckTitle: 'Live operator rehearsal · model' },
]);

export function listPresentationTemplates() {
  return catalog.map(({ source, ...template }) => template);
}

export function getPresentationTemplate(id) {
  return catalog.find(template => template.id === id) || null;
}
