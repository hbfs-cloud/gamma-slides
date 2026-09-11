# Educational presentations for video

A scene shows one relationship; notes carry explanation and evidence. Define a new term before using it. Offer a simple comparison before detailed results and retain counterexamples. Name a metaphor as a metaphor—it never replaces measured data.

## Declarative illustrations

```yaml
slides:
  - layout: visual
    variant: explainer
    title: “−50%” then requires “+100%”.
    subtitle: The calculation base changed.
    visual:
      alt: One hundred euros become fifty, then return to one hundred.
      caption: Educational calculation, not market performance.
      story:
        type: recovery
        labels: ['100', '50', '100']
    notes: Explain the fifty-euro loss, then the doubling of the fifty euros left.
```

`visual.story` replaces `visual.src` for these illustrations. Text is escaped; the generator never receives executable SVG or JavaScript. Types: `recovery`, `correlation`, `converge`, `fork`, `funnel`, `mountain`, `payoff`, `balance`, `timeline`, `survivors`, `network`, `drawdown`, `distribution`, `calendar`, `orbit`, `tiles`, `ladder`, `journey`.

The shapes explain mechanisms. Their paths, points, cells, and surfaces are schematic; never present them as financial series or exact counts. Use a data-backed chart for numeric evidence. `icons` accepts IDs from the native catalog and accompanies labels.

Animations are finite and start on the active stage. Replay and pause are available through M. They honor reduced motion and render static during export. Clean output hides controls and receives presenter interactions.

## Charts and architecture

- `variant: video-chart` prioritizes a title, chart, and readable conclusion. `stock` adds one annotated real candlestick from the last thirty supplied observations; the example chooses the widest body to explain its endpoints.
- To teach candlesticks, use `moving_averages: []`, `show_macd: false`, `show_rsi: false`, `show_bollinger: false`, `show_obv: false`. Price and volume remain available.
- `chart.options.video_readable: true` enlarges D3/Pixi categories, series, and values. Reserve it for short comparisons; place an explicit conclusion below a dense time series.
- `chart.options.center_index: 0` places the first share’s value at a donut center. Identify it with `center_label`; without the index, the center remains the total.
- `variant: video-closeup` keeps Archify and its interactions. A simple chain of four nodes or fewer is also compiled into vertical phone architecture; other topologies retain their appropriate representation.

## Validation

Check mobile HTML separately from a 16:9 video frame reduced to 390px width. Page reflow does not apply to video. A viewer must read the idea and essential evidence without hovering. Fine ticks and sources never substitute for a large visible result.

Check loaded images, diagram relationships, contrast, animation and pause, then record a short clean-output extract. Decode the file to verify what viewers will see. A DOM capture or successful encoding alone is not a visual review.
