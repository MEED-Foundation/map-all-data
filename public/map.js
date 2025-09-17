class IraqLeafletMap {
  constructor() {
    this.map = null;
    this.loadedLayers = new Map();
    this.layerGroups = new Map();
    this.sharawaniLayers = new Map();
    this.combinedLayers = new Map();
    this.layerColors = {
      irq_admbnda_adm0_cso_itos_20190603: "#2c3e50", // Dark blue-gray
      irq_admbnda_adm1_cso_20190603: "#34495e", // Medium gray
      irq_admbnda_adm2_cso_20190603: "#7f8c8d", // Light gray
      irq_admbnda_adm3_cso_20190603: "#95a5a6", // Lighter gray
    };
    this.sharawaniColors = {
      Cemetary: "#6c757d", // Professional gray
      education: "#0d6efd", // Professional blue
      "Fuel Station": "#fd7e14", // Professional orange
      Healthcare: "#dc3545", // Professional red
      Suburbs: "#6f42c1", // Professional purple
    };

    this.combinedColors = {
      // Default colors for different datasets - will be expanded dynamically
      default: "#17a2b8", // Professional teal
      HERA: "#28a745", // Professional green
      Compost: "#ffc107", // Professional yellow
      Investment: "#e83e8c", // Professional pink
      "IQ Air": "#6610f2", // Professional indigo
    };

    // Define coordinate system transformations
    this.setupProjections();
    this.init();
  }

  setupProjections() {
    // Check if proj4 is available
    if (typeof proj4 === "undefined") {
      console.warn(
        "⚠️ Proj4 not available - Sharawani coordinates may not display correctly"
      );
      this.proj4Available = false;
      return;
    }

    this.proj4Available = true;

    // Define UTM Zone 38N (EPSG:32638) - used by Sharawani data
    proj4.defs(
      "EPSG:32638",
      "+proj=utm +zone=38 +datum=WGS84 +units=m +no_defs"
    );
    // WGS84 (EPSG:4326) - standard web mapping
    proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

    console.log("✅ Proj4 coordinate transformations ready");
  }

  async init() {
    console.log("Initializing Iraq Map...");
    this.showLoading(true);

    try {
      await this.initMap();
      console.log("Map initialized successfully");

      await this.loadAvailableLayers();
      console.log("Administrative layers loaded");

      await this.loadSharawaniLayers();
      console.log("Sharawani layers loaded");

      await this.loadCombinedData();
      console.log("Combined dataset loaded");

      this.setupGlobalControls();
      console.log("Global controls setup complete");
    } catch (error) {
      console.error("Error during initialization:", error);
      this.showError(`Initialization failed: ${error.message}`);
    } finally {
      this.showLoading(false);
    }
  }

  setupGlobalControls() {
    const loadEverythingBtn = document.getElementById("loadEverythingBtn");
    if (loadEverythingBtn) {
      loadEverythingBtn.addEventListener("click", () => {
        console.log("🌍 Loading all layers...");

        // Load all administrative layers
        const adminCheckboxes = document.querySelectorAll('[id^="layer-"]');
        adminCheckboxes.forEach((checkbox) => {
          if (!checkbox.checked) {
            checkbox.checked = true;
            const layerName = checkbox.value;
            this.loadLayer(layerName);
          }
        });

        // Load all Sharawani layers
        const sharawaniCheckboxes =
          document.querySelectorAll('[id^="sharawani-"]');
        sharawaniCheckboxes.forEach((checkbox) => {
          if (!checkbox.checked) {
            checkbox.checked = true;
            const layerName = checkbox.value;
            this.loadSharawaniLayer(layerName);
          }
        });

        // Load all Combined dataset layers
        const combinedCheckboxes =
          document.querySelectorAll('[id^="combined-"]');
        combinedCheckboxes.forEach((checkbox) => {
          if (!checkbox.checked) {
            checkbox.checked = true;
            // Trigger the change event to load the dataset
            checkbox.dispatchEvent(new Event("change"));
          }
        });

        // Update button text temporarily
        const originalText = loadEverythingBtn.textContent;
        loadEverythingBtn.textContent = "Loading...";
        loadEverythingBtn.disabled = true;
        loadEverythingBtn.style.background = "#6c757d";

        setTimeout(() => {
          loadEverythingBtn.textContent = originalText;
          loadEverythingBtn.disabled = false;
          loadEverythingBtn.style.background = "#2c3e50";
        }, 2000);
      });
    }
  }

  initMap() {
    return new Promise((resolve) => {
      // Initialize Leaflet map centered on Iraq
      this.map = L.map("leafletMap", {
        center: [33.0, 44.0], // Iraq coordinates
        zoom: 6,
        zoomControl: true,
        attributionControl: true,
      });

      // Add base tile layer (OpenStreetMap)
      const baseLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }
      );

      baseLayer.addTo(this.map);

      // Add alternative base layers
      const satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 18,
        }
      );

      const terrainLayer = L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
          attribution:
            'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
          maxZoom: 17,
        }
      );

      // Create base layer control
      const baseLayers = {
        "Street Map": baseLayer,
        Satellite: satelliteLayer,
        Terrain: terrainLayer,
      };

      // Add layer control
      this.layerControl = L.control.layers(
        baseLayers,
        {},
        {
          position: "topright",
          collapsed: false,
        }
      );
      this.layerControl.addTo(this.map);

      // Add scale control
      L.control.scale({ position: "bottomleft" }).addTo(this.map);

      // Create custom panes for Sharawani layers with different z-indexes
      this.map.createPane("sharawaniPolygonPane");
      this.map.getPane("sharawaniPolygonPane").style.zIndex = 450; // Just above overlayPane (400)
      this.map.getPane("sharawaniPolygonPane").style.pointerEvents = "auto";

      this.map.createPane("sharawaniPointPane");
      this.map.getPane("sharawaniPointPane").style.zIndex = 1000; // Much higher for points
      this.map.getPane("sharawaniPointPane").style.pointerEvents = "auto";

      // Create custom pane for popups with highest z-index
      this.map.createPane("popupPane");
      this.map.getPane("popupPane").style.zIndex = 2000; // Highest z-index for popups
      this.map.getPane("popupPane").style.pointerEvents = "auto";

      resolve();
    });
  }

  async loadAvailableLayers() {
    try {
      console.log("📡 Fetching administrative layers...");
      const response = await fetch("/api/geojson-files");
      const geojsonFiles = await response.json();
      console.log("📊 Administrative layers data:", geojsonFiles);

      const layerControls = document.getElementById("layerControls");
      if (!layerControls) {
        throw new Error("layerControls element not found");
      }
      layerControls.innerHTML = "";

      // Add Load All / Clear All buttons
      const buttonContainer = document.createElement("div");
      buttonContainer.style.marginBottom = "10px";

      const loadAllBtn = document.createElement("button");
      loadAllBtn.textContent = "Load All";
      loadAllBtn.style.cssText =
        "margin-right: 8px; padding: 6px 12px; font-size: 0.8em; background: #0d6efd; color: white; border: 1px solid #0d6efd; border-radius: 3px; cursor: pointer; font-weight: 500; transition: background-color 0.2s ease;";

      const clearAllBtn = document.createElement("button");
      clearAllBtn.textContent = "Clear All";
      clearAllBtn.style.cssText =
        "padding: 6px 12px; font-size: 0.8em; background: #dc3545; color: white; border: 1px solid #dc3545; border-radius: 3px; cursor: pointer; font-weight: 500; transition: background-color 0.2s ease;";

      buttonContainer.appendChild(loadAllBtn);
      buttonContainer.appendChild(clearAllBtn);
      layerControls.appendChild(buttonContainer);

      geojsonFiles.forEach((geojsonFile, index) => {
        const layerItem = document.createElement("div");
        layerItem.className = "layer-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `layer-${geojsonFile.name}`;
        checkbox.value = geojsonFile.name;
        // Check ADM1 by default
        checkbox.checked = geojsonFile.adminLevel === "ADM1";

        const label = document.createElement("label");
        label.htmlFor = `layer-${geojsonFile.name}`;
        label.textContent = `${geojsonFile.displayName} (${geojsonFile.adminLevel})`;

        layerItem.appendChild(checkbox);
        layerItem.appendChild(label);
        layerControls.appendChild(layerItem);

        checkbox.addEventListener("change", (e) => {
          if (e.target.checked) {
            this.loadLayer(geojsonFile.name);
          } else {
            this.hideLayer(geojsonFile.name);
          }
        });

        // Load ADM1 by default
        if (geojsonFile.adminLevel === "ADM1") {
          this.loadLayer(geojsonFile.name);
        }
      });

      // Add event listeners for Load All / Clear All buttons
      loadAllBtn.addEventListener("click", () => {
        geojsonFiles.forEach((file) => {
          const checkbox = document.getElementById(`layer-${file.name}`);
          if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            this.loadLayer(file.name);
          }
        });
      });

      clearAllBtn.addEventListener("click", () => {
        geojsonFiles.forEach((file) => {
          const checkbox = document.getElementById(`layer-${file.name}`);
          if (checkbox && checkbox.checked) {
            checkbox.checked = false;
            this.hideLayer(file.name);
          }
        });
      });
    } catch (error) {
      console.error("Error loading available layers:", error);
      this.showError(
        "Failed to load administrative layer list. Please check the server."
      );
    }
  }

  async loadSharawaniLayers() {
    try {
      console.log("📡 Fetching Sharawani layers...");
      const response = await fetch("/api/sharawani-files");
      const sharawaniFiles = await response.json();
      console.log("📊 Sharawani layers data:", sharawaniFiles);

      const sharawaniControls = document.getElementById("sharawaniControls");
      if (!sharawaniControls) {
        throw new Error("sharawaniControls element not found");
      }
      sharawaniControls.innerHTML = "";

      // Add Load All / Clear All buttons for Sharawani
      const sharawaniButtonContainer = document.createElement("div");
      sharawaniButtonContainer.style.marginBottom = "10px";

      const loadAllSharawaniBtn = document.createElement("button");
      loadAllSharawaniBtn.textContent = "Load All";
      loadAllSharawaniBtn.style.cssText =
        "margin-right: 8px; padding: 6px 12px; font-size: 0.8em; background: #6f42c1; color: white; border: 1px solid #6f42c1; border-radius: 3px; cursor: pointer; font-weight: 500; transition: background-color 0.2s ease;";

      const clearAllSharawaniBtn = document.createElement("button");
      clearAllSharawaniBtn.textContent = "Clear All";
      clearAllSharawaniBtn.style.cssText =
        "padding: 6px 12px; font-size: 0.8em; background: #dc3545; color: white; border: 1px solid #dc3545; border-radius: 3px; cursor: pointer; font-weight: 500; transition: background-color 0.2s ease;";

      sharawaniButtonContainer.appendChild(loadAllSharawaniBtn);
      sharawaniButtonContainer.appendChild(clearAllSharawaniBtn);
      sharawaniControls.appendChild(sharawaniButtonContainer);

      sharawaniFiles.forEach((sharawaniFile) => {
        const layerItem = document.createElement("div");
        layerItem.className = "layer-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `sharawani-${sharawaniFile.name}`;
        checkbox.value = sharawaniFile.name;
        checkbox.checked = false; // None checked by default

        const label = document.createElement("label");
        label.htmlFor = `sharawani-${sharawaniFile.name}`;
        label.textContent = sharawaniFile.displayName;

        layerItem.appendChild(checkbox);
        layerItem.appendChild(label);
        sharawaniControls.appendChild(layerItem);

        checkbox.addEventListener("change", (e) => {
          if (e.target.checked) {
            this.loadSharawaniLayer(sharawaniFile.name);
          } else {
            this.hideSharawaniLayer(sharawaniFile.name);
          }
        });
      });

      // Add event listeners for Sharawani Load All / Clear All buttons
      loadAllSharawaniBtn.addEventListener("click", () => {
        sharawaniFiles.forEach((file) => {
          const checkbox = document.getElementById(`sharawani-${file.name}`);
          if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            this.loadSharawaniLayer(file.name);
          }
        });
      });

      clearAllSharawaniBtn.addEventListener("click", () => {
        sharawaniFiles.forEach((file) => {
          const checkbox = document.getElementById(`sharawani-${file.name}`);
          if (checkbox && checkbox.checked) {
            checkbox.checked = false;
            this.hideSharawaniLayer(file.name);
          }
        });
      });
    } catch (error) {
      console.error("Error loading Sharawani layers:", error);
      this.showError(
        "Failed to load Sharawani layer list. Please check the server."
      );
    }
  }

  async loadCombinedData() {
    try {
      console.log("Fetching Combined dataset...");
      const response = await fetch("/api/combined-data");
      const combinedData = await response.json();
      console.log("Combined dataset data:", combinedData);

      const combinedControls = document.getElementById("combinedControls");
      if (!combinedControls) {
        throw new Error("combinedControls element not found");
      }

      if (!combinedData.success || !combinedData.data) {
        throw new Error("Invalid combined data response");
      }

      // Group data by dataset
      const datasetGroups = {};
      combinedData.data.forEach((point) => {
        if (!datasetGroups[point.dataset]) {
          datasetGroups[point.dataset] = [];
        }
        datasetGroups[point.dataset].push(point);
      });

      // Add Load All / Clear All buttons for Combined data
      const combinedButtonContainer = document.createElement("div");
      combinedButtonContainer.style.marginBottom = "10px";

      const loadAllCombinedBtn = document.createElement("button");
      loadAllCombinedBtn.textContent = "Load All";
      loadAllCombinedBtn.style.cssText =
        "margin-right: 8px; padding: 6px 12px; font-size: 0.8em; background: #17a2b8; color: white; border: 1px solid #17a2b8; border-radius: 3px; cursor: pointer; font-weight: 500; transition: background-color 0.2s ease;";

      const clearAllCombinedBtn = document.createElement("button");
      clearAllCombinedBtn.textContent = "Clear All";
      clearAllCombinedBtn.style.cssText =
        "padding: 6px 12px; font-size: 0.8em; background: #dc3545; color: white; border: 1px solid #dc3545; border-radius: 3px; cursor: pointer; font-weight: 500; transition: background-color 0.2s ease;";

      combinedButtonContainer.appendChild(loadAllCombinedBtn);
      combinedButtonContainer.appendChild(clearAllCombinedBtn);
      combinedControls.appendChild(combinedButtonContainer);

      // Create checkboxes for each dataset
      Object.keys(datasetGroups).forEach((dataset) => {
        const layerItem = document.createElement("div");
        layerItem.className = "layer-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `combined-${dataset}`;
        checkbox.value = dataset;

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.textContent = `${dataset} (${datasetGroups[dataset].length} points)`;

        layerItem.appendChild(checkbox);
        layerItem.appendChild(label);
        combinedControls.appendChild(layerItem);

        // Add event listener for checkbox
        checkbox.addEventListener("change", (e) => {
          if (e.target.checked) {
            this.loadCombinedDataset(dataset, datasetGroups[dataset]);
          } else {
            this.hideCombinedDataset(dataset);
          }
        });
      });

      // Add event listeners for Load All / Clear All buttons
      loadAllCombinedBtn.addEventListener("click", () => {
        Object.keys(datasetGroups).forEach((dataset) => {
          const checkbox = document.getElementById(`combined-${dataset}`);
          if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            this.loadCombinedDataset(dataset, datasetGroups[dataset]);
          }
        });
      });

      clearAllCombinedBtn.addEventListener("click", () => {
        Object.keys(datasetGroups).forEach((dataset) => {
          const checkbox = document.getElementById(`combined-${dataset}`);
          if (checkbox && checkbox.checked) {
            checkbox.checked = false;
            this.hideCombinedDataset(dataset);
          }
        });
      });
    } catch (error) {
      console.error("Error loading Combined dataset:", error);
      this.showError(
        "Failed to load Combined dataset. Please check the server."
      );
    }
  }

  async loadLayer(layerName) {
    if (this.loadedLayers.has(layerName)) {
      this.showLayer(layerName);
      return;
    }

    this.showLoading(true, `Loading ${layerName}...`);

    try {
      const response = await fetch(`/api/geojson/${layerName}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const geojson = await response.json();

      // Create layer group for this administrative level
      const layerGroup = L.layerGroup();

      // Get color for this layer
      const layerColor = this.layerColors[layerName] || this.getRandomColor();

      // Create GeoJSON layer with custom styling and interactions
      const geoJsonLayer = L.geoJSON(geojson, {
        style: (feature) => this.getFeatureStyle(feature, layerColor),
        onEachFeature: (feature, layer) =>
          this.onEachFeature(feature, layer, layerName),
      });

      // Add to layer group
      layerGroup.addLayer(geoJsonLayer);

      // Store references
      this.loadedLayers.set(layerName, geojson);
      this.layerGroups.set(layerName, layerGroup);

      // Add to map
      layerGroup.addTo(this.map);

      // Add to layer control
      this.layerControl.addOverlay(layerGroup, this.getDisplayName(layerName));
    } catch (error) {
      console.error(`Error loading layer ${layerName}:`, error);
      this.showError(`Failed to load ${layerName}. Please check the server.`);
    } finally {
      this.showLoading(false);
    }
  }

  async loadSharawaniLayer(layerName) {
    if (this.sharawaniLayers.has(layerName)) {
      this.showSharawaniLayer(layerName);
      return;
    }

    this.showLoading(true, `Loading ${layerName}...`);

    try {
      const response = await fetch(`/api/sharawani/${layerName}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const geojson = await response.json();

      // Transform coordinates from UTM to WGS84
      const transformedGeoJSON = this.transformSharawaniCoordinates(geojson);

      // Create layer group for this Sharawani layer
      const layerGroup = L.layerGroup();

      // Get color and icon for this layer
      const layerColor =
        this.sharawaniColors[layerName] || this.getRandomColor();
      const icon = this.createSharawaniIcon(layerName, layerColor);

      // Create GeoJSON layer with custom styling for different geometry types
      const geoJsonLayer = L.geoJSON(transformedGeoJSON, {
        pointToLayer: (feature, latlng) => {
          const marker = L.marker(latlng, {
            icon: icon,
            pane: "sharawaniPointPane", // Use point pane for highest z-index
          });
          // Set highest z-index for markers to appear on top of everything
          marker.setZIndexOffset(2000);
          return marker;
        },
        style: (feature) => {
          // Style for polygon features (Suburbs, Cemeteries)
          if (
            feature.geometry.type === "MultiPolygon" ||
            feature.geometry.type === "Polygon"
          ) {
            return {
              fillColor: layerColor,
              weight: 3,
              opacity: 1,
              color: "#ffffff",
              dashArray: "",
              fillOpacity: 0.7,
              // Use polygon pane with lower z-index than points
              pane: "sharawaniPolygonPane",
            };
          }
          return {}; // No style needed for points (handled by pointToLayer)
        },
        onEachFeature: (feature, layer) =>
          this.onEachSharawaniFeature(feature, layer, layerName),
      });

      // Add to layer group
      layerGroup.addLayer(geoJsonLayer);

      // Store references
      this.sharawaniLayers.set(layerName, layerGroup);

      // Add to map
      layerGroup.addTo(this.map);

      // Add to layer control
      this.layerControl.addOverlay(
        layerGroup,
        this.getSharawaniDisplayName(layerName)
      );
    } catch (error) {
      console.error(`Error loading Sharawani layer ${layerName}:`, error);
      this.showError(`Failed to load ${layerName}. Please check the server.`);
    } finally {
      this.showLoading(false);
    }
  }

  transformSharawaniCoordinates(geojson) {
    // Clone the GeoJSON to avoid modifying the original
    const transformed = JSON.parse(JSON.stringify(geojson));

    transformed.features.forEach((feature) => {
      // Check if coordinates need transformation based on their values
      const needsTransformation = this.needsCoordinateTransformation(feature);

      if (!needsTransformation) {
        console.log(
          `ℹ️ Skipping transformation for ${
            feature.properties.name ||
            feature.properties.Health_car ||
            "feature"
          } - already in WGS84`
        );
        return; // Already in WGS84 format
      }

      if (!this.proj4Available) {
        console.warn(
          "⚠️ Proj4 not available - attempting approximate transformation"
        );
        this.approximateTransform(feature);
        return;
      }

      // Use proper Proj4 transformation
      this.transformFeatureGeometry(feature);
    });

    return transformed;
  }

  needsCoordinateTransformation(feature) {
    // Check if coordinates are in UTM (large numbers) vs WGS84 (small numbers)
    const geometry = feature.geometry;

    if (geometry.type === "Point") {
      const [x, y] = geometry.coordinates;
      // UTM coordinates are typically > 100,000, WGS84 coordinates are < 180
      return x > 180 || y > 90;
    } else if (geometry.type === "MultiPolygon") {
      // Check first coordinate of first polygon
      const firstCoord = geometry.coordinates[0][0][0];
      const [x, y] = firstCoord;
      return x > 180 || y > 90;
    } else if (geometry.type === "Polygon") {
      // Check first coordinate of first ring
      const firstCoord = geometry.coordinates[0][0];
      const [x, y] = firstCoord;
      return x > 180 || y > 90;
    }

    return false;
  }

  approximateTransform(feature) {
    const geometry = feature.geometry;

    if (geometry.type === "Point") {
      const [x, y] = geometry.coordinates;
      const lon = (x - 500000) / 111320 + 45;
      const lat = y / 110540;
      geometry.coordinates = [lon, lat];
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          ring.forEach((coord) => {
            const [x, y] = coord;
            coord[0] = (x - 500000) / 111320 + 45;
            coord[1] = y / 110540;
          });
        });
      });
    } else if (geometry.type === "Polygon") {
      geometry.coordinates.forEach((ring) => {
        ring.forEach((coord) => {
          const [x, y] = coord;
          coord[0] = (x - 500000) / 111320 + 45;
          coord[1] = y / 110540;
        });
      });
    }
  }

  transformFeatureGeometry(feature) {
    const geometry = feature.geometry;

    try {
      if (geometry.type === "Point") {
        const [x, y] = geometry.coordinates;
        const [lon, lat] = proj4("EPSG:32638", "EPSG:4326", [x, y]);
        geometry.coordinates = [lon, lat];
      } else if (geometry.type === "MultiPolygon") {
        geometry.coordinates.forEach((polygon) => {
          polygon.forEach((ring) => {
            ring.forEach((coord) => {
              const [x, y] = coord;
              const [lon, lat] = proj4("EPSG:32638", "EPSG:4326", [x, y]);
              coord[0] = lon;
              coord[1] = lat;
            });
          });
        });
      } else if (geometry.type === "Polygon") {
        geometry.coordinates.forEach((ring) => {
          ring.forEach((coord) => {
            const [x, y] = coord;
            const [lon, lat] = proj4("EPSG:32638", "EPSG:4326", [x, y]);
            coord[0] = lon;
            coord[1] = lat;
          });
        });
      }
    } catch (error) {
      console.error("❌ Coordinate transformation error:", error);
      // Keep original coordinates as fallback
    }
  }

  createSharawaniIcon(layerName, color) {
    return L.divIcon({
      html: `<div style="
        background-color: ${color}; 
        width: 16px; 
        height: 16px; 
        border-radius: 50%; 
        border: 3px solid white; 
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        position: relative;
      "></div>`,
      className: "simple-marker",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -8],
    });
  }

  getFeatureStyle(feature, baseColor) {
    return {
      fillColor: baseColor,
      weight: 1.5,
      opacity: 0.6,
      color: "#ffffff",
      dashArray: "",
      fillOpacity: 0.25,
    };
  }

  onEachFeature(feature, layer, layerName) {
    const props = feature.properties;

    // Create popup content
    const popupContent = this.createPopupContent(props);
    layer.bindPopup(popupContent, {
      maxWidth: 300,
      className: "custom-popup",
      pane: "popupPane",
    });

    // Add hover effects
    layer.on({
      mouseover: (e) => this.highlightFeature(e),
      mouseout: (e) => this.resetHighlight(e, layerName),
      click: (e) => this.onFeatureClick(e, props),
    });
  }

  onEachSharawaniFeature(feature, layer, layerName) {
    const props = feature.properties;

    // Create popup content for Sharawani features
    const popupContent = this.createSharawaniPopupContent(props, layerName);
    layer.bindPopup(popupContent, {
      maxWidth: 300,
      className: "custom-popup",
      pane: "popupPane",
    });

    // Add interaction handlers
    layer.on({
      click: (e) => this.onSharawaniFeatureClick(e, props, layerName),
      mouseover: (e) => this.highlightSharawaniFeature(e, layerName),
      mouseout: (e) => this.resetSharawaniHighlight(e, layerName),
    });
  }

  highlightSharawaniFeature(e, layerName) {
    const layer = e.target;
    const layerColor = this.sharawaniColors[layerName] || this.getRandomColor();

    // Only highlight if it's a polygon (markers don't need highlighting)
    if (
      layer.feature &&
      (layer.feature.geometry.type === "MultiPolygon" ||
        layer.feature.geometry.type === "Polygon")
    ) {
      layer.setStyle({
        weight: 4,
        color: "#2c3e50",
        dashArray: "",
        fillOpacity: 0.9,
        fillColor: this.lightenColor(layerColor, 0.3),
      });

      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }
    }
  }

  resetSharawaniHighlight(e, layerName) {
    const layer = e.target;
    const layerColor = this.sharawaniColors[layerName] || this.getRandomColor();

    // Only reset style if it's a polygon
    if (
      layer.feature &&
      (layer.feature.geometry.type === "MultiPolygon" ||
        layer.feature.geometry.type === "Polygon")
    ) {
      layer.setStyle({
        fillColor: layerColor,
        weight: 3,
        opacity: 1,
        color: "#ffffff",
        dashArray: "",
        fillOpacity: 0.7,
      });
    }
  }

  createPopupContent(properties) {
    const name =
      properties.ADM1_EN ||
      properties.ADM2_EN ||
      properties.ADM3_EN ||
      properties.ADM0_EN ||
      "Unknown Area";

    let content = `<div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #2c3e50;">${name}</div>`;
    content += `<div style="margin-bottom: 4px;"><strong>Type:</strong> ${this.getAreaType(
      properties
    )}</div>`;

    if (properties.ADM1_EN && properties.ADM1_EN !== name) {
      content += `<div style="margin-bottom: 4px;"><strong>Governorate:</strong> ${properties.ADM1_EN}</div>`;
    }
    if (properties.ADM2_EN && properties.ADM2_EN !== name) {
      content += `<div style="margin-bottom: 4px;"><strong>District:</strong> ${properties.ADM2_EN}</div>`;
    }
    if (properties.ADM3_EN && properties.ADM3_EN !== name) {
      content += `<div style="margin-bottom: 4px;"><strong>Sub-district:</strong> ${properties.ADM3_EN}</div>`;
    }

    if (properties.ADM1_AR || properties.ADM2_AR || properties.ADM3_AR) {
      content += `<div style="margin-bottom: 4px;"><strong>Arabic:</strong> ${
        properties.ADM1_AR || properties.ADM2_AR || properties.ADM3_AR
      }</div>`;
    }

    if (properties.ADM1_KU || properties.ADM2_KU || properties.ADM3_KU) {
      content += `<div style="margin-bottom: 4px;"><strong>Kurdish:</strong> ${
        properties.ADM1_KU || properties.ADM2_KU || properties.ADM3_KU
      }</div>`;
    }

    return content;
  }

  createSharawaniPopupContent(properties, layerName) {
    // Handle different property structures for different layers
    let name = "Unknown";
    let year = "Unknown";

    // Education and Fuel Station layers
    if (properties.GIS2) {
      name = properties.GIS2;
      year = properties.GIS3 || properties.AYear || "Unknown";
    }
    // Healthcare layer
    else if (properties.Health_car) {
      name = properties.Health_car;
      year = "Unknown"; // Healthcare doesn't have year data
    }
    // Suburbs and Cemeteries layers
    else if (properties.name || properties.NAME_) {
      name = properties.name || properties.NAME_;
      year = "Unknown"; // These don't have year data
    }

    let content = `<div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #2c3e50;">${name}</div>`;
    content += `<div style="margin-bottom: 4px;"><strong>Type:</strong> ${this.getSharawaniDisplayName(
      layerName
    )}</div>`;

    if (year !== "Unknown") {
      content += `<div style="margin-bottom: 4px;"><strong>Year:</strong> ${year}</div>`;
    }

    // Add specific properties based on layer type
    if (properties.Mahala) {
      content += `<div style="margin-bottom: 4px;"><strong>Neighborhood:</strong> ${properties.Mahala}</div>`;
    }

    if (properties.GIS6) {
      content += `<div style="margin-bottom: 4px;"><strong>Phone:</strong> ${properties.GIS6}</div>`;
    }

    if (properties.k4_Desc) {
      content += `<div style="margin-bottom: 4px;"><strong>Description:</strong> ${properties.k4_Desc}</div>`;
    }

    // Healthcare specific fields
    if (properties.Lat && properties.Long) {
      content += `<div style="margin-bottom: 4px;"><strong>Coordinates:</strong> ${properties.Lat}, ${properties.Long}</div>`;
    }

    // Suburbs specific fields
    if (properties.NO_) {
      content += `<div style="margin-bottom: 4px;"><strong>Area Number:</strong> ${properties.NO_}</div>`;
    }

    if (properties.SHAPE_area) {
      const areaSqM = Math.round(properties.SHAPE_area);
      const areaSqKm = (areaSqM / 1000000).toFixed(2);
      content += `<div style="margin-bottom: 4px;"><strong>Area:</strong> ${areaSqKm} km² (${areaSqM.toLocaleString()} m²)</div>`;
    }

    return content;
  }

  highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
      weight: 3,
      color: "#2c3e50",
      dashArray: "",
      fillOpacity: 0.5,
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  }

  resetHighlight(e, layerName) {
    const layer = e.target;
    const baseColor = this.layerColors[layerName] || this.getRandomColor();

    layer.setStyle(this.getFeatureStyle(e.target.feature, baseColor));
  }

  onFeatureClick(e, properties) {
    // Update info panel only - no automatic zooming
    this.showFeatureInfo(properties);
  }

  onSharawaniFeatureClick(e, properties, layerName) {
    // Update info panel with Sharawani data
    this.showSharawaniFeatureInfo(properties, layerName);
  }

  showLayer(layerName) {
    const layerGroup = this.layerGroups.get(layerName);
    if (layerGroup && !this.map.hasLayer(layerGroup)) {
      layerGroup.addTo(this.map);
    }
  }

  hideLayer(layerName) {
    const layerGroup = this.layerGroups.get(layerName);
    if (layerGroup && this.map.hasLayer(layerGroup)) {
      this.map.removeLayer(layerGroup);
    }
  }

  showSharawaniLayer(layerName) {
    const layerGroup = this.sharawaniLayers.get(layerName);
    if (layerGroup && !this.map.hasLayer(layerGroup)) {
      layerGroup.addTo(this.map);
    }
  }

  hideSharawaniLayer(layerName) {
    const layerGroup = this.sharawaniLayers.get(layerName);
    if (layerGroup && this.map.hasLayer(layerGroup)) {
      this.map.removeLayer(layerGroup);
    }
  }

  loadCombinedDataset(datasetName, dataPoints) {
    try {
      console.log(`Loading combined dataset: ${datasetName}`);

      // Get color for this dataset
      const color =
        this.combinedColors[datasetName] || this.combinedColors.default;

      // Create icon for this dataset
      const icon = this.createCombinedIcon(datasetName, color);

      // Create layer group for this dataset
      const layerGroup = L.layerGroup();

      // Add markers for each point
      dataPoints.forEach((point) => {
        const marker = L.marker([point.latitude, point.longitude], {
          icon: icon,
          pane: "sharawaniPointPane", // Use same high z-index pane as other points
        });

        marker.setZIndexOffset(2000);

        // Create popup content
        const popupContent = this.createCombinedPopupContent(
          point,
          datasetName
        );
        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: "custom-popup",
          pane: "popupPane",
        });

        layerGroup.addLayer(marker);
      });

      // Add to map and store reference
      layerGroup.addTo(this.map);
      this.combinedLayers.set(datasetName, layerGroup);

      console.log(`✅ Loaded ${dataPoints.length} points for ${datasetName}`);
    } catch (error) {
      console.error(`Error loading combined dataset ${datasetName}:`, error);
    }
  }

  hideCombinedDataset(datasetName) {
    const layerGroup = this.combinedLayers.get(datasetName);
    if (layerGroup && this.map.hasLayer(layerGroup)) {
      this.map.removeLayer(layerGroup);
    }
  }

  createCombinedIcon(datasetName, color) {
    return L.divIcon({
      html: `<div style="
        background-color: ${color}; 
        width: 14px; 
        height: 14px; 
        border-radius: 50%; 
        border: 2px solid white; 
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        position: relative;
      "></div>`,
      className: "combined-marker",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      popupAnchor: [0, -7],
    });
  }

  createCombinedPopupContent(point, datasetName) {
    return `
      <div class="popup-content">
        <h4>${point.name}</h4>
        <p><strong>Dataset:</strong> ${datasetName}</p>
        <p><strong>Location:</strong> ${point.latitude.toFixed(
          6
        )}, ${point.longitude.toFixed(6)}</p>
      </div>
    `;
  }

  showFeatureInfo(properties) {
    const infoPanel = document.getElementById("infoPanel");
    const name =
      properties.ADM1_EN ||
      properties.ADM2_EN ||
      properties.ADM3_EN ||
      properties.ADM0_EN ||
      "Unknown Area";

    let content = `<h4>${name}</h4>`;
    content += `<p><strong>Type:</strong> ${this.getAreaType(properties)}</p>`;

    if (properties.ADM1_EN && properties.ADM1_EN !== name)
      content += `<p><strong>Governorate:</strong> ${properties.ADM1_EN}</p>`;
    if (properties.ADM2_EN && properties.ADM2_EN !== name)
      content += `<p><strong>District:</strong> ${properties.ADM2_EN}</p>`;
    if (properties.ADM3_EN && properties.ADM3_EN !== name)
      content += `<p><strong>Sub-district:</strong> ${properties.ADM3_EN}</p>`;

    if (properties.ADM1_AR || properties.ADM2_AR || properties.ADM3_AR) {
      content += `<p><strong>Arabic Name:</strong> ${
        properties.ADM1_AR || properties.ADM2_AR || properties.ADM3_AR
      }</p>`;
    }

    if (properties.ADM1_KU || properties.ADM2_KU || properties.ADM3_KU) {
      content += `<p><strong>Kurdish Name:</strong> ${
        properties.ADM1_KU || properties.ADM2_KU || properties.ADM3_KU
      }</p>`;
    }

    infoPanel.innerHTML = content;
  }

  showSharawaniFeatureInfo(properties, layerName) {
    const infoPanel = document.getElementById("infoPanel");
    const name = properties.GIS2 || properties.name || "Unknown";

    let content = `<h4>${name}</h4>`;
    content += `<p><strong>Category:</strong> ${this.getSharawaniDisplayName(
      layerName
    )}</p>`;

    if (properties.GIS3) {
      content += `<p><strong>Year:</strong> ${properties.GIS3}</p>`;
    }

    if (properties.Mahala) {
      content += `<p><strong>Neighborhood:</strong> ${properties.Mahala}</p>`;
    }

    if (properties.GIS6) {
      content += `<p><strong>Contact:</strong> ${properties.GIS6}</p>`;
    }

    infoPanel.innerHTML = content;
  }

  getAreaType(properties) {
    if (properties.ADM3_EN) return "Sub-district";
    if (properties.ADM2_EN) return "District";
    if (properties.ADM1_EN) return "Governorate";
    if (properties.ADM0_EN) return "Country";
    return "Administrative Area";
  }

  getDisplayName(layerName) {
    return layerName
      .replace(/_/g, " ")
      .replace(/irq admbnda /, "")
      .toUpperCase();
  }

  getSharawaniDisplayName(layerName) {
    const nameMap = {
      Cemetary: "Cemeteries",
      education: "Education Facilities",
      "Fuel Station": "Fuel Stations",
      Healthcare: "Healthcare Facilities",
      Suburbs: "Suburbs",
    };

    return (
      nameMap[layerName] ||
      layerName.charAt(0).toUpperCase() + layerName.slice(1)
    );
  }

  getRandomColor() {
    const colors = [
      "#e74c3c",
      "#3498db",
      "#2ecc71",
      "#f39c12",
      "#9b59b6",
      "#1abc9c",
      "#34495e",
      "#e67e22",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  showLoading(show, message = "Loading...") {
    const loadingEl = document.getElementById("loading");
    if (show) {
      loadingEl.style.display = "block";
      loadingEl.querySelector("p").textContent = message;
    } else {
      loadingEl.style.display = "none";
    }
  }

  showError(message) {
    const infoPanel = document.getElementById("infoPanel");
    infoPanel.innerHTML = `
      <h4 style="color: #e74c3c;">⚠️ Error</h4>
      <p style="color: #c0392b;">${message}</p>
      <p style="font-size: 0.9em; color: #7f8c8d;">
        Make sure you have run the Python conversion script and the server is running properly.
      </p>
    `;
  }
}

// Initialize the map when the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM Content Loaded");

  // Check if required libraries are loaded
  if (typeof L === "undefined") {
    console.error("❌ Leaflet library not loaded - cannot continue");
    return;
  }

  if (typeof proj4 === "undefined") {
    console.warn(
      "⚠️ Proj4 library not loaded - Sharawani coordinates may not be accurate"
    );
  } else {
    console.log("✅ Proj4 library loaded");
  }

  console.log("✅ Core libraries ready, initializing map...");
  new IraqLeafletMap();
});
