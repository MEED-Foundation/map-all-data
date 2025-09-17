# Iraq Administrative Divisions Interactive Map

An interactive web application that displays Iraqi administrative divisions using Leaflet with optimized GeoJSON data. Features hover highlighting, click popups, and layer toggling with fast performance.

## Features

- 🗺️ **Interactive Map**: Pan, zoom, and explore Iraqi administrative divisions
- 🎯 **Click Popups**: Click on any area to see detailed information
- ✨ **Hover Effects**: Hover over areas to highlight them
- 🔄 **Layer Toggle**: Show/hide different administrative levels (ADM0-ADM3)
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🌍 **Multi-language Support**: Displays names in English, Arabic, and Kurdish
- ⚡ **Fast Performance**: Pre-converted GeoJSON files for quick loading
- 🐍 **Python Conversion**: Automated shapefile to GeoJSON conversion

## Prerequisites

- **Python 3.7+** (for shapefile conversion)
- **Node.js (v14 or higher)** (for web application)
- **npm or yarn** (for package management)

## Quick Setup

1. **Run the automated setup** (recommended):

   ```bash
   python setup.py
   ```

   This will:

   - Install Python dependencies
   - Convert shapefiles to optimized GeoJSON
   - Install Node.js dependencies
   - Provide next steps

2. **Start the application**:

   ```bash
   npm start
   ```

3. **Open your browser** and navigate to:
   ```
   http://localhost:5000
   ```

## Manual Installation

If you prefer manual setup or the automated script fails:

### Step 1: Convert Shapefiles to GeoJSON

1. **Install Python dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

2. **Run the conversion script**:
   ```bash
   python convert_shapefiles.py
   ```
   This creates a `geojson/` directory with optimized GeoJSON files.

### Step 2: Setup Web Application

1. **Install Node.js dependencies**:

   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

## Usage

### Map Controls

- **Pan**: Click and drag to move around the map
- **Zoom**: Use mouse wheel or pinch gestures to zoom in/out
- **Reset**: Double-click to reset the map view

### Layer Management

- Use the checkboxes in the sidebar to toggle different administrative levels:
  - **ADM0**: Country level (Iraq)
  - **ADM1**: Governorate level
  - **ADM2**: District level
  - **ADM3**: Sub-district level

### Interactive Features

- **Hover**: Move your mouse over any area to highlight it
- **Click**: Click on any area to view detailed information in the sidebar
- **Information Panel**: Shows area name, type, and administrative hierarchy

## Project Structure

```
map-all-data/
├── main.js                    # Express server
├── package.json              # Node.js dependencies and scripts
├── requirements.txt          # Python dependencies
├── convert_shapefiles.py     # Shapefile to GeoJSON converter
├── setup.py                  # Automated setup script
├── views/
│   └── index.ejs            # Main HTML template
├── public/
│   ├── style.css            # Styling
│   └── map.js              # Frontend JavaScript
├── geojson/                 # Generated GeoJSON files (created by conversion)
│   ├── *.geojson           # Converted administrative boundaries
│   └── metadata.json       # Conversion metadata
├── irq-administrative-divisions-shapefiles/
│   └── *.shp               # Original shapefile data
└── datasets/               # Additional data files
```

## API Endpoints

- `GET /` - Serves the main application
- `GET /api/geojson-files` - Lists available GeoJSON files
- `GET /api/geojson/:filename` - Serves pre-converted GeoJSON data

## Technologies Used

### Backend

- **Node.js & Express.js**: Web server and API
- **EJS**: Template engine

### Frontend

- **Leaflet**: Interactive map visualization with multiple base layers
- **HTML5, CSS3, JavaScript**: Modern web technologies
- **Responsive Design**: Mobile-friendly interface

### Data Processing

- **Python**: Shapefile processing and conversion
- **GeoPandas**: Geospatial data manipulation
- **Fiona & Pyproj**: Shapefile reading and coordinate transformations

## Data Sources

The application uses Iraqi administrative division shapefiles containing:

- **Country boundaries (ADM0)**: National level
- **Governorate boundaries (ADM1)**: Provincial level
- **District boundaries (ADM2)**: District level
- **Sub-district boundaries (ADM3)**: Sub-district level

Each shapefile includes names in English, Arabic, and Kurdish where available.

## Performance Optimizations

- **Pre-converted GeoJSON**: Eliminates real-time conversion overhead
- **Coordinate Precision**: Rounded to 6 decimal places for smaller file sizes
- **Optimized JSON**: Minified GeoJSON output
- **Client-side Caching**: Loaded layers are cached in memory
- **On-demand Loading**: Layers load only when requested

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

### Adding New Features

1. **Server-side changes**: Edit `main.js`
2. **Frontend changes**: Edit files in `public/` directory
3. **Templates**: Edit files in `views/` directory
4. **Data processing**: Modify `convert_shapefiles.py`

### Converting New Shapefiles

To add new shapefile data:

1. Place `.shp` files (and associated files) in the `irq-administrative-divisions-shapefiles/` directory
2. Run the conversion script: `python convert_shapefiles.py`
3. Restart the Node.js server to pick up new files

## Troubleshooting

### Common Issues

1. **Python dependencies fail**: Install system dependencies for GeoPandas:

   - **Ubuntu/Debian**: `sudo apt-get install gdal-bin libgdal-dev`
   - **macOS**: `brew install gdal`
   - **Windows**: Use conda: `conda install geopandas`

2. **GeoJSON directory not found**: Run the conversion script first
3. **Port already in use**: Change the PORT in `main.js` or set environment variable
4. **Memory issues**: Large shapefiles may require increased Node.js memory limit

### Performance Tips

- **File sizes**: GeoJSON files are larger than shapefiles but load faster in browsers
- **Layer management**: Toggle layers on/off to improve rendering performance
- **Zoom levels**: Higher zoom levels render more detail but may be slower

## License

This project is for educational and research purposes. Please ensure you have appropriate rights to use the shapefile data in your specific use case.
