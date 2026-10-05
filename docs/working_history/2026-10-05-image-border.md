# Image border property fix

## Purpose

Fix the issue where changing an image node's border color and width in the property panel did not update the image border.

## Scope and decision

- Image nodes previously reset `border-width` and `border-color` to `0px` and `transparent` in `applyNodeAppearance`.
- Keep image fill transparent, but apply the stored border color, width, style, and opacity just like other nodes.

## Changed files

- `src/main/resources/static/js/diagram.js`

## Follow-up

- Image border width, color, and style are now written with inline `!important` priority so utility or global styles cannot override the property panel value.

## Verification

- `node --check src/main/resources/static/js/diagram.js` passed.

## Open issues / next work

- No known open issues.
