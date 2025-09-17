// Debug script to test basic functionality
console.log("🔧 Debug script loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM Content Loaded - Debug Mode");

  // Test if elements exist
  const leafletMap = document.getElementById("leafletMap");
  const layerControls = document.getElementById("layerControls");
  const sharawaniControls = document.getElementById("sharawaniControls");

  console.log("📍 leafletMap element:", leafletMap);
  console.log("📍 layerControls element:", layerControls);
  console.log("📍 sharawaniControls element:", sharawaniControls);

  // Test if libraries are loaded
  console.log("📚 Leaflet loaded:", typeof L !== "undefined");
  console.log("📚 Proj4 loaded:", typeof proj4 !== "undefined");

  // Try to create a basic map
  if (typeof L !== "undefined" && leafletMap) {
    console.log("🗺️ Attempting to create basic map...");
    try {
      const map = L.map("leafletMap", {
        center: [33.0, 44.0],
        zoom: 6,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      console.log("✅ Basic map created successfully");

      // Test API endpoints
      testAPIEndpoints();
    } catch (error) {
      console.error("❌ Error creating basic map:", error);
    }
  } else {
    console.error("❌ Cannot create map - missing Leaflet or map element");
  }
});

async function testAPIEndpoints() {
  console.log("🧪 Testing API endpoints...");

  try {
    // Test administrative layers
    const adminResponse = await fetch("/api/geojson-files");
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log("✅ Admin API working:", adminData.length, "layers");

      // Add some test controls
      const layerControls = document.getElementById("layerControls");
      if (layerControls) {
        layerControls.innerHTML =
          '<div class="layer-item">✅ Admin API Connected</div>';
      }
    } else {
      console.error("❌ Admin API failed:", adminResponse.status);
    }

    // Test Sharawani layers
    const sharawaniResponse = await fetch("/api/sharawani-files");
    if (sharawaniResponse.ok) {
      const sharawaniData = await sharawaniResponse.json();
      console.log("✅ Sharawani API working:", sharawaniData.length, "layers");

      // Add some test controls
      const sharawaniControls = document.getElementById("sharawaniControls");
      if (sharawaniControls) {
        sharawaniControls.innerHTML =
          '<div class="layer-item">✅ Sharawani API Connected</div>';
      }
    } else {
      console.error("❌ Sharawani API failed:", sharawaniResponse.status);
    }
  } catch (error) {
    console.error("❌ API test failed:", error);
  }
}
