const sizes = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 26, 28, 32, 40];

/** Scoped styles for the FoodDash app. --fs scales all app text for the "Large text" device setting. */
export const appCss = `
.fd{--fs:1;--bg:#f4f4f6;--sf:#ffffff;--sf2:#efeff3;--fg:#15151b;--sub:#5f5f6b;--line:#e2e2e8;--brand:#d33b20;--brandfg:#c4361d;--brandsoft:#fdebe6;--ok:#13794a;--oksoft:#e2f5ea;--warn:#8a5300;--warnsoft:#fff3d6;--danger:#c0262d;--star:#a86500;color:var(--fg);background:var(--bg);color-scheme:light;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter Variable",Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.3}
.fd.dark{--bg:#000000;--sf:#1c1c1e;--sf2:#2c2c2e;--fg:#f2f2f7;--sub:#a3a3ae;--line:#323236;--brand:#d33b20;--brandfg:#ff8466;--brandsoft:#3b1d16;--ok:#4ad08a;--oksoft:#12301f;--warn:#ffc35a;--warnsoft:#3a2a0b;--danger:#ff6b6b;--star:#ffc35a;color-scheme:dark}
.fd.lg{--fs:1.4}
${sizes.map((s) => `.fd .t${s}{font-size:calc(${s}px * var(--fs))}`).join('')}
.fd :is(button,a,input,textarea,select,[tabindex]):focus-visible{outline:2px solid var(--brandfg);outline-offset:2px}
.fd .noscroll{scrollbar-width:none}.fd .noscroll::-webkit-scrollbar{display:none}
.fd input,.fd textarea{font:inherit;color:inherit}
@keyframes fd-spin{to{transform:rotate(360deg)}}.fd .spin{animation:fd-spin .8s linear infinite}
@keyframes fd-drop{from{transform:translateY(-130%)}to{transform:none}}.fd .drop{animation:fd-drop .3s ease-out}
@keyframes fd-up{from{transform:translateY(100%)}to{transform:none}}.fd .up{animation:fd-up .25s ease-out}
@keyframes fd-pulse{50%{opacity:.55}}.fd .pulse{animation:fd-pulse 1.4s ease-in-out infinite}
`;
