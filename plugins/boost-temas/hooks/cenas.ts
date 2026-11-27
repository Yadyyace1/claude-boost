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

export const AURORA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06121a"/><stop offset="1" stop-color="#0b1f24"/></linearGradient>
<linearGradient id="faixa1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2de2a6" stop-opacity="0"/><stop offset="0.5" stop-color="#2de2a6" stop-opacity="0.55"/><stop offset="1" stop-color="#7c6cf0" stop-opacity="0"/></linearGradient>
<linearGradient id="faixa2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7c6cf0" stop-opacity="0"/><stop offset="0.5" stop-color="#58c4f0" stop-opacity="0.45"/><stop offset="1" stop-color="#2de2a6" stop-opacity="0"/></linearGradient>
<filter id="borra" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="38"/></filter>
</defs>
<style>
.a1 { animation: ondular 26s ease-in-out infinite alternate; }
.a2 { animation: ondular 34s ease-in-out infinite alternate-reverse; }
@keyframes ondular { from { transform: translateX(-60px) scaleY(1); opacity: 0.55; } to { transform: translateX(80px) scaleY(1.25); opacity: 0.8; } }
@media (prefers-reduced-motion: reduce) { .a1, .a2 { animation: none; } }
</style>
<rect width="1600" height="1000" fill="url(#ceu)"/>
<!-- faixas de luz -->
<g filter="url(#borra)">
<path class="a1" d="M-100 260 C 300 120, 600 420, 900 240 S 1500 180, 1750 300 L 1750 380 C 1400 300, 1100 480, 800 330 S 200 260, -100 380 Z" fill="url(#faixa1)"/>
<path class="a2" d="M-100 420 C 250 300, 700 560, 1000 380 S 1500 340, 1750 460 L 1750 520 C 1400 460, 1050 620, 760 470 S 250 420, -100 520 Z" fill="url(#faixa2)"/>
</g>
<!-- estrelas fixas -->
<g fill="#cfe9ff" opacity="0.5">
<circle cx="140" cy="90" r="1.4"/><circle cx="420" cy="60" r="1.1"/><circle cx="760" cy="110" r="1.3"/><circle cx="1100" cy="70" r="1.2"/><circle cx="1380" cy="130" r="1.5"/><circle cx="1520" cy="50" r="1"/><circle cx="260" cy="170" r="1"/><circle cx="980" cy="160" r="1"/>
</g>
</svg>`

export const ESTRELAS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
<radialGradient id="fundo" cx="0.7" cy="0.2" r="1"><stop offset="0" stop-color="#1b2350"/><stop offset="1" stop-color="#070a1c"/></radialGradient>
</defs>
<style>
.p1 { animation: piscar 7s ease-in-out infinite; }
.p2 { animation: piscar 9s ease-in-out infinite 2s; }
.p3 { animation: piscar 11s ease-in-out infinite 4s; }
.cometa { animation: passar 40s linear infinite; }
@keyframes piscar { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.9; } }
@keyframes passar { 0%, 88% { transform: translate(0, 0); opacity: 0; } 90% { opacity: 0.8; } 100% { transform: translate(-900px, 450px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .p1, .p2, .p3, .cometa { animation: none; } }
</style>
<rect width="1600" height="1000" fill="url(#fundo)"/>
<!-- estrelas em tres grupos que piscam em tempos diferentes -->
<g fill="#ffffff" class="p1"><circle cx="120" cy="80" r="1.6"/><circle cx="520" cy="150" r="1.2"/><circle cx="880" cy="60" r="1.8"/><circle cx="1240" cy="190" r="1.3"/><circle cx="1480" cy="110" r="1.5"/><circle cx="300" cy="320" r="1.1"/><circle cx="1050" cy="300" r="1.2"/></g>
<g fill="#cdd6ff" class="p2"><circle cx="220" cy="200" r="1.3"/><circle cx="680" cy="250" r="1.6"/><circle cx="960" cy="180" r="1.1"/><circle cx="1360" cy="280" r="1.4"/><circle cx="60" cy="380" r="1.2"/><circle cx="1560" cy="360" r="1.1"/></g>
<g fill="#ffe7b0" class="p3"><circle cx="400" cy="40" r="1.4"/><circle cx="760" cy="380" r="1.2"/><circle cx="1150" cy="90" r="1.7"/><circle cx="1420" cy="20" r="1.1"/><circle cx="580" cy="420" r="1"/></g>
<!-- cometa raro -->
<g class="cometa"><line x1="1500" y1="60" x2="1560" y2="30" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.8"/></g>
</svg>`

export const FAISCAS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
<radialGradient id="brasa" cx="0.5" cy="1.1" r="0.9"><stop offset="0" stop-color="#3a2410"/><stop offset="1" stop-color="#120e0a"/></radialGradient>
</defs>
<style>
.s { animation: subir 18s linear infinite; }
.s2 { animation-duration: 24s; animation-delay: -6s; }
.s3 { animation-duration: 30s; animation-delay: -12s; }
.s4 { animation-duration: 21s; animation-delay: -3s; }
@keyframes subir { from { transform: translateY(0); opacity: 0; } 10% { opacity: 0.85; } 80% { opacity: 0.5; } to { transform: translateY(-1100px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .s { animation: none; opacity: 0.5; } }
</style>
<rect width="1600" height="1000" fill="url(#brasa)"/>
<!-- faiscas subindo devagar, longe do meio da tela -->
<g fill="#f0b44a">
<g transform="translate(120 1050)"><path class="s" d="M0 -10 Q 1.4 -1.4 10 0 Q 1.4 1.4 0 10 Q -1.4 1.4 -10 0 Q -1.4 -1.4 0 -10 Z"/></g><g transform="translate(260 1080)"><path class="s s2" d="M0 -10 Q 1.4 -1.4 10 0 Q 1.4 1.4 0 10 Q -1.4 1.4 -10 0 Q -1.4 -1.4 0 -10 Z"/></g>
<g transform="translate(380 1040)"><path class="s s3" d="M0 -10 Q 1.4 -1.4 10 0 Q 1.4 1.4 0 10 Q -1.4 1.4 -10 0 Q -1.4 -1.4 0 -10 Z"/></g><g transform="translate(1240 1060)"><path class="s s4" d="M0 -10 Q 1.4 -1.4 10 0 Q 1.4 1.4 0 10 Q -1.4 1.4 -10 0 Q -1.4 -1.4 0 -10 Z"/></g>
<g transform="translate(1380 1090)"><path class="s s2" d="M0 -10 Q 1.4 -1.4 10 0 Q 1.4 1.4 0 10 Q -1.4 1.4 -10 0 Q -1.4 -1.4 0 -10 Z"/></g><g transform="translate(1500 1050)"><path class="s s3" d="M0 -10 Q 1.4 -1.4 10 0 Q 1.4 1.4 0 10 Q -1.4 1.4 -10 0 Q -1.4 -1.4 0 -10 Z"/></g>
<g transform="translate(60 1100)"><path class="s s4" d="M0 -10 Q 1.4 -1.4 10 0 Q 1.4 1.4 0 10 Q -1.4 1.4 -10 0 Q -1.4 -1.4 0 -10 Z"/></g><g transform="translate(1560 1070)"><path class="s" d="M0 -10 Q 1.4 -1.4 10 0 Q 1.4 1.4 0 10 Q -1.4 1.4 -10 0 Q -1.4 -1.4 0 -10 Z"/></g>
</g>
<g fill="#ffd98a" opacity="0.7">
<g transform="translate(200 1120)"><path class="s s3" d="M0 -10 Q 1.4 -1.4 10 0 Q 1.4 1.4 0 10 Q -1.4 1.4 -10 0 Q -1.4 -1.4 0 -10 Z"/></g><g transform="translate(1450 1130)"><path class="s s2" d="M0 -10 Q 1.4 -1.4 10 0 Q 1.4 1.4 0 10 Q -1.4 1.4 -10 0 Q -1.4 -1.4 0 -10 Z"/></g>
</g>
</svg>`
