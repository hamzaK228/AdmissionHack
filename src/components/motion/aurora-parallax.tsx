/**
 * Aurora backdrop — pure CSS.
 *
 * No JavaScript and no animation-frame loop: the parallax is driven by the
 * `--sy` custom property published by <ScrollDriver>, resolved in the style
 * engine. Per Emil Kowalski's rule, CSS animation beats JS when the main
 * thread is busy, and the transform stays on the compositor.
 *
 * Each blob sits inside its own wrapper so the wrapper can carry the scroll
 * offset while the blob keeps its own `drift` keyframes (an animation would
 * otherwise override a transform on the same element).
 */
export function AuroraParallax() {
  return (
    <div className="aurora" aria-hidden>
      <div className="aurora-layer aurora-layer-1">
        <div className="aurora-blob aurora-blob-1" />
      </div>
      <div className="aurora-layer aurora-layer-2">
        <div className="aurora-blob aurora-blob-2" />
      </div>
    </div>
  );
}
