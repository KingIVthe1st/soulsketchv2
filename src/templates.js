export const SiteTheme = {
  primary: '#E91E63',
  accent: '#673AB7',
  soft: '#FCE4EC',
  text: '#2D2240',
};

export function demoHtml({ baseUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
  <title>SoulmateSketch</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%23667eea'/><stop offset='50%' style='stop-color:%23f093fb'/><stop offset='100%' style='stop-color:%2310f3d4'/></linearGradient></defs><circle cx='50' cy='50' r='45' fill='url(%23g)'/><path d='M35 40 Q50 25 65 40 Q50 55 35 40' fill='white' opacity='0.9'/></svg>" type="image/svg+xml">
  <script src="/starfield.js" defer></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      background: #111827;
      color: #f9fafb;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
      min-height: 100vh;
      position: relative;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      -webkit-text-size-adjust: 100%;
      -webkit-overflow-scrolling: touch;
      overflow-x: hidden;
    }

    /* Animated Starfield */
    #starfield {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }

    .star {
      position: absolute;
      background: #fff;
      border-radius: 50%;
      opacity: 0.8;
      animation: twinkle 3s ease-in-out infinite;
    }

    .star.small {
      width: 1px;
      height: 1px;
      box-shadow: 0 0 6px #fff;
    }

    .star.medium {
      width: 2px;
      height: 2px;
      box-shadow: 0 0 8px #fff;
      animation-duration: 4s;
    }

    .star.large {
      width: 3px;
      height: 3px;
      box-shadow: 0 0 12px #fff;
      animation-duration: 5s;
    }

    @keyframes twinkle {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }

    /* Shooting Stars */
    .shooting-star {
      position: absolute;
      width: 4px;
      height: 4px;
      background: linear-gradient(45deg, #fff, #667eea);
      border-radius: 50%;
      box-shadow: 0 0 10px #667eea;
      opacity: 0;
      animation: shootingStar 3s linear infinite;
    }

    @keyframes shootingStar {
      0% {
        opacity: 0;
        transform: translateX(0) translateY(0) scale(0);
      }
      10% {
        opacity: 1;
        transform: translateX(0) translateY(0) scale(1);
      }
      90% {
        opacity: 1;
        transform: translateX(300px) translateY(150px) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateX(300px) translateY(150px) scale(0);
      }
    }

    .shooting-star::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.8), transparent);
      transform: translate(-50%, -50%) rotate(33deg);
    }

    /* Site Background */
    .site-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(ellipse at center, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
      pointer-events: none;
      z-index: 1;
    }

    /* Main Container */
    .main-container {
      position: relative;
      z-index: 2;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .header {
      background: rgba(17, 24, 39, 0.8);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1rem 0;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea, #f093fb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .nav-links {
      display: flex;
      gap: 2rem;
      list-style: none;
    }

    .nav-links a {
      color: #f9fafb;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s ease;
    }

    .nav-links a:hover {
      color: #667eea;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      min-height: calc(100vh - 80px);
    }

    @media (max-width: 768px) {
      .main-content {
        grid-template-columns: 1fr;
        gap: 1rem;
        padding: 1rem;
      }
    }

    /* Form Section */
    .form-section {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .form-section h2 {
      font-size: 1.875rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      background: linear-gradient(135deg, #667eea, #f093fb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #e5e7eb;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      color: #f9fafb;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      background: rgba(255, 255, 255, 0.15);
    }

    .form-control::placeholder {
      color: #9ca3af;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea, #f093fb);
      border: none;
      color: white;
      padding: 0.875rem 2rem;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 100%;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .btn-primary:active {
      transform: translateY(0);
    }

    /* Results Section */
    .results-section {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: none;
    }

    .results-section.show {
      display: block;
      animation: fadeInUp 0.6s ease-out;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .results-section h2 {
      font-size: 1.875rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      background: linear-gradient(135deg, #667eea, #f093fb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .result-image {
      width: 100%;
      max-width: 400px;
      height: auto;
      border-radius: 15px;
      margin-bottom: 1.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .result-text {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .download-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      color: white;
      padding: 0.875rem 2rem;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
      text-align: center;
    }

    .download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    /* Loading States */
    .loading {
      display: none;
      text-align: center;
      padding: 2rem;
    }

    .loading.show {
      display: block;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-left-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .header-content {
        padding: 0 1rem;
        flex-direction: column;
        gap: 1rem;
      }

      .nav-links {
        gap: 1rem;
      }

      .form-section,
      .results-section {
        padding: 1.5rem;
      }

      .form-section h2,
      .results-section h2 {
        font-size: 1.5rem;
      }
    }

    /* Preloader */
    .preloader {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #111827;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      transition: opacity 0.5s ease;
    }

    .preloader.hidden {
      opacity: 0;
      pointer-events: none;
    }

    .preloader-content {
      text-align: center;
      color: #f9fafb;
    }

    .preloader-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-left-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    .preloader-text {
      font-size: 1.125rem;
      font-weight: 500;
      background: linear-gradient(135deg, #667eea, #f093fb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  </style>
</head>
<body>
  <!-- Preloader -->
  <div class="preloader" id="preloader">
    <div class="preloader-content">
      <div class="preloader-spinner"></div>
      <div class="preloader-text">Loading SoulmateSketch...</div>
    </div>
  </div>

  <!-- Starfield Background -->
  <div id="starfield"></div>
  <div class="site-bg"></div>

  <!-- Main Container -->
  <div class="main-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="logo">SoulmateSketch</div>
        <nav>
          <ul class="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Form Section -->
      <section class="form-section">
        <h2>Create Your Soulmate Sketch</h2>
        <form id="soulmateForm">
          <div class="form-group">
            <label for="name">Your Name</label>
            <input type="text" id="name" name="name" class="form-control" placeholder="Enter your name" required>
          </div>
          
          <div class="form-group">
            <label for="age">Your Age</label>
            <input type="number" id="age" name="age" class="form-control" placeholder="Enter your age" min="18" max="100" required>
          </div>
          
          <div class="form-group">
            <label for="interest">Interested in</label>
            <select id="interest" name="interest" class="form-control" required>
              <option value="">Select preference</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="surprise">Surprise me</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="style">Art Style</label>
            <select id="style" name="style" class="form-control" required>
              <option value="">Select style</option>
              <option value="realistic">Realistic</option>
              <option value="ethereal">Ethereal</option>
              <option value="anime">Anime</option>
              <option value="pencil">Pencil Sketch</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="vibes">Vibe/Personality</label>
            <textarea id="vibes" name="vibes" class="form-control" placeholder="Describe the vibe/personality you're looking for..." rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label for="celeb">Celebrity Inspiration</label>
            <input type="text" id="celeb" name="celeb" class="form-control" placeholder="Any celebrity whose style you admire?">
          </div>
          
          <button type="submit" class="btn-primary">
            <span class="btn-text">Generate Soulmate Sketch</span>
            <span class="btn-loading" style="display: none;">Generating...</span>
          </button>
        </form>
      </section>

      <!-- Results Section -->
      <section class="results-section" id="resultsSection">
        <h2>Your Soulmate Sketch</h2>
        <div class="loading" id="loading">
          <div class="spinner"></div>
          <p>Creating your soulmate sketch...</p>
        </div>
        <div class="results-content" id="resultsContent" style="display: none;">
          <img class="result-image" id="resultImage" alt="Soulmate Sketch">
          <div class="result-text" id="resultText"></div>
          <a href="#" class="download-btn" id="downloadBtn" download="soulmate-sketch.pdf">
            <i class="fas fa-download"></i> Download PDF Report
          </a>
        </div>
      </section>
    </main>
  </div>

  <script>
    // Hide preloader after page load
    window.addEventListener('load', function() {
      setTimeout(() => {
        document.getElementById('preloader').classList.add('hidden');
      }, 1000);
    });

    // Form submission
    document.getElementById('soulmateForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      
      // Show loading state
      document.getElementById('resultsSection').classList.add('show');
      document.getElementById('loading').classList.add('show');
      document.getElementById('resultsContent').style.display = 'none';
      
      // Disable form
      const submitBtn = this.querySelector('button[type="submit"]');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');
      
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
      submitBtn.disabled = true;
      
      try {
        // Create order
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tier: 'premium',
            addons: ['aura', 'twin_flame', 'past_life']
          })
        });
        
        if (!orderResponse.ok) {
          throw new Error('Failed to create order');
        }
        
        const orderData = await orderResponse.json();
        const orderId = orderData.id;
        
        // Submit quiz data
        const quizResponse = await fetch('/api/orders/' + orderId + '/intake', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        if (!quizResponse.ok) {
          throw new Error('Failed to submit quiz data');
        }
        
        // Generate results
        const generateResponse = await fetch('/api/orders/' + orderId + '/generate', {
          method: 'POST'
        });
        
        if (!generateResponse.ok) {
          throw new Error('Failed to generate results');
        }
        
        const results = await generateResponse.json();
        
        // Display results
        document.getElementById('resultImage').src = results.imagePath;
        document.getElementById('resultText').textContent = results.profileText;
        document.getElementById('downloadBtn').href = results.pdfPath;
        
        // Show results
        document.getElementById('loading').classList.remove('show');
        document.getElementById('resultsContent').style.display = 'block';
        
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
      } finally {
        // Re-enable form
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
      }
    });

    // ENHANCED VISUAL EFFECTS - DRAMATIC STARFIELD + SHOOTING STARS
    window.addEventListener('load', function() {
      let starfield = document.getElementById('starfield');
      if (!starfield) {
        starfield = document.createElement('div');
        starfield.id = 'starfield';
        Object.assign(starfield.style, {
          position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: '0'
        });
        document.body.appendChild(starfield);
      }
      
      const style = document.createElement('style');
      style.textContent = 
        '@keyframes twinkle { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }' +
        '@keyframes shootingStar { 0% { opacity: 0; transform: translateX(0) translateY(0); } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; transform: translateX(300px) translateY(150px); } }' +
        '.star { position: absolute; background: #fff; border-radius: 50%; animation: twinkle 3s ease-in-out infinite; }' +
        '.shooting-star { position: absolute; width: 6px; height: 6px; background: linear-gradient(45deg, #fff, #667eea); border-radius: 50%; animation: shootingStar 3s linear infinite; }' +
        '.shooting-star::before { content: ""; position: absolute; top: 50%; left: 50%; width: 60px; height: 2px; background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.8), transparent); transform: translate(-50%, -50%) rotate(33deg); }';
      
      document.head.appendChild(style);
      
      // Create stars
      for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 4 + 2;
        Object.assign(star.style, {
          width: size + 'px', height: size + 'px', left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%', animationDelay: Math.random() * 5 + 's',
          boxShadow: '0 0 ' + (size * 2) + 'px #fff'
        });
        starfield.appendChild(star);
      }
      
      // Create shooting stars
      setInterval(() => {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        Object.assign(shootingStar.style, {
          left: Math.random() * 30 + '%', top: Math.random() * 30 + '%',
          boxShadow: '0 0 10px #667eea'
        });
        starfield.appendChild(shootingStar);
        setTimeout(() => {
          if (shootingStar.parentNode) {
            shootingStar.parentNode.removeChild(shootingStar);
          }
        }, 3000);
      }, 4000);
      
      console.log('✨ Enhanced starfield with', starfield.children.length, 'stars loaded!');
    });
  </script>
</body>
</html>`;
}