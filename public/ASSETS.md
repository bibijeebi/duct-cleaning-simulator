# Game Assets

All images are served from `/public/` at runtime, not bundled into the JS.
Load via `new THREE.TextureLoader().load('/textures/foo.webp')` or plain `<img src="/icons/foo.webp">` for HUD.

## Textures (8, seamless tileable 1024×1024)

Use with `THREE.TextureLoader` + `texture.wrapS = texture.wrapT = THREE.RepeatWrapping`.

| File | Use |
|---|---|
| `textures/drywall_beige.webp` | Office walls |
| `textures/carpet_tile_gray.webp` | Office floors |
| `textures/galvanized_sheet_metal.webp` | Trunk line ducts, patches |
| `textures/flex_duct_silver.webp` | Flex duct branches, tubing |
| `textures/acoustic_ceiling_tile.webp` | Drop ceiling tiles |
| `textures/concrete_floor.webp` | Mechanical room, parking lot |
| `textures/drop_ceiling_grid.webp` | T-bar ceiling grid |
| `textures/safety_yellow_plastic.webp` | Negative air machine, hazard props |

## Icons (17, 1024×1024, transparent PNG converted to WebP)

Use in HUD overlays (loadout menu, inventory, hotbar, interaction prompts).

Critical equipment:
- `icons/wand.webp` (agitation wand)
- `icons/negative_air_machine.webp`
- `icons/flex_tubing.webp`
- `icons/vacuum.webp`
- `icons/plastic_sheeting.webp`
- `icons/screw_gun.webp`
- `icons/hole_saw.webp`
- `icons/fsk_tape.webp`
- `icons/sheet_metal_patch.webp`
- `icons/mastic.webp`
- `icons/compressor_hose.webp`

Minor equipment:
- `icons/chimney_brush.webp`
- `icons/shop_broom.webp`
- `icons/coil_cleaner.webp`
- `icons/pressure_washer.webp`
- `icons/n95_mask.webp`

Trap item:
- `icons/duct_tape_trap.webp` (shown with red prohibition overlay — this is the WRONG choice; selecting it = -10 penalty)

## Posters (4, 1024×1024)

Load as textures onto `PlaneGeometry` props attached to walls in the building.

| File | Place |
|---|---|
| `posters/safety_first.webp` | Reception wall, entry corridor |
| `posters/hazard_asbestos.webp` | Mechanical room (for the asbestos discovery event) |
| `posters/nadca_certified.webp` | Van interior or shop back wall |
| `posters/think_safety.webp` | Office hallway |

## Decals (1, 1536×1024)

| File | Use |
|---|---|
| `decals/van_side_decal.webp` | Apply to both sides of the Carolina Quality Air van mesh (PlaneGeometry or BoxGeometry material override) |

## Example usage

```ts
import { TextureLoader, RepeatWrapping, MeshStandardMaterial, sRGBEncoding } from 'three';

const loader = new TextureLoader();

// Tileable texture
const drywall = loader.load('/textures/drywall_beige.webp');
drywall.wrapS = drywall.wrapT = RepeatWrapping;
drywall.repeat.set(4, 4); // tile density
drywall.colorSpace = 'srgb'; // or SRGBColorSpace in newer three

const wallMat = new MeshStandardMaterial({ map: drywall, roughness: 0.9 });

// Van decal (no tiling)
const vanDecal = loader.load('/decals/van_side_decal.webp');
vanDecal.colorSpace = 'srgb';
const vanMat = new MeshStandardMaterial({ map: vanDecal, roughness: 0.4, metalness: 0.0 });
```

## HUD icon usage (vanilla DOM)

```ts
function iconUrl(id: string) { return `/icons/${id}.webp`; }

const el = document.createElement('div');
el.style.backgroundImage = `url(${iconUrl('wand')})`;
el.style.backgroundSize = 'contain';
el.style.backgroundRepeat = 'no-repeat';
```

## Regenerating / adding new assets

Use `scripts/gen_assets.py` (uv script, requires `OPENAI_API_KEY`). Re-running is idempotent — existing files are skipped.

Cost: ~$0.19 per 1024×1024 image, ~$0.25 per 1536×1024. Total pack: ~$6.
