// ====================================================================
// PURE JS ANIMATION ENGINE (GSAP-STYLE)
// AUTHOR: SKILLJAVA
// ====================================================================

// --- 0. CONFIG & ASSETS ---
const CONFIG = {
    logos: [
        'java.svg', 'javascript.svg', 'react.svg', 'html5.svg', 
        'css3.svg', 'docker.svg', 'git.svg', 'node.svg', 
        'python.svg', 'spring.svg', 'postgresql.svg', 'redis.svg'
    ]
};

// Fallback SVG if asset missing
function getPlaceholderSVG(color) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="${color}" stroke-width="8"/></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// --- 1. ANIMATION ENGINE ---
class AnimEngine {
    constructor() {
        this.activeTweens = [];
    }

    static easings = {
        linear: t => t,
        easeOutQuad: t => t * (2 - t),
        easeOutBack: t => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        },
        easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    };

    /**
     * Tween a target's properties
     * @param {HTMLElement|NodeList|string} target 
     * @param {Object} vars - { x, y, opacity, scale, rotate, duration, delay, ease, onComplete }
     */
    to(target, vars) {
        // Resolve target
        let elements = [];
        if (typeof target === 'string') elements = document.querySelectorAll(target);
        else if (target instanceof NodeList || Array.isArray(target)) elements = target;
        else if (target instanceof HTMLElement) elements = [target];
        
        if (elements.length === 0) return;

        elements.forEach((el, index) => {
            if (!el) return;
            
            // Stagger logic
            const delay = (vars.delay || 0) + (vars.stagger ? index * vars.stagger : 0);
            
            this._animateSingle(el, { ...vars, delay });
        });
    }

    _animateSingle(el, vars) {
        const duration = (vars.duration || 1) * 1000;
        const delay = (vars.delay || 0) * 1000;
        const easing = AnimEngine.easings[vars.ease] || AnimEngine.easings.easeOutQuad;
        
        // Initial state
        const computed = window.getComputedStyle(el);
        const startState = {
            opacity: parseFloat(computed.opacity),
            // Simple transform parsing (limited to scale/translate/rotate for demo)
            scale: 1, x: 0, y: 0, rotate: 0
        };

        // Parse transform manually if needed, but for simplicity we assume starting from CSS state or 0
        // Ideally we would parse the matrix()

        const endState = {
            opacity: vars.opacity !== undefined ? vars.opacity : startState.opacity,
            x: vars.x !== undefined ? vars.x : 0,
            y: vars.y !== undefined ? vars.y : 0,
            scale: vars.scale !== undefined ? vars.scale : 1,
            rotate: vars.rotate !== undefined ? vars.rotate : 0
        };

        const startTime = performance.now() + delay;

        const tick = (now) => {
            if (now < startTime) {
                requestAnimationFrame(tick);
                return;
            }

            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeVal = easing(progress);

            // Interpolate
            const current = {
                opacity: startState.opacity + (endState.opacity - startState.opacity) * easeVal,
                x: startState.x + (endState.x - startState.x) * easeVal,
                y: startState.y + (endState.y - startState.y) * easeVal,
                scale: startState.scale + (endState.scale - startState.scale) * easeVal,
                rotate: startState.rotate + (endState.rotate - startState.rotate) * easeVal
            };

            // Apply
            if (vars.opacity !== undefined) el.style.opacity = current.opacity;
            
            // Construct transform string
            let transform = '';
            if (vars.x || vars.y) transform += `translate(${current.x}px, ${current.y}px) `;
            if (vars.scale !== undefined) transform += `scale(${current.scale}) `;
            if (vars.rotate !== undefined) transform += `rotate(${current.rotate}deg) `;
            
            if (transform) el.style.transform = transform;

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                if (vars.onComplete) vars.onComplete(el);
            }
        };

        requestAnimationFrame(tick);
    }

    /**
     * Observe elements entering viewport
     * @param {string} selector 
     * @param {Object} options - { onEnter, onLeave, threshold, once }
     */
    scrollTrigger(selector, options) {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (options.onEnter) options.onEnter(entry.target);
                    if (options.once) observer.unobserve(entry.target);
                } else {
                    if (options.onLeave) options.onLeave(entry.target);
                }
            });
        }, { threshold: options.threshold || 0.2 });

        elements.forEach(el => observer.observe(el));
    }
}

const anim = new AnimEngine();

// --- 2. INITIALIZATION ---

// Populate Marquees & Skills
function initDynamicContent() {
    const topMarquee = document.getElementById('marquee-top');
    const botMarquee = document.getElementById('marquee-bottom');
    const skillsContainer = document.getElementById('skills-container');

    if (!topMarquee || !botMarquee || !skillsContainer) return;

    // Duplicate list for infinite scroll illusion
    const marqueeList = [...CONFIG.logos, ...CONFIG.logos, ...CONFIG.logos];

    // Helper to create image
    const createLogo = (name, className) => {
        const img = document.createElement('img');
        img.src = `assets/lang/${name}`;
        img.onerror = () => { img.src = getPlaceholderSVG('#00ff41'); };
        img.className = className;
        img.alt = 'Tech Logo';
        return img;
    };

    // Fill Marquees
    marqueeList.forEach(logo => {
        topMarquee.appendChild(createLogo(logo, 'marquee-logo'));
        botMarquee.appendChild(createLogo(logo, 'marquee-logo'));
    });

    // Fill Skills Cloud
    CONFIG.logos.forEach(logo => {
        const bubble = document.createElement('div');
        bubble.className = 'skill-bubble';
        bubble.appendChild(createLogo(logo, ''));
        skillsContainer.appendChild(bubble);
    });
}

// Background Particles
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    const resize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0) this.x = width; 
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }
        draw() {
            ctx.fillStyle = '#00ff41';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const init = () => {
        particles = [];
        for (let i = 0; i < 50; i++) particles.push(new Particle());
    };

    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.globalAlpha = 0.3;
        
        // Update & Draw
        particles.forEach((p, i) => {
            p.update();
            p.draw();
            // Connections
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = '#00ff41';
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        });
        
        requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    init();
    animate();
}

// Custom Cursor
function initCursor() {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mx = -100, my = -100;
    let rx = -100, ry = -100;

    window.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px)`;
    });

    const loop = () => {
        rx += (mx - rx) * 0.15;
        ry += (my - ry) * 0.15;
        ring.style.transform = `translate(${rx}px, ${ry}px)`;
        requestAnimationFrame(loop);
    };
    loop();

    // Hover effects
    document.querySelectorAll('a, button, .magnetic').forEach(el => {
        el.addEventListener('mouseenter', () => {
            ring.style.width = '50px';
            ring.style.height = '50px';
            ring.style.backgroundColor = 'rgba(0,255,65,0.1)';
        });
        el.addEventListener('mouseleave', () => {
            ring.style.width = '40px';
            ring.style.height = '40px';
            ring.style.backgroundColor = 'transparent';
        });
    });
}

// Magnetic Buttons
function initMagnetic() {
    const magnets = document.querySelectorAll('.magnetic');
    magnets.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });
}

// Toggle Animation
function initToggle() {
    const btn = document.getElementById('anim-toggle');
    if(!btn) return;
    
    let isPlaying = true;
    btn.onclick = () => {
        isPlaying = !isPlaying;
        btn.classList.toggle('disabled');
        // Hack to pause CSS animations
        document.body.style.setProperty('--play-state', isPlaying ? 'running' : 'paused');
        // Stop JS animations logic if needed, but for now CSS is main heavy lifter
    };
}

// --- 3. MAIN SEQUENCE ---

window.addEventListener('load', () => {
    
    // 1. Loader Sequence
    const loader = document.getElementById('loader');
    const bar = document.querySelector('.loader-fill');
    
    if (loader && bar) {
        anim.to(bar, { width: '100%', duration: 1, ease: 'linear', onComplete: () => {
            anim.to(loader, { opacity: 0, duration: 0.5, onComplete: () => {
                loader.style.display = 'none';
                document.body.classList.remove('loading-state');
                runEntranceAnimations();
            }});
        }});
    }

    // 2. Init Systems
    initDynamicContent();
    initParticles();
    initCursor();
    initMagnetic();
    initToggle();

    // 3. Setup Scroll Triggers
    anim.scrollTrigger('[data-anim="fade-up"]', {
        onEnter: (el) => {
            el.style.opacity = 0;
            el.style.transform = 'translateY(30px)';
            anim.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'easeOutBack' });
        },
        once: true
    });

    anim.scrollTrigger('[data-anim="slide-right"]', {
        onEnter: (el) => {
            el.style.opacity = 0;
            el.style.transform = 'translateX(50px)';
            anim.to(el, { opacity: 1, x: 0, duration: 0.8, ease: 'easeOutExpo' });
        },
        once: true
    });

    anim.scrollTrigger('[data-anim="scale-in"]', {
        onEnter: (el) => {
            el.style.opacity = 0;
            el.style.transform = 'scale(0.8)';
            anim.to(el, { opacity: 1, scale: 1, duration: 0.8, ease: 'easeOutBack' });
        },
        once: true
    });

    // Counters
    anim.scrollTrigger('.counter', {
        onEnter: (el) => {
            const target = +el.getAttribute('data-target');
            let current = 0;
            const step = target / 30;
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.innerText = Math.floor(current) + '+';
            }, 30);
        },
        once: true
    });

});

function runEntranceAnimations() {
    // Hero Text
    const heroText = document.querySelector('.hero-content');
    if (heroText) {
        heroText.style.opacity = 0;
        heroText.style.transform = 'translateY(50px)';
        anim.to(heroText, { opacity: 1, y: 0, duration: 1, delay: 0.2, ease: 'easeOutExpo' });
    }

    // Hero Visual
    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual) {
        heroVisual.style.opacity = 0;
        heroVisual.style.transform = 'scale(0.9) translateX(50px)';
        anim.to(heroVisual, { opacity: 1, scale: 1, x: 0, duration: 1, delay: 0.4, ease: 'easeOutExpo' });
    }
}
