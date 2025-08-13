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
    }

    .site-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(240, 147, 251, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 60% 40%, rgba(16, 243, 212, 0.1) 0%, transparent 50%),
        linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #0f3460 100%);
      z-index: -1;
      animation: backgroundShift 20s ease-in-out infinite;
    }

    @keyframes backgroundShift {
      0%, 100% { filter: hue-rotate(0deg) brightness(1); }
      25% { filter: hue-rotate(5deg) brightness(1.1); }
      50% { filter: hue-rotate(-3deg) brightness(0.95); }
      75% { filter: hue-rotate(3deg) brightness(1.05); }
    }

    .container {
      position: relative;
      z-index: 2;
      min-height: 100vh;
    }

    /* Header */
    .header {
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: blur(12px);
      background: rgba(0, 0, 0, 0.3);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #f093fb 50%, #10f3d4 100%);
    }

    .logo-text {
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.025em;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.05);
      font-size: 11px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fbbf24;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .shimmer {
      background: linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.7) 100%);
      background-size: 200% 100%;
      animation: shimmer 2s ease-in-out infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Hero Section */
    .hero {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 16px 24px;
      text-align: center;
    }

    .hero h2 {
      margin-top: 16px;
      font-size: 48px;
      font-weight: 600;
      line-height: 1.1;
      letter-spacing: -0.025em;
    }

    .gradient-text {
      background: linear-gradient(45deg, #818cf8, #f093fb, #10f3d4, #818cf8);
      background-size: 300% 300%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradientShift 4s ease-in-out infinite;
    }

    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .hero p {
      margin-top: 12px;
      color: rgba(255, 255, 255, 0.7);
      max-width: 512px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Main Layout */
    .main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 16px;
      display: grid;
      gap: 32px;
      grid-template-columns: 1fr 1fr;
    }

    @media (max-width: 1024px) {
      .main {
        grid-template-columns: 1fr;
      }
      .hero h2 {
        font-size: 36px;
      }
    }

    /* Card Styling */
    .card {
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: 
        linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%),
        rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px) saturate(1.8);
      padding: 24px;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        0 0 0 1px rgba(255, 255, 255, 0.05);
      height: fit-content;
      position: relative;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent);
      transition: left 0.6s;
      pointer-events: none;
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 12px 48px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        0 0 0 1px rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .card:hover::before {
      left: 100%;
    }

    .card h2 {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 16px;
    }

    /* Form Styling */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
      color: #f9fafb;
    }

    input, select, textarea {
      width: 100%;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: 
        linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%),
        rgba(255, 255, 255, 0.03);
      padding: 12px;
      color: #f9fafb;
      font-size: 14px;
      transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
      backdrop-filter: blur(10px);
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #667eea;
      background: 
        linear-gradient(145deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.05) 100%),
        rgba(255, 255, 255, 0.05);
      box-shadow: 
        0 0 0 3px rgba(102, 126, 234, 0.15),
        0 4px 20px rgba(102, 126, 234, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }

    input:hover, select:hover, textarea:hover {
      border-color: rgba(255, 255, 255, 0.25);
      background: 
        linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 100%),
        rgba(255, 255, 255, 0.05);
    }

    input::placeholder, textarea::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    textarea {
      min-height: 112px;
      resize: vertical;
    }

    /* File Upload */
    .file-upload {
      border: 2px dashed rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    }

    .file-upload:hover {
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.1);
    }

    .file-upload.dragover {
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.2);
    }

    .file-upload input[type="file"] {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    /* Button */
    .btn {
      border-radius: 8px;
      padding: 12px 16px;
      color: white;
      background: linear-gradient(135deg, #667eea 0%, #f093fb 50%, #10f3d4 100%);
      border: none;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      font-size: 14px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
      box-shadow: 
        0 4px 15px rgba(102, 126, 234, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.6s;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 8px 25px rgba(102, 126, 234, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
      filter: brightness(1.1);
    }

    .btn:hover::before {
      left: 100%;
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      flex: 1;
      min-width: 140px;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    /* Credits */
    .credits {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
      margin-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .credits-text {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }

    /* Results Panel */
    .results-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .results-content {
      text-align: center;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      padding: 40px 0;
    }

    .result-image {
      max-width: 100%;
      border-radius: 12px;
      margin-bottom: 16px;
      box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .result-text {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      text-align: left;
      max-height: 300px;
      overflow-y: auto;
      white-space: pre-wrap;
      line-height: 1.6;
      font-size: 14px;
    }

    .result-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .result-actions .btn {
      flex: 1;
      min-width: 140px;
    }

    /* Loading */
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 40px 0;
      position: relative;
    }

    .neural-network {
      position: relative;
      width: 200px;
      height: 120px;
      margin-bottom: 16px;
    }

    .neural-node {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: linear-gradient(45deg, #667eea, #f093fb);
      box-shadow: 0 0 15px rgba(102, 126, 234, 0.5);
      animation: neuralPulse 2s ease-in-out infinite;
    }

    .neural-connection {
      position: absolute;
      height: 2px;
      background: linear-gradient(90deg, transparent, #667eea, transparent);
      opacity: 0.6;
      animation: neuralFlow 1.5s linear infinite;
    }

    @keyframes neuralPulse {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 1; }
    }

    @keyframes neuralFlow {
      0% { background-position: -100% 50%; }
      100% { background-position: 200% 50%; }
    }

    .stage-text {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .hidden { display: none; }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .header-content { padding: 12px; }
      .logo-text { font-size: 20px; }
      .status-badge { font-size: 10px; padding: 3px 8px; }
      .hero { padding: 24px 12px 16px; }
      .hero h2 { font-size: 28px; line-height: 1.2; }
      .hero p { font-size: 14px; }
      .main { padding: 20px 12px; gap: 20px; }
      .card { padding: 16px; }
      .form-grid { grid-template-columns: 1fr; gap: 12px; }
      .form-group { margin-bottom: 12px; }
      input, select, textarea { padding: 14px; font-size: 16px; }
      .file-upload { padding: 16px; }
      .btn { padding: 14px 16px; font-size: 16px; font-weight: 600; }
      .credits { flex-direction: column; gap: 12px; align-items: stretch; }
      .credits-text { text-align: center; }
      .result-actions { flex-direction: column; }
      .result-actions .btn { width: 100%; margin-bottom: 8px; }
      .result-text { max-height: 200px; font-size: 13px; }
      .loading { padding: 30px 0; }
    }

    @media (max-width: 480px) {
      .hero h2 { font-size: 24px; }
      .main { padding: 16px 8px; }
      .card { padding: 12px; margin: 0 4px; }
      .form-grid { gap: 8px; }
      input, select, textarea { padding: 12px; }
      .file-upload { padding: 12px; }
      .result-image { border-radius: 8px; }
    }

    /* Footer */
    .footer {
      padding: 40px 0;
      text-align: center;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
    }
  </style>
</head>
<body>
  <div class="site-bg"></div>
  
  <div class="container">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <div class="logo-icon"></div>
          <h1 class="logo-text">SoulmateSketch</h1>
      </div>
        <div class="status-badge">
          <span class="status-dot"></span>
          <span class="shimmer">AI powered mystical insights</span>
        </div>
      </div>
    </header>

    <section class="hero">
      <h2>Turn memories into <span class="gradient-text">soulmate sketches</span></h2>
      <p>Describe your ideal match and upload your photo. We'll create a personalized AI sketch with mystical insights.</p>
    </section>

    <main class="main">
      <!-- Form Section -->
      <section class="card">
        <h2>Describe your soulmate</h2>
        <form id="soulmateForm">
          <div class="form-grid">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="email" placeholder="you@example.com" required />
      </div>
            <div class="form-group">
              <label>Interested in</label>
              <select id="interest">
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="surprise" selected>Surprise me</option>
              </select>
    </div>
            <div class="form-group">
              <label>Birthday</label>
              <input type="date" id="birthday" />
    </div>
            <div class="form-group">
              <label>Celebrity lookalike</label>
              <input type="text" id="celeb" placeholder="e.g. Ryan Gosling, Emma Stone..." />
      </div>
            <div class="form-group full-width">
              <label>Upload your photo</label>
              <div class="file-upload" id="fileUpload">
                <p>📸 Drag & drop or click to upload</p>
                <p style="font-size: 12px; color: rgba(255,255,255,0.6);">Best results with clear face photos</p>
                <input type="file" id="photo" accept="image/*" />
      </div>
      </div>
            <div class="form-group full-width">
              <label>Ideal vibe & personality</label>
              <textarea id="vibes" placeholder="e.g., adventurous yet grounded, loves art and travel, kind and ambitious..." maxLength="500"></textarea>
      </div>
            <div class="form-group full-width">
              <label>Story / background details</label>
              <textarea id="dealbreakers" placeholder="Share details about your ideal match, their interests, values, or any specific traits that matter to you..."></textarea>
        </div>
      </div>
          <div class="credits">
            <div class="credits-text">All premium features included</div>
            <button type="submit" class="btn">Create Soulmate Sketch</button>
    </div>
        </form>
      </section>

      <!-- Results Section -->
      <section class="card">
        <h2>Your soulmate sketch</h2>
        <div class="results-panel">
          <div id="initialMessage" class="results-content">
            <p>Your personalized soulmate sketch and mystical insights will appear here after generation.</p>
    </div>

          <div id="loading" class="loading hidden">
            <div class="neural-network" id="neuralNetwork"></div>
            <div class="stage-text" id="stageText">Creating your mystical connection...</div>
            <p style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 16px;">Advanced AI processing in progress</p>
      </div>

          <div id="results" class="hidden">
            <img id="resultImage" src="" alt="Your Soulmate Sketch" class="result-image" />
            <div id="resultText" class="result-text"></div>
            <div class="result-actions">
              <a id="pdfLink" href="" class="btn">📋 Download Full Report</a>
              <button class="btn btn-secondary" onclick="restart()">🔄 Create Another</button>
      </div>
    </div>
  </div>
      </section>
    </main>

    <footer class="footer">
      By using this service you agree to our terms. Your data is processed securely and never shared.
    </footer>
  </div>

  <script>
    let orderId = null;

    // Neural network visualization
    function createNeuralNetwork() {
      const container = document.getElementById('neuralNetwork');
      container.innerHTML = '';
      
      const layers = [
        { count: 3, x: 20 },
        { count: 5, x: 100 },
        { count: 4, x: 180 }
      ];
      
      const nodes = [];
      
      layers.forEach((layer, layerIndex) => {
        for (let i = 0; i < layer.count; i++) {
          const node = document.createElement('div');
          node.className = 'neural-node';
          const y = (120 / (layer.count + 1)) * (i + 1) - 6;
          node.style.left = layer.x + 'px';
          node.style.top = y + 'px';
          node.style.animationDelay = (layerIndex * 0.2 + i * 0.1) + 's';
          container.appendChild(node);
          
          nodes.push({ element: node, layer: layerIndex, x: layer.x + 6, y: y + 6 });
        }
      });
      
      for (let i = 0; i < layers.length - 1; i++) {
        const currentLayer = nodes.filter(n => n.layer === i);
        const nextLayer = nodes.filter(n => n.layer === i + 1);
        
        currentLayer.forEach(node1 => {
          nextLayer.forEach(node2 => {
            const connection = document.createElement('div');
            connection.className = 'neural-connection';
            
            const dx = node2.x - node1.x;
            const dy = node2.y - node1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            connection.style.width = length + 'px';
            connection.style.left = node1.x + 'px';
            connection.style.top = node1.y + 'px';
            connection.style.transform = 'rotate(' + angle + 'deg)';
            connection.style.transformOrigin = '0 50%';
            connection.style.animationDelay = Math.random() * 2 + 's';
            
            container.appendChild(connection);
          });
        });
      }
    }

    // File upload handling
    const fileUpload = document.getElementById('fileUpload');
    const photoInput = document.getElementById('photo');

    fileUpload.addEventListener('click', () => photoInput.click());
    fileUpload.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUpload.classList.add('dragover');
    });
    fileUpload.addEventListener('dragleave', () => {
      fileUpload.classList.remove('dragover');
    });
    fileUpload.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUpload.classList.remove('dragover');
      photoInput.files = e.dataTransfer.files;
      updateFileUploadText();
    });
    photoInput.addEventListener('change', updateFileUploadText);

    function updateFileUploadText() {
      if (photoInput.files.length > 0) {
        fileUpload.innerHTML = '<p>✅ ' + photoInput.files[0].name + '</p>';
      }
    }

    // Form submission
    document.getElementById('soulmateForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      if (!email) {
        alert('Please enter your email');
        return;
      }

      const submitBtn = e.target.querySelector('button[type="submit"]');
      const formInputs = e.target.querySelectorAll('input, select, textarea, button');
      formInputs.forEach(input => input.disabled = true);
      submitBtn.textContent = 'Creating...';

      document.getElementById('initialMessage').classList.add('hidden');
      document.getElementById('loading').classList.remove('hidden');
      document.getElementById('results').classList.add('hidden');
      
      createNeuralNetwork();

      try {
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            tier: 'deluxe', 
            addons: ['aura', 'twin_flame', 'past_life'] 
          })
        });
        const orderData = await orderResponse.json();
        orderId = orderData.id;

        const formData = new FormData();
        if (photoInput.files.length > 0) {
          formData.append('photo', photoInput.files[0]);
        }
        formData.append('quiz', JSON.stringify({
          interest: document.getElementById('interest').value,
          birthday: document.getElementById('birthday').value,
          vibes: document.getElementById('vibes').value,
          dealbreakers: document.getElementById('dealbreakers').value,
          celeb: document.getElementById('celeb').value,
          style: 'realistic'
        }));

        await fetch('/api/orders/' + orderId + '/intake', {
          method: 'POST',
          body: formData
        });

        const generateResponse = await fetch('/api/orders/' + orderId + '/generate', {
          method: 'POST'
        });
        const generateData = await generateResponse.json();
        
        setTimeout(() => {
          document.getElementById('loading').classList.add('hidden');
          document.getElementById('results').classList.remove('hidden');
          document.getElementById('resultImage').src = '/' + generateData.imagePath;
          document.getElementById('pdfLink').href = '/' + generateData.pdfPath;
          
          if (generateData.profileText) {
            document.getElementById('resultText').textContent = generateData.profileText;
          }
        }, 1500);
        
      } catch (error) {
        console.error('Error generating soulmate:', error);
        alert('Error generating your soulmate sketch. Please try again.');
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('initialMessage').classList.remove('hidden');
      } finally {
        formInputs.forEach(input => input.disabled = false);
        submitBtn.textContent = 'Create Soulmate Sketch';
      }
    });

    function restart() {
      orderId = null;
      document.getElementById('soulmateForm').reset();
      photoInput.value = '';
      fileUpload.innerHTML = '<p>📸 Drag & drop or click to upload</p><p style="font-size: 12px; color: rgba(255,255,255,0.6);">Best results with clear face photos</p>';
      
      const submitBtn = document.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Create Soulmate Sketch';
      
      document.getElementById('results').classList.add('hidden');
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('initialMessage').classList.remove('hidden');
    }
  </script>
</body>
</html>`;
}console.log('Visual effects loaded - Wed Aug 13 15:53:59 EDT 2025');
// VISUAL EFFECTS REBUILD Wed Aug 13 16:12:22 EDT 2025

