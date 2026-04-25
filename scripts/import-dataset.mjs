import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const datasetDir = path.join("D:", "zoo app", "app demo data", "manu_dataset");
const imagesSourceDir = path.join(datasetDir, "images");
const imagesDestDir = path.join(rootDir, "public", "species-images");

// Category normalisation map
const categoryMap = {
  Amphibian: "amphibian",
  Bat: "bat",
  Bird: "bird",
  "Dung Beetle": "dung-beetle",
  Fruit: "fruit",
  Fungus: "fungus",
  Herpetofauna: "herpetofauna",
  "Large Mammal": "large-mammal",
  Orchid: "orchid",
  Reptile: "reptile",
};

function difficultyFromCategory(cat) {
  const common = ["Bird", "Large Mammal"];
  const rare = ["Fungus", "Orchid"];
  if (common.includes(cat)) return "common";
  if (rare.includes(cat)) return "rare";
  return "uncommon";
}

// Copy images recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log("Copying species images...");
copyDir(imagesSourceDir, imagesDestDir);
console.log("Images copied to public/species-images/");

// Load and transform dataset
const dataset = JSON.parse(fs.readFileSync(path.join(datasetDir, "dataset.json"), "utf-8"));

const speciesData = dataset.map((entry) => {
  // Image path: dataset has "images/amphibian/foo.png" → "/species-images/amphibian/foo.png"
  const imagePath = entry.image
    ? "/species-images/" + entry.image.replace(/^images\//, "")
    : "/placeholder-species.svg";

  return {
    id: entry.id,
    name: entry.name,
    scientific_name: entry.name,
    category: categoryMap[entry.category] ?? entry.category.toLowerCase(),
    image: imagePath,
    description: entry.description || "",
    habitat: entry.source_title || "",
    difficulty: difficultyFromCategory(entry.category),
    family: entry.family || "",
    source_title: entry.source_title || "",
  };
});

const outPath = path.join(rootDir, "data", "species-data.json");
fs.writeFileSync(outPath, JSON.stringify(speciesData, null, 2));

console.log(`Done! Imported ${speciesData.length} species into data/species-data.json`);

// Summary
const counts = {};
speciesData.forEach((s) => { counts[s.category] = (counts[s.category] || 0) + 1; });
console.log("\nCategory breakdown:");
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
