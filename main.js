const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from geojson directory
app.use("/geojson", express.static(path.join(__dirname, "geojson")));

// Route to serve the main page
app.get("/", (req, res) => {
  console.log("📄 Serving main page");
  res.render("index");
});

// Test route for debugging
app.get("/test", (req, res) => {
  res.json({
    message: "Server is working!",
    timestamp: new Date().toISOString(),
    geojsonExists: require("fs").existsSync(
      require("path").join(__dirname, "geojson")
    ),
    sharawaniExists: require("fs").existsSync(
      require("path").join(__dirname, "datasets", "Sharawani")
    ),
  });
});

// API endpoint to serve pre-converted GeoJSON files
app.get("/api/geojson/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const geojsonPath = path.join(__dirname, "geojson", `${filename}.geojson`);

    if (!fs.existsSync(geojsonPath)) {
      return res.status(404).json({ error: "GeoJSON file not found" });
    }

    // Read and serve the GeoJSON file
    const geojsonData = fs.readFileSync(geojsonPath, "utf8");
    const geojson = JSON.parse(geojsonData);

    res.json(geojson);
  } catch (error) {
    console.error("Error reading GeoJSON file:", error);
    res.status(500).json({ error: "Error reading GeoJSON file" });
  }
});

// API endpoint to list available GeoJSON files (administrative boundaries)
app.get("/api/geojson-files", (req, res) => {
  try {
    const geojsonDir = path.join(__dirname, "geojson");

    // Check if geojson directory exists
    if (!fs.existsSync(geojsonDir)) {
      return res.status(404).json({
        error:
          "GeoJSON directory not found. Please run the Python conversion script first.",
      });
    }

    const files = fs.readdirSync(geojsonDir);

    // Filter for .geojson files and extract base names
    const geojsonFiles = files
      .filter((file) => file.endsWith(".geojson"))
      .map((file) => {
        const baseName = path.basename(file, ".geojson");
        return {
          name: baseName,
          displayName: baseName
            .replace(/_/g, " ")
            .replace(/irq admbnda /, "")
            .toUpperCase(),
          adminLevel: getAdminLevel(baseName),
          filePath: `/geojson/${file}`,
          type: "administrative",
        };
      })
      .sort((a, b) => {
        // Sort by admin level (ADM0, ADM1, ADM2, ADM3)
        const levelOrder = { ADM0: 0, ADM1: 1, ADM2: 2, ADM3: 3 };
        return levelOrder[a.adminLevel] - levelOrder[b.adminLevel];
      });

    res.json(geojsonFiles);
  } catch (error) {
    console.error("Error listing GeoJSON files:", error);
    res.status(500).json({ error: "Error listing GeoJSON files" });
  }
});

// API endpoint to list Sharawani GeoJSON files (point data)
app.get("/api/sharawani-files", (req, res) => {
  try {
    const sharawaniDir = path.join(__dirname, "datasets", "Sharawani");

    if (!fs.existsSync(sharawaniDir)) {
      return res.status(404).json({
        error: "Sharawani directory not found.",
      });
    }

    const files = fs.readdirSync(sharawaniDir);

    // Filter for .geojson files and extract base names
    const sharawaniFiles = files
      .filter((file) => file.endsWith(".geojson"))
      .map((file) => {
        const baseName = path.basename(file, ".geojson");
        return {
          name: baseName,
          displayName: formatSharawaniName(baseName),
          category: getSharawaniCategory(baseName),
          filePath: `/datasets/Sharawani/${file}`,
          type: "point",
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    res.json(sharawaniFiles);
  } catch (error) {
    console.error("Error listing Sharawani files:", error);
    res.status(500).json({ error: "Error listing Sharawani files" });
  }
});

// API endpoint to serve Sharawani GeoJSON files
app.get("/api/sharawani/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const geojsonPath = path.join(
      __dirname,
      "datasets",
      "Sharawani",
      `${filename}.geojson`
    );

    if (!fs.existsSync(geojsonPath)) {
      return res
        .status(404)
        .json({ error: "Sharawani GeoJSON file not found" });
    }

    // Read and serve the GeoJSON file
    const geojsonData = fs.readFileSync(geojsonPath, "utf8");
    const geojson = JSON.parse(geojsonData);

    res.json(geojson);
  } catch (error) {
    console.error("Error reading Sharawani GeoJSON file:", error);
    res.status(500).json({ error: "Error reading Sharawani GeoJSON file" });
  }
});

// API endpoint to serve Villages GeoJSON data
app.get("/api/villages-data", (req, res) => {
  try {
    const geojsonPath = path.join(__dirname, "datasets", "villages.geojson");

    if (!fs.existsSync(geojsonPath)) {
      return res.status(404).json({
        error:
          "villages.geojson file not found. Please make sure the villages data is available.",
      });
    }

    // Read the GeoJSON file
    const geojsonData = fs.readFileSync(geojsonPath, "utf8");
    const geojson = JSON.parse(geojsonData);

    // Extract data in the format expected by the frontend
    const formattedData = geojson.features.map((feature) => ({
      name:
        feature.properties.name ||
        feature.properties.Name ||
        `Village ${feature.properties.osm_id || "Unknown"}`,
      latitude: feature.properties.latitude,
      longitude: feature.properties.longitude,
      city: feature.properties.city,
      osm_id: feature.properties.osm_id,
      dataset: "Villages",
    }));

    res.json({
      success: true,
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error reading villages.geojson:", error);
    res.status(500).json({ error: "Error reading villages.geojson file" });
  }
});

// API endpoint to serve Combined GeoJSON data (much faster than Excel!)
app.get("/api/combined-data", (req, res) => {
  try {
    const geojsonPath = path.join(__dirname, "datasets", "Combined.geojson");

    if (!fs.existsSync(geojsonPath)) {
      return res.status(404).json({
        error:
          "Combined.geojson file not found. Please run the conversion script first.",
      });
    }

    // Read the GeoJSON file (much faster than parsing Excel)
    const geojsonData = fs.readFileSync(geojsonPath, "utf8");
    const geojson = JSON.parse(geojsonData);

    // Extract data in the same format expected by the frontend
    const formattedData = geojson.features.map((feature) => ({
      name: feature.properties.name,
      latitude: feature.properties.latitude,
      longitude: feature.properties.longitude,
      dataset: feature.properties.dataset,
    }));

    res.json({
      success: true,
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error reading Combined.geojson:", error);
    res.status(500).json({ error: "Error reading Combined.geojson file" });
  }
});

// API endpoint to serve IQ Air devices GeoJSON data
app.get("/api/iq-air-data", (req, res) => {
  try {
    const geojsonPath = path.join(
      __dirname,
      "datasets",
      "IQ Air devices.geojson"
    );

    if (!fs.existsSync(geojsonPath)) {
      return res.status(404).json({
        error:
          "IQ Air devices.geojson file not found. Please make sure the IQ Air devices data is available.",
      });
    }

    // Read the GeoJSON file
    const geojsonData = fs.readFileSync(geojsonPath, "utf8");
    const geojson = JSON.parse(geojsonData);

    // Extract data in the format expected by the frontend
    const formattedData = geojson.features.map((feature) => ({
      name:
        feature.properties.Name ||
        feature.properties.name ||
        `IQ Air Device ${feature.properties["Unnamed: 0"] || "Unknown"}`,
      latitude: feature.properties.latitude,
      longitude: feature.properties.longitude,
      height: feature.properties["Hight (meter)"] || feature.properties.height,
      dataset: "IQ Air",
    }));

    res.json({
      success: true,
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error reading IQ Air devices.geojson:", error);
    res
      .status(500)
      .json({ error: "Error reading IQ Air devices.geojson file" });
  }
});

// Helper function to determine admin level
function getAdminLevel(filename) {
  if (filename.toLowerCase().includes("adm0")) return "ADM0";
  if (filename.toLowerCase().includes("adm1")) return "ADM1";
  if (filename.toLowerCase().includes("adm2")) return "ADM2";
  if (filename.toLowerCase().includes("adm3")) return "ADM3";
  return "UNKNOWN";
}

// Helper function to format Sharawani layer names
function formatSharawaniName(filename) {
  const nameMap = {
    Cemetary: "Cemeteries",
    education: "Education Facilities",
    "Fuel Station": "Fuel Stations",
    Healthcare: "Healthcare Facilities",
    Suburbs: "Suburbs",
  };

  return (
    nameMap[filename] || filename.charAt(0).toUpperCase() + filename.slice(1)
  );
}

// Helper function to categorize Sharawani layers
function getSharawaniCategory(filename) {
  const categoryMap = {
    Cemetary: "infrastructure",
    education: "services",
    "Fuel Station": "infrastructure",
    Healthcare: "services",
    Suburbs: "administrative",
  };

  return categoryMap[filename] || "other";
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
