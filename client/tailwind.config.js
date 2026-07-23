/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // ── COLOR TOKENS ─────────────────────────────────────────
            colors: {
                surface: {
                    DEFAULT: '#0F172A',
                    secondary: '#1E293B',
                    tertiary: '#334155',
                    elevated: '#475569',
                },
                foreground: {
                    DEFAULT: '#F8FAFC',
                    muted: '#94A3B8',
                    subtle: '#64748B',
                },
                border: {
                    DEFAULT: 'rgba(255, 255, 255, 0.08)',
                    strong: 'rgba(255, 255, 255, 0.14)',
                },
                accent: {
                    DEFAULT: '#5B6AFF',
                    hover: '#4655E0',
                    subtle: 'rgba(91, 106, 255, 0.12)',
                },
                medical: {
                    DEFAULT: '#10B981',
                    subtle: 'rgba(16, 185, 129, 0.12)',
                },
                status: {
                    success: '#10B981',
                    warning: '#F59E0B',
                    error: '#EF4444',
                    info: '#3B82F6',
                },
                // Aliases matching status tokens
                success: '#10B981',
                warning: '#F59E0B',
                error: '#EF4444',
                info: '#3B82F6',
            },

            // ── GRADIENT TOKENS ──────────────────────────────────────
            backgroundImage: {
                'hero': 'linear-gradient(135deg, #5B6AFF 0%, #38BDF8 100%)',
                'hero-subtle': 'linear-gradient(135deg, rgba(91,106,255,0.08) 0%, rgba(56,189,248,0.08) 100%)',
                'accent-glow': 'radial-gradient(ellipse at center, rgba(91,106,255,0.15) 0%, transparent 70%)',
                'surface-glass': 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                'surface-elevated': 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
                'card-hover': 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                'medical': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                'warning': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                'error': 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                'scroll-reveal': 'linear-gradient(180deg, transparent 0%, rgba(91,106,255,0.03) 50%, transparent 100%)',
                'border-glow': 'linear-gradient(90deg, transparent, rgba(91,106,255,0.3), transparent)',
            },

            // ── TYPOGRAPHY ───────────────────────────────────────────
            fontFamily: {
                sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
            },
            fontSize: {
                '2xs': ['0.625rem', { lineHeight: '1rem' }],
            },

            // ── BORDER RADIUS ────────────────────────────────────────
            borderRadius: {
                button: '6px',
                card: '12px',
                panel: '16px',
            },

            // ── BOX SHADOW ──────────────────────────────────────────
            boxShadow: {
                'card': '0 4px 20px -4px rgba(0,0,0,0.12), 0 1px 4px -2px rgba(0,0,0,0.08)',
                'card-hover': '0 12px 40px -8px rgba(0,0,0,0.18), 0 4px 16px -4px rgba(0,0,0,0.12)',
                'card-press': '0 2px 8px -2px rgba(0,0,0,0.15)',
                'panel': '0 1px 2px rgba(0,0,0,0.16)',
                'focus': '0 0 0 3px rgba(91,106,255,0.35)',
                'glow-accent': '0 0 30px -10px rgba(91,106,255,0.4)',
                'glow-medical': '0 0 30px -10px rgba(16,185,129,0.35)',
                'inner-glow': 'inset 0 1px 1px rgba(255,255,255,0.08)',
            },

            // ── TRANSITION TIMING ───────────────────────────────────
            transitionTimingFunction: {
                'ease-out-strong': 'cubic-bezier(0.16, 1, 0.3, 1)',
                'ease-in-out-strong': 'cubic-bezier(0.77, 0, 0.175, 1)',
                'drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
            },

            // ── KEYFRAMES ───────────────────────────────────────────
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(12px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.96)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                drawLine: {
                    '0%': { strokeDashoffset: '1000' },
                    '100%': { strokeDashoffset: '0' },
                },
                pulseNode: {
                    '0%, 100%': { r: '8' },
                    '50%': { r: '10' },
                },
            },

            // ── ANIMATIONS ──────────────────────────────────────────
            animation: {
                'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-in-right': 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'draw-line': 'drawLine 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'pulse-node': 'pulseNode 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },

            // ── SPACING SCALE (Extended) ────────────────────────────
            spacing: {
                '18': '4.5rem',  // 72px
                '22': '5.5rem',  // 88px
                '26': '6.5rem',  // 104px
                '30': '7.5rem',  // 120px
            },
        },
    },
    plugins: [],
}