# Console model pipeline

The site is ready to swap its fallback console for a modeled glTF/GLB. Add the optimized file to `public/models/kwam-console.glb` and set this deployment environment variable:

```text
VITE_CONSOLE_MODEL_URL=/models/kwam-console.glb
```

Recommended free workflow:

1. Model and apply transforms in Blender; use real-world-ish proportions and keep the cartridge slot centered at the existing console position.
2. Export binary glTF (`.glb`) with textures packed.
3. Use `gltf-transform` with Draco geometry compression and KTX2/BasisU textures before committing the final asset.
4. Keep the final `.glb` under about 2 MB for the first scene load; use the procedural console as the automatic fallback if the model fails to load.

The current machine does not have Blender, Draco, or KTX2 converters installed, so no file has been mislabeled as compressed. Once the exported asset exists, the loader in `src/main.js` replaces the fallback automatically.
