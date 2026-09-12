// Public examples are authored decks, not diagrams invented by the landing page.
export const explanatoryStories = [
  { id: 'cyber-incident', slug: 'cyber-incident', slide: 0, label: 'Cybersecurity', title: 'Follow an attack. Find the places to stop it.', copy: 'Actors, stolen access, attempted exfiltration and the defenders who contain it. A fictional incident explained in eight animated diagrams.', audience: 'For security teams and decision-makers', guide: 'cyber-incident-demo.md' },
  { id: 'saas-explained', slug: 'saas-explained', slide: 0, label: 'SaaS, without jargon', title: 'What happens after a customer clicks Book?', copy: 'Follow a reservation through the app, the shared workspace and the people behind the service. Seven diagrams for a non-technical audience.', audience: 'For customers, colleagues and stakeholders', guide: 'saas-explained-demo.md' },
  { id: 'data-pipeline', slug: 'data-pipeline', slide: 0, label: 'Data engineering', title: 'From a CRM change to a trusted business view.', copy: 'HubSpot, n8n, S3, AWS Batch, Redshift and dbt. Eight diagrams expose the data path, permissions, scaling limits and recovery routes.', audience: 'For architecture reviews and data teams', guide: 'data-pipeline-demo.md' },
];

export function storiesHTML(entries) {
  const stories = explanatoryStories.filter(story => entries.some(entry => entry.slug === story.slug));
  if (!stories.length) return '';
  return `<section class="story-examples shell" id="stories" aria-labelledby="stories-title">
    <div class="story-heading"><h2 id="stories-title">Explain a complex idea. One path at a time.</h2><p>Three complete, editable presentations. Open a story, press Play story, or choose a focus view to walk the room through a diagram.</p></div>
    <div class="story-grid">${stories.map(story => `<article data-story="${story.id}">
      <p class="story-label">${story.label}</p><a class="story-poster" href="./${story.slug}/" tabindex="-1" aria-hidden="true"><img src="./assets/story-${story.id}.jpg" width="1280" height="720" loading="lazy" alt=""></a>
      <h3>${story.title}</h3><p>${story.copy}</p><p class="story-audience">${story.audience}</p>
      <a class="story-open" href="./${story.slug}/">Open animated story <span aria-hidden="true">↗</span></a>
      <a class="story-source" href="https://github.com/hbfs-cloud/gamma-slides/blob/main/presentations/${story.slug}.yaml">Get the editable source</a>
    </article>`).join('')}</div>
    <p class="story-disclosure">Illustrative scenarios, not a live attack, a connected SaaS account or deployed cloud infrastructure. Every deck includes presenter notes.</p>
  </section>`;
}

export function storiesCSS() {
  return `.story-examples{padding:72px 0;border-top:1px solid #cfc9bd}.story-heading{display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:end;margin-bottom:32px}.story-heading h2{margin:0;font-family:SourceSerif,Georgia,serif;font-weight:440;font-size:clamp(2rem,4vw,3rem);letter-spacing:-.035em;line-height:1.05;max-width:20ch}.story-heading>p{margin:0;color:#62646b;max-width:55ch}.story-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px}.story-grid article{display:flex;flex-direction:column;min-width:0;border-top:2px solid #1748d5;padding-top:16px}.story-grid .story-label{font-size:.875rem;font-weight:650;color:#1748d5;margin-bottom:16px}.story-poster{display:block;border:1px solid #cfc9bd;margin-bottom:24px}.story-poster img{display:block;width:100%;height:auto}.story-grid h3{font-size:1.5rem;line-height:1.2;letter-spacing:-.025em;margin:0 0 16px}.story-grid p{font-size:1rem;color:#62646b;margin-bottom:16px}.story-grid .story-audience{font-size:.75rem;margin-top:auto}.story-open{display:flex;align-items:center;justify-content:space-between;min-height:48px;font-weight:650;text-decoration:none;border-top:1px solid #cfc9bd}.story-open span{color:#1748d5}.story-source{display:flex;align-items:center;min-height:44px;font-size:.875rem;color:#62646b}.story-disclosure{margin:24px 0 0;font-size:.75rem;color:#62646b}@media(max-width:850px){.story-grid{grid-template-columns:1fr;gap:40px}.story-heading{grid-template-columns:1fr;gap:16px}.story-poster{max-width:680px}.story-grid h3{max-width:30ch}.story-grid p{max-width:65ch}}@media(max-width:590px){.story-examples{padding:48px 0}}`;
}
