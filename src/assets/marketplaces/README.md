# Marketplace logos (official files only)

Tarazu shows the real logo of each marketplace a seller sells on. These are third-party trademarks, so
**only files downloaded from the platform's own brand or press resources belong here**. Nothing in this
folder may be redrawn, traced from a screenshot, or generated.

Drop a file in and it appears across the app on the next build (no code change; `src/brand/channels.tsx`
picks it up with `import.meta.glob`). Until a file is present, the app shows the platform's name with a
neutral store icon, never an imitation of the logo.

| Platform | File names | Where to get the official file |
| --- | --- | --- |
| Amazon | `amazon.svg` (wordmark), `amazon-icon.svg` (square mark, optional) | Amazon press centre logo library: https://press.aboutamazon.com/logos |
| Flipkart | `flipkart.svg`, `flipkart-icon.svg` | Flipkart's brand or partnerships team, or the logo pack in your Flipkart Seller Hub / Flipkart Stories newsroom (https://stories.flipkart.com) |
| Nykaa | `nykaa.svg`, `nykaa-icon.svg` | Nykaa brand partnerships / corporate communications, or the Nykaa partner (seller) panel |
| Meesho | `meesho.svg`, `meesho-icon.svg` | Meesho brand team or the Meesho Supplier Panel |

SVG is preferred; PNG or WebP also work (same names). Use the full-colour version on a light background.

Check each platform's trademark guidelines before publishing. Showing a marketplace logo to say "this
seller sells here" is the usual integration use; don't alter, recolour or animate the logos.

WhatsApp's glyph (`../channels/whatsapp.svg`) is the official mark as published in Meta's WhatsApp brand
resources (https://about.meta.com/brand/resources/whatsapp/whatsapp-brand), via the Simple Icons project (CC0 path data).
