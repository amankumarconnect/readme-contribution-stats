# Readme Contribution Stats

![Users](https://readme-contribution-stats.aman-kumar-connect.workers.dev/?type=stats)

This tool generates a dynamic SVG card showing the repositories where you have merged PRs and created issues. example:

![Repo Stats](https://readme-contribution-stats.aman-kumar-connect.workers.dev/?type=repos&username=amankumarconnect&limit=6)

## Usage

Copy-paste the following code into your `README.md`:

```markdown
[![Contribution Stats](https://readme-contribution-stats.aman-kumar-connect.workers.dev/?type=repos&username=YOUR_USERNAME&limit=6)](https://github.com/amankumarconnect/readme-contribution-stats)
```

### Configuration

1.  **Username**: Replace `YOUR_USERNAME` with your GitHub username.

2.  **Sort**: You can add `&sort=contributions` to sort by the number of PRs and issues. The default is `&sort=stars`.

3.  **Exclude**: You can add `&exclude=repo1,repo2,owner/repo3` to hide specific repositories from the card. This accepts a comma-separated list of repository names or full repository paths.

4.  **Issues**: You can add `&issues=true` to track repositories where you have created or contributed to issues. By default, only PRs are shown.

5.  **PRs**: You can add `&prs=true` to explicitly show PRs. This is useful when combined with `&issues=true` to show both contribution types.

Example usage:

```markdown
<!-- Show only PRs (default behavior) -->
[![Contribution Stats](https://readme-contribution-stats.aman-kumar-connect.workers.dev/?type=repos&username=YOUR_USERNAME&limit=6)](https://github.com/amankumarconnect/readme-contribution-stats)

<!-- Show only issues -->
[![Contribution Stats](https://readme-contribution-stats.aman-kumar-connect.workers.dev/?type=repos&username=YOUR_USERNAME&limit=6&issues=true)](https://github.com/amankumarconnect/readme-contribution-stats)

<!-- Show both PRs and issues -->
[![Contribution Stats](https://readme-contribution-stats.aman-kumar-connect.workers.dev/?type=repos&username=YOUR_USERNAME&limit=6&prs=true&issues=true)](https://github.com/amankumarconnect/readme-contribution-stats)

<!-- Show both, sorted by contributions, excluding specific repos -->
[![Contribution Stats](https://readme-contribution-stats.aman-kumar-connect.workers.dev/?type=repos&username=YOUR_USERNAME&limit=6&prs=true&issues=true&sort=contributions&exclude=repo1,repo2)](https://github.com/amankumarconnect/readme-contribution-stats)
```

## ❓ FAQ & Common Mistakes

### 📌 FAQ

**Does this project use the GitHub API?**  
Yes. The stats are generated using publicly available GitHub data via the GitHub API.

**Is authentication required?**  
No authentication is required. However, unauthenticated requests may be subject to GitHub rate limits.

**Does this support private repositories?**  
No. Only public repositories and public contributions are supported.

**How often do the stats update?**  
The stats update based on GitHub’s API cache and may not reflect real-time changes instantly.

**Can this be used for organization accounts?**  
This tool is primarily designed for individual GitHub user profiles.

---

### ⚠️ Common Mistakes

- Using an invalid or misspelled `username`
- Setting very large values for `limit`, which may result in empty or slow responses
- Confusing different `type` values (e.g., `stats` vs `repos`)
- Expecting private repository data to appear
- Assuming stats update immediately after new commits or PRs

More features and cards are coming soon! Please star the repo ⭐

## Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.

