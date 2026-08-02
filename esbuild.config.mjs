import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import fs from "fs";
import path from "path";

const prod = process.argv[2] === "production";

const banner = `/*
Food Spot — bundled by esbuild. Source: src/ in this repository.
*/`;

function concatStyles() {
  const dir = "styles";
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".css"))
    .sort();
  // Leaflet's CSS ships inside the bundle (Map tab). It goes FIRST so every
  // fs- style can override it.
  const leafletCss = path.join("node_modules", "leaflet", "dist", "leaflet.css");
  const css = [
    "/* === leaflet.css (vendored from node_modules/leaflet/dist) === */\n" +
      fs.readFileSync(leafletCss, "utf8"),
    ...files.map((f) => `/* === ${f} === */\n` + fs.readFileSync(path.join(dir, f), "utf8")),
  ].join("\n\n");
  fs.writeFileSync("foodspot/styles.css", css);
  console.log(`styles: concatenated leaflet + ${files.length} files -> foodspot/styles.css`);
}

const stylesPlugin = {
  name: "concat-styles",
  setup(build) {
    build.onEnd(() => concatStyles());
  },
};

const context = await esbuild.context({
  banner: { js: banner },
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
  ],
  format: "cjs",
  target: "es2020",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "foodspot/main.js",
  plugins: [stylesPlugin],
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
