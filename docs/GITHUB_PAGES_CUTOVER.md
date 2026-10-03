# GitHub Pages domain cutover

The site deploys through GitHub Actions (`actions/deploy-pages`), not the legacy branch-based Pages builder.

For this deployment mode, the root `CNAME` file is retained as repository metadata but is **not** the authoritative custom-domain configuration. GitHub's current documentation says a CNAME file is ignored for custom GitHub Actions workflows; the custom domain must be configured in the repository's Pages settings. https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages

## Required sequence

1. In the repository's **Settings → Pages**, set the custom domain to `mycelix.luminousdynamics.io`.
2. Verify the parent domain for the organization in GitHub Pages using the `_github-pages-challenge-<ORG>` TXT mechanism and keep the TXT record published. GitHub documents verification as protection against Pages takeover. https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
3. Create the DNS CNAME for `mycelix.luminousdynamics.io` pointing to the organization's GitHub Pages hostname.
4. Wait for DNS propagation and confirm the custom domain reports as verified.
5. Enable **Enforce HTTPS** after certificate provisioning succeeds. GitHub documents that certificate issuance can be blocked by conflicting DNS records. https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
6. Only then treat `mycelix.luminousdynamics.io` as the public canonical Mycelix site.

## Security rules

- Do not use the retired `mycelix.net` hostname for redirects, OAuth callbacks, CORS, Origin checks, recovery links, or deployment tooling.
- Do not create wildcard DNS records under the verified domain. GitHub explicitly warns that wildcard records can still create takeover paths. https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- Keep the GitHub Pages verification TXT record in place after verification.
- Record the final DNS answers, certificate fingerprint, HTTP headers, and deployment commit in the incident evidence capsule.
