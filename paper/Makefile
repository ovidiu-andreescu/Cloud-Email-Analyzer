TECTONIC ?= tectonic

.PHONY: all clean

all: main.pdf

main.pdf: main.tex references.bib figures/architecture.tex figures/pipeline.tex figures/data_model.tex figures/ml_comparison.tex tables/components.tex tables/artifacts.tex tables/related.tex tables/ml_results.tex
	$(TECTONIC) --keep-logs --keep-intermediates --reruns 2 main.tex

clean:
	rm -f main.aux main.bbl main.blg main.log main.out main.toc main.xdv main.pdf
