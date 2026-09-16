# Publication identity and privacy controls

The public commit identity is
`ARCWELL Contributors <contributors@arcwell.invalid>`.
This is the selected metadata identity, not a contact mailbox or a claim that
GitHub will conceal or unlink authenticated account activity.

`npm run identity:setup` installs repository-local configuration and hooks:

- **pre-commit:** checks both effective Git identities and the entire Git index,
  including staged bytes that differ from the working tree.
- **commit-msg:** checks messages for restricted tokens, addresses, paths, and
  credential-shaped strings.
- **pre-push:** checks all locally reachable commits, messages, refs, and historical
  blobs. A shallow checkout fails the full-history check.
- **CI:** independently runs the full-history audit and the application checks.

The policy stores fingerprints of restricted known identifiers rather than
republishing those identifiers in a denylist. Personal emails, filesystem paths,
private document types, editor provenance, and common credential formats are also
checked. Upstream package source and funding links are retained in lockfiles as
third-party metadata; they are not ARCWELL contributor identities.

These are defense-in-depth checks, not proof that arbitrary text contains no
personal information. Local hooks can be bypassed. CI runs after data reaches
GitHub, and branch protection does not prevent every object upload. Review new
names, public account activity, binary imagery, image/video metadata, and changes
to the guard itself before publication. Never push private history to this remote.
