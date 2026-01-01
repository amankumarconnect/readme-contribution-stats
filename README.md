# Readme Contribution Stats

![Users](https://readme-contribution-stats.aman-kumar-connect.workers.dev/?type=stats)

This tool generates a dynamic SVG card showing the repositories where you have merged PRs. example:

![Repo Stats](https://readme-contribution-stats.aman-kumar-connect.workers.dev/?type=repos&username=amankumarconnect&limit=6)

## Usage

Copy and paste the following code into your `README.md`:

```markdown
[![Contribution Stats](https://readme-contribution-stats.aman-kumar-connect.workers.dev/type=repos&username=YOUR_USERNAME&limit=6)](https://github.com/amankumarconnect/readme-contribution-stats)
```

### Configuration

1.  **Username**: Replace `YOUR_USERNAME` with your GitHub username.

2.  **Sort**: You can add `&sort=contributions` to sort by the number of PRs. The default is `&sort=stars`.

3.  **Exclude**: You can add `&exclude=repo1,repo2,owner/repo3` to hide specific repositories from the card. This accepts a comma-separated list of repository names or full repository paths.

Example usage:

```markdown
[![Contribution Stats](https://readme-contribution-stats.aman-kumar-connect.workers.dev/?type=repos&username=YOUR_USERNAME&limit=6&sort=contributions&exclude=repo1,repo2,owner/repo3)](https://github.com/amankumarconnect/readme-contribution-stats)
```

More features and cards are coming soon! Please star the repo ⭐

## Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.
