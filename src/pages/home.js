export async function renderHomePage(env) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Readme Contribution Stats</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2338a169'%3E%3Cpath d='M12 2.5a9.5 9.5 0 100 19 9.5 9.5 0 000-19zM1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12z'/%3E%3Cpath d='M12 14.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm0 1.5a4 4 0 110-8 4 4 0 010 8z'/%3E%3Cpath d='M12 5a7 7 0 00-7 7h1.5a5.5 5.5 0 1111 0H19a7 7 0 00-7-7z'/%3E%3C/svg%3E">
    <style>
        :root {
            --gray-0: #f6f8fa;
            --gray-1: #eaeef2;
            --gray-2: #d0d7de;
            --gray-3: #afb8c1;
            --gray-4: #8c959f;
            --gray-5: #6e7781;
            --gray-6: #57606a;
            --gray-7: #424a53;
            --gray-8: #32383f;
            --gray-9: #24292f;
            --black-0: #1f2328;
            --white-0: #ffffff;
            --green-4: #2da44e;
            --green-5: #1a7f37;
            --green-6: #116329;
            --blue-5: #0969da;

            --bg-body: #0d1117;
            --bg-container: #161b22;
            --text-primary: var(--gray-0);
            --text-secondary: var(--gray-4);
            --border-color: #30363d;
            --input-bg: #0d1117;
            --input-border: #30363d;
            --btn-primary-bg: #238636;
            --btn-primary-hover: #2ea043;
            --code-bg: #161b22;
            --btn-secondary-bg: #21262d;
            --btn-secondary-border: #30363d;
            --btn-secondary-hover: #30363d;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            background-color: var(--bg-body);
            color: var(--text-primary);
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .container {
            background: var(--bg-container);
            padding: 40px;
            border-radius: 6px;
            border: 1px solid var(--border-color);
            box-shadow: 0 1px 3px rgba(0,0,0,0.12);
            max-width: 600px;
            width: 100%;
            text-align: center;
        }
        h1 {
            color: var(--text-primary);
            margin-bottom: 20px;
        }
        .input-group {
            margin-bottom: 15px;
            text-align: left;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: var(--text-primary);
        }
        input {
            width: 100%;
            padding: 8px 12px;
            background-color: var(--input-bg);
            border: 1px solid var(--input-border);
            color: var(--text-primary);
            border-radius: 6px;
            font-size: 16px;
            box-sizing: border-box;
        }
        input:focus {
            border-color: var(--blue-5);
            outline: none;
            box-shadow: 0 0 0 3px rgba(56, 139, 253, 0.3);
        }
        button {
            background-color: var(--btn-primary-bg);
            color: white;
            border: 1px solid rgba(240, 246, 252, 0.1);
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
        }
        button:hover {
            background-color: var(--btn-primary-hover);
        }
        .preview {
            margin-top: 30px;
            display: none;
        }
        .preview h3 {
            color: var(--text-primary);
        }
        .preview img {
            max-width: 100%;
            border: 1px solid var(--border-color);
            border-radius: 6px;
        }
        .code-block {
            background: var(--code-bg);
            padding: 15px;
            padding-right: 70px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            text-align: left;
            margin-top: 20px;
            position: relative;
            overflow-x: auto;
            display: none;
        }
        .code-block pre {
            margin: 0;
            font-family: monospace;
            font-size: 14px;
            color: var(--text-primary);
            white-space: pre-wrap;
            word-break: break-all;
        }
        .copy-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: var(--btn-secondary-bg);
            border: 1px solid var(--btn-secondary-border);
            border-radius: 6px;
            padding: 5px 10px;
            font-size: 12px;
            cursor: pointer;
            color: var(--text-primary);
            width: auto;
        }
        .copy-btn:hover {
            background-color: var(--btn-secondary-hover);
        }
        .footer {
            margin-top: 40px;
            color: var(--text-secondary);
            font-size: 14px;
            text-align: center;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .stars-badge {
            display: inline-flex;
            align-items: center;
            background: var(--btn-secondary-bg);
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 14px;
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            text-decoration: none;
        }
        .stars-badge svg {
            margin-right: 5px;
            fill: var(--text-secondary);
        }
        a {
            color: #58a6ff;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Readme Contribution Stats</h1>
            <a href="https://github.com/amankumarconnect/readme-contribution-stats" target="_blank" class="stars-badge">
                <svg height="16" viewBox="0 0 16 16" width="16"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
                <span id="repo-stars">...</span>&nbsp;Stars
            </a>
        </div>
        <form id="statsForm">
            <div class="input-group">
                <label for="username">GitHub Username</label>
                <input type="text" id="username" placeholder="e.g. amankumarconnect" required>
            </div>
            <div class="input-group">
                <label for="repo">Specific Repo (Optional)</label>
                <input type="text" id="repo" placeholder="e.g. owner/repo-name">
            </div>
            <div class="input-group">
                <label for="limit">Limit (Max Repos)</label>
                <input type="number" id="limit" value="6" min="1" max="20">
            </div>
            <button type="submit">Generate Card</button>
        </form>

        <div class="preview" id="preview">
            <h3>Preview</h3>
            <img id="previewImage" src="" alt="Contribution Stats">
        </div>

        <div class="code-block" id="codeBlock">
            <button class="copy-btn" id="copyBtn">Copy</button>
            <pre id="markdownCode"></pre>
        </div>

        <p id="starPrompt" style="display: none; margin-top: 20px; font-size: 14px;">
            <a href="https://github.com/amankumarconnect/readme-contribution-stats" target="_blank">If you find this tool useful, please consider starring the repository ⭐</a>
        </p>
    </div>

    <div class="footer">
        <p>Made with ❤️ by <a href="https://github.com/amankumarconnect" target="_blank">aman</a></p>
    </div>

    <script>
        const form = document.getElementById('statsForm');
        const preview = document.getElementById('preview');
        const previewImage = document.getElementById('previewImage');
        const codeBlock = document.getElementById('codeBlock');
        const markdownCode = document.getElementById('markdownCode');
        const copyBtn = document.getElementById('copyBtn');
        const starPrompt = document.getElementById('starPrompt');

        fetch('https://api.github.com/repos/amankumarconnect/readme-contribution-stats')
            .then(res => res.json())
            .then(data => {
                document.getElementById('repo-stars').textContent = data.stargazers_count || 'Unknown';
            })
            .catch(() => {
                document.getElementById('repo-stars').textContent = 'Unknown';
            });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const repo = document.getElementById('repo').value.trim();
            const limit = document.getElementById('limit').value;
            
            if (!username) return;

            const baseUrl = window.location.origin;
            const params = new URLSearchParams();
            params.append('username', username);

            if (repo) {
                params.append('type', 'repo');
                params.append('repo', repo);
            } else {
                params.append('type', 'repos');
                params.append('limit', limit);
            }

            const imageUrl = \`\${baseUrl}/?\${params.toString()}\`;
            const markdown = \`[![Contribution Stats](\${imageUrl})](https://github.com/amankumarconnect/readme-contribution-stats)\`;

            previewImage.src = imageUrl;
            markdownCode.textContent = markdown;
            
            preview.style.display = 'block';
            codeBlock.style.display = 'block';
            starPrompt.style.display = 'block';
        });

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(markdownCode.textContent).then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => copyBtn.textContent = originalText, 2000);
            });
        });
    </script>
</body>
</html>
    `;

    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}