#!/usr/bin/env python3
"""
Convert Combined.xlsx to GeoJSON format for faster map loading.

This script reads the Excel file and converts it to GeoJSON format,
which is much more efficient for web mapping applications.
"""

import pandas as pd
import json
from pathlib import Path
import sys

def excel_to_geojson(excel_path, output_path=None):
    """
    Convert Excel file to GeoJSON format.
    
    Args:
        excel_path (str): Path to the Excel file
        output_path (str): Path for the output GeoJSON file (optional)
    
    Returns:
        dict: GeoJSON data structure
    """
    try:
        # Read the Excel file
        print(f"📖 Reading Excel file: {excel_path}")
        df = pd.read_excel(excel_path)
        
        print(f"📊 Found {len(df)} rows and {len(df.columns)} columns")
        print(f"📋 Columns: {list(df.columns)}")
        
        # Display first few rows to understand the structure
        print("\n📝 First 3 rows:")
        print(df.head(3))
        
        # Try to identify coordinate columns
        coordinate_columns = []
        possible_lat_cols = ['lat', 'latitude', 'y', 'lat_deg', 'lat_decimal']
        possible_lon_cols = ['lon', 'longitude', 'lng', 'long', 'x', 'lon_deg', 'lon_decimal']
        
        lat_col = None
        lon_col = None
        
        # Find latitude column
        for col in df.columns:
            if col.lower() in possible_lat_cols:
                lat_col = col
                break
            elif any(term in col.lower() for term in ['lat', 'y']):
                lat_col = col
                break
        
        # Find longitude column
        for col in df.columns:
            if col.lower() in possible_lon_cols:
                lon_col = col
                break
            elif any(term in col.lower() for term in ['lon', 'lng', 'long', 'x']):
                lon_col = col
                break
        
        if not lat_col or not lon_col:
            print("❌ Could not automatically identify coordinate columns.")
            print("📋 Available columns:")
            for i, col in enumerate(df.columns):
                print(f"   {i}: {col}")
            
            # Let user specify columns
            try:
                lat_idx = int(input(f"\n🎯 Enter the number for LATITUDE column (0-{len(df.columns)-1}): "))
                lon_idx = int(input(f"🎯 Enter the number for LONGITUDE column (0-{len(df.columns)-1}): "))
                lat_col = df.columns[lat_idx]
                lon_col = df.columns[lon_idx]
            except (ValueError, IndexError):
                print("❌ Invalid column selection")
                return None
        
        print(f"✅ Using latitude column: {lat_col}")
        print(f"✅ Using longitude column: {lon_col}")
        
        # Check for dataset column
        dataset_col = None
        possible_dataset_cols = ['dataset', 'source', 'type', 'category', 'data_source']
        
        for col in df.columns:
            if col.lower() in possible_dataset_cols:
                dataset_col = col
                break
            elif 'dataset' in col.lower() or 'source' in col.lower():
                dataset_col = col
                break
        
        if dataset_col:
            print(f"✅ Using dataset column: {dataset_col}")
        else:
            print("⚠️ No dataset column found - will use 'Unknown' as default")
        
        # Check for name column
        name_col = None
        possible_name_cols = ['name', 'title', 'location', 'place', 'site']
        
        for col in df.columns:
            if col.lower() in possible_name_cols:
                name_col = col
                break
        
        if name_col:
            print(f"✅ Using name column: {name_col}")
        else:
            print("⚠️ No name column found - will generate names")
        
        # Remove rows with invalid coordinates
        df_clean = df.dropna(subset=[lat_col, lon_col]).copy()
        
        # Convert coordinates to numeric, replacing non-numeric values with NaN
        df_clean[lat_col] = pd.to_numeric(df_clean[lat_col], errors='coerce')
        df_clean[lon_col] = pd.to_numeric(df_clean[lon_col], errors='coerce')
        
        # Remove rows with NaN coordinates after conversion
        df_clean = df_clean.dropna(subset=[lat_col, lon_col])
        
        # Filter valid coordinate ranges
        df_clean = df_clean[
            (df_clean[lat_col] >= -90) & (df_clean[lat_col] <= 90) &
            (df_clean[lon_col] >= -180) & (df_clean[lon_col] <= 180)
        ]
        
        removed_rows = len(df) - len(df_clean)
        if removed_rows > 0:
            print(f"⚠️ Removed {removed_rows} rows with invalid coordinates")
        
        print(f"✅ Processing {len(df_clean)} valid data points")
        
        # Create GeoJSON structure
        geojson = {
            "type": "FeatureCollection",
            "features": []
        }
        
        # Convert each row to a GeoJSON feature
        for idx, row in df_clean.iterrows():
            try:
                lat = float(row[lat_col])
                lon = float(row[lon_col])
                
                # Create properties dictionary (exclude coordinate columns)
                properties = {}
                for col in df.columns:
                    if col not in [lat_col, lon_col]:
                        value = row[col]
                        # Handle NaN values
                        if pd.isna(value):
                            properties[col] = None
                        else:
                            properties[col] = str(value) if not isinstance(value, (int, float, bool)) else value
                
                # Add standardized fields for compatibility with your map
                if name_col:
                    properties['name'] = str(row[name_col]) if not pd.isna(row[name_col]) else f"Point {idx+1}"
                else:
                    properties['name'] = f"Point {idx+1}"
                
                if dataset_col:
                    properties['dataset'] = str(row[dataset_col]) if not pd.isna(row[dataset_col]) else "Unknown"
                else:
                    properties['dataset'] = "Unknown"
                
                properties['latitude'] = lat
                properties['longitude'] = lon
                
                # Create GeoJSON feature
                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lon, lat]  # GeoJSON uses [lon, lat] order
                    },
                    "properties": properties
                }
                
                geojson["features"].append(feature)
                
            except (ValueError, TypeError) as e:
                print(f"⚠️ Skipping row {idx} due to coordinate error: {e}")
                continue
        
        print(f"✅ Created GeoJSON with {len(geojson['features'])} features")
        
        # Save to file if output path specified
        if output_path:
            print(f"💾 Saving GeoJSON to: {output_path}")
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(geojson, f, indent=2, ensure_ascii=False)
            
            # Calculate file sizes
            excel_size = Path(excel_path).stat().st_size
            geojson_size = Path(output_path).stat().st_size
            
            print(f"📊 File size comparison:")
            print(f"   📄 Excel: {excel_size / 1024 / 1024:.2f} MB")
            print(f"   🗺️ GeoJSON: {geojson_size / 1024 / 1024:.2f} MB")
            print(f"   📉 Size reduction: {((excel_size - geojson_size) / excel_size * 100):.1f}%")
        
        return geojson
        
    except Exception as e:
        print(f"❌ Error converting file: {e}")
        return None

def main():
    """Main function to run the conversion."""
    excel_file = "datasets/Combined.xlsx"
    output_file = "datasets/Combined.geojson"
    
    # Check if input file exists
    if not Path(excel_file).exists():
        print(f"❌ Excel file not found: {excel_file}")
        print("📂 Please make sure the file exists in the datasets folder")
        return
    
    print("🔄 Starting Excel to GeoJSON conversion...")
    print("=" * 50)
    
    # Convert the file
    geojson_data = excel_to_geojson(excel_file, output_file)
    
    if geojson_data:
        print("=" * 50)
        print("✅ Conversion completed successfully!")
        print(f"📍 Total features: {len(geojson_data['features'])}")
        
        # Show dataset breakdown if available
        if geojson_data['features']:
            datasets = {}
            for feature in geojson_data['features']:
                dataset = feature['properties'].get('dataset', 'Unknown')
                datasets[dataset] = datasets.get(dataset, 0) + 1
            
            print("\n📊 Dataset breakdown:")
            for dataset, count in datasets.items():
                print(f"   {dataset}: {count} points")
        
        print(f"\n🎯 Next steps:")
        print(f"   1. Update your server to serve the GeoJSON file")
        print(f"   2. Modify your API endpoint to use the new format")
        print(f"   3. Test the map performance improvement")
        
    else:
        print("❌ Conversion failed!")

if __name__ == "__main__":
    main()
