# Stellar Visual-Adaptation Experiment

This contained surface evaluates the steady-state Ferwerda et al. (SIGGRAPH
1996) threshold-visibility tone-reproduction equations against the accepted
stellar screen-palette cache. It is an alternate experimental Color path, not
a production dependency or a modification of Bruneton Color.

Reference conditions for the first experiment are taken directly from the
paper: an 80 cd/m^2 display, display adaptation at 40 cd/m^2, and the paper's
0.001 cd/m^2 starlight scene condition. The experiment reports the original
photopic and scotopic threshold functions separately and keeps the existing
Bruneton and production-Ward results as controls.

The CIE scotopic spectral luminous-efficiency fixture is copied from the CIE
dataset identified by DOI `10.25039/CIE.DS.gr6w4b5g` and retains its upstream
metadata and checksums.
