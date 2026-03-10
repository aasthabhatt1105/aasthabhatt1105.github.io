// -------------------------------------------------------------
// 1. Loader & Initialization Sequence
// -------------------------------------------------------------
window.addEventListener('load', () => {
    
    // Simulate loading progress
    let target = 0;
    let current = 0;
    const bar = document.querySelector('.progress');
    const interval = setInterval(() => {
        target += Math.random() * 20;
        if(target > 100) target = 100;
        current += (target - current) * 0.1;
        bar.style.width = `${current}%`;
        
        if(current >= 99) {
            clearInterval(interval);
            finishLoad();
        }
    }, 50);

    function finishLoad() {
        const loader = document.getElementById('loader');
        
        // Hide Loader
        gsap.to(loader, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => {
                loader.style.display = 'none';
                initHeroAnimations();
            }
        });
    }

    const yearElement = document.getElementById("year");
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});

// -------------------------------------------------------------
// 2. Interactive Starfield (HTML5 Canvas)
// -------------------------------------------------------------
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let width, height;
let stars = [];
const numStars = 600;

// Mouse tracking for parallax
let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => {
    // Normalize mouse across center
    targetMouseX = (e.clientX - width / 2) * 0.05;
    targetMouseY = (e.clientY - height / 2) * 0.05;
});

class Star {
    constructor() {
        this.reset();
        this.z = Math.random() * width; // Initial random depth
    }

    reset() {
        this.x = (Math.random() - 0.5) * width * 2;
        this.y = (Math.random() - 0.5) * height * 2;
        this.z = width;
        this.pz = this.z;
        // Random cyan/purple tint for space theme
        this.color = Math.random() > 0.8 ? '#b026ff' : (Math.random() > 0.5 ? '#00f0ff' : '#ffffff');
    }

    update() {
        // Warp speed effect
        this.z -= 2; 
        
        if (this.z < 1) {
            this.reset();
            this.pz = this.z;
        }
    }

    draw() {
        // Apply parallax based on mouse
        this.px = this.x + mouseX * (width / this.z);
        this.py = this.y + mouseY * (width / this.z);

        // Project 3D coordinate to 2D screen
        this.sx = (this.px / this.z) * width + width / 2;
        this.sy = (this.py / this.z) * height + height / 2;
        
        // Don't draw if behind the camera
        if (this.z < 1) return;

        let radius = Math.max(0, 1.5 - (this.z / width));

        ctx.beginPath();
        ctx.arc(this.sx, this.sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        
        // Add glow for larger stars
        if(radius > 1) {
             ctx.shadowBlur = Math.random() * 15;
             ctx.shadowColor = this.color;
        } else {
             ctx.shadowBlur = 0;
        }
        
        ctx.fill();
    }
}

class Satellite {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = Math.random() < 0.5 ? -100 : width + 100;
        this.y = Math.random() * height;
        this.vx = (this.x < 0 ? 1 : -1) * (0.5 + Math.random() * 1);
        this.vy = (Math.random() - 0.5) * 0.5;
        this.color = '#00ff66'; // Green for satellite
        this.blinkTimer = 0;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.blinkTimer += 1;
        
        if (this.x < -200 || this.x > width + 200 || this.y < -200 || this.y > height + 200) {
            this.reset();
        }
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
        
        // Blinking effect
        if (this.blinkTimer % 60 < 30) {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }
}

for (let i = 0; i < numStars; i++) {
    stars.push(new Star());
}

let satellites = [];
for (let i = 0; i < 3; i++) { // Add 3 satellites
    satellites.push(new Satellite());
}

function animateStars() {
    // Smooth mouse interpolation
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    // Dark trailing effect
    ctx.fillStyle = 'rgba(5, 8, 20, 0.4)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw Constellations (lines between close stars in the front)
    ctx.lineWidth = 0.5;
    for (let i = 0; i < stars.length; i++) {
        let s1 = stars[i];
        if (s1.z > width / 3) continue; // Only connect stars closer to camera
        
        for (let j = i + 1; j < stars.length; j++) {
            let s2 = stars[j];
            if (s2.z > width / 3) continue;
            
            let dx = s1.sx - s2.sx;
            let dy = s1.sy - s2.sy;
            let distSq = dx*dx + dy*dy;
            
            if (distSq < 15000) { // Connect if close enough on screen
                let opacity = 1 - (distSq / 15000);
                if (opacity > 0.05) {
                    ctx.strokeStyle = `rgba(0, 240, 255, ${opacity * 0.3})`;
                    ctx.beginPath();
                    ctx.moveTo(s1.sx, s1.sy);
                    ctx.lineTo(s2.sx, s2.sy);
                    ctx.stroke();
                }
            }
        }
    }
    
    // Draw stars
    stars.forEach(star => {
        star.update();
        star.draw();
    });
    
    // Draw satellites
    satellites.forEach(sat => {
        sat.update();
        sat.draw();
    });
    
    requestAnimationFrame(animateStars);
}

animateStars();

// -------------------------------------------------------------
// 3. Interactive ISS Canvas
// -------------------------------------------------------------
function initISSCanvas() {
    const canvas = document.getElementById('iss-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let issImg = new Image();
    let astroImg = new Image();
    issImg.src = 'iss_bg.png';
    astroImg.src = 'ai_astronaut.png';

    // Astronaut State
    let astro = {
        x: 0, y: 0, 
        baseX: 0, baseY: 0,
        targetX: 0, targetY: 0,
        time: 0,
        rotation: 0
    };

    let scrollInfluence = 0;

    function resizeISS() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Start astronaut closer to the center-right
        astro.baseX = canvas.width * 0.65;
        astro.baseY = canvas.height * 0.4;
    }

    window.addEventListener('resize', resizeISS);
    resizeISS();

    // Track scroll for parallax floating
    window.addEventListener('scroll', () => {
        let scrollY = window.scrollY;
        scrollInfluence = scrollY * 0.5; // Astronaut drifts up as we scroll down
    });

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw ISS Background (Cover logic)
        // User requested to remove the background image of the ISS and astronaut
        /*
        if (issImg.complete) {
            let scale = Math.max(canvas.width / issImg.width, canvas.height / issImg.height);
            let w = issImg.width * scale;
            let h = issImg.height * scale;
            // Add subtle parallax to background based on mouse
            let bgOffsetX = -mouseX * 0.1;
            let bgOffsetY = -mouseY * 0.1;
            ctx.drawImage(issImg, (canvas.width - w) / 2 + bgOffsetX, (canvas.height - h) / 2 + bgOffsetY, w, h);
        }
        */

        // 2. Draw Astronaut and Speech Bubble
        if (astroImg.complete) {
            astro.time += 0.01;
            
            // Base floating animation
            let floatY = Math.sin(astro.time) * 30;
            let floatX = Math.cos(astro.time * 0.8) * 20;
            
            // Mouse interaction: Astronaut slightly follows mouse
            astro.targetX = astro.baseX + floatX + (mouseX * 0.3);
            astro.targetY = astro.baseY + floatY + (mouseY * 0.3) - scrollInfluence;
            
            // Smooth trailing
            astro.x += (astro.targetX - astro.x) * 0.05;
            astro.y += (astro.targetY - astro.y) * 0.05;
            
            // Rotation based on movement and time
            astro.rotation = Math.sin(astro.time * 0.5) * 0.1 - (mouseX * 0.0005);

            let aW = Math.min(canvas.width * 0.25, 300); // Scale astronaut by screen size
            let aH = aW * (astroImg.height / astroImg.width);

            ctx.save();
            ctx.translate(astro.x, astro.y);
            ctx.rotate(astro.rotation);
            // Mix-blend-mode screen equivalent in canvas to remove black bg
            ctx.globalCompositeOperation = 'screen'; 
            ctx.drawImage(astroImg, -aW/2, -aH/2, aW, aH);
            ctx.restore();

            // 3. Draw Speech Bubble
            drawSpeechBubble(ctx, astro.x, astro.y, aW, aH);
        }

        requestAnimationFrame(draw);
    }

    function drawSpeechBubble(ctx, ax, ay, aw, ah) {
        // Fade out bubble as user scrolls down
        let bubbleOpacity = 1 - Math.min(scrollInfluence / 300, 1);
        if (bubbleOpacity <= 0) return;

        let bx = ax - aw * 0.8 - 250; // Position to the left of astronaut
        let by = ay - ah * 0.3;
        let boxW = 320;
        let boxH = 140;
        let radius = 10;

        // Position adjustment for smaller screens
        if (bx < 20) {
            bx = ax + aw * 0.5 + 20; // Move to right side
            if (bx + boxW > canvas.width) {
                 bx = 20; // Pin to left edge if too tight
                 by = ay - ah * 0.6 - boxH; // Move above
            }
        }

        ctx.save();
        ctx.globalAlpha = bubbleOpacity;

        // Bubble Background (Glassmorphism)
        ctx.fillStyle = 'rgba(10, 16, 30, 0.7)';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.filter = 'blur(2px)'; // Slight background blur effect inside canvas
        ctx.beginPath();
        ctx.roundRect(bx, by, boxW, boxH, radius);
        ctx.fill();
        ctx.filter = 'none'; // reset filter
        ctx.stroke();

        // Pointer connecting bubble to astronaut
        ctx.beginPath();
        let px = bx + boxW;
        let py = by + boxH / 2;
        let pointedToX = ax - aw * 0.1;

        if (bx > ax) { // If bubble is on the right
            px = bx;
            pointedToX = ax + aw * 0.1;
        } else if (by < ay - ah * 0.5) { // If bubble is above
             px = bx + boxW / 2;
             py = by + boxH;
             pointedToX = ax;
        }

        ctx.moveTo(px, py - 10);
        ctx.lineTo(pointedToX, ay - 10);
        ctx.lineTo(px, py + 10);
        ctx.fillStyle = 'rgba(10, 16, 30, 0.7)';
        ctx.fill();
        ctx.stroke();

        // Text Content
        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 16px "Space Grotesk", sans-serif';
        ctx.fillText("INCOMING TRANSMISSION...", bx + 15, by + 25);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '14px "Inter", sans-serif';
        ctx.fillText("Welcome to my Orbit!", bx + 15, by + 50);
        
        ctx.fillStyle = '#a0aec0';
        ctx.font = '13px "Inter", sans-serif';
        // Simple text wrapping simulation
        ctx.fillText("I'm Aastha Bhatt, a Space Systems", bx + 15, by + 75);
        ctx.fillText("Engineer designing mission-critical", bx + 15, by + 95);
        ctx.fillText("hardware for deep space exploration.", bx + 15, by + 115);

        ctx.restore();
    }
    
    draw();
}

initISSCanvas();

// -------------------------------------------------------------
// 4. GSAP Animations
// -------------------------------------------------------------
gsap.registerPlugin(ScrollTrigger);

function initScrollAnimations() {
  const scrollItems = document.querySelectorAll('.gs-scroll');
  
  scrollItems.forEach((item, index) => {
    gsap.from(item, {
      scrollTrigger: {
        trigger: item,
        start: "top 85%", 
        toggleActions: "play none none reverse"
      },
      y: 50,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      delay: index % 3 * 0.1 // slight stagger for grid items
    });
  });
}

function initHeroAnimations() {
    const tl = gsap.timeline();

    // Fade in Header and ISS Canvas
    tl.to('#iss-canvas', {
        opacity: 0.85,
        duration: 1.5,
        ease: "power2.inOut"
    }, 0);

    tl.from('.hud-header', {
        y: -50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    }, 0.5);

    // Fade in Scroll Prompt
    tl.to('.scroll-prompt', {
        opacity: 1,
        duration: 1,
        ease: "power2.inOut"
    }, 1.5);

    // Scroll sequence for the cinematic profile reveal
    const heroTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".cinematic-hero",
            start: "top top",
            end: "bottom bottom",
            scrub: 1
        }
    });

    // 1. Fade out scroll prompt as soon as we scroll
    heroTl.to('.scroll-prompt', { opacity: 0, duration: 0.1 }, 0);
    
    // 2. Fade in the sticky profile card (around 10% scroll depth)
    heroTl.fromTo('.sticky-profile', 
        { opacity: 0, scale: 0.95, y: 50 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "power2.out" }, 
        0.1
    );

    // 3. Keep profile visible until near the end of the cinematic hero scroll
    heroTl.to('.sticky-profile', { opacity: 0, y: -50, duration: 0.2 }, 0.8);
    
    // 4. Fade out canvas slowly near the end of cinematic hero
    heroTl.to('#iss-canvas', { opacity: 0.2, duration: 1 }, 0);

    initScrollAnimations();
}

// Ensure smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});
