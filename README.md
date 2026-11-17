# Drinks & Destinations — Homepage

Open `index.html` in a browser. GSAP, ScrollTrigger, SplitText, Lenis, Swiper and Google Fonts load from CDNs, so you need an internet connection.

## Adding images

Every image slot points to a fixed filename in `images/`. Until that file exists, the slot shows its filename and Figma size. Export at 2x and save with these names:

| File | Figma size | Section |
|---|---|---|
| `hero.jpg` | 785 × 603 | Hero (the CSS flips it horizontally, like Figma; if your export is already flipped, remove `scale: -1 1` from `.hero__img`) |
| `news-adam-eve.jpg` | 690 × 363 | News feature |
| `news-sora-bar.jpg`, `news-jalisco.jpg`, `news-south-seas.jpg` | 180 × 220 | News list |
| `about-rojita.jpg` | 480 × 403 | About |
| `exp-1.jpg` … `exp-5.jpg` | 384 × 280 | Experiences carousel |
| `rtmis.jpg`, `podcast.jpg` | 480 × 301 | RTMIS / Podcast |
| `press-1.jpg` … `press-4.jpg` | 282 × 138 | In the news |
| `logo-1.png` … `logo-5.png` | 172×97, 178×127, 180×52, 169×79, 99×99 | Partner logos |

**Site logo:** the header and footer currently use a text version of the logo. Export the Figma logo as `images/logo.svg` and replace the `<span class="logo__text">` inside each `.logo` link with `<img src="images/logo.svg" alt="Drinks & Destinations" width="178" height="50">`.

Also update the alt text in `index.html` if your photos differ from the descriptions there. The partner logos currently use generic alt text ("Partner logo 1"), so replace those with each company's name.

## Fonts

- **Hedvig Letters Serif** loads from Google Fonts.
- **Times New Roman** is a standard system font.
- **Kross Neue Grotesk** (navigation) and **Qartella ExtraBold** (display buttons) are paid fonts. Add `fonts/KrossNeueGrotesk-Regular.woff2` and `fonts/Qartella-ExtraBold.woff2` and they load automatically. Until then the site uses Space Grotesk instead.

## Provisional sections

Figma's usage limit was reached before these nodes could be inspected, so their layout and copy are best guesses. Each one is marked with a comment in `index.html`:

- Experiences (`585:1715`)
- RTMIS (`585:1716`)
- Podcast (`585:1717`); the copy comes from the public podcast listing
- Footer (`585:1754`)

The "In the news" section and the logo strip were built from Figma layer data: the text, sizes and positions are exact, but colours and font sizes were inferred.

## To wire up

- The newsletter form only validates the email in the browser and shows a thank-you message. Connect it to your email provider in `initNewsletter()` in `js/main.js`.
- Several links point to sections on this page (`#news`, `#about`, `#in-the-news`) because inner pages don't exist yet. Change them to the real URLs once those pages are built.
