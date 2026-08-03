# Cloud Email Analyzer Paper

This directory contains the SCSS-style LaTeX paper package for Cloud Email Analyzer.

## Build

From this directory, run:

```bash
make
```

The Makefile uses `tectonic` from `PATH` by default. To use another executable, pass it explicitly with `TECTONIC=/path/to/tectonic`.

To use a different executable, run `make TECTONIC=/path/to/tectonic`.

The expected output is:

```text
paper/main.pdf
```

## Notes

- `main.tex` contains the paper text and template-style formatting.
- `references.bib` contains academic references plus the few official technical references needed for AWS, ClamAV, and EICAR behavior.
- `figures/` contains TikZ diagrams included by `main.tex`.
- `tables/` contains LaTeX-native tables included by `main.tex`.
- `scripts/` is reserved for future reproducible figure-generation scripts.

The paper front matter includes the confirmed student group, faculty, university, section, and scientific coordinator affiliation.
