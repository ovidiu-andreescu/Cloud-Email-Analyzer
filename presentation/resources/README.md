# Presentation Source

The editable slide source is in `slides/`. Each `slide-XX.mjs` module defines one slide, and `cloud_email_deck.mjs` imports the full deck.

## Build

The source uses the Codex Presentations artifact runtime (`@oai/artifact-tool`) to create and export PowerPoint shapes. It is therefore reproducible from a Codex presentation task, not from a plain Node.js installation alone. Keep scratch output outside the repository while iterating, then copy the reviewed PPTX to `presentation/project_presentation.pptx`.

The entry point is `slides/cloud_email_deck.mjs`; it imports the ten slide modules and exports `buildDeck(presentation, ctx)`. Use that function from the artifact-tool workspace's deck runner.

Export the final PDF from PowerPoint after the PPTX is reviewed.
