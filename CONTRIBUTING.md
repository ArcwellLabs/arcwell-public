# Contributing

Use the public repository's contributor identity for both author and committer:
`ARCWELL Contributors <contributors@arcwell.invalid>`.
Run `npm run identity:setup` immediately after cloning. This configures only this
repository and installs pre-commit, commit-message, and pre-push guards.

1. Create a descriptive branch without a personal handle.
2. Make a focused change and stage the exact files you intend to publish.
3. Run `npm run privacy:check` and `npm run verify`.
4. Commit with an accurate message and the actual current date.
5. Open a pull request with the behavior changed and verification performed.

Do not add personal usernames, personal email addresses, home-directory paths,
credentials, private documents, editor project IDs, or private deployment exports.
Use `example.com` for illustrative contact addresses and clearly label sample data.
Review screenshots and binary assets visually and inspect metadata before adding them.
Retain legally required third-party copyright and license notices.

GitHub associates pull requests, reviews, issues, and pushes with the authenticated
account. Git author metadata does not hide that account. Use only a public-facing
account you intend to expose for public GitHub activity.

Do not merge private Git history into this repository. Bring over reviewed changes
as new commits. Changes to privacy policy, hooks, and CI require maintainer review.
Contributions must be material you have the right to submit under this repository's
license; keep third-party licenses and attribution intact.
