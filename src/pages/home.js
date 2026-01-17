export async function renderHomePage(env) {
	const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Readme Contribution Stats</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000000'%3E%3Cpath d='M12 2.5a9.5 9.5 0 100 19 9.5 9.5 0 000-19zM1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12z'/%3E%3Cpath d='M12 14.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm0 1.5a4 4 0 110-8 4 4 0 010 8z'/%3E%3Cpath d='M12 5a7 7 0 00-7 7h1.5a5.5 5.5 0 1111 0H19a7 7 0 00-7-7z'/%3E%3C/svg%3E">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            /* Brutalist Theme Palette */
            --bg-sidebar: #0a0a0a;
            --bg-main: #f0f0f0;
            --text-sidebar: #e5e5e5;
            --text-main: #171717;
            --accent: #2563eb;
            --border-sidebar: #333;
            --border-main: #000;
            --input-bg: #171717;
            --input-focus: #fff;
            --input-text-focus: #000;
            --sidebar-width: 260px;
        }

        * {
            box-sizing: border-box;
            border-radius: 0 !important;
        }

        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            background: var(--bg-sidebar);
            display: flex;
        }

        .sidebar {
            width: var(--sidebar-width);
            height: 100%;
            background: var(--bg-sidebar);
            border-right: 1px solid var(--border-sidebar);
            display: flex;
            flex-direction: column;
            padding: 20px;
            overflow-y: auto;
            flex-shrink: 0;
        }

        .main-content {
            flex-grow: 1;
            background: var(--bg-main);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            background-image: linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px);
            background-size: 20px 20px;
            background-position: 10px 10px;
            overflow: hidden;
        }

        .brand {
            margin-bottom: 30px;
        }

        .brand h1 {
            color: #fff;
            font-size: 1rem;
            font-weight: 800;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            line-height: 1.2;
        }

        .brand h1 span {
            color: var(--accent);
        }

        .form-group {
            margin-bottom: 16px;
        }

        label {
            display: block;
            color: #888;
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 5px;
            font-weight: 600;
        }

        input, select {
            width: 100%;
            background: var(--bg-sidebar);
            border: 1px solid #444;
            color: #fff;
            padding: 8px 10px;
            font-size: 0.8rem;
            font-family: 'JetBrains Mono', monospace;
            transition: all 0.2s ease;
        }

        input:focus, select:focus {
            background: #fff;
            color: #000;
            border-color: #fff;
            outline: none;
        }

        .generate-btn {
            background: var(--accent);
            color: #fff;
            border: none;
            width: 100%;
            padding: 12px;
            text-transform: uppercase;
            font-weight: 700;
            font-size: 0.75rem;
            cursor: pointer;
            border: 1px solid var(--accent);
            margin-top: 10px;
            transition: all 0.2s;
        }

        .generate-btn:hover {
            background: transparent;
            color: var(--accent);
        }

        .footer {
            margin-top: auto;
            border-top: 1px solid #333;
            padding-top: 12px;
            color: #666;
            font-size: 0.6rem;
            font-family: 'JetBrains Mono', monospace;
        }

        .footer a {
            color: #888;
            text-decoration: none;
            border-bottom: 1px solid #888;
        }

        .preview-box {
            border: 2px solid #000;
            background: #0d1117;
            padding: 10px;
            box-shadow: 6px 6px 0px #000;
            max-width: 85%;
            transition: transform 0.2s;
            display: none;
        }
        
        .preview-box.visible {
            display: block;
            animation: slideUp 0.4s ease-out;
        }

        .preview-box img {
            display: block;
            max-width: 100%;
            height: auto;
            border: none;
        }

        .code-bar {
            margin-top: 0;
            background: #000;
            color: #fff;
            padding: 0;
            display: flex;
            align-items: center;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.7rem;
            border-top: 2px solid #000;
        }

        .code-content {
            padding: 8px 10px;
            flex-grow: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .copy-btn {
            background: var(--accent);
            color: #fff;
            border: none;
            padding: 8px 16px;
            text-transform: uppercase;
            font-weight: 700;
            cursor: pointer;
            border-left: 2px solid #000;
            margin-left: 2px;
            transition: background 0.2s;
            font-size: 0.7rem;
        }

        .copy-btn:hover {
            background: #1d4ed8;
        }
        
        .empty-state h2 {
            font-size: 0.9rem;
            font-weight: 500;
            color: #000;
            margin-bottom: 6px;
            text-align: center;
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 800px) {
            body {
                flex-direction: column;
                overflow-y: auto;
            }
            .sidebar {
                width: 100%;
                height: auto;
            }
        }
    </style>
</head>
<body>

    <aside class="sidebar">
        <div class="brand">
            <h1>Readme<br><span>Contribution</span><br>Stats.</h1>
        </div>

        <div class="form-group">
            <label>Username</label>
            <input type="text" id="username" placeholder="e.g. amankumarconnect" spellcheck="false">
        </div>

        <div class="form-group">
            <label>Specific Repo (Optional)</label>
            <input type="text" id="repo" placeholder="e.g. owner/repo-name or https://github.com/owner/repo" spellcheck="false">
        </div>

        <div class="form-group" id="limit-group">
            <label>Repo Limit</label>
            <select id="limit">
                <option value="4">4 Repositories</option>
                <option value="6" selected>6 Repositories</option>
                <option value="8">8 Repositories</option>
                <option value="10">10 Repositories</option>
            </select>
        </div>

        <div class="form-group" id="sort-group">
            <label>Sort Metric</label>
            <select id="sort">
                <option value="stars">Most Stars</option>
                <option value="contributions">Most Contributions</option>
            </select>
        </div>

        <div class="form-group" id="exclude-group">
            <label>Exclusions</label>
            <input type="text" id="exclude" placeholder="repo1, owner/repo2">
        </div>

        <button id="generate-btn" class="generate-btn">GENERATE</button>

        <div class="footer">
            <p>2026 / <a href="https://github.com/amankumarconnect" target="_blank">Aman Kumar</a></p>
        </div>
    </aside>

    <main class="main-content">
        <div class="empty-state" id="empty-state">
            <h2>WAITING FOR INPUT</h2>
            <p>// Enter details and click Generate</p>
        </div>

        <div class="preview-box" id="preview-box">
            <img id="preview-image" src="" alt="Stats Card">
            <div class="code-bar">
                <div class="code-content" id="markdown-code"></div>
                <button class="copy-btn" id="copy-btn">COPY</button>
            </div>
        </div>
    </main>

    <script>
        const inputs = ['username', 'repo', 'limit', 'sort', 'exclude'];
        const elements = {};
        inputs.forEach(id => elements[id] = document.getElementById(id));
        
        const previewBox = document.getElementById('preview-box');
        const emptyState = document.getElementById('empty-state');
        const previewImage = document.getElementById('preview-image');
        const markdownCode = document.getElementById('markdown-code');
        const copyBtn = document.getElementById('copy-btn');
        const generateBtn = document.getElementById('generate-btn');

        // Toggle UI visibility based on whether a specific repo is being generated
        elements.repo.addEventListener('input', () => {
            const isSingleRepo = elements.repo.value.trim() !== '';
            ['limit-group', 'sort-group', 'exclude-group'].forEach(id => {
                document.getElementById(id).style.opacity = isSingleRepo ? '0.4' : '1';
                document.getElementById(id).style.pointerEvents = isSingleRepo ? 'none' : 'auto';
            });
        });

        function generateUrl() {
            const username = elements.username.value.trim();
            const repo = elements.repo.value.trim();
            if (!username) return null;

            const baseUrl = window.location.origin;
            const params = new URLSearchParams();
            params.append('username', username);

            if (repo) {
                params.append('type', 'repo');
                params.append('repo', repo);
            } else {
                params.append('type', 'repos');
                params.append('limit', elements.limit.value);
                
                if (elements.sort.value !== 'stars') {
                    params.append('sort', elements.sort.value);
                }
                
                const exclude = elements.exclude.value.trim();
                if (exclude) {
                    params.append('exclude', exclude);
                }
            }

            return \`\${baseUrl}/?\${params.toString()}&transparent=true&t=\${Date.now()}\`;
        }

        function updatePreview() {
            const url = generateUrl();
            if (!url) return;
            
            emptyState.style.display = 'none';
            previewBox.classList.remove('visible');
            setTimeout(() => {
                previewBox.style.display = 'block';
                const markdown = \`[![Contribution Stats](\${url})](https://github.com/amankumarconnect/readme-contribution-stats)\`;
                previewImage.src = url;
                markdownCode.textContent = markdown;
                previewBox.classList.add('visible');
            }, 10);
        }

        generateBtn.addEventListener('click', updatePreview);

        inputs.forEach(id => {
            elements[id].addEventListener('keypress', (e) => {
                if (e.key === 'Enter') updatePreview();
            });
        });

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(markdownCode.textContent).then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'COPIED';
                copyBtn.style.background = '#10b981';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.background = '';
                }, 2000);
            });
        });
    </script>
</body>
</html>
    `;

    return new Response(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
        },
    });
}