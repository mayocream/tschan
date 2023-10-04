# Kumo 曇!

Cloudflare Workers for [kumo.e.ki](https://kumo.e.ki), the cloud service of TSちゃん！

The Serverless way to build the Web API, make life easier and save money.

## Features

- [x] OAuth with GitHub
- [ ] TSちゃん! Project Management
- [ ] Dictionary
- [ ] GPT4 API

## Development

Use [wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/).

### Secrets

Secrets in Cloudflare Workers (via dashboard) not loaded in local dev environment, so we add it mannually.
See [Locally overriding vars in wrangler dev (#879)](https://github.com/cloudflare/workers-sdk/commit/f6943132a04f17af68e2070756d1ec2aa2bdf0be).

Create `.dev.vars` file in the root directory with the following content:

```js
GITHUB_CLIENT_ID = "<secret>"
GITHUB_CLIENT_SECRET = "<secret>"
JWT_SECRET = "<secret>"
```

Replace `<secret>` with the real secrets.
