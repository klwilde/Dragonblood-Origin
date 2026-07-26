// Thin publishing interface used by the cadence pipeline.
//
// Substack does not expose a stable, public publishing API, so this module
// defines the interface the rest of the engine codes against (draft, publish,
// tier routing) plus an in-memory mock implementation for local development
// and tests. Wire up a real adapter (e.g. a partner-API integration, or a
// browser-automation adapter against the Substack dashboard) by implementing
// the same three methods and passing it into `createPipeline` instead of
// `createMockClient`.

function createMockClient() {
  const drafts = [];
  const published = [];

  return {
    async draft({ cadence, tier, title, body }) {
      const entry = { id: `draft-${drafts.length + 1}`, cadence, tier, title, body, createdAt: new Date() };
      drafts.push(entry);
      return entry;
    },
    async publish(draftId, { tier } = {}) {
      const index = drafts.findIndex((d) => d.id === draftId);
      if (index === -1) throw new Error(`No such draft: ${draftId}`);
      const [entry] = drafts.splice(index, 1);
      const post = { ...entry, tier: tier ?? entry.tier, publishedAt: new Date() };
      published.push(post);
      return post;
    },
    _drafts: drafts,
    _published: published,
  };
}

module.exports = { createMockClient };
