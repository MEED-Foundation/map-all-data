# Excel to GeoJSON/CSV Conversion Guide

## Why Convert?

Your `Combined.xlsx` file is heavy and slow to load on the web map. Converting to **GeoJSON** is the best solution because:

✅ **GeoJSON is better than CSV for maps because:**

- Native support in Leaflet (your mapping library)
- Smaller file size for coordinate data
- Contains geometry + properties in one structure
- Standard geospatial format
- Faster rendering on web maps
- No client-side parsing needed

## Quick Start

### 1. Install Dependencies

```bash
pip install -r conversion_requirements.txt
```

### 2. Convert to GeoJSON (Recommended)

```bash
python convert_excel_to_geojson.py
```

### 3. Convert to CSV (Alternative)

```bash
python convert_excel_to_csv.py
```

## What the Scripts Do

### GeoJSON Conversion (`convert_excel_to_geojson.py`)

- Automatically detects coordinate columns (latitude/longitude)
- Handles missing/invalid data
- Creates proper GeoJSON Point features
- Preserves all original data as properties
- Shows file size comparison
- Interactive column selection if auto-detection fails

### CSV Conversion (`convert_excel_to_csv.py`)

- Simple Excel to CSV conversion
- Preserves all data exactly as-is
- Shows file size comparison
- Faster but less optimal for web maps

## Expected Results

### File Size Reduction

- Excel files are typically 2-5x larger than GeoJSON
- GeoJSON is more compact than CSV for coordinate data
- Faster loading times on your web map

### Performance Improvement

- **Before**: Slow Excel parsing on server
- **After**: Direct GeoJSON loading in browser
- **Result**: 3-10x faster map loading

## Integration with Your Map

After conversion, update your server code to serve the GeoJSON file:

### Option 1: Direct File Serving

```javascript
// In your map.js, replace the API call with direct file loading
const response = await fetch("/datasets/Combined.geojson");
const geojsonData = await response.json();
```

### Option 2: Update API Endpoint

Modify your `/api/combined-data` endpoint to serve the GeoJSON file instead of parsing Excel.

## Troubleshooting

### Common Issues

**"Could not identify coordinate columns"**

- The script will ask you to manually select columns
- Look for columns containing latitude/longitude values

**"Invalid coordinates"**

- Script automatically filters out invalid coordinates
- Check your data for values outside ±90 (lat) and ±180 (lon)

**"File not found"**

- Make sure `Combined.xlsx` is in the `datasets/` folder
- Check file name spelling and case

### Column Detection

The script looks for these column names:

- **Latitude**: lat, latitude, y, lat_deg, lat_decimal
- **Longitude**: lon, longitude, lng, long, x, lon_deg, lon_decimal
- **Name**: name, title, location, place, site
- **Dataset**: dataset, source, type, category, data_source

## File Structure After Conversion

```
datasets/
├── Combined.xlsx          # Original file (keep as backup)
├── Combined.geojson       # New GeoJSON file (recommended)
└── Combined.csv           # CSV file (if you chose this option)
```

## Next Steps

1. **Run the conversion script**
2. **Test the new file** with your map
3. **Update your server** to use the new format
4. **Remove or backup** the original Excel file
5. **Enjoy faster map loading!** 🚀

## Performance Comparison

| Format  | File Size | Loading Speed | Map Performance | Recommendation |
| ------- | --------- | ------------- | --------------- | -------------- |
| Excel   | Large     | Slow          | Poor            | ❌ Avoid       |
| CSV     | Medium    | Medium        | Fair            | ⚠️ OK          |
| GeoJSON | Small     | Fast          | Excellent       | ✅ Best        |

Choose **GeoJSON** for the best web mapping performance!
