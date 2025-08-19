// Starfield Effect - External JS File
(function() {
  function createStarfield() {
    const starfield = document.createElement('div');
    starfield.id = 'starfield';
    Object.assign(starfield.style, {
      position: 'fixed',
      top: '0', left: '0', width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '0'
    });
    document.body.appendChild(starfield);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes twinkle { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
      @keyframes shootingStar { 0%{opacity:0;transform:translate(0,0)} 10%{opacity:1} 90%{opacity:1} 100%{opacity:0;transform:translate(320px,160px)} }
      .star{position:absolute;background:#fff;border-radius:50%;animation:twinkle 3s ease-in-out infinite}
      .shooting-star{position:absolute;width:6px;height:6px;background:linear-gradient(45deg,#fff,#667eea);border-radius:50%;animation:shootingStar 3s linear infinite}
      .shooting-star::before{content:"";position:absolute;top:50%;left:50%;width:60px;height:2px;background:linear-gradient(90deg,transparent,rgba(102,126,234,.8),transparent);transform:translate(-50%,-50%) rotate(33deg)}
    `;
    document.head.appendChild(style);

    const starCount = window.innerWidth < 768 ? 100 : 160;
    for (let i = 0; i < starCount; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const size = 2 + Math.random() * 4;
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.animationDelay = (Math.random() * 5) + 's';
      s.style.boxShadow = `0 0 ${size * 2}px #fff`;
      starfield.appendChild(s);
    }

    setInterval(() => {
      const st = document.createElement('div');
      st.className = 'shooting-star';
      st.style.left = (Math.random() * 30) + '%';
      st.style.top = (Math.random() * 30) + '%';
      starfield.appendChild(st);
      setTimeout(() => st.remove(), 3000);
    }, 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createStarfield);
  } else {
    createStarfield();
  }
})();

// Starfield Effect - External JS File
(function() {
    function createStarfield() {
        // Create starfield container
        const starfield = document.createElement('div');
        starfield.id = 'starfield';
        starfield.style.position = 'fixed';
        starfield.style.top = '0';
        starfield.style.left = '0';
        starfield.style.width = '100%';
        starfield.style.height = '100%';
        starfield.style.pointerEvents = 'none';
        starfield.style.zIndex = '0';
        document.body.appendChild(starfield);

        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
        @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
        }
        .star {
            position: absolute;
            background: #fff;
            border-radius: 50%;
            animation: twinkle 3s ease-in-out infinite;
        }
        `;
        document.head.appendChild(style);

        // Create 120 stars
        for (let i = 0; i < 120; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.width = (Math.random() * 3 + 1) + 'px';
            star.style.height = star.style.width;
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 5 + 's';
            star.style.boxShadow = '0 0 6px #fff';
            starfield.appendChild(star);
        }
    }

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createStarfield);
    } else {
        createStarfield();
    }
})();
