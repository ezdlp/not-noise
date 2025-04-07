# Security Policy

## Handling Sensitive Information

This document provides guidelines for securely handling sensitive information in the Soundraiser project.

## Reporting Security Issues

If you discover a security vulnerability or exposure, please report it to us immediately by emailing security@soundraiser.io.

## Exposed API Keys

If you receive an alert about exposed API keys:

1. **Immediately rotate the exposed keys**:
   - For Stripe: Log in to the Stripe Dashboard → Developers → API keys → Revoke and create new keys
   - For Supabase: Go to Supabase Dashboard → Project Settings → API → Revoke and generate new keys

2. **Remove the keys from Git history**:
   ```bash
   # Install BFG Repo-Cleaner
   # Download from https://rtyley.github.io/bfg-repo-cleaner/
   
   # Replace sensitive data in Git history
   java -jar bfg.jar --replace-text passwords.txt /path/to/your/repo.git
   
   # Where passwords.txt contains the patterns to be replaced, e.g.:
   # sk_live_51Ok9CbFx6uwYcH3S==>REMOVED-STRIPE-KEY
   
   # After BFG completes, run these commands:
   cd /path/to/your/repo.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

3. **Add protective measures**:
   - Use environment variables for all sensitive values
   - Add .env files to .gitignore
   - Set up pre-commit hooks to prevent accidental commits of sensitive data
   - Configure GitGuardian or other tools to monitor repositories

## Secure Practices

1. **Environment Variables**:
   - Store sensitive data in .env files
   - NEVER commit .env files to Git repositories
   - Use .env.example files as templates (without real values)

2. **API Keys**:
   - Use test keys for development
   - Restrict keys to minimum required permissions
   - Regularly rotate production keys

3. **Deployment**:
   - Use secure methods to set environment variables in production
   - For Supabase Edge Functions, use the CLI's secret management:
     ```bash
     supabase secrets set KEY_NAME=value --project-ref your-project-ref
     ```

4. **Code Reviews**:
   - Always check for exposed secrets before approving PRs
   - Use automated scanning tools

## Additional Resources

- [Stripe API Security Best Practices](https://stripe.com/docs/security/guide)
- [Supabase Security Documentation](https://supabase.com/docs/guides/platform/security)
- [Git Secret Management Tools](https://git-secret.io/) 