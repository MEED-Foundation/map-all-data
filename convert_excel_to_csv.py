#!/usr/bin/env python3
"""
Convert Combined.xlsx to CSV format.

This is a simpler alternative if you prefer CSV over GeoJSON.
However, GeoJSON is recommended for web mapping applications.
"""

import pandas as pd
from pathlib import Path

def excel_to_csv(excel_path, output_path=None):
    """
    Convert Excel file to CSV format.
    
    Args:
        excel_path (str): Path to the Excel file
        output_path (str): Path for the output CSV file (optional)
    
    Returns:
        pandas.DataFrame: The converted data
    """
    try:
        # Read the Excel file
        print(f"📖 Reading Excel file: {excel_path}")
        df = pd.read_excel(excel_path)
        
        print(f"📊 Found {len(df)} rows and {len(df.columns)} columns")
        print(f"📋 Columns: {list(df.columns)}")
        
        # Display first few rows
        print("\n📝 First 3 rows:")
        print(df.head(3))
        
        # Save to CSV if output path specified
        if output_path:
            print(f"💾 Saving CSV to: {output_path}")
            df.to_csv(output_path, index=False, encoding='utf-8')
            
            # Calculate file sizes
            excel_size = Path(excel_path).stat().st_size
            csv_size = Path(output_path).stat().st_size
            
            print(f"📊 File size comparison:")
            print(f"   📄 Excel: {excel_size / 1024 / 1024:.2f} MB")
            print(f"   📄 CSV: {csv_size / 1024 / 1024:.2f} MB")
            
            if csv_size < excel_size:
                print(f"   📉 Size reduction: {((excel_size - csv_size) / excel_size * 100):.1f}%")
            else:
                print(f"   📈 Size increase: {((csv_size - excel_size) / excel_size * 100):.1f}%")
        
        return df
        
    except Exception as e:
        print(f"❌ Error converting file: {e}")
        return None

def main():
    """Main function to run the conversion."""
    excel_file = "datasets/Combined.xlsx"
    output_file = "datasets/Combined.csv"
    
    # Check if input file exists
    if not Path(excel_file).exists():
        print(f"❌ Excel file not found: {excel_file}")
        print("📂 Please make sure the file exists in the datasets folder")
        return
    
    print("🔄 Starting Excel to CSV conversion...")
    print("=" * 50)
    
    # Convert the file
    df = excel_to_csv(excel_file, output_file)
    
    if df is not None:
        print("=" * 50)
        print("✅ Conversion completed successfully!")
        print(f"📍 Total rows: {len(df)}")
        print(f"📋 Total columns: {len(df.columns)}")
        
        print(f"\n🎯 Note:")
        print(f"   CSV is simpler but GeoJSON is better for web maps")
        print(f"   Consider using convert_excel_to_geojson.py instead")
        
    else:
        print("❌ Conversion failed!")

if __name__ == "__main__":
    main()
