#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["openai>=1.50.0", "pillow>=10.0.0"]
# ///
"""Generate game asset pack for duct cleaning sim via gpt-image-2.

Parallelized with ThreadPoolExecutor for speed.
Outputs:
  - textures/ (tileable, 1024x1024)
  - icons/ (tool icons, transparent bg, 1024x1024)
  - posters/ (wall posters, 1024x1024)
  - decals/ (van decal, 1536x1024)
"""
import base64
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
OUT = Path("/home/claude/game_assets")
for sub in ("textures", "icons", "posters", "decals"):
    (OUT / sub).mkdir(parents=True, exist_ok=True)


TEXTURES = {
    "drywall_beige": "Seamless tileable texture of a commercial office drywall painted in muted warm beige. Light orange-peel texture visible. Perfectly tileable on all four edges. No shadows or lighting baked in. Flat, even lighting. Top-down flat photographic style. Matte finish.",
    "carpet_tile_gray": "Seamless tileable texture of commercial office carpet tile in medium gray with subtle darker flecks. Low pile, short loops visible. Perfectly tileable on all four edges. No shadows. Top-down view. Flat even lighting.",
    "galvanized_sheet_metal": "Seamless tileable texture of galvanized HVAC sheet metal with subtle spangle pattern. Silver-gray with faint metallic crystalline texture characteristic of galvanizing. Slightly brushed finish. Perfectly tileable on all four edges. No shadows, top-down view.",
    "flex_duct_silver": "Seamless tileable texture of silver flexible HVAC duct exterior. Horizontal ribbed pattern of the inner wire helix creating parallel shadow bands. Slightly wrinkled reflective silver mylar surface. Perfectly tileable horizontally.",
    "acoustic_ceiling_tile": "Seamless tileable texture of a white acoustic drop ceiling tile with randomly distributed small pinhole pores and subtle fissures. Flat matte off-white finish. Perfectly tileable on all four edges. Top-down flat view.",
    "concrete_floor": "Seamless tileable texture of a sealed concrete mechanical room floor. Medium gray, slight polish sheen, subtle aggregate visible. Minor hairline cracks and very faint staining. Perfectly tileable on all four edges. Flat even lighting.",
    "drop_ceiling_grid": "Seamless tileable texture of a white painted T-bar drop ceiling grid intersection. Metal T-bars forming a cross, slightly dusty. White satin finish. Seamless on four edges.",
    "safety_yellow_plastic": "Seamless tileable texture of safety yellow industrial plastic. Slight pebbled surface, matte finish, OSHA-standard hazard yellow color. Perfectly tileable on all four edges. Flat top-down view.",
}

ICONS = {
    "wand": "Game UI icon of an HVAC air duct cleaning whip: a black flexible rod with a rotating black bristle brush head on one end and a brass quick-connect air fitting on the other. Centered, full object visible. Transparent background. Clean vector-style rendering with soft shadows. Square composition.",
    "negative_air_machine": "Game UI icon of a portable yellow HEPA negative air machine on black wheels. Rectangular box with round intake grille on one side and flex duct port on top. Subtle 'HEPA' text on side. Centered, full object. Transparent background. Clean vector-style rendering.",
    "flex_tubing": "Game UI icon of a coiled 8-inch silver flexible HVAC duct. Ribbed reflective silver spiral coil, 2-3 loops visible. Centered. Transparent background. Clean vector-style rendering.",
    "vacuum": "Game UI icon of a portable upright HEPA shop vacuum. Black canister body with silver HEPA filter section, hose port on top, wheeled base. Centered. Transparent background. Clean vector-style rendering.",
    "plastic_sheeting": "Game UI icon of a roll of clear plastic sheeting drop cloth, partially unrolled. Translucent milky-white plastic. Centered. Transparent background. Clean vector-style rendering.",
    "screw_gun": "Game UI icon of a cordless yellow and black DeWalt-style impact driver with a Phillips bit inserted. Three-quarter view. Centered. Transparent background. Clean vector-style rendering.",
    "hole_saw": "Game UI icon of a bi-metal hole saw attachment with arbor, about 6 inches diameter. Silver teeth around circumference. Three-quarter view showing the cup shape. Transparent background. Clean vector-style rendering.",
    "fsk_tape": "Game UI icon of a roll of foil-scrim-kraft FSK tape. Shiny silver aluminum foil exterior with visible fiber scrim pattern. Cardboard core visible. Centered. Transparent background. Clean vector-style rendering.",
    "sheet_metal_patch": "Game UI icon of a 6-inch square galvanized sheet metal patch with bent tabs on edges. Silver-gray galvanized finish. Angled three-quarter view. Transparent background. Clean vector-style rendering.",
    "mastic": "Game UI icon of a tube of gray HVAC duct mastic sealant, caulk-gun style cartridge. Product label reading 'MASTIC' visible. Three-quarter view. Transparent background. Clean vector-style rendering.",
    "compressor_hose": "Game UI icon of a coiled yellow-and-black pneumatic air compressor hose with brass quick-connect fittings on each end. Two coils visible. Centered. Transparent background. Clean vector-style rendering.",
    "chimney_brush": "Game UI icon of a round nylon chimney brush on a threaded metal rod. Black bristles splayed outward. Centered. Transparent background. Clean vector-style rendering.",
    "shop_broom": "Game UI icon of a push broom with wooden handle and wide black bristle head. Three-quarter view. Centered. Transparent background. Clean vector-style rendering.",
    "coil_cleaner": "Game UI icon of a blue spray can of HVAC evaporator coil cleaner. Trigger spray nozzle on top. Product label visible. Three-quarter view. Transparent background. Clean vector-style rendering.",
    "pressure_washer": "Game UI icon of a small electric pressure washer. Wheeled base, handle, trigger wand attached by hose. Yellow and black. Three-quarter view. Transparent background. Clean vector-style rendering.",
    "n95_mask": "Game UI icon of a white N95 respirator mask with two blue elastic straps and a silver metal nose bridge clip. Front view. Transparent background. Clean vector-style rendering.",
    "duct_tape_trap": "Game UI icon of a roll of silver cloth duct tape. Marked clearly with a red prohibition symbol overlay (red circle with diagonal line through it) to indicate this is the WRONG choice for HVAC patching. Transparent background. Clean vector-style rendering.",
}

POSTERS = {
    "safety_first": "Commercial safety workplace poster on white background with green and black text. Headline reads 'SAFETY FIRST'. Below headline, smaller text reads 'PPE REQUIRED BEYOND THIS POINT'. Below that, four small icons with labels: a hard hat labeled 'HEAD', safety glasses labeled 'EYES', work gloves labeled 'HANDS', steel toe boot labeled 'FEET'. Portrait orientation. Clean professional design, OSHA-style aesthetic.",
    "hazard_asbestos": "OSHA-style hazard warning poster. Yellow background top half, white bottom half. Large bold black text 'ASBESTOS HAZARD MAY BE PRESENT'. Below that, smaller text 'VERMICULITE INSULATION / 29 CFR 1926.1101 / STOP WORK AND NOTIFY SUPERVISOR'. Black hazard triangle with exclamation mark centered. Portrait orientation.",
    "nadca_certified": "Industry certification poster. Clean corporate design. Blue and white color scheme. Headline 'NADCA CERTIFIED FACILITY'. Subtext 'AIR SYSTEMS CLEANING SPECIALIST'. Below that, smaller text 'ACR STANDARD 2021 COMPLIANCE'. NADCA-style round logo placeholder at top (generic HVAC swirl emblem). Portrait orientation.",
    "think_safety": "Commercial workplace motivational poster. Green border with white center panel. Headline 'THINK. PLAN. WORK SAFE.' in bold black sans-serif. Below: '1. PPE ON  2. HAZARDS ID'D  3. TOOLS CHECKED  4. PLAN COMMUNICATED'. Portrait orientation. Professional clean design.",
}

DECAL = {
    "van_side_decal": (
        "Bold commercial HVAC service van side decal, designed to wrap a van panel. "
        "Solid yellow background (OSHA safety yellow #FFD700). Large bold black sans-serif text: "
        "'CAROLINA QUALITY AIR' arranged on two lines, centered. Below the main text, smaller black text: "
        "'COMMERCIAL DUCT CLEANING / LICENSED & INSURED'. "
        "Phone number '(919) 555-0100' bottom right in black. "
        "Clean professional typographic design. Wide landscape aspect ratio. No photos, no gradient, no background texture. "
        "Pure flat colors, high contrast, designed to be applied as a flat texture to a van side panel in a game."
    ),
}


def gen(category: str, name: str, prompt: str, size: str = "1024x1024") -> str:
    out_path = OUT / category / f"{name}.png"
    if out_path.exists() and out_path.stat().st_size > 10_000:
        return f"[skip] {category}/{name} (exists)"
    try:
        t0 = time.time()
        resp = client.images.generate(model="gpt-image-2", prompt=prompt, size=size, n=1)
        b64 = resp.data[0].b64_json
        out_path.write_bytes(base64.b64decode(b64))
        return f"[ok] {category}/{name}.png ({out_path.stat().st_size // 1024} KB, {time.time()-t0:.1f}s)"
    except Exception as e:
        return f"[FAIL] {category}/{name}: {type(e).__name__}: {e}"


def main() -> None:
    jobs = []
    for name, prompt in TEXTURES.items():
        jobs.append(("textures", name, prompt, "1024x1024"))
    for name, prompt in ICONS.items():
        jobs.append(("icons", name, prompt, "1024x1024"))
    for name, prompt in POSTERS.items():
        jobs.append(("posters", name, prompt, "1024x1024"))
    for name, prompt in DECAL.items():
        jobs.append(("decals", name, prompt, "1536x1024"))

    print(f"generating {len(jobs)} assets, parallel=6")
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=6) as ex:
        futures = [ex.submit(gen, *j) for j in jobs]
        for fut in as_completed(futures):
            print(fut.result(), flush=True)
    print(f"\ntotal: {time.time()-t0:.1f}s")
    # Summary
    for sub in ("textures", "icons", "posters", "decals"):
        files = sorted((OUT / sub).iterdir())
        print(f"  {sub}: {len(files)} files")


if __name__ == "__main__":
    main()
