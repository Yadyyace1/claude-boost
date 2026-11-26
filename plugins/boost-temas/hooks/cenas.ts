// Cenários animados (SVG puro, movimento lento). Sem imagens, sem fontes, comentários simples.

export const SYNTHWAVE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#120b1f"/>
<stop offset="0.55" stop-color="#2a1145"/>
<stop offset="0.62" stop-color="#4a1554"/>
<stop offset="1" stop-color="#120b1f"/>
</linearGradient>
<linearGradient id="sol" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#ffb347"/>
<stop offset="1" stop-color="#ff4fd8"/>
</linearGradient>
</defs>
<style>
.grade { animation: andar 9s linear infinite; }
.brilho { animation: pulsar 14s ease-in-out infinite; }
@keyframes andar { from { transform: translateY(0); } to { transform: translateY(50px); } }
@keyframes pulsar { 0%, 100% { opacity: 0.32; } 50% { opacity: 0.42; } }
</style>
<rect width="1600" height="1000" fill="url(#ceu)"/>
<!-- sol baixo no horizonte -->
<g class="brilho" opacity="0.36">
<circle cx="1260" cy="610" r="170" fill="url(#sol)"/>
<rect x="1080" y="560" width="360" height="9" fill="#2a1145"/>
<rect x="1080" y="585" width="360" height="11" fill="#2a1145"/>
<rect x="1080" y="612" width="360" height="14" fill="#2a1145"/>
</g>
<rect x="0" y="618" width="1600" height="382" fill="#120b1f"/>
<!-- grade em perspectiva -->
<g stroke="#ff4fd8" stroke-width="1.5" opacity="0.28">
<line x1="800" y1="620" x2="-900" y2="1000"/>
<line x1="800" y1="620" x2="-400" y2="1000"/>
<line x1="800" y1="620" x2="100" y2="1000"/>
<line x1="800" y1="620" x2="500" y2="1000"/>
<line x1="800" y1="620" x2="800" y2="1000"/>
<line x1="800" y1="620" x2="1100" y2="1000"/>
<line x1="800" y1="620" x2="1500" y2="1000"/>
<line x1="800" y1="620" x2="2000" y2="1000"/>
<line x1="800" y1="620" x2="2500" y2="1000"/>
</g>
<g class="grade" stroke="#9d7bff" stroke-width="1.5" opacity="0.26">
<line x1="0" y1="630" x2="1600" y2="630"/>
<line x1="0" y1="650" x2="1600" y2="650"/>
<line x1="0" y1="680" x2="1600" y2="680"/>
<line x1="0" y1="720" x2="1600" y2="720"/>
<line x1="0" y1="770" x2="1600" y2="770"/>
<line x1="0" y1="830" x2="1600" y2="830"/>
<line x1="0" y1="900" x2="1600" y2="900"/>
<line x1="0" y1="980" x2="1600" y2="980"/>
<line x1="0" y1="1030" x2="1600" y2="1030"/>
</g>
</svg>`

export const OCEANO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<style>
.fundo { fill: #0b1520; }
.o1 { fill: #12304a; opacity: 0.55; animation: mar 26s ease-in-out infinite alternate; }
.o2 { fill: #164064; opacity: 0.45; animation: mar 34s ease-in-out infinite alternate-reverse; }
.o3 { fill: #1d5582; opacity: 0.35; animation: mar 42s ease-in-out infinite alternate; }
@media (prefers-color-scheme: light) {
.fundo { fill: #eaf2f8; }
.o1 { fill: #cfe3f2; opacity: 0.7; }
.o2 { fill: #b7d5ec; opacity: 0.55; }
.o3 { fill: #9ec6e6; opacity: 0.45; }
}
@keyframes mar { from { transform: translateX(-60px); } to { transform: translateX(60px); } }
</style>
<rect class="fundo" width="1600" height="1000"/>
<!-- tres camadas de ondas no pe da tela -->
<path class="o1" d="M-200 760 C 100 720 300 800 600 760 S 1100 720 1400 760 S 1800 800 1900 770 V 1000 H -200 Z"/>
<path class="o2" d="M-200 830 C 150 800 350 870 650 830 S 1150 790 1450 830 S 1800 860 1900 840 V 1000 H -200 Z"/>
<path class="o3" d="M-200 900 C 200 870 400 940 700 905 S 1200 870 1500 900 S 1800 930 1900 915 V 1000 H -200 Z"/>
</svg>`
